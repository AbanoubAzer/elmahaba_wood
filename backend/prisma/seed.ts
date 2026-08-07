import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5432/elmahaba_wood_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting Rich Database Seeding (10x10x10) for El-Mahaba Wood Trading System...');

  // 1. Clean existing data
  await prisma.bankCheck.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.collectionRoute.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.treasuryTransaction.deleteMany();
  await prisma.treasuryAccount.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.woodProduct.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.createMany({
    data: [
      { name: 'الدعم الفني (مخفي)', email: 'support@elmahaba.com', password: hashedPassword, phone: '01000000000', role: 'ADMIN', active: true, isHidden: true },
      { name: 'صاحب الشركة (المدير)', email: 'owner@elmahaba.com', password: hashedPassword, phone: '01000000001', role: 'ADMIN', active: true, isHidden: false },
      { name: 'أحمد المحاسب', email: 'accountant@elmahaba.com', password: hashedPassword, phone: '01200000002', role: 'ACCOUNTANT', active: true, isHidden: false },
      { name: 'مينا المخزنجي', email: 'storekeeper@elmahaba.com', password: hashedPassword, phone: '01200000003', role: 'STOREKEEPER', active: true, isHidden: false },
    ],
  });
  console.log('✅ Users seeded');

  // 3. Seed 10 Wood Products
  const products: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const p = await prisma.woodProduct.create({
      data: {
        code: `PROD-00${i}`,
        name: `خشب نوع ${i} ممتاز`,
        specs: `${10 * i} × ${20 * i} مم`,
        volumeM3: 50.0 + i * 5, // 55 to 100 m3
        pricePerM3: 10000 + i * 1000,
        minStockM3: 10.0,
        notes: `ملاحظات منتج ${i}`,
      },
    });
    products.push(p);
  }
  console.log('✅ 10 Wood Products seeded');

  // 4. Seed 10 Customers & 10 Suppliers
  const customers: any[] = [];
  const suppliers: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const c = await prisma.customer.create({
      data: {
        name: `عميل ${i} (شركة المقاولات ${i})`,
        phone: `010100000${i.toString().padStart(2, '0')}`,
        address: `عنوان العميل ${i}`,
        notes: `عميل رقم ${i}`,
        balance: 0, // will update via ledger
      },
    });
    customers.push(c);

    const s = await prisma.supplier.create({
      data: {
        name: `مورد ${i} (شركة الأخشاب ${i})`,
        phone: `011200000${i.toString().padStart(2, '0')}`,
        address: `عنوان المورد ${i}`,
        notes: `مورد رقم ${i}`,
        balance: 0,
      },
    });
    suppliers.push(s);
  }
  console.log('✅ 10 Customers & 10 Suppliers seeded');

  // 5. Seed Treasuries
  const treasury1 = await prisma.treasuryAccount.create({ data: { name: 'الخزينة الرئيسية', type: 'CASH', balance: 500000 } });
  const treasury2 = await prisma.treasuryAccount.create({ data: { name: 'البنك الأهلي', type: 'BANK_TRANSFER', balance: 1000000 } });
  console.log('✅ Treasuries seeded');

  // 6. Generate 10 Invoices for EACH Customer (100 Sales) and EACH Supplier (100 Purchases)
  console.log('⏳ Generating 200 Invoices & Ledger Entries (this might take a few seconds)...');

  let invoiceCounter = 1;
  const paymentMethods = ['CASH', 'INSTAPAY', 'BANK_TRANSFER', 'VODAFONE_CASH', 'CHECK'];

  // Helper to create an invoice and ledger entry
  async function createInvoice(party: any, partyType: 'CUSTOMER' | 'SUPPLIER') {
    const isSale = partyType === 'CUSTOMER';
    const type = isSale ? 'SALE' : 'PURCHASE';
    const prefix = isSale ? 'INV' : 'PUR';
    const invoiceNo = `${prefix}-2026-${invoiceCounter.toString().padStart(4, '0')}`;
    invoiceCounter++;

    // Pick 1 to 3 random products
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items: any[] = [];
    let totalVolumeM3 = 0;
    let totalAmount = 0;

    for (let i = 0; i < numItems; i++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const volumeM3 = (Math.random() * 5 + 1); // 1 to 6 m3
      const pricePerM3 = isSale ? (prod.pricePerM3 * 1.1) : prod.pricePerM3; // Sell with 10% markup
      const total = volumeM3 * pricePerM3;

      items.push({
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        volumeM3,
        pricePerM3,
        total,
      });
      totalVolumeM3 += volumeM3;
      totalAmount += total;
    }

    // Payment (randomize: full, partial, unpaid)
    let paidAmount = 0;
    const rand = Math.random();
    if (rand < 0.4) paidAmount = totalAmount; // 40% full paid
    else if (rand < 0.8) paidAmount = totalAmount * 0.5; // 40% partial
    else paidAmount = 0; // 20% unpaid
    
    const remainingAmount = totalAmount - paidAmount;
    const status = paidAmount >= totalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
    const paymentType = paidAmount >= totalAmount ? 'CASH' : paidAmount > 0 ? 'PARTIAL' : 'CREDIT';
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const date = new Date(2026, 0, Math.floor(Math.random() * 90) + 1); // random date in early 2026

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo, date, type, partyType,
        partyId: party.id, partyName: party.name,
        totalVolumeM3, totalAmount, paidAmount, remainingAmount,
        paymentType: paymentType as any, paymentMethod: paymentMethod as any, treasuryId: treasury1.id,
        notes: `فاتورة تجريبية ${invoiceNo}`,
        status: status as any, createdBy: 'أحمد المحاسب',
        items: { create: items },
      },
    });

    // Update Party Balance & Ledger Entry
    if (isSale) {
      await prisma.customer.update({ where: { id: party.id }, data: { balance: { increment: remainingAmount } } });
      await prisma.ledgerEntry.create({
        data: {
          date, partyType, partyId: party.id, partyName: party.name,
          description: `فاتورة مبيعات رقم ${invoiceNo}`,
          debit: totalAmount, credit: paidAmount, balance: 0, // Simplified for seed
          invoiceId: invoice.id,
        }
      });
      // Inventory out
      for (const item of items) {
        await prisma.inventoryMovement.create({
          data: { invoiceNo, type: 'out', productId: item.productId, productCode: item.productCode, productName: item.productName, volumeM3: item.volumeM3, pricePerM3: item.pricePerM3, totalValue: item.total, createdBy: 'أحمد المحاسب' }
        });
      }
    } else {
      await prisma.supplier.update({ where: { id: party.id }, data: { balance: { increment: remainingAmount } } });
      await prisma.ledgerEntry.create({
        data: {
          date, partyType, partyId: party.id, partyName: party.name,
          description: `فاتورة شراء رقم ${invoiceNo}`,
          debit: paidAmount, credit: totalAmount, balance: 0,
          invoiceId: invoice.id,
        }
      });
      // Inventory in
      for (const item of items) {
        await prisma.inventoryMovement.create({
          data: { invoiceNo, type: 'in', productId: item.productId, productCode: item.productCode, productName: item.productName, volumeM3: item.volumeM3, pricePerM3: item.pricePerM3, totalValue: item.total, createdBy: 'أحمد المحاسب' }
        });
      }
    }
  }

  for (const customer of customers) {
    for (let i = 0; i < 10; i++) await createInvoice(customer, 'CUSTOMER');
  }
  for (const supplier of suppliers) {
    for (let i = 0; i < 10; i++) await createInvoice(supplier, 'SUPPLIER');
  }

  console.log('✅ 200 Invoices created!');
  console.log('🎉 Rich Database seeding completed successfully!');
}

main()
  .catch((e) => { console.error('❌ Seeding error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
