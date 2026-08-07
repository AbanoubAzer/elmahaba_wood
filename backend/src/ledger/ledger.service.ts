import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  /** Get all ledger entries (customers + suppliers) ordered by date */
  async findAll() {
    return this.prisma.ledgerEntry.findMany({
      orderBy: { date: 'asc' },
    });
  }

  /** Get ledger for one customer */
  async findByCustomer(customerId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { partyId: customerId, partyType: 'CUSTOMER' },
      orderBy: { date: 'asc' },
    });
  }

  /** Get ledger for one supplier */
  async findBySupplier(supplierId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { partyId: supplierId, partyType: 'SUPPLIER' },
      orderBy: { date: 'asc' },
    });
  }
}
