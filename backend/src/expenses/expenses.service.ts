import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreasuriesService } from '../treasuries/treasuries.service';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private prisma: PrismaService,
    private treasuriesService: TreasuriesService,
  ) {}

  async findAll() {
    return this.prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async create(data: any) {
    // Start transaction to ensure expense and treasury deduction both happen
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the expense
      const expense = await tx.expense.create({
        data: {
          title: data.title,
          category: data.category,
          amount: data.amount,
          date: new Date(data.date),
          treasuryId: data.treasuryId,
          notes: data.notes,
          createdBy: data.createdBy || 'System',
        },
      });

      // 2. If treasury is selected, deduct amount and record transaction
      if (data.treasuryId) {
        const treasury = await tx.treasuryAccount.findUnique({
          where: { id: data.treasuryId },
        });

        if (!treasury) {
          throw new BadRequestException('الخزينة المحددة غير موجودة');
        }

        if (Number(treasury.balance) < Number(data.amount)) {
          throw new BadRequestException('رصيد الخزينة غير كافٍ لإتمام هذا المصروف');
        }

        if (treasury) {
          // Deduct from treasury balance
          await tx.treasuryAccount.update({
            where: { id: data.treasuryId },
            data: { balance: { decrement: data.amount } },
          });

          // Create treasury transaction
          await tx.treasuryTransaction.create({
            data: {
              fromTreasuryId: data.treasuryId,
              fromTreasuryName: treasury.name,
              amount: data.amount,
              type: 'expense',
              notes: `مصروفات: ${data.title} - ${data.category}`,
              createdBy: data.createdBy || 'System',
              date: new Date(data.date),
            },
          });
        }
      }

      return expense;
    });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({ where: { id } });
      if (!expense) throw new BadRequestException('المصروف غير موجود');

      // Refund the treasury if the expense was linked to one
      if (expense.treasuryId) {
        await tx.treasuryAccount.update({
          where: { id: expense.treasuryId },
          data: { balance: { increment: expense.amount } },
        });

        await tx.treasuryTransaction.create({
          data: {
            toTreasuryId: expense.treasuryId,
            toTreasuryName: (await tx.treasuryAccount.findUnique({ where: { id: expense.treasuryId } }))?.name || '',
            amount: expense.amount,
            type: 'refund',
            notes: `إلغاء مصروف: ${expense.title} - ${expense.category}`,
            createdBy: expense.createdBy || 'System',
            date: new Date(),
          },
        });
      }

      return tx.expense.delete({ where: { id } });
    });
  }
}
