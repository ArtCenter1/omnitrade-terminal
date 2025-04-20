// src/services/exchange/sandboxAdapter.ts
import { BaseExchangeAdapter } from './baseExchangeAdapter';
import { MockDataService } from '../mockData/mockDataService';
import {
  Exchange,
  TradingPair,
  OrderBook,
  Kline,
  Portfolio,
  Order,
  PerformanceMetrics,
} from '@/types/exchange';

/**
 * Sandbox exchange adapter for practice trading
 */
export class SandboxAdapter extends BaseExchangeAdapter {
  private readonly mockDataService: MockDataService;

  constructor() {
    super('sandbox');
    this.mockDataService = new MockDataService();
  }

  /**
   * Get basic information about the Sandbox exchange.
   */
  public async getExchangeInfo(): Promise<Exchange> {
    return {
      id: this.exchangeId,
      name: 'Sandbox',
      url: 'https://omnitrade.io/sandbox',
      description:
        'Practice trading environment with simulated assets and orders.',
      features: ['spot', 'margin', 'futures'],
      fees: {
        maker: 0.0, // No fees in sandbox
        taker: 0.0, // No fees in sandbox
      },
      requiredCredentials: [],
      countries: ['*'], // Available worldwide
      logo: '/exchanges/sandbox.svg',
    };
  }

  /**
   * Get all available trading pairs on the Sandbox.
   */
  public async getTradingPairs(): Promise<TradingPair[]> {
    // Generate a comprehensive set of trading pairs for practice
    return this.mockDataService.generateTradingPairs(this.exchangeId, 100);
  }

  /**
   * Get the order book for a specific trading pair on the Sandbox.
   */
  public async getOrderBook(
    symbol: string,
    limit: number = 20,
  ): Promise<OrderBook> {
    return this.mockDataService.generateOrderBook(
      this.exchangeId,
      symbol,
      limit,
    );
  }

  /**
   * Get historical candlestick/kline data for a trading pair.
   */
  public async getKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit: number = 500,
  ): Promise<Kline[]> {
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
   * Get the user's portfolio on the Sandbox.
   */
  public async getPortfolio(apiKeyId: string): Promise<Portfolio> {
    // Always use the same seed for consistent portfolio data
    return this.mockDataService.generatePortfolio(this.exchangeId, 42);
  }

  /**
   * Place a new order on the Sandbox.
   * In sandbox mode, orders are executed immediately for market orders,
   * and with a high probability for limit orders near market price.
   */
  public async placeOrder(
    apiKeyId: string,
    order: Partial<Order>,
  ): Promise<Order> {
    console.log(`[SandboxAdapter] Placing order: ${JSON.stringify(order)}`);
    const userId = apiKeyId; // Use apiKeyId as userId for mock data

    // Create the order with sandbox-specific logic
    const newOrder = this.mockDataService.placeOrder(userId, {
      ...order,
      exchangeId: this.exchangeId,
    });

    // For sandbox, we'll simulate immediate execution for market orders
    // and quick execution for limit orders that are close to market price
    if (order.type === 'market') {
      // Market orders execute immediately
      setTimeout(() => {
        this.simulateOrderExecution(userId, newOrder.id);
      }, 500);
    } else if (order.type === 'limit') {
      // For limit orders, check if they're close to market price
      const currentPrice = this.mockDataService.getCurrentPrice(
        this.exchangeId,
        order.symbol || 'BTC/USDT',
      );

      const orderPrice = order.price || 0;
      const priceDifference =
        Math.abs(orderPrice - currentPrice) / currentPrice;

      // If the limit price is within 1% of market price, execute it quickly
      if (priceDifference < 0.01) {
        setTimeout(
          () => {
            this.simulateOrderExecution(userId, newOrder.id);
          },
          2000 + Math.random() * 3000,
        ); // 2-5 seconds
      }
    }

    return newOrder;
  }

  /**
   * Cancel an existing order on the Sandbox.
   */
  public async cancelOrder(
    apiKeyId: string,
    orderId: string,
    symbol: string,
  ): Promise<boolean> {
    const userId = apiKeyId; // Use apiKeyId as userId for mock data
    return this.mockDataService.cancelOrder(userId, orderId);
  }

  /**
   * Get all open orders for the user on the Sandbox.
   */
  public async getOpenOrders(
    apiKeyId: string,
    symbol?: string,
  ): Promise<Order[]> {
    const userId = apiKeyId; // Use apiKeyId as userId for mock data
    return this.mockDataService.getOrders(userId, this.exchangeId, symbol, [
      'new',
      'partially_filled',
    ]);
  }

  /**
   * Get order history for the user on the Sandbox.
   */
  public async getOrderHistory(
    apiKeyId: string,
    symbol?: string,
    limit: number = 50,
  ): Promise<Order[]> {
    const userId = apiKeyId; // Use apiKeyId as userId for mock data
    return this.mockDataService.getOrders(
      userId,
      this.exchangeId,
      symbol,
      ['filled', 'canceled', 'rejected'],
      limit,
    );
  }

  /**
   * Get performance metrics for the user on the Sandbox.
   */
  public async getPerformanceMetrics(
    apiKeyId: string,
    timeframe: string = '1m',
  ): Promise<PerformanceMetrics> {
    return this.mockDataService.generatePerformanceMetrics(timeframe);
  }

  /**
   * Helper method to simulate order execution
   */
  private simulateOrderExecution(userId: string, orderId: string): void {
    const orders = this.mockDataService.getOrders(userId);
    const order = orders.find((o) => o.id === orderId);

    if (!order || order.status !== 'new') {
      return;
    }

    // Update the order status
    this.mockDataService.updateOrderStatus(
      userId,
      orderId,
      'filled',
      order.quantity,
    );

    console.log(`[SandboxAdapter] Executed order ${orderId}`);
  }
}
