import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MarketDataGateway } from './market-data.gateway';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({
  imports: [ConfigModule.forRoot()], // Add ConfigModule here
  controllers: [MarketDataController],
  providers: [MarketDataService, MarketDataGateway],
})
export class MarketDataModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('/api/v1/market-data');
  }
}
