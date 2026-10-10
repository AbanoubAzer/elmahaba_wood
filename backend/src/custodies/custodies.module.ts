import { Module } from '@nestjs/common';
import { CustodiesController } from './custodies.controller';
import { CustodiesService } from './custodies.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustodiesController],
  providers: [CustodiesService],
  exports: [CustodiesService],
})
export class CustodiesModule {}
