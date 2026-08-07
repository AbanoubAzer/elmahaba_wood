import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getPnl(from?: string, to?: string) {
    const where: any = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to + 'T23:59:59');
    }

    const [saleInvoices, purchaseInvoices, expenses] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { ...where, type: 'SALE', status: { not: 'CANCELLED' } },
        include: { items: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.invoice.findMany({
        where: { ...where, type: 'PURCHASE', status: { not: 'CANCELLED' } },
        include: { items: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.expense.findMany({
        where,
      }),
    ]);

    const totalRevenue = saleInvoices.reduce((s, inv) => s + Number(inv.totalAmount), 0);
    const totalCost = purchaseInvoices.reduce((s, inv) => s + Number(inv.totalAmount), 0);
    const totalExpenses = expenses.reduce((s, exp) => s + Number(exp.amount), 0);
    const totalCollected = saleInvoices.reduce((s, inv) => s + Number(inv.paidAmount), 0);
    const totalPaid = purchaseInvoices.reduce((s, inv) => s + Number(inv.paidAmount), 0);
    const grossProfit = totalRevenue - totalCost - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Per-product breakdown
    const productMap: Record<string, {
      productCode: string; productName: string;
      soldVolumeM3: number; soldRevenue: number;
      purchasedVolumeM3: number; purchasedCost: number;
      profit: number;
    }> = {};

    for (const inv of saleInvoices) {
      for (const item of inv.items) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            productCode: item.productCode,
            productName: item.productName,
            soldVolumeM3: 0, soldRevenue: 0,
            purchasedVolumeM3: 0, purchasedCost: 0,
            profit: 0,
          };
        }
        productMap[item.productId].soldVolumeM3 += Number(item.volumeM3);
        productMap[item.productId].soldRevenue += Number(item.total);
      }
    }

    for (const inv of purchaseInvoices) {
      for (const item of inv.items) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            productCode: item.productCode,
            productName: item.productName,
            soldVolumeM3: 0, soldRevenue: 0,
            purchasedVolumeM3: 0, purchasedCost: 0,
            profit: 0,
          };
        }
        productMap[item.productId].purchasedVolumeM3 += Number(item.volumeM3);
        productMap[item.productId].purchasedCost += Number(item.total);
      }
    }

    const byProduct = Object.entries(productMap).map(([id, p]) => ({
      productId: id,
      ...p,
      profit: p.soldRevenue - p.purchasedCost,
    })).sort((a, b) => b.profit - a.profit);

    return {
      period: { from: from ?? null, to: to ?? null },
      summary: {
        totalRevenue,
        totalCost,
        totalExpenses,
        grossProfit,
        profitMarginPct: Math.round(profitMargin * 100) / 100,
        totalCollected,
        totalPaid,
        outstandingReceivables: totalRevenue - totalCollected,
        outstandingPayables: totalCost - totalPaid,
        invoiceCount: { sales: saleInvoices.length, purchases: purchaseInvoices.length },
      },
      byProduct,
    };
  }

  async getDashboardSummary() {
    const [
      customerCount,
      supplierCount,
      productCount,
      totalReceivables,
      totalPayables,
      recentSales,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.supplier.count(),
      this.prisma.woodProduct.count(),
      this.prisma.customer.aggregate({ _sum: { balance: true } }),
      this.prisma.supplier.aggregate({ _sum: { balance: true } }),
      this.prisma.invoice.findMany({
        where: { type: 'SALE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true },
      }),
    ]);

    return {
      customerCount,
      supplierCount,
      productCount,
      totalReceivables: Number(totalReceivables._sum.balance ?? 0),
      totalPayables: Number(totalPayables._sum.balance ?? 0),
      recentSales,
    };
  }
}
