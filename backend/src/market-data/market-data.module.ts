import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MarketDataGateway } from './market-data.gateway';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { CoinGeckoProxyController } from './coingecko-proxy.controller';
import { BinanceTestnetProxyController } from './binance-testnet-proxy.controller';

@Module({
  imports: [ConfigModule.forRoot()], // Add ConfigModule here
  controllers: [
    MarketDataController,
    CoinGeckoProxyController,
    BinanceTestnetProxyController,
  ],
  providers: [MarketDataService, MarketDataGateway],
})
export class MarketDataModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('/api/v1/market-data');
  }
}
