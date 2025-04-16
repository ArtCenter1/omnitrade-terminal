// Base Exchange Adapter

import {
  Exchange,
  TradingPair,
  OrderBook,
  Kline,
  Portfolio,
  Order,
  PerformanceMetrics,
  ExchangeAdapter,
} from '@/types/exchange';

import { MockDataService } from '../mockData/mockDataService';

/**
 * Base class for exchange adapters that implements common functionality
 * and provides a foundation for exchange-specific implementations.
 */
export abstract class BaseExchangeAdapter implements ExchangeAdapter {
  protected mockDataService: MockDataService;
  protected exchangeId: string;

  constructor(exchangeId: string) {
    this.exchangeId = exchangeId;
    this.mockDataService = new MockDataService();
  }

  /**
   * Get basic information about the exchange.
   */
  public abstract getExchangeInfo(): Promise<Exchange>;

  /**
   * Get all available trading pairs for the exchange.
   */
  public abstract getTradingPairs(): Promise<TradingPair[]>;

  /**
   * Get the order book for a specific trading pair.
   */
  public abstract getOrderBook(
    symbol: string,
    limit?: number,
  ): Promise<OrderBook>;

  /**
   * Get candlestick/kline data for a specific trading pair.
   */
  public abstract getKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit?: number,
  ): Promise<Kline[]>;

  /**
   * Get the user's portfolio (balances) from the exchange.
   */
  public abstract getPortfolio(apiKeyId: string): Promise<Portfolio>;

  /**
   * Place a new order on the exchange.
   */
  public abstract placeOrder(
    apiKeyId: string,
    order: Partial<Order>,
  ): Promise<Order>;

  /**
   * Cancel an existing order on the exchange.
   */
  public abstract cancelOrder(
    apiKeyId: string,
    orderId: string,
    symbol: string,
  ): Promise<boolean>;

  /**
   * Get all open orders for the user.
   */
  public abstract getOpenOrders(
    apiKeyId: string,
    symbol?: string,
  ): Promise<Order[]>;

  /**
   * Get order history for the user.
   */
  public abstract getOrderHistory(
    apiKeyId: string,
    symbol?: string,
    limit?: number,
  ): Promise<Order[]>;

  /**
   * Get performance metrics for the user's trading activity.
   */
  public abstract getPerformanceMetrics(
    apiKeyId: string,
    period?: string,
  ): Promise<PerformanceMetrics>;

  /**
   * Validate API key credentials with the exchange.
   */
  public abstract validateApiKey(
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean>;
}
