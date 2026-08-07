import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const where = user?.role?.toUpperCase() !== 'ADMIN' 
      ? { createdBy: user?.name }
      : {};

    return this.prisma.invoice.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async findOne(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  /** Returns the next invoice number without creating an invoice */
  async getNextInvoiceNo(type: 'sale' | 'purchase') {
    const year = new Date().getFullYear();
    const prefix = type === 'sale' ? 'INV' : 'PUR';
    const count = await this.prisma.invoice.count({
      where: { type: type.toUpperCase() as any },
    });
    return { invoiceNo: `${prefix}-${year}-${(count + 1).toString().padStart(3, '0')}` };
  }

  async create(data: {
    date: string;
    type: 'SALE' | 'PURCHASE' | 'sale' | 'purchase';
    partyType: 'CUSTOMER' | 'SUPPLIER' | 'customer' | 'supplier';
    partyId: string;
    partyName: string;
    items: Array<{
      productId: string;
      productCode: string;
      productName: string;
      volumeM3: number;
      pricePerM3: number;
      total: number;
    }>;
    totalVolumeM3: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentType?: 'CASH' | 'CREDIT' | 'PARTIAL' | 'cash' | 'credit' | 'partial';
    paymentMethod?: string;
    treasuryId: string;
    notes?: string;
    createdBy: string;
  }) {
    const formattedType = data.type.toUpperCase() as 'SALE' | 'PURCHASE';
    const formattedPartyType = data.partyType.toUpperCase() as 'CUSTOMER' | 'SUPPLIER';

    const year = new Date().getFullYear();
    const prefix = formattedType === 'SALE' ? 'INV' : 'PUR';
    const count = await this.prisma.invoice.count({ where: { type: formattedType } });
    const invoiceNo = `${prefix}-${year}-${(count + 1).toString().padStart(3, '0')}`;

    const status =
      data.paidAmount >= data.totalAmount
        ? 'PAID'
        : data.paidAmount > 0
        ? 'PARTIAL'
        : 'UNPAID';

    return this.prisma.$transaction(async (tx) => {
      // ── Step 0: Validate stock sufficiency for SALE (Atomic Check) ────────
      if (formattedType === 'SALE') {
        for (const item of data.items) {
          const updateResult = await tx.woodProduct.updateMany({
            where: {
              id: item.productId,
              volumeM3: { gte: item.volumeM3 },
            },
            data: {
              volumeM3: { decrement: item.volumeM3 },
            },
          });

          if (updateResult.count === 0) {
            throw new BadRequestException(
              `رصيد غير كافٍ في المخزون للصنف "${item.productName}" (${item.productCode})` +
              ` أو أن الصنف غير موجود`
            );
          }
        }
      }

      // ── Step 1: Create Invoice Record ────────────────────────────────────
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          date: new Date(data.date),
          type: formattedType,
          partyType: formattedPartyType,
          partyId: data.partyId,
          partyName: data.partyName,
          totalVolumeM3: data.totalVolumeM3,
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          remainingAmount: data.remainingAmount,
          paymentType: (data.paymentType?.toUpperCase() as any) || 'CASH',
          paymentMethod: (data.paymentMethod?.toUpperCase() as any) || 'CASH',
          treasuryId: data.treasuryId,
          notes: data.notes,
          status,
          createdBy: data.createdBy,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              productCode: i.productCode,
              productName: i.productName,
              volumeM3: i.volumeM3,
              pricePerM3: i.pricePerM3,
              total: i.total,
            })),
          },
        },
        include: { items: true },
      });

      // ── Step 2: Adjust Stock + Create Inventory Movement ─────────────────
      for (const item of data.items) {
        const prod = await tx.woodProduct.findUnique({ where: { id: item.productId } });
        if (prod) {
          // Adjust Stock conditionally for purchase (Sale is already deducted atomically in Step 0)
          if (formattedType === 'PURCHASE') {
            await tx.woodProduct.update({
              where: { id: item.productId },
              data: { volumeM3: { increment: item.volumeM3 } },
            });
          }
          await tx.inventoryMovement.create({
            data: {
              invoiceNo,
              type: formattedType === 'SALE' ? 'out' : 'in',
              productId: item.productId,
              productCode: item.productCode,
              productName: item.productName,
              volumeM3: item.volumeM3,
              pricePerM3: item.pricePerM3,
              totalValue: item.total,
              createdBy: data.createdBy,
            },
          });
        }
      }

      // ── Step 3: Update Ledger + Party Balance ─────────────────────────────
      if (formattedPartyType === 'CUSTOMER') {
        const cust = await tx.customer.findUnique({ where: { id: data.partyId } });
        if (cust) {
          const newBal = Number(cust.balance) + data.remainingAmount;
          await tx.customer.update({ where: { id: cust.id }, data: { balance: newBal } });
          await tx.ledgerEntry.create({
            data: {
              partyType: 'CUSTOMER',
              partyId: cust.id,
              partyName: cust.name,
              description: `فاتورة مبيعات رقم ${invoiceNo}`,
              debit: data.totalAmount,
              credit: data.paidAmount,
              balance: newBal,
              invoiceId: invoice.id,
              notes: data.notes,
            },
          });
        }
      } else {
        const supp = await tx.supplier.findUnique({ where: { id: data.partyId } });
        if (supp) {
          const newBal = Number(supp.balance) + data.remainingAmount;
          await tx.supplier.update({ where: { id: supp.id }, data: { balance: newBal } });
          await tx.ledgerEntry.create({
            data: {
              partyType: 'SUPPLIER',
              partyId: supp.id,
              partyName: supp.name,
              description: `فاتورة شراء رقم ${invoiceNo}`,
              debit: data.paidAmount,
              credit: data.totalAmount,
              balance: newBal,
              invoiceId: invoice.id,
              notes: data.notes,
            },
          });
        }
      }

      // ── Step 4: Update Treasury Balance ───────────────────────────────────
      if (data.paidAmount > 0) {
        const treasury = await tx.treasuryAccount.findUnique({ where: { id: data.treasuryId } });
        if (treasury) {
          const currentBal = Number(treasury.balance);
          const newBal =
            formattedType === 'SALE'
              ? currentBal + data.paidAmount
              : currentBal - data.paidAmount;
          await tx.treasuryAccount.update({
            where: { id: treasury.id },
            data: { balance: Math.max(0, newBal) },
          });
        }
      }

      return invoice;
    });
  }

  /** Record a partial payment on an existing invoice */
  async recordPayment(
    invoiceId: string,
    amount: number,
    treasuryId: string,
    createdBy: string,
    notes?: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');

    const remaining = Number(invoice.remainingAmount);
    if (amount > remaining) {
      throw new BadRequestException(
        `المبلغ المدفوع (${amount.toLocaleString()}) أكبر من المتبقي (${remaining.toLocaleString()}) ج.م`,
      );
    }

    const newPaid = Number(invoice.paidAmount) + amount;
    const newRemaining = remaining - amount;
    const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';

    return this.prisma.$transaction(async (tx) => {
      // 1. Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
        },
      });

      // 2. Create ledger credit entry
      if (invoice.partyType === 'CUSTOMER') {
        const cust = await tx.customer.findUnique({ where: { id: invoice.partyId } });
        if (cust) {
          const newBal = Number(cust.balance) - amount;
          await tx.customer.update({ where: { id: cust.id }, data: { balance: newBal } });
          await tx.ledgerEntry.create({
            data: {
              partyType: 'CUSTOMER',
              partyId: cust.id,
              partyName: cust.name,
              description: `تحصيل دفعة على فاتورة ${invoice.invoiceNo}`,
              debit: 0,
              credit: amount,
              balance: newBal,
              invoiceId: invoice.id,
              notes: notes,
            },
          });
        }
      } else {
        const supp = await tx.supplier.findUnique({ where: { id: invoice.partyId } });
        if (supp) {
          const newBal = Number(supp.balance) - amount;
          await tx.supplier.update({ where: { id: supp.id }, data: { balance: newBal } });
          await tx.ledgerEntry.create({
            data: {
              partyType: 'SUPPLIER',
              partyId: supp.id,
              partyName: supp.name,
              description: `دفعة على فاتورة ${invoice.invoiceNo}`,
              debit: amount,
              credit: 0,
              balance: newBal,
              invoiceId: invoice.id,
              notes: notes,
            },
          });
        }
      }

      // 3. Update treasury
      const treasury = await tx.treasuryAccount.findUnique({ where: { id: treasuryId } });
      if (treasury) {
        const isSale = invoice.type === 'SALE';
        const newTreasuryBal = isSale
          ? Number(treasury.balance) + amount
          : Number(treasury.balance) - amount;
        await tx.treasuryAccount.update({
          where: { id: treasuryId },
          data: { balance: Math.max(0, newTreasuryBal) },
        });
      }

      return updatedInvoice;
    });
  }

  /** Cancel an invoice and reverse its effects */
  async cancel(invoiceId: string, cancelledBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true },
      });

      if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');
      if (invoice.status === 'CANCELLED') throw new BadRequestException('الفاتورة ملغاة بالفعل');

      const isSale = invoice.type === 'SALE';

      // 1. Reverse Inventory
      for (const item of invoice.items) {
        if (isSale) {
          // Returning stock from cancelled sale
          await tx.woodProduct.update({
            where: { id: item.productId },
            data: { volumeM3: { increment: item.volumeM3 } },
          });
        } else {
          // Returning stock from cancelled purchase (check if we have enough)
          const updateResult = await tx.woodProduct.updateMany({
            where: {
              id: item.productId,
              volumeM3: { gte: item.volumeM3 },
            },
            data: {
              volumeM3: { decrement: item.volumeM3 },
            },
          });
          if (updateResult.count === 0) {
            throw new BadRequestException(`لا يمكن إلغاء فاتورة الشراء لأن الرصيد الحالي للصنف (${item.productCode}) أقل من الكمية المشتراة`);
          }
        }

        // Add reverse movement
        await tx.inventoryMovement.create({
          data: {
            invoiceNo: invoice.invoiceNo,
            type: isSale ? 'in' : 'out', // reverse
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            volumeM3: item.volumeM3,
            pricePerM3: item.pricePerM3,
            totalValue: item.total,
            createdBy: cancelledBy,
            notes: 'إلغاء فاتورة',
          },
        });
      }

      // 2. Reverse Treasury if any money was paid
      if (Number(invoice.paidAmount) > 0) {
        // Need to refund customer (sale) or get refund from supplier (purchase)
        // Sale: we withdraw money from treasury to give back to customer.
        // Purchase: we deposit money to treasury that supplier returned.
        const treasury = await tx.treasuryAccount.findUnique({ where: { id: invoice.treasuryId } });
        if (treasury) {
           // We use updateMany here to ensure we don't withdraw more than we have for sales
           if (isSale) {
             const tResult = await tx.treasuryAccount.updateMany({
               where: { id: treasury.id, balance: { gte: invoice.paidAmount } },
               data: { balance: { decrement: invoice.paidAmount } },
             });
             if (tResult.count === 0) {
                throw new BadRequestException('لا يوجد رصيد كافٍ في الخزنة لرد المبلغ المدفوع للعميل');
             }
           } else {
             await tx.treasuryAccount.update({
               where: { id: treasury.id },
               data: { balance: { increment: invoice.paidAmount } },
             });
           }
        }
      }

      // 3. Reverse Ledger (Customer/Supplier balance)
      if (invoice.partyType === 'CUSTOMER') {
        const cust = await tx.customer.findUnique({ where: { id: invoice.partyId } });
        if (cust) {
          const newBal = Number(cust.balance) - Number(invoice.remainingAmount);
          await tx.customer.update({ where: { id: cust.id }, data: { balance: newBal } });
          await tx.ledgerEntry.create({
            data: {
              partyType: 'CUSTOMER',
              partyId: cust.id,
              partyName: cust.name,
              description: `إلغاء فاتورة رقم ${invoice.invoiceNo}`,
              debit: 0,
              credit: invoice.remainingAmount,
              balance: newBal,
              invoiceId: invoice.id,
              notes: 'إلغاء فاتورة',
            },
          });
        }
      } else {
        const supp = await tx.supplier.findUnique({ where: { id: invoice.partyId } });
        if (supp) {
          const newBal = Number(supp.balance) - Number(invoice.remainingAmount);
          await tx.supplier.update({ where: { id: supp.id }, data: { balance: newBal } });
          await tx.ledgerEntry.create({
            data: {
              partyType: 'SUPPLIER',
              partyId: supp.id,
              partyName: supp.name,
              description: `إلغاء فاتورة رقم ${invoice.invoiceNo}`,
              debit: invoice.remainingAmount, // Reverse
              credit: 0,
              balance: newBal,
              invoiceId: invoice.id,
              notes: 'إلغاء فاتورة',
            },
          });
        }
      }

      // 4. Update Invoice Status
      return tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'CANCELLED' },
      });
    });
  }
}
