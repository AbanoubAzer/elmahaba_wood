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
}
