import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';

@Injectable()
export class InstallmentsService {
  private readonly logger = new Logger(InstallmentsService.name);

  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  async getAll() {
    return this.prisma.installment.findMany({
      orderBy: { dueDate: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.installment.create({
      data: {
        partyName: data.partyName,
        partyType: data.partyType,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        notes: data.notes,
      },
    });
  }

  async togglePaid(id: string, paid: boolean) {
    return this.prisma.installment.update({
      where: { id },
      data: {
        paid,
        paidDate: paid ? new Date() : null,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.installment.delete({
      where: { id },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkAndSendEmails() {
    this.logger.debug('Checking for upcoming installments/alerts...');
    
    const smtpConfig = await this.settings.getSetting('smtpConfig', null);
    if (!smtpConfig || !smtpConfig.enabled || !smtpConfig.senderEmail || !smtpConfig.recipientEmail) {
      this.logger.debug('SMTP is not configured or disabled. Skipping emails.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpConfig.senderEmail,
        pass: process.env.EMAIL_PASS || 'dummy-password', 
      },
    });

    const now = new Date();
    // Due in next 24 hours OR overdue, not paid, email not sent
    const dueInstallments = await this.prisma.installment.findMany({
      where: {
        paid: false,
        emailSent: false,
        dueDate: {
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const inst of dueInstallments) {
      try {
        const isOverdue = new Date(inst.dueDate) < new Date();
        const statusText = isOverdue ? 'متأخر (Overdue)' : 'موعد مقترب (Upcoming)';
        const color = isOverdue ? 'red' : 'orange';
        const typeName = inst.partyType === 'general' ? 'تنبيه عام' : inst.partyType === 'supplier' ? 'مورد أخشاب' : 'التزام شخصي';

        const amountNum = Number(inst.amount);

        const mailOptions = {
          from: `"نظام الإشعارات" <${smtpConfig.senderEmail}>`,
          to: smtpConfig.recipientEmail,
          subject: `[${typeName}] ${statusText}: ${inst.partyName}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: ${color};">🔔 تنبيه: ${typeName} ${statusText}</h2>
              <h3><strong>المستحق له / العنوان:</strong> ${inst.partyName}</h3>
              <p><strong>المبلغ:</strong> ${amountNum > 0 ? amountNum + ' ج.م' : 'لا يوجد (تنبيه عام)'}</p>
              <p><strong>تاريخ الاستحقاق:</strong> <span dir="ltr">${inst.dueDate.toISOString().split('T')[0]}</span></p>
              <p><strong>ملاحظات:</strong> ${inst.notes || 'لا يوجد'}</p>
              <hr />
              <p style="font-size: 12px; color: #777;">هذه رسالة تلقائية من النظام.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        
        await this.prisma.installment.update({
          where: { id: inst.id },
          data: { emailSent: true },
        });
        
        this.logger.log(`Installment email sent for: ${inst.partyName}`);
      } catch (error) {
        this.logger.error(`Failed to send email for installment ${inst.id}`, error);
      }
    }
  }
}
