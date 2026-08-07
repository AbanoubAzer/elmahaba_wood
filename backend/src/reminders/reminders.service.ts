import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    // Configure NodeMailer transporter (Needs actual App Password in .env)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'abanoubgazer96@gmail.com', // or process.env.EMAIL_USER
        pass: process.env.EMAIL_PASS || 'dummy-password', // Must be an App Password
      },
    });
  }

  async findAll() {
    return this.prisma.reminder.findMany({
      orderBy: { dueDate: 'asc' },
    });
  }

  async create(data: { title: string; description?: string; dueDate: string }) {
    return this.prisma.reminder.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
      },
    });
  }

  async markAsCompleted(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { isCompleted: true },
    });
  }

  async delete(id: string) {
    return this.prisma.reminder.delete({
      where: { id },
    });
  }

  // Runs every day at 8:00 AM (or every minute for testing if we change it)
  // We'll run it every hour for better responsiveness
  @Cron(CronExpression.EVERY_HOUR)
  async handleCronReminders() {
    this.logger.debug('Checking for upcoming or overdue reminders...');

    const now = new Date();
    // Find reminders that are due within the next 24 hours OR overdue, not completed, and email not sent yet.
    const reminders = await this.prisma.reminder.findMany({
      where: {
        isCompleted: false,
        emailSent: false,
        dueDate: {
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Due in next 24 hours or already passed
        },
      },
    });

    for (const reminder of reminders) {
      try {
        await this.sendReminderEmail(reminder);
        
        // Mark as email sent so we don't spam
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { emailSent: true },
        });
        
        this.logger.log(`Reminder email sent for: ${reminder.title}`);
      } catch (error) {
        this.logger.error(`Failed to send email for reminder ${reminder.id}`, error);
      }
    }
  }

  private async sendReminderEmail(reminder: any) {
    const isOverdue = new Date(reminder.dueDate) < new Date();
    const statusText = isOverdue ? 'متأخر (Overdue)' : 'موعد مقترب (Upcoming)';
    const color = isOverdue ? 'red' : 'orange';

    const mailOptions = {
      from: '"المحبه لتجاره الاخشاب اداره ايهاب سعد" <abanoubgazer96@gmail.com>',
      to: 'abanoubgazer96@gmail.com',
      subject: `[تذكير النظام] ${statusText}: ${reminder.title}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: ${color};">🔔 تنبيه: لديك تذكير ${statusText}</h2>
          <h3><strong>الموضوع:</strong> ${reminder.title}</h3>
          <p><strong>التفاصيل:</strong> ${reminder.description || 'لا يوجد تفاصيل إضافية'}</p>
          <p><strong>تاريخ الاستحقاق:</strong> <span dir="ltr">${reminder.dueDate.toISOString().split('T')[0]}</span></p>
          <hr />
          <p style="font-size: 12px; color: #777;">
            هذه رسالة تلقائية من نظام شركة المحبة لتجارة الأخشاب.
            الرجاء الدخول إلى لوحة التحكم لتعليم هذا التذكير كـ "مكتمل".
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
