import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; phone: string; address: string; notes?: string; balance?: number }) {
    return this.prisma.customer.create({
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
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async getLedger(customerId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        partyId: customerId,
        partyType: 'CUSTOMER',
      },
      include: {
        invoice: {
          include: { items: true }
        }
      },
      orderBy: { date: 'asc' },
    });
  }

  async addLedgerEntry(customerId: string, data: {
    description: string;
    debit?: number;
    credit?: number;
    notes?: string;
    woodSpecs?: string;
    volumeM3?: number;
    pricePerM3?: number;
    invoiceId?: string;
  }) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error('Customer not found');

    const debit = data.debit ?? 0;
    const credit = data.credit ?? 0;
    const currentBalance = Number(customer.balance);
    const newBalance = currentBalance + debit - credit;

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { balance: newBalance },
    });

    return this.prisma.ledgerEntry.create({
      data: {
        partyType: 'CUSTOMER',
        partyId: customer.id,
        partyName: customer.name,
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
