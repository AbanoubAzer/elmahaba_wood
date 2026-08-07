import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecksService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.bankCheck.create({
      data: {
        checkNumber: data.checkNumber,
        bankName: data.bankName,
        dueDate: new Date(data.dueDate),
        amount: data.amount,
        type: data.type,
        partyId: data.partyId,
        partyName: data.partyName,
        status: data.status || 'PENDING',
        notes: data.notes,
      },
    });
  }

  async findAll() {
    return this.prisma.bankCheck.findMany({
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const check = await this.prisma.bankCheck.findUnique({ where: { id } });
    if (!check) throw new NotFoundException('الشيك غير موجود');
    return check;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.bankCheck.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.bankCheck.delete({ where: { id } });
  }
}
