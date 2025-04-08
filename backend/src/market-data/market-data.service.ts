import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import Redis from 'ioredis';

const redis = new Redis();

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  private async cacheFetch<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    const data = await fetcher();
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    return data;
  }

  async getSymbols(): Promise<string[]> {
    return this.cacheFetch<string[]>('symbols', 3600, async () => {
      this.logger.log('Fetching symbols from exchange API');
      try {
        const response: AxiosResponse<string[]> = await axios.get(
          'https://api.exchange.example.com/symbols',
        );
        return response.data;
      } catch (error) {
        this.logger.error('Error fetching symbols', error);
        throw error;
      }
    });
  }

  async getTicker(symbol: string): Promise<any> {
    const key = `ticker:${symbol}`;
    return this.cacheFetch<any>(key, 2, async () => {
      this.logger.log(`Fetching ticker for ${symbol} from exchange API`);
      try {
        const response: AxiosResponse<any> = await axios.get(
          'https://api.exchange.example.com/ticker',
          {
            params: { symbol },
          },
        );
        return response.data;
      } catch (error) {
        this.logger.error(`Error fetching ticker for ${symbol}`, error);
        throw error;
      }
    });
  }

  async getOrderbook(symbol: string, limit?: number): Promise<any> {
    const key = `orderbook:${symbol}:${limit ?? 'default'}`;
    return this.cacheFetch<any>(key, 2, async () => {
      this.logger.log(`Fetching orderbook for ${symbol} from exchange API`);
      try {
        const response: AxiosResponse<any> = await axios.get(
          'https://api.exchange.example.com/orderbook',
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

  async getTrades(symbol: string, limit?: number): Promise<any[]> {
    const key = `trades:${symbol}:${limit ?? 'default'}`;
    return this.cacheFetch<any[]>(key, 2, async () => {
      this.logger.log(`Fetching trades for ${symbol} from exchange API`);
      try {
        const response: AxiosResponse<any[]> = await axios.get(
          'https://api.exchange.example.com/trades',
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
  ): Promise<any[]> {
    const key = `klines:${symbol}:${interval}:${startTime ?? 'null'}:${endTime ?? 'null'}:${limit ?? 'default'}`;
    return this.cacheFetch<any[]>(key, 10, async () => {
      this.logger.log(`Fetching klines for ${symbol} from exchange API`);
      try {
        const response: AxiosResponse<any[]> = await axios.get(
          'https://api.exchange.example.com/klines',
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
