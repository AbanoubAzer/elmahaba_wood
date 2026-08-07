import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { WoodProductsModule } from './wood-products/wood-products.module';
import { InvoicesModule } from './invoices/invoices.module';
import { TreasuriesModule } from './treasuries/treasuries.module';
import { LedgerModule } from './ledger/ledger.module';
import { UsersModule } from './users/users.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from './reminders/reminders.module';
import { BackupModule } from './backup/backup.module';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { ChecksModule } from './checks/checks.module';
import { InstallmentsModule } from './installments/installments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute per IP
    }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CustomersModule,
    SuppliersModule,
    WoodProductsModule,
    InvoicesModule,
    TreasuriesModule,
    LedgerModule,
    ReportsModule,
    UsersModule,
    BackupModule,
    RemindersModule,
    ChecksModule,
    InstallmentsModule,
    NotificationsModule,
    SettingsModule,
    ExpensesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}


