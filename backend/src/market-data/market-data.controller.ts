import {
  Controller,
  Get,
  Query,
  Headers,
  InternalServerErrorException,
  Logger, // Import Logger
} from '@nestjs/common';
import {
  MarketDataService,
  MarketCoin, // Import the new MarketCoin interface
  OrderbookResponse,
  TradeResponse,
  KlineResponse,
} from './market-data.service';
import {
  IsString,
  IsOptional,
  IsNumberString,
  IsInt,
  IsBooleanString,
  Min,
  Max,
} from 'class-validator';

export class SymbolDto {
  @IsString()
  symbol: string;
}

// Removed unused TickerDto

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

// DTO for the new /markets endpoint query parameters
export class MarketsDto {
  @IsOptional()
  @IsString()
  vs_currency?: string = 'usd';

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(250) // CoinGecko limit
  per_page?: number = 100;

  @IsOptional()
  @IsString() // Add validation for allowed values if needed
  order?: string = 'market_cap_desc';

  @IsOptional()
  @IsBooleanString() // Accept 'true' or 'false' string
  sparkline?: string = 'false'; // Default to false as string
}

@Controller('/api/v1/market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('markets') // Renamed route from 'symbols' to 'markets'
  async getMarkets(
    @Headers('x-api-key') _apiKey: string,
    @Query() query: MarketsDto, // Use the new MarketsDto
  ): Promise<MarketCoin[]> {
    void _apiKey; // API key might be used later for internal logic/rate limiting
    // Validation is handled by the global ValidationPipe
    try {
      // Convert sparkline string to boolean for service call
      const sparklineBool = query.sparkline === 'true';
      return await this.marketDataService.getMarkets(
        query.vs_currency,
        query.page,
        query.per_page,
        query.order,
        sparklineBool,
      );
    } catch (error: unknown) {
      this.logger.error('Error in getMarkets controller', error); // Added logger
      throw new InternalServerErrorException('Failed to fetch market data');
    }
  }
  // Added logger instance
  private readonly logger = new Logger(MarketDataController.name);

  // Removed getTicker method

  @Get('orderbook')
  async getOrderbook(
    @Headers('x-api-key') _apiKey: string,
    @Query() query: OrderbookDto,
  ): Promise<OrderbookResponse> {
    void _apiKey;
    // Validation is handled by the global ValidationPipe
    // Note: OrderbookDto still uses SymbolDto, which might need adjustment
    // if the 'symbol' should now be the CoinGecko 'id'. Assuming it's okay for now.
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
    // Validation is handled by the global ValidationPipe
    // Note: KlinesDto still uses SymbolDto.
    // Note: TradesDto still uses SymbolDto.
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
    // Validation is handled by the global ValidationPipe
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
  // validateDto method was already removed
}
