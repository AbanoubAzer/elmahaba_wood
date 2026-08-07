import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
@UseGuards(AuthGuard('jwt'))
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.suppliersService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.suppliersService.update(id, body);
  }

  @Get(':id/ledger')
  getLedger(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.suppliersService.getLedger(id);
  }

  @Post(':id/ledger')
  addLedgerEntry(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    this.checkAdmin(req);
    return this.suppliersService.addLedgerEntry(id, body);
  }
}
