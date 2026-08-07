import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invoicesService.findAll(
      req.user,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  /** GET /api/invoices/next-number?type=sale|purchase */
  @Get('next-number')
  getNextInvoiceNo(@Query('type') type: 'sale' | 'purchase' = 'sale') {
    return this.invoicesService.getNextInvoiceNo(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateInvoiceDto) {
    return this.invoicesService.create(body as any);
  }

  /** POST /api/invoices/:id/payment — record partial payment */
  @Post(':id/payment')
  recordPayment(
    @Param('id') id: string,
    @Body() body: RecordPaymentDto,
  ) {
    return this.invoicesService.recordPayment(
      id,
      body.amount,
      body.treasuryId,
      body.createdBy,
      body.notes,
    );
  }

  /** POST /api/invoices/:id/cancel — void an invoice */
  @Post(':id/cancel')
  cancelInvoice(
    @Param('id') id: string,
    @Body('createdBy') createdBy: string,
  ) {
    return this.invoicesService.cancel(id, createdBy);
  }
}
