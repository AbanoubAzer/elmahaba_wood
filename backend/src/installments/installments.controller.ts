import { Controller, Get, Post, Patch, Param, Body, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InstallmentsService } from './installments.service';

@Controller('installments')
@UseGuards(AuthGuard('jwt'))
export class InstallmentsController {
  constructor(private readonly installmentsService: InstallmentsService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get()
  async getAll(@Request() req: any) {
    this.checkAdmin(req);
    return this.installmentsService.getAll();
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    this.checkAdmin(req);
    return this.installmentsService.create(body);
  }

  @Patch(':id/toggle-paid')
  async togglePaid(@Request() req: any, @Param('id') id: string, @Body() body: { paid: boolean }) {
    this.checkAdmin(req);
    return this.installmentsService.togglePaid(id, body.paid);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.installmentsService.delete(id);
  }
}
