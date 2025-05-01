// src/services/exchange/binanceTestnetBenchmarkAdapter.ts

import { BinanceTestnetAdapter } from './binanceTestnetAdapter';
import PerformanceLogger from '@/utils/performanceLogger';
import * as apiUtils from '@/utils/apiUtils';
import { getFeatureFlags } from '@/config/featureFlags';

// We're now overriding specific methods instead of trying to intercept all API calls

/**
 * Enhanced Binance Testnet Adapter with performance benchmarking
 */
export class BinanceTestnetBenchmarkAdapter extends BinanceTestnetAdapter {
  private performanceLogger: PerformanceLogger;

  constructor() {
    super();
    this.performanceLogger = PerformanceLogger.getInstance();

    // Check if benchmark is enabled via feature flag
    const featureFlags = getFeatureFlags();
    const isBenchmarkEnabled = featureFlags.enableBinanceTestnetBenchmark;

    // Enable performance logging based on feature flag
    this.performanceLogger.setEnabled(isBenchmarkEnabled);

    // We can't override the module's makeApiRequest directly as it's read-only
    // Instead, we'll use our own implementation for API calls

    console.log(
      `BinanceTestnetBenchmarkAdapter initialized with performance logging ${isBenchmarkEnabled ? 'enabled' : 'disabled'}`,
    );
  }

  // We're not overriding the private makeUnauthenticatedRequest method directly
  // Instead, we'll override the public methods that use it

  // We're not overriding the private makeAuthenticatedRequest method directly
  // Instead, we'll override the public methods that use it

  /**
   * Override getExchangeInfo to add performance logging
   */
  public async getExchangeInfo(): Promise<any> {
    const endpointName = 'exchangeInfo';
    const endMeasuring = this.performanceLogger.startMeasuring(
      endpointName,
      'GET',
    );

    try {
      const result = await super.getExchangeInfo();

      // Calculate response size (approximate)
      const responseSize = JSON.stringify(result).length;

      // End measuring with success
      endMeasuring('success', {
        responseSize,
        rateLimitInfo: {
          usedWeight: 10, // Weight for exchange info
        },
      });

      return result;
    } catch (error) {
      // End measuring with error
      endMeasuring('error', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Override getTradingPairs to add performance logging
   */
  public async getTradingPairs(): Promise<any> {
    const endpointName = 'tradingPairs';
    const endMeasuring = this.performanceLogger.startMeasuring(
      endpointName,
      'GET',
    );

    try {
      const result = await super.getTradingPairs();

      // Calculate response size (approximate)
      const responseSize = JSON.stringify(result).length;

      // End measuring with success
      endMeasuring('success', {
        responseSize,
        rateLimitInfo: {
          usedWeight: 1, // Weight for trading pairs
        },
      });

      return result;
    } catch (error) {
      // End measuring with error
      endMeasuring('error', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Override getOrderBook to add performance logging
   */
  public async getOrderBook(symbol: string, limit: number = 20): Promise<any> {
    const endpointName = 'orderBook';
    const endMeasuring = this.performanceLogger.startMeasuring(
      endpointName,
      'GET',
    );

    try {
      const result = await super.getOrderBook(symbol, limit);

      // Calculate response size (approximate)
      const responseSize = JSON.stringify(result).length;

      // Calculate weight based on limit
      let weight = 1;
      if (limit > 1000) {
        weight = 50;
      } else if (limit > 500) {
        weight = 10;
      } else if (limit > 100) {
        weight = 5;
      }

      // End measuring with success
      endMeasuring('success', {
        responseSize,
        rateLimitInfo: {
          usedWeight: weight,
        },
      });

      return result;
    } catch (error) {
      // End measuring with error
      endMeasuring('error', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Override getTickerStats to add performance logging
   */
  public async getTickerStats(symbol?: string): Promise<any> {
    const endpointName = 'tickerStats';
    const endMeasuring = this.performanceLogger.startMeasuring(
      endpointName,
      'GET',
    );

    try {
      const result = await super.getTickerStats(symbol);

      // Calculate response size (approximate)
      const responseSize = JSON.stringify(result).length;

      // End measuring with success
      endMeasuring('success', {
        responseSize,
        rateLimitInfo: {
          usedWeight: symbol ? 1 : 40, // Weight is 1 for single symbol, 40 for all symbols
        },
      });

      return result;
    } catch (error) {
      // End measuring with error
      endMeasuring('error', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Override getRecentTrades to add performance logging
   */
  public async getRecentTrades(
    symbol: string,
    limit: number = 500,
  ): Promise<any> {
    const endpointName = 'recentTrades';
    const endMeasuring = this.performanceLogger.startMeasuring(
      endpointName,
      'GET',
    );

    try {
      const result = await super.getRecentTrades(symbol, limit);

      // Calculate response size (approximate)
      const responseSize = JSON.stringify(result).length;

      // End measuring with success
      endMeasuring('success', {
        responseSize,
        rateLimitInfo: {
          usedWeight: 1, // Weight for recent trades
        },
      });

      return result;
    } catch (error) {
      // End measuring with error
      endMeasuring('error', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Enable or disable performance logging
   * Also updates the feature flag to persist the setting
   */
  public enablePerformanceLogging(enabled: boolean): void {
    this.performanceLogger.setEnabled(enabled);

    // Update the feature flag to persist the setting
    import('@/config/featureFlags').then(({ setFeatureFlag }) => {
      setFeatureFlag('enableBinanceTestnetBenchmark', enabled);
    });

    console.log(`Performance logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get performance statistics for all endpoints or a specific endpoint
   */
  public getPerformanceStats(endpoint?: string): any {
    return this.performanceLogger.calculateStats(endpoint);
  }

  /**
   * Export performance logs to JSON
   */
  public exportPerformanceLogs(): string {
    return this.performanceLogger.exportLogsToJson();
  }

  /**
   * Clear performance logs
   */
  public clearPerformanceLogs(): void {
    this.performanceLogger.clearLogs();
  }

  /**
   * Get all performance logs
   */
  public getPerformanceLogs(): any[] {
    return this.performanceLogger.getLogs();
  }
}
