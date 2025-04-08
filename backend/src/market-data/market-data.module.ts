import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MarketDataGateway } from './market-data.gateway';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({
  controllers: [MarketDataController],
  providers: [MarketDataService, MarketDataGateway],
})
export class MarketDataModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('/api/v1/market-data');
  }
}
