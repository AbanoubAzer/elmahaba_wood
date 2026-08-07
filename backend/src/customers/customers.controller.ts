import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(AuthGuard('jwt'))
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.customersService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.customersService.update(id, body);
  }

  @Get(':id/ledger')
  getLedger(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.customersService.getLedger(id);
  }

  @Post(':id/ledger')
  addLedgerEntry(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    this.checkAdmin(req);
    return this.customersService.addLedgerEntry(id, body);
  }
}
