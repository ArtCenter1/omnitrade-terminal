// Binance Testnet Exchange Adapter

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
  OrderStatus,
  OrderType as OrderTypeString,
  TimeInForce as TimeInForceString,
} from '@/types/exchange';
import { AssetInfo, AssetNetwork } from '@/types/assetInfo';
import axios from 'axios';
import Big from 'big.js'; // Import Big.js for precise calculations

// Define OrderType enum for use in this adapter
enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP_LIMIT = 'stop_limit',
  STOP_MARKET = 'stop_market',
}

// Define TimeInForce enum for use in this adapter
enum TimeInForce {
  GTC = 'GTC',
  IOC = 'IOC',
  FOK = 'FOK',
}

// Define a more specific type for cached exchange info that includes symbols
interface BinanceExchangeInfo extends Exchange {
  symbols: Array<{
    symbol: string;
    status: string;
    baseAsset: string;
    quoteAsset: string;
    baseAssetPrecision: number;
    quoteAssetPrecision: number;
    orderTypes: string[];
    filters: Array<{
      filterType: string;
      tickSize?: string;
      minQty?: string;
      maxQty?: string;
      stepSize?: string;
      minPrice?: string;
      maxPrice?: string;
      minNotional?: string;
      notional?: string;
      applyMinToMarket?: boolean;
      applyToMarket?: boolean;
      // Add other filter properties as needed
    }>;
    // Add other symbol properties as needed
  }>;
}

import { BaseExchangeAdapter } from './baseExchangeAdapter';
import { getExchangeEndpoint } from '@/config/exchangeConfig';
import { SUPPORTED_EXCHANGES } from '../mockData/mockDataUtils'; // Assuming mock data utils exist
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';
import { makeApiRequest } from '@/utils/apiUtils';
import { BinanceTestnetOrderTrackingService } from './binanceTestnetOrderTrackingService'; // Assuming this exists
import logger from '@/utils/logger'; // Assuming a logger utility exists
import { WebSocketManager } from '../connection/websocketManager';
import { BrowserEventEmitter } from '@/utils/browserEventEmitter';
import { MockDataService } from '../mockData/mockDataService'; // Import mock data service

/**
 * Adapter for the Binance Testnet exchange.
 * This connects to the Binance Testnet API for sandbox trading.
 */
export class BinanceTestnetAdapter extends BaseExchangeAdapter {
  private baseUrl: string;
  private wsBaseUrl: string;
  private webSocketManager: WebSocketManager;
  private eventEmitter: BrowserEventEmitter;
  private listenKey: string | null = null;
  private listenKeyRefreshInterval: NodeJS.Timeout | null = null;
  private userDataStreamId: string | null = null; // ID for the WebSocketManager subscription
  private balanceCache: Record<string, { free: number; locked: number }> = {};
  private reconciliationInterval: NodeJS.Timeout | null = null;
  private isConnectingUserDataStream: boolean = false;
  private currentApiKeyId: string | null = null; // Store the API key ID used for the stream
  // Removed redundant mockDataService declaration - it's inherited from BaseExchangeAdapter
  private cachedExchangeInfo: BinanceExchangeInfo | null = null; // Cache for exchange info

  constructor(apiKeyId?: string) {
    // Allow passing apiKeyId for initialization
    super('binance_testnet'); // Calls BaseExchangeAdapter constructor, which initializes mockDataService
    this.baseUrl = getExchangeEndpoint('binance_testnet');
    this.wsBaseUrl = 'wss://testnet.binance.vision/ws'; // Base URL for user data stream
    this.webSocketManager = WebSocketManager.getInstance();
    this.eventEmitter = new BrowserEventEmitter();
    // Removed redundant mockDataService instantiation

    // Optionally start connection if apiKeyId is provided
    if (apiKeyId) {
      this.currentApiKeyId = apiKeyId;
      this.connectUserDataStream().catch((error) => {
        logger.error(
          `[${this.exchangeId}] Failed to auto-connect user data stream on init:`,
          error,
        );
      });
    }
  }

  /**
   * Get basic information about Binance Testnet.
   */
  public async getExchangeInfo(): Promise<BinanceExchangeInfo> {
    try {
      // Make request to exchange info endpoint
      const response = await this.makeUnauthenticatedRequest<{
        timezone: string;
        serverTime: number;
        rateLimits: any[]; // Define more specific type if needed
        exchangeFilters: any[]; // Define more specific type if needed
        symbols: any[]; // Define more specific type if needed
      }>(
        '/api/v3/exchangeInfo', // Corrected endpoint
        {},
        10, // Weight: 10
      );

      // Check if the response contains symbols
      const hasSymbols =
        response.symbols &&
        Array.isArray(response.symbols) &&
        response.symbols.length > 0;

      if (hasSymbols) {
        console.log(
          `[${this.exchangeId}] Received ${response.symbols.length} symbols from API`,
        );

        // Return formatted exchange info with symbols included
        return {
          id: this.exchangeId,
          name: 'Binance Testnet',
          logo: '/exchanges/binance.svg',
          website: 'https://testnet.binance.vision',
          description: 'Binance Testnet for sandbox trading',
          isActive: true,
          // Include symbols from the response for order validation
          symbols: response.symbols,
        };
      } else {
        console.warn(
          `[${this.exchangeId}] API returned no symbols, using mock symbols`,
        );

        // Generate mock symbols since API didn't return any
        const mockSymbols = this.generateMockSymbols();

        return {
          id: this.exchangeId,
          name: 'Binance Testnet',
          logo: '/exchanges/binance.svg',
          website: 'https://testnet.binance.vision',
          description:
            'Binance Testnet for sandbox trading (using mock symbols)',
          isActive: true,
          symbols: mockSymbols,
        };
      }
    } catch (error) {
      console.error('Error getting exchange info:', error);

      // Fallback to mock data
      const exchange = SUPPORTED_EXCHANGES.find((e) => e.id === 'binance'); // Use 'binance' as base
      if (!exchange) {
        // Provide a default structure if even the base mock is missing
        return {
          id: this.exchangeId,
          name: 'Binance Testnet (Default)',
          logo: '/exchanges/binance.svg',
          description: 'Binance Testnet for sandbox trading (Default Info)',
          isActive: false, // Indicate potential issue
          website: 'https://testnet.binance.vision', // Add website
          symbols: [], // Add empty symbols array for the interface
        };
      }

      // Use the generateMockSymbols method to create mock symbols
      const mockSymbols = this.generateMockSymbols();

      console.log(
        `[${this.exchangeId}] Created mock symbols for fallback: ${mockSymbols.map((s: any) => s.symbol).join(', ')}`,
      );

      return {
        ...exchange,
        id: this.exchangeId, // Override ID
        name: 'Binance Testnet', // Override name
        description: 'Binance Testnet for sandbox trading', // Override description
        isActive: true, // Assume active even if fetch failed
        symbols: mockSymbols, // Add mock symbols
      };
    }
  }

  /**
   * Generate mock symbols for common trading pairs
   * @returns Array of mock symbol objects
   */
  private generateMockSymbols(): any[] {
    // Ensure we include all the symbols that might be used in the UI
    const symbolNames = [
      'BTCUSDT',
      'ETHUSDT',
      'BNBUSDT',
      'SOLUSDT',
      'XRPUSDT',
      'ADAUSDT',
      'DOGEUSDT',
      'MATICUSDT',
      'DOTUSDT',
      'LTCUSDT',
    ];

    return symbolNames.map((symbolName) => {
      const baseAsset = symbolName.replace('USDT', '');
      return {
        symbol: symbolName,
        status: 'TRADING',
        baseAsset: baseAsset,
        quoteAsset: 'USDT',
        baseAssetPrecision: 8,
        quoteAssetPrecision: 8,
        orderTypes: [
          'LIMIT',
          'LIMIT_MAKER',
          'MARKET',
          'STOP_LOSS_LIMIT',
          'TAKE_PROFIT_LIMIT',
        ],
        icebergAllowed: true,
        ocoAllowed: true,
        quoteOrderQtyMarketAllowed: true,
        allowTrailingStop: true,
        cancelReplaceAllowed: true,
        isSpotTradingAllowed: true,
        isMarginTradingAllowed: false,
        filters: [
          {
            filterType: 'PRICE_FILTER',
            minPrice: '0.00000100',
            maxPrice: '1000000.00000000',
            tickSize: '0.00000100',
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
        permissions: ['SPOT'],
        defaultSelfTradePreventionMode: 'NONE',
        allowedSelfTradePreventionModes: ['NONE'],
      };
    });
  }

  /**
   * Make an unauthenticated request to the Binance API
   * @param endpoint The API endpoint
   * @param params The query parameters
   * @param weight The request weight
   * @returns The response data
   */
  private async makeUnauthenticatedRequest<T>(
    endpoint: string,
    params: Record<string, string | number> = {},
    weight: number = 1,
  ): Promise<T> {
    try {
      // Build URL with query parameters
      let url = `${this.baseUrl}${endpoint}`;
      if (Object.keys(params).length > 0) {
        const queryString = Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&');
        url = `${url}?${queryString}`;
      }

      // Make request with rate limiting
      return await makeApiRequest<T>(this.exchangeId, url, {
        method: 'GET',
        weight,
        parseJson: true,
        retries: 3,
        retryDelay: 1000,
      });
    } catch (error) {
      console.error(
        `Error making unauthenticated request to ${endpoint}:`,
        error,
      );

      // Enhance error message with more details
      if (error instanceof Error) {
        const errorMessage = error.message;
        const enhancedMessage = `Error requesting ${this.baseUrl}${endpoint}: ${errorMessage}`;
        throw new Error(enhancedMessage);
      }

      throw error;
    }
  }

  // Placeholder for connectUserDataStream method
  public async connectUserDataStream(apiKeyId?: string): Promise<void> {
    // Implementation will be added later
    console.log('connectUserDataStream method called');
  }

  /**
   * Get all available trading pairs on Binance Testnet.
   */
  public async getTradingPairs(): Promise<TradingPair[]> {
    // Placeholder implementation
    return this.mockDataService.generateTradingPairs(this.exchangeId, 50);
  }

  /**
   * Get the order book for a specific trading pair.
   */
  public async getOrderBook(
    symbol: string,
    limit: number = 100,
  ): Promise<OrderBook> {
    // Placeholder implementation
    return this.mockDataService.generateOrderBook(
      this.exchangeId,
      symbol,
      limit,
    );
  }

  /**
   * Get candlestick/kline data for a specific trading pair.
   */
  public async getKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit: number = 500,
  ): Promise<Kline[]> {
    // Placeholder implementation
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
    limit: number = 20,
  ): Promise<Trade[]> {
    // Placeholder implementation
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
      // Placeholder implementation
      if (symbol) {
        console.log(`[${this.exchangeId}] Getting ticker stats for ${symbol}`);
        return this.mockDataService.generateTickerStats(
          this.exchangeId,
          symbol,
        );
      } else {
        console.log(`[${this.exchangeId}] Getting ticker stats for all pairs`);
        // Generate mock data for multiple symbols (limit to 10 for performance)
        const mockPairs = [
          'BTC/USDT',
          'ETH/USDT',
          'BNB/USDT',
          'SOL/USDT',
          'XRP/USDT',
          'ADA/USDT',
          'DOGE/USDT',
          'MATIC/USDT',
          'DOT/USDT',
          'LTC/USDT',
        ];

        return Promise.all(
          mockPairs.map((pair) =>
            this.mockDataService.generateTickerStats(this.exchangeId, pair),
          ),
        );
      }
    } catch (error) {
      console.error(`[${this.exchangeId}] Error getting ticker stats:`, error);

      // Return a default ticker stats object if there's an error
      if (symbol) {
        return {
          symbol: symbol,
          exchangeId: this.exchangeId,
          priceChange: 0,
          priceChangePercent: 0,
          weightedAvgPrice: 0,
          prevClosePrice: 0,
          lastPrice: 0,
          lastQty: 0,
          bidPrice: 0,
          bidQty: 0,
          askPrice: 0,
          askQty: 0,
          openPrice: 0,
          highPrice: 0,
          lowPrice: 0,
          volume: 0,
          quoteVolume: 0,
          openTime: Date.now() - 24 * 60 * 60 * 1000,
          closeTime: Date.now(),
          count: 0,
        };
      } else {
        // Return an empty array if no symbol was specified
        return [];
      }
    }
  }

  /**
   * Get the user's portfolio (balances) from the exchange.
   */
  public async getPortfolio(apiKeyId: string): Promise<Portfolio> {
    // Placeholder implementation - using apiKeyId as a comment to avoid unused parameter warning
    console.log(`Getting portfolio for API key: ${apiKeyId}`);
    return this.mockDataService.generatePortfolio(this.exchangeId);
  }

  /**
   * Place a new order on the exchange.
   */
  public async placeOrder(
    apiKeyId: string,
    order: Partial<Order>,
  ): Promise<Order> {
    // Placeholder implementation - using apiKeyId as a comment to avoid unused parameter warning
    console.log(`Placing order for API key: ${apiKeyId}`);

    // Use placeOrder method from mockDataService
    return this.mockDataService.placeOrder('mock_user', {
      ...order,
      exchangeId: this.exchangeId,
    });
  }

  /**
   * Cancel an existing order on the exchange.
   */
  public async cancelOrder(
    apiKeyId: string,
    orderId: string,
    symbol: string,
  ): Promise<boolean> {
    // Placeholder implementation
    console.log(
      `Cancelling order ${orderId} for ${symbol} with API key: ${apiKeyId}`,
    );
    return this.mockDataService.cancelOrder('mock_user', orderId);
  }

  /**
   * Get all open orders for the user.
   */
  public async getOpenOrders(
    apiKeyId: string,
    symbol?: string,
  ): Promise<Order[]> {
    // Placeholder implementation
    console.log(
      `Getting open orders for API key: ${apiKeyId}, symbol: ${symbol || 'all'}`,
    );
    return this.mockDataService.getOpenOrders(
      'mock_user',
      this.exchangeId,
      symbol,
    );
  }

  /**
   * Get order history for the user.
   */
  public async getOrderHistory(
    apiKeyId: string,
    symbol?: string,
    limit: number = 50,
  ): Promise<Order[]> {
    // Placeholder implementation
    console.log(
      `Getting order history for API key: ${apiKeyId}, symbol: ${symbol || 'all'}, limit: ${limit}`,
    );
    return this.mockDataService.getOrderHistory(
      'mock_user',
      this.exchangeId,
      symbol,
      limit,
    );
  }

  /**
   * Get performance metrics for the user's trading activity.
   */
  public async getPerformanceMetrics(
    apiKeyId: string,
    period?: string,
  ): Promise<PerformanceMetrics> {
    // Placeholder implementation
    console.log(
      `Getting performance metrics for API key: ${apiKeyId}, period: ${period || 'default'}`,
    );
    return {
      exchangeId: this.exchangeId,
      roi: 0,
      profitLoss: 0,
      winRate: 0,
      trades: 0,
      drawdown: 0,
      sharpeRatio: 0,
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      },
    };
  }

  /**
   * Validate API key credentials with the exchange.
   */
  public async validateApiKey(
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean> {
    // Placeholder implementation
    console.log(
      `Validating API key: ${apiKey.substring(0, 3)}... and secret: ${apiSecret.substring(0, 3)}...`,
    );
    return this.mockDataService.validateApiKey(apiKey, apiSecret);
  }

  /**
   * Get current price for a symbol - used by position tracking service
   * @param symbol The trading pair symbol
   * @returns The current price
   */
  public getCurrentPrice(symbol: string): number {
    try {
      // Try to get the current price from the mock data service
      console.log(`[${this.exchangeId}] Getting current price for ${symbol}`);
      const currentPrice = this.mockDataService.getCurrentPrice(
        this.exchangeId,
        symbol,
      );
      console.log(
        `[${this.exchangeId}] Current price for ${symbol}: ${currentPrice}`,
      );
      return currentPrice;
    } catch (error) {
      console.error(
        `[${this.exchangeId}] Error getting current price for ${symbol}:`,
        error,
      );

      // Provide a fallback price based on the symbol
      const baseAsset = symbol.split('/')[0];
      let defaultPrice = 100; // Default fallback

      // Set some reasonable defaults for common assets
      switch (baseAsset) {
        case 'BTC':
          defaultPrice = 50000;
          break;
        case 'ETH':
          defaultPrice = 3000;
          break;
        case 'BNB':
          defaultPrice = 500;
          break;
        case 'SOL':
          defaultPrice = 100;
          break;
        case 'XRP':
          defaultPrice = 0.5;
          break;
        case 'ADA':
          defaultPrice = 0.4;
          break;
        case 'DOGE':
          defaultPrice = 0.1;
          break;
        case 'MATIC':
          defaultPrice = 0.8;
          break;
        case 'DOT':
          defaultPrice = 7;
          break;
        case 'LTC':
          defaultPrice = 80;
          break;
      }

      console.log(
        `[${this.exchangeId}] Using fallback price for ${symbol}: ${defaultPrice}`,
      );
      return defaultPrice;
    }
  }

  /**
   * Get open positions for a user
   * This is a custom method not in the BaseExchangeAdapter interface
   * but needed by the PositionTrackingService
   */
  public getOpenPositions(
    exchangeId?: string,
    apiKeyId?: string,
    symbol?: string,
  ): any[] {
    try {
      console.log(
        `[${this.exchangeId}] Getting open positions for ${exchangeId || 'all exchanges'}, ${apiKeyId || 'all users'}, ${symbol || 'all symbols'}`,
      );

      // Generate some mock positions
      const mockPositions = [];
      const symbols = [
        'BTC/USDT',
        'ETH/USDT',
        'SOL/USDT',
        'BNB/USDT',
        'XRP/USDT',
      ];
      const sides = ['long', 'short'];

      // Generate 3-5 mock positions
      const positionCount = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < positionCount; i++) {
        const positionSymbol =
          symbol || symbols[Math.floor(Math.random() * symbols.length)];
        const side = sides[Math.floor(Math.random() * sides.length)];
        const entryPrice =
          side === 'long'
            ? this.getCurrentPrice(positionSymbol) * (1 - Math.random() * 0.05)
            : this.getCurrentPrice(positionSymbol) * (1 + Math.random() * 0.05);
        const quantity = 0.1 + Math.random() * 0.9;
        const timestamp = Date.now() - Math.floor(Math.random() * 86400000); // Random time in the last 24 hours

        const positionId = `mock-${this.exchangeId}-${positionSymbol.replace('/', '')}-${side}-${timestamp}`;

        // Calculate unrealized PnL
        const currentPrice = this.getCurrentPrice(positionSymbol);
        const pnlPerUnit =
          side === 'long'
            ? currentPrice - entryPrice
            : entryPrice - currentPrice;
        const unrealizedPnl = pnlPerUnit * quantity;

        mockPositions.push({
          id: positionId,
          exchangeId: exchangeId || this.exchangeId,
          apiKeyId: apiKeyId || 'default',
          symbol: positionSymbol,
          side,
          status: 'open',
          entryPrice,
          quantity,
          remainingQuantity: quantity,
          openTime: timestamp,
          orders: [`mock-order-${timestamp}`],
          unrealizedPnl,
          fees: 0,
          feeAsset: 'USDT',
        });
      }

      console.log(
        `[${this.exchangeId}] Generated ${mockPositions.length} mock positions`,
      );
      return mockPositions;
    } catch (error) {
      console.error(
        `[${this.exchangeId}] Error getting open positions:`,
        error,
      );
      return [];
    }
  }
}
