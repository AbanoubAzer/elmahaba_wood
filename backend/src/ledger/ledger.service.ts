import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  /** Get all ledger entries (customers + suppliers) ordered by date */
  async findAll(page?: number, limit?: number) {
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.ledgerEntry.findMany({
          orderBy: { date: 'asc' },
          include: {
            invoice: {
              include: { items: true },
            },
          },
          skip,
          take: limit,
        }),
        this.prisma.ledgerEntry.count(),
      ]);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    return this.prisma.ledgerEntry.findMany({
      orderBy: { date: 'asc' },
      include: {
        invoice: {
          include: { items: true },
        },
      },
    });
  }

  /** Get ledger for one customer */
  async findByCustomer(customerId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { partyId: customerId, partyType: 'CUSTOMER' },
      orderBy: { date: 'asc' },
      include: {
        invoice: {
          include: { items: true }
        }
      }
    });
  }

  /** Get ledger for one supplier */
  async findBySupplier(supplierId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { partyId: supplierId, partyType: 'SUPPLIER' },
      orderBy: { date: 'asc' },
      include: {
        invoice: {
          include: { items: true }
        }
      }
    });
  }
}
