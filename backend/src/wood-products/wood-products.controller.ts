import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WoodProductsService } from './wood-products.service';

@Controller('wood-products')
@UseGuards(AuthGuard('jwt'))
export class WoodProductsController {
  private checkAdmin(req: any) {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('صلاحيات مدير النظام مطلوبة');
    }
  }
  constructor(private readonly woodProductsService: WoodProductsService) {}

  @Get()
  findAll() {
    return this.woodProductsService.findAll();
  }

  @Get('movements')
  getMovements() {
    return this.woodProductsService.getMovements();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.woodProductsService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.woodProductsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.woodProductsService.update(id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.woodProductsService.remove(id);
  }
}
