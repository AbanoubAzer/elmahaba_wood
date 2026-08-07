import { Controller, Get, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  /** GET /api/reports/pnl?from=2026-01-01&to=2026-12-31 */
  @Get('pnl')
  getPnl(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.checkAdmin(req);
    return this.reportsService.getPnl(from, to);
  }

  /** GET /api/reports/summary */
  @Get('summary')
  getDashboardSummary(@Request() req: any) {
    this.checkAdmin(req);
    return this.reportsService.getDashboardSummary();
  }
}
