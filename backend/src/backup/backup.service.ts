import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  async exportDatabase() {
    const data = {
      users: await this.prisma.user.findMany(),
      customers: await this.prisma.customer.findMany(),
      suppliers: await this.prisma.supplier.findMany(),
      woodProducts: await this.prisma.woodProduct.findMany(),
      treasuryAccounts: await this.prisma.treasuryAccount.findMany(),
      treasuryTransactions: await this.prisma.treasuryTransaction.findMany(),
      invoices: await this.prisma.invoice.findMany({ include: { items: true } }),
      ledgerEntries: await this.prisma.ledgerEntry.findMany(),
      inventoryMovements: await this.prisma.inventoryMovement.findMany(),
      collectionRoutes: await this.prisma.collectionRoute.findMany(),
      installments: await this.prisma.installment.findMany(),
      auditLogs: await this.prisma.auditLog.findMany(),
    };

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  async importDatabase(backupData: any) {
    if (!backupData || !backupData.data || backupData.version !== '1.0') {
      throw new BadRequestException('ملف النسخة الاحتياطية غير صالح أو غير مدعوم');
    }

    const { data } = backupData;

    try {
      // 1. Clean existing data in reverse order of dependencies
      await this.prisma.auditLog.deleteMany();
      await this.prisma.installment.deleteMany();
      await this.prisma.collectionRoute.deleteMany();
      await this.prisma.ledgerEntry.deleteMany();
      await this.prisma.invoiceItem.deleteMany();
      await this.prisma.invoice.deleteMany();
      await this.prisma.treasuryTransaction.deleteMany();
      await this.prisma.treasuryAccount.deleteMany();
      await this.prisma.inventoryMovement.deleteMany();
      await this.prisma.woodProduct.deleteMany();
      await this.prisma.supplier.deleteMany();
      await this.prisma.customer.deleteMany();
      // Keep users untouched to avoid locking out the admin doing the import
      // If we want to restore users too, we should filter out the current user

      // 2. Import core entities
      if (data.customers?.length) await this.prisma.customer.createMany({ data: data.customers });
      if (data.suppliers?.length) await this.prisma.supplier.createMany({ data: data.suppliers });
      if (data.woodProducts?.length) await this.prisma.woodProduct.createMany({ data: data.woodProducts });
      if (data.treasuryAccounts?.length) await this.prisma.treasuryAccount.createMany({ data: data.treasuryAccounts });

      // 3. Import invoices and items
      if (data.invoices?.length) {
        for (const invoice of data.invoices) {
          const { items, ...invoiceData } = invoice;
          await this.prisma.invoice.create({
            data: {
              ...invoiceData,
              items: {
                create: items.map((item: any) => {
                  const { invoiceId, id, ...rest } = item;
                  return rest;
                })
              }
            }
          });
        }
      }

      // 4. Import logs and entries
      if (data.ledgerEntries?.length) await this.prisma.ledgerEntry.createMany({ data: data.ledgerEntries });
      if (data.treasuryTransactions?.length) await this.prisma.treasuryTransaction.createMany({ data: data.treasuryTransactions });
      if (data.inventoryMovements?.length) await this.prisma.inventoryMovement.createMany({ data: data.inventoryMovements });
      if (data.collectionRoutes?.length) await this.prisma.collectionRoute.createMany({ data: data.collectionRoutes });
      if (data.installments?.length) await this.prisma.installment.createMany({ data: data.installments });

      return { success: true, message: 'تم استعادة النسخة الاحتياطية بنجاح' };
    } catch (err: any) {
      console.error('Import failed', err);
      throw new BadRequestException('فشل استعادة البيانات: ' + err.message);
    }
  }
}
