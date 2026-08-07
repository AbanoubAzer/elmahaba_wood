import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChecksService } from './checks.service';

@Controller('checks')
@UseGuards(AuthGuard('jwt'))
export class ChecksController {
  constructor(private readonly checksService: ChecksService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Post()
  create(@Request() req: any, @Body() data: any) {
    this.checkAdmin(req);
    return this.checksService.create(data);
  }

  @Get()
  findAll(@Request() req: any) {
    this.checkAdmin(req);
    return this.checksService.findAll();
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.checksService.findOne(id);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    this.checkAdmin(req);
    return this.checksService.update(id, data);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.checksService.remove(id);
  }
}
