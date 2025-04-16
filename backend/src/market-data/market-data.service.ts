import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import axios, { AxiosResponse } from 'axios';
import { RedisService } from '../redis/redis.service';

// Interface representing data from CoinGecko /coins/markets
export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
  sparkline_in_7d?: {
    // Optional sparkline data
    price: number[];
  };
}

// Keep Orderbook, Trade, Kline interfaces if needed for other endpoints
// (Assuming they might be implemented later)
export interface OrderbookResponse {
  symbol: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
}
export interface TradeResponse {
  id: string;
  price: string;
  quantity: string;
  timestamp: number;
  isBuyerMaker: boolean;
}
export interface KlineResponse {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

// Removed unused CoinGeckoCoin interface

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly coingeckoBaseUrl: string;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService
  ) {
    // Inject ConfigService
    const baseUrl = this.configService.get<string>('COINGECKO_API_BASE_URL');
    if (!baseUrl) {
      // Ensure proper formatting for the error message
      throw new Error(
        'COINGECKO_API_BASE_URL is not defined in the environment variables',
      );
    }
    this.coingeckoBaseUrl = baseUrl;
  }

  private async cacheFetch<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.redisService.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }

      // If not in cache, fetch the data
      const data = await fetcher();

      // Set cache but don't wait for it to complete
      this.redisService.set(key, JSON.stringify(data), ttlSeconds).catch((err: Error) => {
        this.logger.error(`Failed to set cache key ${key}: ${err.message}`);
      });

      return data; // Return data immediately
    } catch (error) {
      // If Redis fails, just fetch the data directly
      this.logger.warn(`Cache operation failed for ${key}, fetching directly: ${error instanceof Error ? error.message : String(error)}`);
      return await fetcher();
    }
  }

  async getMarkets(
    vs_currency: string = 'usd',
    page: number = 1,
    per_page: number = 100,
    order: string = 'market_cap_desc',
    sparkline: boolean = false, // Add sparkline option
  ): Promise<MarketCoin[]> {
    const key = `markets:${vs_currency}:page${page}:per${per_page}:${order}:sparkline${sparkline}`;
    // Cache for 5 minutes (adjust as needed)
    return this.cacheFetch<MarketCoin[]>(key, 300, async () => {
      this.logger.log(
        `Fetching markets from CoinGecko API (/coins/markets) - Page: ${page}, Per Page: ${per_page}`,
      );
      try {
        const response: AxiosResponse<MarketCoin[]> = await axios.get(
          `${this.coingeckoBaseUrl}/coins/markets`,
          {
            params: {
              vs_currency,
              order,
              per_page,
              page,
              sparkline,
              price_change_percentage: '24h', // Request 24h price change
            },
          },
        );
        return response.data;
      } catch (error) {
        this.logger.error('Error fetching markets from CoinGecko', error);
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch markets from CoinGecko: ${message}`);
      }
    });
  }

  // Removed getTicker method as it's replaced by getMarkets

  async getOrderbook(
    symbol: string,
    limit?: number,
  ): Promise<OrderbookResponse> {
    const key = `orderbook:${symbol}:${limit ?? 'default'}`;
    return this.cacheFetch<OrderbookResponse>(key, 2, async () => {
      // TODO: Update this method for CoinGecko API (/coins/{id}/tickers)
      this.logger.log(`Fetching orderbook for ${symbol} from placeholder API`);
      try {
        const response: AxiosResponse<OrderbookResponse> = await axios.get(
          `https://api.exchange.example.com/orderbook`, // Placeholder URL
          {
            params: { symbol, limit },
          },
        );
        return response.data;
      } catch (error) {
        this.logger.error(`Error fetching orderbook for ${symbol}`, error);
        throw error;
      }
    });
  }

  async getTrades(symbol: string, limit?: number): Promise<TradeResponse[]> {
    const key = `trades:${symbol}:${limit ?? 'default'}`;
    return this.cacheFetch<TradeResponse[]>(key, 2, async () => {
      // TODO: Update this method for CoinGecko API (/coins/{id}/market_chart) or similar
      this.logger.log(`Fetching trades for ${symbol} from placeholder API`);
      try {
        const response: AxiosResponse<TradeResponse[]> = await axios.get(
          `https://api.exchange.example.com/trades`, // Placeholder URL
          {
            params: { symbol, limit },
          },
        );
        return response.data;
      } catch (error) {
        this.logger.error(`Error fetching trades for ${symbol}`, error);
        throw error;
      }
    });
  }

  async getKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit?: number,
  ): Promise<KlineResponse[]> {
    const key = `klines:${symbol}:${interval}:${startTime ?? 'null'}:${endTime ?? 'null'}:${limit ?? 'default'}`;
    return this.cacheFetch<KlineResponse[]>(key, 10, async () => {
      // TODO: Update this method for CoinGecko API (/coins/{id}/ohlc)
      this.logger.log(`Fetching klines for ${symbol} from placeholder API`);
      try {
        const response: AxiosResponse<KlineResponse[]> = await axios.get(
          `https://api.exchange.example.com/klines`, // Placeholder URL
          {
            params: { symbol, interval, startTime, endTime, limit },
          },
        );
        return response.data;
      } catch (error) {
        this.logger.error(`Error fetching klines for ${symbol}`, error);
        throw error;
      }
    });
  }
}
