import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustodiesService } from './custodies.service';

@Controller('custodies')
@UseGuards(AuthGuard('jwt'))
export class CustodiesController {
  constructor(private readonly custodiesService: CustodiesService) {}

  @Get()
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.custodiesService.getAll(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const createdBy = req.user?.name || 'مدير النظام';
    return this.custodiesService.create({ ...body, createdBy });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.custodiesService.update(id, body);
  }

  @Patch(':id/toggle-delivered')
  async toggleDelivered(@Param('id') id: string, @Body() body: { delivered: boolean }) {
    return this.custodiesService.toggleDelivered(id, body.delivered);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.custodiesService.delete(id);
  }
}
