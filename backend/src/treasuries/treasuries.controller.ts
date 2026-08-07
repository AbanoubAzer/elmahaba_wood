import { Controller, Get, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TreasuriesService } from './treasuries.service';

@Controller('treasuries')
@UseGuards(AuthGuard('jwt'))
export class TreasuriesController {
  constructor(private readonly treasuriesService: TreasuriesService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get()
  async findAll(@Request() req: any) {
    const treasuries = await this.treasuriesService.findAll();
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      return treasuries.map(t => ({ ...t, balance: 0 }));
    }
    return treasuries;
  }

  @Get('transactions')
  getTransactions(@Request() req: any) {
    this.checkAdmin(req);
    return this.treasuriesService.getTransactions();
  }

  @Post('transfer')
  transfer(@Request() req: any, @Body() body: { fromId: string; toId: string; amount: number; notes: string; createdBy: string }) {
    this.checkAdmin(req);
    return this.treasuriesService.transferFunds(body);
  }

  @Post(':id/balance')
  updateBalance(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { amount: number; type: 'deposit' | 'withdrawal' }
  ) {
    this.checkAdmin(req);
    return this.treasuriesService.updateBalance(id, body.amount, body.type);
  }
}
