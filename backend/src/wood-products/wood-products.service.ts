import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WoodProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.woodProduct.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.woodProduct.findUnique({
      where: { id },
    });
  }

  async create(data: {
    code: string;
    name: string;
    specs: string;
    volumeM3: number;
    pricePerM3: number;
    minStockM3?: number;
    notes?: string;
  }) {
    return this.prisma.woodProduct.create({
      data: {
        code: data.code,
        name: data.name,
        specs: data.specs,
        volumeM3: data.volumeM3,
        pricePerM3: data.pricePerM3,
        minStockM3: data.minStockM3 ?? 5.0,
        notes: data.notes,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.woodProduct.update({
      where: { id },
      data,
    });
  }

  async getMovements() {
    return this.prisma.inventoryMovement.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: string) {
    // Check if product has any remaining stock
    const product = await this.prisma.woodProduct.findUnique({
      where: { id },
    });
    if (product && Number(product.volumeM3) > 0) {
      throw new BadRequestException('لا يمكن حذف صنف يحتوي على كمية في المخزن.');
    }

    // Check if product is used in any invoice items
    const invoiceItems = await this.prisma.invoiceItem.findFirst({
      where: { productId: id },
    });
    if (invoiceItems) {
      throw new BadRequestException('لا يمكن حذف هذا الصنف لأنه مستخدم في فواتير سابقة.');
    }

    // Check if product has inventory movements
    const movements = await this.prisma.inventoryMovement.findFirst({
      where: { productId: id },
    });
    if (movements) {
      throw new BadRequestException('لا يمكن حذف هذا الصنف لوجود حركات مخزنية مسجلة عليه.');
    }

    return this.prisma.woodProduct.delete({
      where: { id },
    });
  }
}
