import { Module } from '@nestjs/common';
import { WoodProductsService } from './wood-products.service';
import { WoodProductsController } from './wood-products.controller';

@Module({
  controllers: [WoodProductsController],
  providers: [WoodProductsService],
  exports: [WoodProductsService],
})
export class WoodProductsModule {}
