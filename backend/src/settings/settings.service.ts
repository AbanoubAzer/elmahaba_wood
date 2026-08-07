import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async getSetting(key: string, defaultValue: any = null) {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key },
      });
      return setting ? JSON.parse(setting.value) : defaultValue;
    } catch (error) {
      this.logger.error(`Failed to get setting ${key}`, error);
      return defaultValue;
    }
  }

  async setSetting(key: string, value: any) {
    try {
      const valueStr = JSON.stringify(value);
      await this.prisma.systemSetting.upsert({
        where: { key },
        update: { value: valueStr },
        create: { key, value: valueStr },
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to set setting ${key}`, error);
      throw error;
    }
  }

  async testSmtp() {
    const config = await this.getSetting('smtpConfig');
    if (!config || !config.enabled || !config.senderEmail || !config.appPassword) {
      throw new Error('إعدادات SMTP غير مكتملة أو معطلة');
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.senderEmail,
        pass: config.appPassword,
      },
    });

    try {
      await transporter.sendMail({
        from: `"نظام المحبة للأخشاب" <${config.senderEmail}>`,
        to: config.recipientEmail || config.senderEmail,
        subject: 'بريد تجريبي من نظام المحبة للأخشاب',
        text: 'تم إعداد خدمة البريد الإلكتروني بنجاح! يمكنك الآن استقبال الإشعارات والتنبيهات اليومية.',
      });
      return { success: true };
    } catch (error: any) {
      this.logger.error('Failed to send test email', error);
      throw new Error('فشل إرسال البريد: ' + error.message);
    }
  }
}
