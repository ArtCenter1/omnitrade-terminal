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

// Import test network adapters
import { BinanceAdapter } from './binanceAdapter';
import { CoinbaseAdapter } from './coinbaseAdapter';

/**
 * Sandbox exchange adapter for practice trading
 */
export class SandboxAdapter extends BaseExchangeAdapter {
  private readonly mockDataService: MockDataService;
  private readonly binanceTestAdapter: BinanceAdapter;
  private readonly coinbaseTestAdapter: CoinbaseAdapter;
  private readonly preferredTestNetwork: string = 'binance'; // Default to Binance test network

  constructor() {
    super('sandbox');
    this.mockDataService = new MockDataService();

    // Initialize test network adapters
    this.binanceTestAdapter = new BinanceAdapter();
    this.coinbaseTestAdapter = new CoinbaseAdapter();

    // Try to get preferred test network from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedNetwork = window.localStorage.getItem('sandbox_test_network');
      if (savedNetwork && ['binance', 'coinbase'].includes(savedNetwork)) {
        this.preferredTestNetwork = savedNetwork;
      }
    }

    console.log(
      `[SandboxAdapter] Using ${this.preferredTestNetwork} test network as primary data source`,
    );
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
    try {
      // First try to get trading pairs from the preferred test network
      let testPairs: TradingPair[] = [];

      if (this.preferredTestNetwork === 'binance') {
        testPairs = await this.binanceTestAdapter.getTradingPairs();
      } else if (this.preferredTestNetwork === 'coinbase') {
        testPairs = await this.coinbaseTestAdapter.getTradingPairs();
      }

      // If we got pairs from the test network, use them but mark them as sandbox
      if (testPairs && testPairs.length > 0) {
        console.log(
          `[SandboxAdapter] Using ${testPairs.length} trading pairs from ${this.preferredTestNetwork} test network`,
        );

        // Mark the pairs as sandbox pairs
        return testPairs.map((pair) => ({
          ...pair,
          exchangeId: this.exchangeId,
          isSandbox: true,
        }));
      }
    } catch (error) {
      console.error(
        `[SandboxAdapter] Error getting trading pairs from test network:`,
        error,
      );
    }

    // Fallback to mock data if test network fails
    console.log(`[SandboxAdapter] Falling back to mock trading pairs`);
    return this.mockDataService.generateTradingPairs(this.exchangeId, 100);
  }

  /**
   * Get the order book for a specific trading pair on the Sandbox.
   */
  public async getOrderBook(
    symbol: string,
    limit: number = 20,
  ): Promise<OrderBook> {
    try {
      // First try to get order book from the preferred test network
      let testOrderBook: OrderBook | null = null;

      if (this.preferredTestNetwork === 'binance') {
        testOrderBook = await this.binanceTestAdapter.getOrderBook(
          symbol,
          limit,
        );
      } else if (this.preferredTestNetwork === 'coinbase') {
        testOrderBook = await this.coinbaseTestAdapter.getOrderBook(
          symbol,
          limit,
        );
      }

      // If we got an order book from the test network, use it but mark it as sandbox
      if (
        testOrderBook &&
        (testOrderBook.bids.length > 0 || testOrderBook.asks.length > 0)
      ) {
        console.log(
          `[SandboxAdapter] Using order book from ${this.preferredTestNetwork} test network for ${symbol}`,
        );

        return {
          ...testOrderBook,
          exchangeId: this.exchangeId,
        };
      }
    } catch (error) {
      console.error(
        `[SandboxAdapter] Error getting order book from test network:`,
        error,
      );
    }

    // Fallback to mock data if test network fails
    console.log(
      `[SandboxAdapter] Falling back to mock order book for ${symbol}`,
    );
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
    try {
      // First try to get klines from the preferred test network
      let testKlines: Kline[] = [];

      if (this.preferredTestNetwork === 'binance') {
        testKlines = await this.binanceTestAdapter.getKlines(
          symbol,
          interval,
          startTime,
          endTime,
          limit,
        );
      } else if (this.preferredTestNetwork === 'coinbase') {
        testKlines = await this.coinbaseTestAdapter.getKlines(
          symbol,
          interval,
          startTime,
          endTime,
          limit,
        );
      }

      // If we got klines from the test network, use them
      if (testKlines && testKlines.length > 0) {
        console.log(
          `[SandboxAdapter] Using ${testKlines.length} klines from ${this.preferredTestNetwork} test network for ${symbol}`,
        );
        return testKlines;
      }
    } catch (error) {
      console.error(
        `[SandboxAdapter] Error getting klines from test network:`,
        error,
      );
    }

    // Fallback to mock data if test network fails
    console.log(`[SandboxAdapter] Falling back to mock klines for ${symbol}`);
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
