/**
 * Factory for creating standardized mock data
 */

import { MockDataService } from '@/services/mockData/mockDataService';

// Create a singleton instance of MockDataService
const mockDataService = new MockDataService();

/**
 * Create mock exchange info data
 * @returns Mock exchange info data
 */
export function createMockExchangeInfo() {
  return {
    timezone: 'UTC',
    serverTime: Date.now(),
    rateLimits: [
      {
        rateLimitType: 'REQUEST_WEIGHT',
        interval: 'MINUTE',
        intervalNum: 1,
        limit: 1200,
      },
    ],
    symbols: [
      {
        symbol: 'BTCUSDT',
        status: 'TRADING',
        baseAsset: 'BTC',
        baseAssetPrecision: 8,
        quoteAsset: 'USDT',
        quotePrecision: 8,
        quoteAssetPrecision: 8,
        orderTypes: ['LIMIT', 'MARKET', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'],
        filters: [
          {
            filterType: 'PRICE_FILTER',
            minPrice: '0.01000000',
            maxPrice: '1000000.00000000',
            tickSize: '0.01000000',
          },
          {
            filterType: 'LOT_SIZE',
            minQty: '0.00000100',
            maxQty: '9000.00000000',
            stepSize: '0.00000100',
          },
          {
            filterType: 'MIN_NOTIONAL',
            minNotional: '10.00000000',
            applyToMarket: true,
          },
        ],
      },
      {
        symbol: 'ETHUSDT',
        status: 'TRADING',
        baseAsset: 'ETH',
        baseAssetPrecision: 8,
        quoteAsset: 'USDT',
        quotePrecision: 8,
        quoteAssetPrecision: 8,
        orderTypes: ['LIMIT', 'MARKET', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'],
        filters: [
          {
            filterType: 'PRICE_FILTER',
            minPrice: '0.01000000',
            maxPrice: '100000.00000000',
            tickSize: '0.01000000',
          },
          {
            filterType: 'LOT_SIZE',
            minQty: '0.00001000',
            maxQty: '9000.00000000',
            stepSize: '0.00001000',
          },
          {
            filterType: 'MIN_NOTIONAL',
            minNotional: '10.00000000',
            applyToMarket: true,
          },
        ],
      },
      {
        symbol: 'BNBUSDT',
        status: 'TRADING',
        baseAsset: 'BNB',
        baseAssetPrecision: 8,
        quoteAsset: 'USDT',
        quotePrecision: 8,
        quoteAssetPrecision: 8,
        orderTypes: ['LIMIT', 'MARKET', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'],
        filters: [
          {
            filterType: 'PRICE_FILTER',
            minPrice: '0.01000000',
            maxPrice: '100000.00000000',
            tickSize: '0.01000000',
          },
          {
            filterType: 'LOT_SIZE',
            minQty: '0.00100000',
            maxQty: '9000.00000000',
            stepSize: '0.00100000',
          },
          {
            filterType: 'MIN_NOTIONAL',
            minNotional: '10.00000000',
            applyToMarket: true,
          },
        ],
      },
    ],
  };
}

/**
 * Create mock order book data
 * @param symbol The trading pair symbol
 * @param limit The number of entries to include
 * @returns Mock order book data
 */
export function createMockOrderBook(symbol: string, limit: number) {
  const mockOrderBook = mockDataService.generateOrderBook(
    'binance_testnet',
    symbol || 'BTCUSDT',
    limit || 20
  );

  return {
    lastUpdateId: Date.now(),
    bids: mockOrderBook.bids.map((entry) => [
      entry.price.toString(),
      entry.quantity.toString(),
    ]),
    asks: mockOrderBook.asks.map((entry) => [
      entry.price.toString(),
      entry.quantity.toString(),
    ]),
  };
}

/**
 * Create mock ticker statistics
 * @param symbol The trading pair symbol
 * @returns Mock ticker statistics
 */
export function createMockTickerStats(symbol: string) {
  return mockDataService.generateTickerStats(
    'binance_testnet',
    symbol || 'BTCUSDT'
  );
}

/**
 * Create mock klines data
 * @param symbol The trading pair symbol
 * @param interval The time interval
 * @param limit The number of entries to include
 * @returns Mock klines data
 */
export function createMockKlines(symbol: string, interval: string, limit: number) {
  return mockDataService.generateKlines(
    'binance_testnet',
    symbol || 'BTCUSDT',
    interval || '1h',
    undefined,
    undefined,
    limit || 100
  );
}

/**
 * Create mock trades data
 * @param symbol The trading pair symbol
 * @param limit The number of entries to include
 * @returns Mock trades data
 */
export function createMockTrades(symbol: string, limit: number) {
  return mockDataService.generateRecentTrades(
    'binance_testnet',
    symbol || 'BTCUSDT',
    limit || 50
  );
}

/**
 * Create mock health check data
 * @returns Mock health check data
 */
export function createMockHealthCheck() {
  return {
    status: 'ok',
    timestamp: Date.now(),
    environment: 'development',
    services: {
      api: 'healthy',
      database: 'healthy',
      cache: 'healthy',
    },
  };
}

/**
 * Get the MockDataService instance
 * @returns The MockDataService instance
 */
export function getMockDataService() {
  return mockDataService;
}
