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
  Trade,
  TickerStats,
} from '@/types/exchange';

// Import test network adapters
import { BinanceAdapter } from './binanceAdapter';
import { BinanceTestnetAdapter } from './binanceTestnetAdapter';
import { getFeatureFlags } from '@/config/featureFlags';
import { getExchangeEndpoint } from '@/config/exchangeConfig';
import { BrowserEventEmitter } from '@/utils/browserEventEmitter';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';

/**
 * Sandbox exchange adapter for practice trading
 */
export class SandboxAdapter extends BaseExchangeAdapter {
  private readonly binanceTestAdapter: BinanceAdapter | BinanceTestnetAdapter;
  private readonly useBinanceTestnet: boolean;
  protected eventEmitter: BrowserEventEmitter;

  constructor() {
    super('sandbox');
    this.mockDataService = new MockDataService();
    this.eventEmitter = new BrowserEventEmitter();

    // Check if Binance Testnet is enabled
    const featureFlags = getFeatureFlags();
    this.useBinanceTestnet = featureFlags.useBinanceTestnet;

    // Initialize Binance Testnet adapter
    if (this.useBinanceTestnet) {
      console.log('[SandboxAdapter] Using Binance Testnet adapter');
      this.binanceTestAdapter = new BinanceTestnetAdapter();

      // Test the Binance Testnet API accessibility
      this.testBinanceTestnetApiAccessibility();
    } else {
      this.binanceTestAdapter = new BinanceAdapter();
    }

    console.log(
      `[SandboxAdapter] Using Binance${
        this.useBinanceTestnet ? ' Testnet' : ''
      } as primary data source`,
    );
  }

  /**
   * Test if the Binance Testnet API is accessible
   * This helps determine if we should use the Binance Testnet API or fall back to mock data
   */
  private async testBinanceTestnetApiAccessibility(): Promise<void> {
    try {
      console.log('[SandboxAdapter] Testing Binance Testnet API accessibility');

      // Get the base URL from the Binance Testnet adapter
      const baseUrl = getExchangeEndpoint('binance_testnet');

      if (!baseUrl || !baseUrl.includes('testnet.binance.vision')) {
        console.warn(
          '[SandboxAdapter] Invalid Binance Testnet base URL:',
          baseUrl,
        );
        return;
      }

      // Make a simple ping request to test connectivity
      const testUrl = `${baseUrl}/api/v3/ping`;
      console.log('[SandboxAdapter] Testing connection to:', testUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('[SandboxAdapter] Binance Testnet API is accessible!');
      } else {
        console.warn(
          '[SandboxAdapter] Binance Testnet API is not accessible. Status:',
          response.status,
        );
      }
    } catch (error) {
      console.error(
        '[SandboxAdapter] Error testing Binance Testnet API accessibility:',
        error,
      );
    }
  }

  /**
   * Get basic information about the Sandbox exchange.
   */
  public async getExchangeInfo(): Promise<Exchange> {
    // If Binance Testnet is enabled, show that in the name and description
    const name = this.useBinanceTestnet ? 'Demo (Binance Testnet)' : 'Demo';
    const description = this.useBinanceTestnet
      ? 'Practice trading environment using Binance Testnet API.'
      : 'Practice trading environment with simulated assets and orders.';

    return {
      id: this.exchangeId,
      name,
      website: this.useBinanceTestnet
        ? 'https://testnet.binance.vision'
        : 'https://omnitrade.io/demo',
      description,
      isActive: true,
      logo: this.useBinanceTestnet
        ? '/exchanges/binance.svg'
        : '/exchanges/demo.svg',
    };
  }

  /**
   * Get all available trading pairs on the Sandbox.
   */
  public async getTradingPairs(): Promise<TradingPair[]> {
    try {
      // Try to get trading pairs from Binance Testnet
      const testPairs = await this.binanceTestAdapter.getTradingPairs();

      // If we got pairs from Binance, use them but mark them as sandbox
      if (testPairs && testPairs.length > 0) {
        console.log(
          `[SandboxAdapter] Using ${testPairs.length} trading pairs from Binance${
            this.useBinanceTestnet ? ' Testnet' : ''
          }`,
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
        `[SandboxAdapter] Error getting trading pairs from Binance${
          this.useBinanceTestnet ? ' Testnet' : ''
        }:`,
        error,
      );
    }

    // Fallback to mock data if Binance fails
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
    // Only try to get data from Binance Testnet if it's enabled
    if (this.useBinanceTestnet) {
      try {
        // First check if the API is accessible with a direct ping
        let isApiAccessible = false;
        try {
          const baseUrl = getExchangeEndpoint('binance_testnet');
          const testUrl = `${baseUrl}/api/v3/ping`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

          const testResponse = await fetch(testUrl, {
            method: 'GET',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (testResponse.ok) {
            console.log(
              `[SandboxAdapter] Binance Testnet API is accessible for order book request`,
            );
            isApiAccessible = true;
          } else {
            console.warn(
              `[SandboxAdapter] Binance Testnet API is not accessible for order book request. Status: ${testResponse.status}`,
            );
          }
        } catch (testError) {
          console.warn(
            `[SandboxAdapter] API accessibility test failed for order book request:`,
            testError,
          );
        }

        // Only proceed with the API request if the ping was successful
        if (isApiAccessible) {
          // Try to get order book from Binance Testnet
          const testOrderBook = await this.binanceTestAdapter.getOrderBook(
            symbol,
            limit,
          );

          // If we got an order book from Binance, use it but mark it as sandbox
          if (
            testOrderBook &&
            (testOrderBook.bids.length > 0 || testOrderBook.asks.length > 0)
          ) {
            console.log(
              `[SandboxAdapter] Using order book from Binance Testnet for ${symbol}`,
            );

            return {
              ...testOrderBook,
              exchangeId: this.exchangeId,
            };
          } else {
            console.warn(
              `[SandboxAdapter] Binance Testnet returned empty order book for ${symbol}`,
            );
          }
        }
      } catch (error) {
        console.error(
          `[SandboxAdapter] Error getting order book from Binance Testnet:`,
          error,
        );
      }
    } else {
      console.log(
        `[SandboxAdapter] Binance Testnet is disabled, using mock order book for ${symbol}`,
      );
    }

    // Fallback to mock data if Binance fails or is disabled
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
      // Try to get klines from Binance Testnet
      const testKlines = await this.binanceTestAdapter.getKlines(
        symbol,
        interval,
        startTime,
        endTime,
        limit,
      );

      // If we got klines from Binance, use them
      if (testKlines && testKlines.length > 0) {
        console.log(
          `[SandboxAdapter] Using ${testKlines.length} klines from Binance${
            this.useBinanceTestnet ? ' Testnet' : ''
          } for ${symbol}`,
        );
        return testKlines;
      }
    } catch (error) {
      console.error(
        `[SandboxAdapter] Error getting klines from Binance${
          this.useBinanceTestnet ? ' Testnet' : ''
        }:`,
        error,
      );
    }

    // Fallback to mock data if Binance fails
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
   * Get recent trades for a specific trading pair.
   */
  public async getRecentTrades(
    symbol: string,
    limit: number = 100,
  ): Promise<Trade[]> {
    try {
      // Try to get recent trades from Binance Testnet
      const testTrades = await this.binanceTestAdapter.getRecentTrades(
        symbol,
        limit,
      );

      // If we got trades from Binance, use them
      if (testTrades && testTrades.length > 0) {
        console.log(
          `[SandboxAdapter] Using ${testTrades.length} recent trades from Binance${
            this.useBinanceTestnet ? ' Testnet' : ''
          } for ${symbol}`,
        );
        return testTrades;
      }
    } catch (error) {
      console.error(
        `[SandboxAdapter] Error getting recent trades from Binance${
          this.useBinanceTestnet ? ' Testnet' : ''
        }:`,
        error,
      );
    }

    // Fallback to mock data if Binance fails
    console.log(`[SandboxAdapter] Falling back to mock trades for ${symbol}`);
    return this.mockDataService.generateRecentTrades(
      this.exchangeId,
      symbol,
      limit,
    );
  }

  /**
   * Get 24hr ticker statistics for a specific trading pair.
   * If no symbol is provided, returns statistics for all trading pairs.
   */
  public async getTickerStats(
    symbol?: string,
  ): Promise<TickerStats | TickerStats[]> {
    try {
      // Try to get ticker stats from Binance Testnet
      const testStats = await this.binanceTestAdapter.getTickerStats(symbol);

      // If we got stats from Binance, use them
      if (testStats) {
        console.log(
          `[SandboxAdapter] Using ticker stats from Binance${
            this.useBinanceTestnet ? ' Testnet' : ''
          } for ${symbol || 'all symbols'}`,
        );

        // If it's an array, update the exchangeId for each stat
        if (Array.isArray(testStats)) {
          return testStats.map((stat) => ({
            ...stat,
            exchangeId: this.exchangeId,
          }));
        }

        // If it's a single stat, update the exchangeId
        return {
          ...testStats,
          exchangeId: this.exchangeId,
        };
      }
    } catch (error) {
      console.error(
        `[SandboxAdapter] Error getting ticker stats from Binance${
          this.useBinanceTestnet ? ' Testnet' : ''
        }:`,
        error,
      );
    }

    // Fallback to mock data if Binance fails
    console.log(
      `[SandboxAdapter] Falling back to mock ticker stats for ${symbol || 'all symbols'}`,
    );
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
   * Get the user's portfolio on the Sandbox.
   */
  public async getPortfolio(apiKeyId: string): Promise<Portfolio> {
    // Use the getMockPortfolioData function to get a consistent demo portfolio
    console.log(`[SandboxAdapter] Getting portfolio for ${apiKeyId}`);

    // Always use the sandbox-key to get the demo portfolio for consistency
    const portfolioData = getMockPortfolioData('sandbox-key');

    if (!portfolioData.data) {
      console.error(
        `[SandboxAdapter] Failed to get portfolio data for ${apiKeyId}`,
      );
      // Fallback to the mock data service
      const fallbackPortfolio = this.mockDataService.generatePortfolio(
        this.exchangeId,
        42,
      );

      // Log the fallback portfolio data
      console.log(
        `[SandboxAdapter] Using fallback portfolio with ${fallbackPortfolio.assets.length} assets for ${apiKeyId}`,
      );
      fallbackPortfolio.assets.forEach((asset) => {
        console.log(
          `[SandboxAdapter] Fallback asset: ${asset.asset}, Free: ${asset.free}, Locked: ${asset.locked}, Total: ${asset.total}`,
        );
      });

      // Emit balance updates for the fallback portfolio
      this.emitBalanceUpdates(apiKeyId, fallbackPortfolio);

      return fallbackPortfolio;
    }

    const portfolio = portfolioData.data;

    // Ensure we have at least some standard assets for testing
    if (!portfolio.assets || portfolio.assets.length === 0) {
      console.warn(
        `[SandboxAdapter] Portfolio has no assets, adding default assets`,
      );

      // Add some default assets
      portfolio.assets = [
        {
          asset: 'USDT',
          free: 50000.0,
          locked: 0,
          total: 50000.0,
          usdValue: 50000.0,
          exchangeId: this.exchangeId,
        },
        {
          asset: 'BTC',
          free: 0.1,
          locked: 0,
          total: 0.1,
          usdValue: 8305.53,
          exchangeId: this.exchangeId,
        },
      ];

      portfolio.totalUsdValue = 58305.53;
    }

    // Emit balance updates for each asset in the portfolio
    this.emitBalanceUpdates(apiKeyId, portfolio);

    // Log the portfolio data
    console.log(
      `[SandboxAdapter] Generated portfolio with ${portfolio.assets.length} assets for ${apiKeyId}`,
    );
    portfolio.assets.forEach((asset) => {
      console.log(
        `[SandboxAdapter] Asset: ${asset.asset}, Free: ${asset.free}, Locked: ${asset.locked}, Total: ${asset.total}`,
      );
    });

    return portfolio;
  }

  /**
   * Emit balance updates for each asset in the portfolio
   * @param apiKeyId The API key ID
   * @param portfolio The portfolio data
   */
  private emitBalanceUpdates(apiKeyId: string, portfolio: Portfolio): void {
    // Emit balance updates for each asset
    portfolio.assets.forEach((asset) => {
      const updateData = {
        exchangeId: this.exchangeId,
        apiKeyId: apiKeyId,
        asset: asset.asset,
        balance: {
          free: asset.free,
          locked: asset.locked,
          total: asset.total,
          available: asset.free,
        },
        timestamp: Date.now(),
      };

      // Log the balance update
      console.log(
        `[SandboxAdapter] Emitting balance update for ${asset.asset}: Free=${asset.free}, Locked=${asset.locked}, Total=${asset.total}`,
      );

      // Emit the balance update event
      this.eventEmitter.emit('balanceUpdate', updateData);
    });

    console.log(
      `[SandboxAdapter] Emitted balance updates for ${portfolio.assets.length} assets`,
    );
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

    // Update balances based on the order
    this.updateBalancesForOrder(apiKeyId, newOrder);

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
   * Update balances when an order is placed
   * @param apiKeyId The API key ID
   * @param order The order that was placed
   */
  private async updateBalancesForOrder(
    apiKeyId: string,
    order: Order,
  ): Promise<void> {
    try {
      // Get the current portfolio
      const portfolio = await this.getPortfolio(apiKeyId);

      // Refresh balances after order placement
      this.emitBalanceUpdates(apiKeyId, portfolio);

      console.log(`[SandboxAdapter] Updated balances after order placement`);
    } catch (error) {
      console.error(
        `[SandboxAdapter] Error updating balances after order placement:`,
        error,
      );
    }
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
    return this.mockDataService.getOpenOrders(userId, this.exchangeId, symbol);
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
    return this.mockDataService.getOrderHistory(
      userId,
      this.exchangeId,
      symbol,
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
    // Get all orders for the user
    const openOrders = this.mockDataService.getOpenOrders(userId);
    const order = openOrders.find((o) => o.id === orderId);

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

    // Update balances after order execution
    this.updateBalancesForOrder(userId, order);

    console.log(`[SandboxAdapter] Executed order ${orderId}`);
  }

  /**
   * Provides access to the event emitter for subscribing to updates.
   * Example: adapter.getEventEmitter().on('balanceUpdate', (data) => { ... });
   */
  public getEventEmitter(): BrowserEventEmitter {
    return this.eventEmitter;
  }

  /**
   * Validate API key credentials with the exchange.
   * For sandbox mode, we'll always return true since it's a practice environment.
   * @param apiKey The API key to validate
   * @param apiSecret The API secret to validate
   * @returns Always true for sandbox mode
   */
  public async validateApiKey(
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean> {
    console.log(`[SandboxAdapter] Validating API key (sandbox mode)`);

    // For Binance Testnet, we can try to validate the key if it's enabled
    if (
      this.useBinanceTestnet &&
      this.binanceTestAdapter instanceof BinanceTestnetAdapter
    ) {
      try {
        // Try to validate with Binance Testnet
        return await this.binanceTestAdapter.validateApiKey(apiKey, apiSecret);
      } catch (error) {
        console.error(
          `[SandboxAdapter] Error validating API key with Binance Testnet:`,
          error,
        );
      }
    }

    // For sandbox mode, we'll accept any non-empty key/secret
    return apiKey.length > 0 && apiSecret.length > 0;
  }
}
