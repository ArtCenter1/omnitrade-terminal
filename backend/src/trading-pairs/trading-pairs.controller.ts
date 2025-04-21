import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { TradingPairsService, TradingPair } from './trading-pairs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('trading-pairs')
@UseGuards(JwtAuthGuard)
export class TradingPairsController {
  private readonly logger = new Logger(TradingPairsController.name);

  constructor(private readonly tradingPairsService: TradingPairsService) {}

  @Get(':exchangeId')
  async getTradingPairs(
    @Param('exchangeId') exchangeId: string,
  ): Promise<TradingPair[]> {
    this.logger.log(`Request for trading pairs of exchange: ${exchangeId}`);
    return this.tradingPairsService.getTradingPairs(exchangeId);
  }

  @Get(':exchangeId/:symbol')
  async getTradingPair(
    @Param('exchangeId') exchangeId: string,
    @Param('symbol') symbol: string,
  ): Promise<TradingPair | null> {
    this.logger.log(
      `Request for trading pair ${symbol} of exchange: ${exchangeId}`,
    );
    return this.tradingPairsService.getTradingPair(exchangeId, symbol);
  }

  @Get()
  async getAllTradingPairs(): Promise<Record<string, TradingPair[]>> {
    this.logger.log('Request for all trading pairs');
    return this.tradingPairsService.getAllTradingPairs();
  }
}
