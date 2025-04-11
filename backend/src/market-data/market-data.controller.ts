import {
  Controller,
  Get,
  Query,
  Headers,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  MarketDataService,
  TickerResponse,
  OrderbookResponse,
  TradeResponse,
  KlineResponse,
} from './market-data.service';
import {
  IsString,
  IsOptional,
  IsNumberString,
  validateSync,
} from 'class-validator';

export class SymbolDto {
  @IsString()
  symbol: string;
}

export class TickerDto extends SymbolDto {}

export class OrderbookDto extends SymbolDto {
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

export class TradesDto extends SymbolDto {
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

export class KlinesDto extends SymbolDto {
  @IsString()
  interval: string;

  @IsOptional()
  @IsNumberString()
  startTime?: string;

  @IsOptional()
  @IsNumberString()
  endTime?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}

@Controller('/api/v1/market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('symbols')
  async getSymbols(@Headers('x-api-key') _apiKey?: string): Promise<string[]> {
    void _apiKey;
    try {
      return await this.marketDataService.getSymbols();
    } catch (_error: unknown) {
      void _error;
      throw new InternalServerErrorException('Failed to fetch symbols');
    }
  }

  @Get('ticker')
  async getTicker(
    @Headers('x-api-key') _apiKey: string,
    @Query() query: TickerDto,
  ): Promise<TickerResponse> {
    void _apiKey;
    this.validateDto(query);
    try {
      return await this.marketDataService.getTicker(query.symbol);
    } catch (_error: unknown) {
      void _error;
      throw new InternalServerErrorException('Failed to fetch ticker');
    }
  }

  @Get('orderbook')
  async getOrderbook(
    @Headers('x-api-key') _apiKey: string,
    @Query() query: OrderbookDto,
  ): Promise<OrderbookResponse> {
    void _apiKey;
    this.validateDto(query);
    try {
      return await this.marketDataService.getOrderbook(
        query.symbol,
        query.limit ? parseInt(query.limit, 10) : undefined,
      );
    } catch (_error: unknown) {
      void _error;
      throw new InternalServerErrorException('Failed to fetch orderbook');
    }
  }

  @Get('trades')
  async getTrades(
    @Headers('x-api-key') _apiKey: string,
    @Query() query: TradesDto,
  ): Promise<TradeResponse[]> {
    void _apiKey;
    this.validateDto(query);
    try {
      return await this.marketDataService.getTrades(
        query.symbol,
        query.limit ? parseInt(query.limit, 10) : undefined,
      );
    } catch (_error: unknown) {
      void _error;
      throw new InternalServerErrorException('Failed to fetch trades');
    }
  }

  @Get('klines')
  async getKlines(
    @Headers('x-api-key') _apiKey: string,
    @Query() query: KlinesDto,
  ): Promise<KlineResponse[]> {
    void _apiKey;
    this.validateDto(query);
    try {
      return await this.marketDataService.getKlines(
        query.symbol,
        query.interval,
        query.startTime ? parseInt(query.startTime, 10) : undefined,
        query.endTime ? parseInt(query.endTime, 10) : undefined,
        query.limit ? parseInt(query.limit, 10) : undefined,
      );
    } catch (_error: unknown) {
      void _error;
      throw new InternalServerErrorException('Failed to fetch klines');
    }
  }

  private validateDto(dto: object) {
    const errors = validateSync(dto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
  }
}
