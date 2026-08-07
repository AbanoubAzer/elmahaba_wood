import { Controller, Get, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get('smtp')
  async getSmtpConfig(@Request() req: any) {
    this.checkAdmin(req);
    return this.settingsService.getSetting('smtpConfig', {
      enabled: true,
      senderEmail: 'notifications@elmahaba-wood.com',
      recipientEmail: 'owner@elmahaba-wood.com',
    });
  }

  @Post('smtp')
  async updateSmtpConfig(@Request() req: any, @Body() config: any) {
    this.checkAdmin(req);
    return this.settingsService.setSetting('smtpConfig', config);
  }

  @Post('smtp/test')
  async testSmtpConfig(@Request() req: any) {
    this.checkAdmin(req);
    try {
      return await this.settingsService.testSmtp();
    } catch (error: any) {
      throw new ForbiddenException(error.message);
    }
  }
}
