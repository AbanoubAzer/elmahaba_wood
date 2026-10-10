import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustodiesService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.custody.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    personName: string;
    phone?: string;
    location?: string;
    amount: number;
    expectedReturnDate?: string | Date;
    delivered?: boolean;
    notes?: string;
    createdBy?: string;
  }) {
    return this.prisma.custody.create({
      data: {
        personName: data.personName,
        phone: data.phone || null,
        location: data.location || null,
        amount: data.amount,
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
        delivered: data.delivered ?? false,
        deliveredDate: data.delivered ? new Date() : null,
        notes: data.notes || null,
        createdBy: data.createdBy || null,
      },
    });
  }

  async update(id: string, data: {
    personName?: string;
    phone?: string;
    location?: string;
    amount?: number;
    expectedReturnDate?: string | Date;
    delivered?: boolean;
    deliveredDate?: string | Date;
    notes?: string;
  }) {
    const updateData: any = { ...data };
    if (data.expectedReturnDate !== undefined) {
      updateData.expectedReturnDate = data.expectedReturnDate ? new Date(data.expectedReturnDate) : null;
    }
    if (data.deliveredDate !== undefined) {
      updateData.deliveredDate = data.deliveredDate ? new Date(data.deliveredDate) : null;
    }

    return this.prisma.custody.update({
      where: { id },
      data: updateData,
    });
  }

  async toggleDelivered(id: string, delivered: boolean) {
    return this.prisma.custody.update({
      where: { id },
      data: {
        delivered,
        deliveredDate: delivered ? new Date() : null,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.custody.delete({
      where: { id },
    });
  }
}
