import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Define the TradingPair interface
export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  exchangeId: string;
  priceDecimals: number;
  quantityDecimals: number;
  minQuantity?: number;
  maxQuantity?: number;
  minPrice?: number;
  maxPrice?: number;
  minNotional?: number;
}

@Injectable()
export class TradingPairsService {
  private readonly logger = new Logger(TradingPairsService.name);

  // Mock trading pairs for different exchanges
  private readonly mockTradingPairs: Record<string, TradingPair[]> = {
    binance: [
      {
        symbol: 'BTC/USDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        exchangeId: 'binance',
        priceDecimals: 2,
        quantityDecimals: 6,
        minQuantity: 0.000001,
        maxQuantity: 1000,
        minPrice: 0.01,
        maxPrice: 1000000,
        minNotional: 10,
      },
      {
        symbol: 'ETH/USDT',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        exchangeId: 'binance',
        priceDecimals: 2,
        quantityDecimals: 5,
        minQuantity: 0.00001,
        maxQuantity: 10000,
        minPrice: 0.01,
        maxPrice: 100000,
        minNotional: 10,
      },
      {
        symbol: 'SOL/USDT',
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        exchangeId: 'binance',
        priceDecimals: 2,
        quantityDecimals: 2,
        minQuantity: 0.01,
        maxQuantity: 100000,
        minPrice: 0.01,
        maxPrice: 10000,
        minNotional: 10,
      },
      {
        symbol: 'BNB/USDT',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        exchangeId: 'binance',
        priceDecimals: 2,
        quantityDecimals: 3,
        minQuantity: 0.001,
        maxQuantity: 10000,
        minPrice: 0.01,
        maxPrice: 10000,
        minNotional: 10,
      },
      {
        symbol: 'XRP/USDT',
        baseAsset: 'XRP',
        quoteAsset: 'USDT',
        exchangeId: 'binance',
        priceDecimals: 5,
        quantityDecimals: 1,
        minQuantity: 0.1,
        maxQuantity: 1000000,
        minPrice: 0.00001,
        maxPrice: 1000,
        minNotional: 10,
      },
    ],
    coinbase: [
      {
        symbol: 'BTC/USD',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        exchangeId: 'coinbase',
        priceDecimals: 2,
        quantityDecimals: 8,
        minQuantity: 0.00000001,
        maxQuantity: 1000,
        minPrice: 0.01,
        maxPrice: 1000000,
        minNotional: 1,
      },
      {
        symbol: 'ETH/USD',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        exchangeId: 'coinbase',
        priceDecimals: 2,
        quantityDecimals: 8,
        minQuantity: 0.00000001,
        maxQuantity: 10000,
        minPrice: 0.01,
        maxPrice: 100000,
        minNotional: 1,
      },
      {
        symbol: 'SOL/USD',
        baseAsset: 'SOL',
        quoteAsset: 'USD',
        exchangeId: 'coinbase',
        priceDecimals: 2,
        quantityDecimals: 8,
        minQuantity: 0.00000001,
        maxQuantity: 100000,
        minPrice: 0.01,
        maxPrice: 10000,
        minNotional: 1,
      },
    ],
    kraken: [
      {
        symbol: 'BTC/USD',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        exchangeId: 'kraken',
        priceDecimals: 1,
        quantityDecimals: 8,
        minQuantity: 0.0001,
        maxQuantity: 100,
        minPrice: 0.1,
        maxPrice: 1000000,
        minNotional: 10,
      },
      {
        symbol: 'ETH/USD',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        exchangeId: 'kraken',
        priceDecimals: 2,
        quantityDecimals: 8,
        minQuantity: 0.001,
        maxQuantity: 1000,
        minPrice: 0.01,
        maxPrice: 100000,
        minNotional: 10,
      },
    ],
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Get all trading pairs for a specific exchange
   */
  async getTradingPairs(exchangeId: string): Promise<TradingPair[]> {
    this.logger.log(`Fetching trading pairs for exchange: ${exchangeId}`);

    // In a real implementation, we would fetch this data from the exchange API
    // For now, we'll return mock data
    return this.mockTradingPairs[exchangeId.toLowerCase()] || [];
  }

  /**
   * Get a specific trading pair by symbol and exchange
   */
  async getTradingPair(
    exchangeId: string,
    symbol: string,
  ): Promise<TradingPair | null> {
    this.logger.log(
      `Fetching trading pair ${symbol} for exchange: ${exchangeId}`,
    );

    // In a real implementation, we would fetch this data from the exchange API
    // For now, we'll return mock data
    const pairs = this.mockTradingPairs[exchangeId.toLowerCase()] || [];
    return pairs.find((pair) => pair.symbol === symbol) || null;
  }

  /**
   * Get all trading pairs for all exchanges
   */
  async getAllTradingPairs(): Promise<Record<string, TradingPair[]>> {
    this.logger.log('Fetching all trading pairs for all exchanges');

    // In a real implementation, we would fetch this data from the exchange APIs
    // For now, we'll return mock data
    return this.mockTradingPairs;
  }
}
