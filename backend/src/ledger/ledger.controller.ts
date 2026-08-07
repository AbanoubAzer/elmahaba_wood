import { Controller, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LedgerService } from './ledger.service';

@Controller('ledger')
@UseGuards(AuthGuard('jwt'))
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  /** GET /api/ledger — all entries */
  @Get()
  findAll(@Request() req: any) {
    this.checkAdmin(req);
    return this.ledgerService.findAll();
  }

  /** GET /api/ledger/customer/:id */
  @Get('customer/:id')
  findByCustomer(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.ledgerService.findByCustomer(id);
  }

  /** GET /api/ledger/supplier/:id */
  @Get('supplier/:id')
  findBySupplier(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.ledgerService.findBySupplier(id);
  }
}
