import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BackupService } from './backup.service';
import type { Response } from 'express';

@Controller('backup')
@UseGuards(AuthGuard('jwt'))
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get('export')
  async exportDatabase(@Request() req: any, @Res() res: Response) {
    this.checkAdmin(req);
    const backup = await this.backupService.exportDatabase();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=elmahaba-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.send(backup);
  }

  @Post('import')
  async importDatabase(@Request() req: any, @Body() data: any) {
    this.checkAdmin(req);
    return this.backupService.importDatabase(data);
  }
}
