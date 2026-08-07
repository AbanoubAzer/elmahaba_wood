import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5432/elmahaba_wood_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@elmahaba.com';
  const password = 'admin';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', password: hashedPassword }
    });
    console.log('Admin user updated! Email: ' + email + ' Password: ' + password);
  } else {
    await prisma.user.create({
      data: {
        name: 'مدير النظام',
        email,
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
      }
    });
    console.log('Admin user created! Email: ' + email + ' Password: ' + password);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
