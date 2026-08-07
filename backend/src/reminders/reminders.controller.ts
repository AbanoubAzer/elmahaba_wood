import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RemindersService } from './reminders.service';

@Controller('reminders')
@UseGuards(AuthGuard('jwt'))
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll() {
    return this.remindersService.findAll();
  }

  @Post()
  create(@Body() data: { title: string; description?: string; dueDate: string }) {
    return this.remindersService.create(data);
  }

  @Patch(':id/complete')
  markAsCompleted(@Param('id') id: string) {
    return this.remindersService.markAsCompleted(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.remindersService.delete(id);
  }
}
