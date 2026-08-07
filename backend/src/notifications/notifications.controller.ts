import { Controller, Get, Patch, Param, Body, Post, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get()
  async getAll(@Request() req: any) {
    this.checkAdmin(req);
    return this.notificationsService.getAll();
  }

  @Patch(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.notificationsService.markAsRead(id);
  }

  @Post()
  async create(@Request() req: any, @Body() body: { title: string; message: string; type: string }) {
    this.checkAdmin(req);
    return this.notificationsService.createNotification(body.title, body.message, body.type);
  }
}
