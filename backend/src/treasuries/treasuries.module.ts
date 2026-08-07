import { Module } from '@nestjs/common';
import { TreasuriesService } from './treasuries.service';
import { TreasuriesController } from './treasuries.controller';

@Module({
  controllers: [TreasuriesController],
  providers: [TreasuriesService],
  exports: [TreasuriesService],
})
export class TreasuriesModule {}
