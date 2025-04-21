import { Module } from '@nestjs/common';
import { TradingPairsController } from './trading-pairs.controller';
import { TradingPairsService } from './trading-pairs.service';
import { TradingPairsGateway } from './trading-pairs.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TradingPairsController],
  providers: [TradingPairsService, TradingPairsGateway],
  exports: [TradingPairsService],
})
export class TradingPairsModule {}
