import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TreasuriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.treasuryAccount.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTransactions() {
    return this.prisma.treasuryTransaction.findMany({
      orderBy: { date: 'desc' },
      take: 200,
    });
  }

  async updateBalance(treasuryId: string, amount: number, type: 'deposit' | 'withdrawal') {
    const treasury = await this.prisma.treasuryAccount.findUnique({ where: { id: treasuryId } });
    if (!treasury) throw new BadRequestException('الخزينة غير موجودة');

    const currentBal = Number(treasury.balance);
    if (type === 'withdrawal' && currentBal < amount) {
      throw new BadRequestException(
        `رصيد غير كافٍ في "${treasury.name}" — المتاح: ${currentBal.toLocaleString()} ج.م`
      );
    }

    const newBal = type === 'deposit' ? currentBal + amount : currentBal - amount;
    return this.prisma.treasuryAccount.update({
      where: { id: treasuryId },
      data: { balance: newBal },
    });
  }

  async transferFunds(data: {
    fromId: string;
    toId: string;
    amount: number;
    notes: string;
    createdBy: string;
  }) {
    const from = await this.prisma.treasuryAccount.findUnique({ where: { id: data.fromId } });
    const to = await this.prisma.treasuryAccount.findUnique({ where: { id: data.toId } });

    if (!from) throw new BadRequestException('الخزينة المرسِلة غير موجودة');
    if (!to) throw new BadRequestException('الخزينة المستقبِلة غير موجودة');
    if (Number(from.balance) < data.amount) {
      throw new BadRequestException(
        `رصيد غير كافٍ في "${from.name}" — المتاح: ${Number(from.balance).toLocaleString()} ج.م`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.treasuryAccount.update({
        where: { id: data.fromId },
        data: { balance: Number(from.balance) - data.amount },
      });
      await tx.treasuryAccount.update({
        where: { id: data.toId },
        data: { balance: Number(to.balance) + data.amount },
      });
      return tx.treasuryTransaction.create({
        data: {
          fromTreasuryId: data.fromId,
          fromTreasuryName: from.name,
          toTreasuryId: data.toId,
          toTreasuryName: to.name,
          amount: data.amount,
          type: 'transfer',
          notes: data.notes,
          createdBy: data.createdBy,
        },
      });
    });
  }
}
