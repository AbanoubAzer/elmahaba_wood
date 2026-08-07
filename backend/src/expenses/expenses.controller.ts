import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(AuthGuard('jwt'))
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }

  @Get()
  async getAll() {
    return this.expensesService.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.expensesService.create(body);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.expensesService.delete(id);
  }
}
