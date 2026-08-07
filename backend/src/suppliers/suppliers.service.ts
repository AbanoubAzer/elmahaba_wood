import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; phone: string; address: string; notes?: string; balance?: number }) {
    return this.prisma.supplier.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        balance: data.balance ?? 0,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async getLedger(supplierId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        partyId: supplierId,
        partyType: 'SUPPLIER',
      },
      include: {
        invoice: {
          include: { items: true }
        }
      },
      orderBy: { date: 'asc' },
    });
  }

  async addLedgerEntry(supplierId: string, data: {
    description: string;
    debit?: number;
    credit?: number;
    notes?: string;
    woodSpecs?: string;
    volumeM3?: number;
    pricePerM3?: number;
    invoiceId?: string;
  }) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new Error('Supplier not found');

    const debit = data.debit ?? 0;
    const credit = data.credit ?? 0;
    const currentBalance = Number(supplier.balance);
    const newBalance = currentBalance + credit - debit;

    await this.prisma.supplier.update({
      where: { id: supplierId },
      data: { balance: newBalance },
    });

    return this.prisma.ledgerEntry.create({
      data: {
        partyType: 'SUPPLIER',
        partyId: supplier.id,
        partyName: supplier.name,
        description: data.description,
        debit,
        credit,
        balance: newBalance,
        notes: data.notes,
        woodSpecs: data.woodSpecs,
        volumeM3: data.volumeM3,
        pricePerM3: data.pricePerM3,
        invoiceId: data.invoiceId,
      },
    });
  }
}
