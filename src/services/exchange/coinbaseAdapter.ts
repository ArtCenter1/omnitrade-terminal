// Coinbase Exchange Adapter

import {
  Exchange,
  TradingPair,
  OrderBook,
  Kline,
  Portfolio,
  Order,
  PerformanceMetrics,
  Trade,
  TickerStats,
} from '@/types/exchange';

import { BaseExchangeAdapter } from './baseExchangeAdapter';
import { SUPPORTED_EXCHANGES } from '../mockData/mockDataUtils';

/**
 * Adapter for the Coinbase exchange.
 * In development mode, this uses mock data.
 * In production, it would connect to the real Coinbase API.
 */
export class CoinbaseAdapter extends BaseExchangeAdapter {
  constructor() {
    super('coinbase');
  }

  /**
   * Get basic information about Coinbase.
   */
  public async getExchangeInfo(): Promise<Exchange> {
    // In development mode, return mock data
    const exchange = SUPPORTED_EXCHANGES.find((e) => e.id === this.exchangeId);
    if (!exchange) {
      throw new Error(`Exchange ${this.exchangeId} not found`);
    }
    return exchange;
  }

  /**
   * Get all available trading pairs on Coinbase.
   */
  public async getTradingPairs(): Promise<TradingPair[]> {
    // In development mode, generate mock trading pairs
    // Coinbase typically has fewer pairs than Binance
    return this.mockDataService.generateTradingPairs(this.exchangeId, 30);
  }

  /**
   * Get the order book for a specific trading pair on Coinbase.
   */
  public async getOrderBook(
    symbol: string,
    limit: number = 20,
  ): Promise<OrderBook> {
    // In development mode, generate a mock order book
    return this.mockDataService.generateOrderBook(
      this.exchangeId,
      symbol,
      limit,
    );
  }

  /**
   * Get candlestick/kline data for a specific trading pair on Coinbase.
   */
  public async getKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100,
  ): Promise<Kline[]> {
    // In development mode, generate mock klines
    return this.mockDataService.generateKlines(
      this.exchangeId,
      symbol,
      interval,
      startTime,
      endTime,
      limit,
    );
  }

  /**
   * Get recent trades for a specific trading pair on Coinbase.
   */
  public async getRecentTrades(
    symbol: string,
    limit: number = 100,
  ): Promise<Trade[]> {
    // In development mode, generate mock trades
    return this.mockDataService.generateRecentTrades(
      this.exchangeId,
      symbol,
      limit,
    );
  }

  /**
   * Get 24hr ticker statistics for a specific trading pair on Coinbase.
   * If no symbol is provided, returns statistics for all trading pairs.
   */
  public async getTickerStats(
    symbol?: string,
  ): Promise<TickerStats | TickerStats[]> {
    // In development mode, generate mock ticker stats
    if (symbol) {
      return this.mockDataService.generateTickerStats(this.exchangeId, symbol);
    } else {
      // Generate stats for multiple symbols
      const pairs = await this.getTradingPairs();
      const stats: TickerStats[] = [];
      for (const pair of pairs.slice(0, 10)) {
        // Limit to 10 pairs for performance
        stats.push(
          await this.mockDataService.generateTickerStats(
            this.exchangeId,
            pair.symbol,
          ),
        );
      }
      return stats;
    }
  }

  /**
   * Get the user's portfolio (balances) from Coinbase.
   */
  public async getPortfolio(apiKeyId: string): Promise<Portfolio> {
    // In development mode, generate a mock portfolio
    // Use the apiKeyId as a seed for consistent results per user
    const seed = parseInt(apiKeyId.replace(/[^0-9]/g, '')) || undefined;
    return this.mockDataService.generatePortfolio(this.exchangeId, seed);
  }

  /**
   * Place a new order on Coinbase.
   */
  public async placeOrder(
    apiKeyId: string,
    order: Partial<Order>,
  ): Promise<Order> {
    // In development mode, create a mock order
    const userId = apiKeyId; // Use apiKeyId as userId for mock data
    return this.mockDataService.placeOrder(userId, {
      ...order,
      exchangeId: this.exchangeId,
    });
  }

  /**
   * Cancel an existing order on Coinbase.
   */
  public async cancelOrder(
    apiKeyId: string,
    orderId: string,
    symbol: string,
  ): Promise<boolean> {
    // In development mode, cancel a mock order
    const userId = apiKeyId; // Use apiKeyId as userId for mock data
    return this.mockDataService.cancelOrder(userId, orderId);
  }

  /**
   * Get all open orders for the user on Coinbase.
   */
  public async getOpenOrders(
    apiKeyId: string,
    symbol?: string,
  ): Promise<Order[]> {
    // In development mode, get mock open orders
    const userId = apiKeyId; // Use apiKeyId as userId for mock data
    return this.mockDataService.getOpenOrders(userId, this.exchangeId, symbol);
  }

  /**
   * Get order history for the user on Coinbase.
   */
  public async getOrderHistory(
    apiKeyId: string,
    symbol?: string,
    limit: number = 50,
  ): Promise<Order[]> {
    // In development mode, get mock order history
    const userId = apiKeyId; // Use apiKeyId as userId for mock data
    return this.mockDataService.getOrderHistory(
      userId,
      this.exchangeId,
      symbol,
      limit,
    );
  }

  /**
   * Get performance metrics for the user's trading activity on Coinbase.
   */
  public async getPerformanceMetrics(
    apiKeyId: string,
    period: string = '1m',
  ): Promise<PerformanceMetrics> {
    // In development mode, generate mock performance metrics
    return this.mockDataService.generatePerformanceMetrics(period);
  }

  /**
   * Validate API key credentials with Coinbase.
   */
  public async validateApiKey(
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean> {
    // In development mode, perform a simple validation
    return this.mockDataService.validateApiKey(apiKey, apiSecret);
  }
}
