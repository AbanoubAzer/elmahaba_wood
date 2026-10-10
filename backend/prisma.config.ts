import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'ts-node ./prisma/seed.ts',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ||
      process.env.DIRECT_URL ||
      'postgresql://postgres:test@localhost:5432/elmahaba_wood_db?schema=public',
  },
});
