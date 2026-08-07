import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async getAll() {
    try {
      return await this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to get notifications', error);
      throw error;
    }
  }

  async markAsRead(id: string) {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { read: true },
      });
    } catch (error) {
      this.logger.error(`Failed to mark notification ${id} as read`, error);
      throw error;
    }
  }

  async createNotification(title: string, message: string, type: string) {
    try {
      return await this.prisma.notification.create({
        data: {
          title,
          message,
          type,
          date: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      throw error;
    }
  }
}
