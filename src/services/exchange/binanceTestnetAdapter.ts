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

  /**
   * Helper method to make a robust fetch request with proper error handling
   * @param url The URL to fetch
   * @param timeoutMs Timeout in milliseconds
   * @returns The fetch response
   */
  private async makeFetchRequest(
    url: string,
    timeoutMs: number = 10000,
  ): Promise<Response> {
    console.log(`[${this.exchangeId}] Making robust fetch request to: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          contentType: 'application/json',
          accept: 'application/json',
          cacheControl: 'no-cache',
        },
        signal: controller.signal,
        // Add credentials: 'omit' to avoid sending cookies which can cause CORS issues
        credentials: 'omit',
        // Add mode: 'cors' to explicitly request CORS
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(
          `[${this.exchangeId}] Fetch successful with status: ${response.status}`,
        );
      } else {
        console.warn(
          `[${this.exchangeId}] Fetch failed with status: ${response.status}`,
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[${this.exchangeId}] Fetch error:`, error);
      throw error;
    }
  }

  constructor(apiKeyId?: string) {
    // Allow passing apiKeyId for initialization
    super('binance_testnet'); // Calls BaseExchangeAdapter constructor, which initializes mockDataService

    // Get the correct endpoint from the configuration
    this.baseUrl = getExchangeEndpoint('binance_testnet');

    // Log the base URL for debugging
    console.log(
      `[${this.exchangeId}] Initialized with base URL: ${this.baseUrl}`,
    );

    // Ensure we're using the correct Binance Testnet URL
    if (!this.baseUrl || !this.baseUrl.includes('testnet.binance.vision')) {
      console.warn(
        `[${this.exchangeId}] Invalid base URL: ${this.baseUrl}, using default`,
      );
      this.baseUrl = 'https://testnet.binance.vision/api';
    }

    // Check if we should use a CORS proxy
    const useCorsProxy = false; // Set to true if needed for development
    if (useCorsProxy) {
      // Use a CORS proxy like cors-anywhere or your own proxy
      console.log(`[${this.exchangeId}] Using CORS proxy for API requests`);
      this.baseUrl = `https://cors-anywhere.herokuapp.com/${this.baseUrl}`;
    }

    this.wsBaseUrl = 'wss://testnet.binance.vision/ws'; // Base URL for user data stream
    this.webSocketManager = WebSocketManager.getInstance();
    this.eventEmitter = new BrowserEventEmitter();

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
      console.log(`[${this.exchangeId}] Getting exchange info`);

      // Make request to exchange info endpoint directly
      try {
        console.log(
          `[${this.exchangeId}] Using direct fetch for exchange info`,
        );
        // Avoid double /api in the URL
        const url = this.baseUrl.endsWith('/api')
          ? `${this.baseUrl}/v3/exchangeInfo`
          : `${this.baseUrl}/api/v3/exchangeInfo`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            contentType: 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(
            `[${this.exchangeId}] Exchange info fetch successful with status: ${response.status}`,
          );
          const data = await response.json();

          // Check if the response contains symbols
          const hasSymbols =
            data.symbols &&
            Array.isArray(data.symbols) &&
            data.symbols.length > 0;

          if (hasSymbols) {
            console.log(
              `[${this.exchangeId}] Received ${data.symbols.length} symbols from API via direct fetch`,
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
              symbols: data.symbols,
            };
          } else {
            console.warn(
              `[${this.exchangeId}] API returned no symbols via direct fetch, trying makeUnauthenticatedRequest`,
            );
            // Continue to try with makeUnauthenticatedRequest
          }
        } else {
          console.warn(
            `[${this.exchangeId}] Exchange info direct fetch failed with status: ${response.status}, trying makeUnauthenticatedRequest`,
          );
          // Continue to try with makeUnauthenticatedRequest
        }
      } catch (fetchError) {
        console.warn(
          `[${this.exchangeId}] Exchange info direct fetch failed, trying makeUnauthenticatedRequest:`,
          fetchError,
        );
        // Continue to try with makeUnauthenticatedRequest
      }

      // Try with makeUnauthenticatedRequest as fallback
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
          `[${this.exchangeId}] Received ${response.symbols.length} symbols from API via makeUnauthenticatedRequest`,
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
      console.error(`[${this.exchangeId}] Error getting exchange info:`, error);

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
      // Ensure we have a valid base URL
      if (!this.baseUrl || !this.baseUrl.includes('testnet.binance.vision')) {
        console.warn(
          `[${this.exchangeId}] Invalid base URL detected: ${this.baseUrl}, using default`,
        );
        this.baseUrl = 'https://testnet.binance.vision/api';
      }

      // Build URL with query parameters - handle endpoint path correctly
      let url: string;
      if (endpoint.startsWith('/api') && this.baseUrl.endsWith('/api')) {
        // Avoid double /api in the URL
        url = `${this.baseUrl}${endpoint.substring(4)}`;
      } else {
        url = `${this.baseUrl}${endpoint}`;
      }

      // Add query parameters if any
      if (Object.keys(params).length > 0) {
        const queryString = Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&');
        url = `${url}?${queryString}`;
      }

      // Log the constructed URL for debugging
      console.log(`[${this.exchangeId}] Constructed URL: ${url}`);

      // Enhanced logging for debugging
      console.log(`[${this.exchangeId}] Making API request to: ${url}`);

      // Try direct fetch first to avoid any issues with the makeApiRequest utility
      try {
        console.log(`[${this.exchangeId}] Using direct fetch to: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            contentType: 'application/json',
            accept: 'application/json',
            cacheControl: 'no-cache',
          },
          signal: controller.signal,
          // Add credentials: 'omit' to avoid sending cookies which can cause CORS issues
          credentials: 'omit',
          // Add mode: 'cors' to explicitly request CORS
          mode: 'cors',
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(
            `[${this.exchangeId}] Direct fetch successful with status: ${response.status}`,
          );
          const data = await response.json();

          // Log successful response (truncated for large responses)
          const responseStr = JSON.stringify(data).substring(0, 200);
          console.log(
            `[${this.exchangeId}] API response (truncated): ${responseStr}${responseStr.length >= 200 ? '...' : ''}`,
          );

          // Check if the response is an error message from Binance
          if (data && data.code && data.msg) {
            console.warn(
              `[${this.exchangeId}] Binance API error: Code ${data.code}, Message: ${data.msg}`,
            );
            throw new Error(`Binance API error (${data.code}): ${data.msg}`);
          }

          return data as T;
        } else {
          console.warn(
            `[${this.exchangeId}] Direct fetch failed with status: ${response.status}`,
          );

          // Try to parse error response
          try {
            const errorData = await response.json();
            console.warn(`[${this.exchangeId}] Error response:`, errorData);

            if (errorData && errorData.code && errorData.msg) {
              throw new Error(
                `Binance API error (${errorData.code}): ${errorData.msg}`,
              );
            }
          } catch (parseError) {
            console.warn(
              `[${this.exchangeId}] Could not parse error response:`,
              parseError,
            );
          }

          // Continue to try with makeApiRequest as fallback
        }
      } catch (fetchError) {
        console.warn(
          `[${this.exchangeId}] Direct fetch failed, falling back to makeApiRequest:`,
          fetchError,
        );

        // If this is already a Binance API error, rethrow it
        if (
          fetchError instanceof Error &&
          fetchError.message.includes('Binance API error')
        ) {
          throw fetchError;
        }

        // Continue to try with makeApiRequest as fallback
      }

      // Make request with rate limiting as fallback
      console.log(
        `[${this.exchangeId}] Falling back to makeApiRequest for: ${url}`,
      );

      const response = await makeApiRequest<T>(this.exchangeId, url, {
        method: 'GET',
        weight,
        parseJson: true,
        retries: 3,
        retryDelay: 1000,
      });

      // Log successful response (truncated for large responses)
      const responseStr = JSON.stringify(response).substring(0, 200);
      console.log(
        `[${this.exchangeId}] API response via makeApiRequest (truncated): ${responseStr}${responseStr.length >= 200 ? '...' : ''}`,
      );

      // Check if the response is an error message from Binance
      if (
        response &&
        typeof response === 'object' &&
        'code' in response &&
        'msg' in response
      ) {
        console.warn(
          `[${this.exchangeId}] Binance API error via makeApiRequest: Code ${response.code}, Message: ${response.msg}`,
        );
        throw new Error(
          `Binance API error (${response.code}): ${response.msg}`,
        );
      }

      return response;
    } catch (error) {
      console.error(
        `[${this.exchangeId}] Error making unauthenticated request to ${endpoint}:`,
        error,
      );

      // Enhance error message with more details
      if (error instanceof Error) {
        // If it's already a Binance API error, just rethrow it
        if (error.message.includes('Binance API error')) {
          throw error;
        }

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
    try {
      // Get exchange info which contains all symbols
      const exchangeInfo = await this.getExchangeInfo();

      if (exchangeInfo.symbols && exchangeInfo.symbols.length > 0) {
        console.log(
          `[${this.exchangeId}] Converting ${exchangeInfo.symbols.length} symbols to trading pairs`,
        );

        // Convert Binance symbols to our TradingPair format
        return exchangeInfo.symbols
          .filter((symbol) => symbol.status === 'TRADING') // Only include active symbols
          .map((symbol) => {
            // Find price filter for price precision
            const priceFilter = symbol.filters.find(
              (filter) => filter.filterType === 'PRICE_FILTER',
            );
            const lotSizeFilter = symbol.filters.find(
              (filter) => filter.filterType === 'LOT_SIZE',
            );
            const minNotionalFilter = symbol.filters.find(
              (filter) => filter.filterType === 'MIN_NOTIONAL',
            );

            // Calculate decimals from tickSize (e.g., 0.00001000 -> 8 decimals)
            const calculateDecimals = (value: string | undefined): number => {
              if (!value) return 2;
              const match = value.match(/0\.0*1[0]*/);
              if (!match) return 2;
              return match[0].length - 2; // Subtract "0." from the length
            };

            return {
              symbol: `${symbol.baseAsset}/${symbol.quoteAsset}`,
              baseAsset: symbol.baseAsset,
              quoteAsset: symbol.quoteAsset,
              exchangeId: this.exchangeId,
              priceDecimals: calculateDecimals(priceFilter?.tickSize),
              quantityDecimals: calculateDecimals(lotSizeFilter?.stepSize),
              minQuantity: lotSizeFilter?.minQty
                ? parseFloat(lotSizeFilter.minQty)
                : undefined,
              maxQuantity: lotSizeFilter?.maxQty
                ? parseFloat(lotSizeFilter.maxQty)
                : undefined,
              minPrice: priceFilter?.minPrice
                ? parseFloat(priceFilter.minPrice)
                : undefined,
              maxPrice: priceFilter?.maxPrice
                ? parseFloat(priceFilter.maxPrice)
                : undefined,
              minNotional: minNotionalFilter?.minNotional
                ? parseFloat(minNotionalFilter.minNotional)
                : undefined,
            };
          });
      }
    } catch (error) {
      console.error(`[${this.exchangeId}] Error getting trading pairs:`, error);
    }

    // Fallback to mock data if API request fails
    console.log(`[${this.exchangeId}] Falling back to mock trading pairs`);
    return this.mockDataService.generateTradingPairs(this.exchangeId, 50);
  }

  /**
   * Get the order book for a specific trading pair.
   */
  public async getOrderBook(
    symbol: string,
    limit: number = 100,
  ): Promise<OrderBook> {
    try {
      // Convert symbol format from "BTC/USDT" to "BTCUSDT" for Binance API
      const binanceSymbol = symbol.replace('/', '');

      console.log(`[${this.exchangeId}] Getting order book for ${symbol}`);

      // Try direct fetch first
      try {
        const url = `${this.baseUrl}/api/v3/depth?symbol=${encodeURIComponent(binanceSymbol)}&limit=${Math.min(limit, 5000)}`;
        console.log(
          `[${this.exchangeId}] Using direct fetch for order book: ${url}`,
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            contentType: 'application/json',
            accept: 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(
            `[${this.exchangeId}] Order book fetch successful with status: ${response.status}`,
          );
          const data = await response.json();

          // Check if the response contains bids and asks
          if (
            data &&
            data.bids &&
            data.asks &&
            (data.bids.length > 0 || data.asks.length > 0)
          ) {
            console.log(
              `[${this.exchangeId}] Received order book for ${symbol} with ${data.bids.length} bids and ${data.asks.length} asks via direct fetch`,
            );

            // Convert string arrays to OrderBookEntry objects
            const bids = data.bids.map(([price, quantity]: string[]) => ({
              price: parseFloat(price),
              quantity: parseFloat(quantity),
            }));

            const asks = data.asks.map(([price, quantity]: string[]) => ({
              price: parseFloat(price),
              quantity: parseFloat(quantity),
            }));

            return {
              symbol,
              exchangeId: this.exchangeId,
              bids,
              asks,
              timestamp: Date.now(),
              lastUpdateId: data.lastUpdateId,
            };
          } else {
            console.warn(
              `[${this.exchangeId}] API returned empty order book via direct fetch for ${symbol}, trying makeUnauthenticatedRequest`,
            );
            // Continue to try with makeUnauthenticatedRequest
          }
        } else {
          console.warn(
            `[${this.exchangeId}] Order book direct fetch failed with status: ${response.status}, trying makeUnauthenticatedRequest`,
          );
          // Continue to try with makeUnauthenticatedRequest
        }
      } catch (fetchError) {
        console.warn(
          `[${this.exchangeId}] Order book direct fetch failed, trying makeUnauthenticatedRequest:`,
          fetchError,
        );
        // Continue to try with makeUnauthenticatedRequest
      }

      // Make request to depth endpoint using makeUnauthenticatedRequest as fallback
      const response = await this.makeUnauthenticatedRequest<{
        lastUpdateId: number;
        bids: string[][];
        asks: string[][];
      }>(
        '/api/v3/depth',
        {
          symbol: binanceSymbol,
          limit: Math.min(limit, 5000), // Binance has a max limit of 5000
        },
        // Weight varies based on limit
        limit <= 100 ? 1 : limit <= 500 ? 5 : limit <= 1000 ? 10 : 50,
      );

      // Check if the response contains bids and asks
      if (
        response &&
        response.bids &&
        response.asks &&
        (response.bids.length > 0 || response.asks.length > 0)
      ) {
        console.log(
          `[${this.exchangeId}] Received order book for ${symbol} with ${response.bids.length} bids and ${response.asks.length} asks via makeUnauthenticatedRequest`,
        );

        // Convert string arrays to OrderBookEntry objects
        const bids = response.bids.map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        }));

        const asks = response.asks.map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        }));

        return {
          symbol,
          exchangeId: this.exchangeId,
          bids,
          asks,
          timestamp: Date.now(),
          lastUpdateId: response.lastUpdateId,
        };
      } else {
        console.warn(
          `[${this.exchangeId}] API returned empty order book for ${symbol}, using mock data`,
        );
      }
    } catch (error) {
      console.error(
        `[${this.exchangeId}] Error getting order book for ${symbol}:`,
        error,
      );
    }

    // Fallback to mock data if API request fails or returns empty data
    console.log(
      `[${this.exchangeId}] Falling back to mock order book for ${symbol}`,
    );
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
    try {
      // Convert symbol format from "BTC/USDT" to "BTCUSDT" for Binance API
      const binanceSymbol = symbol.replace('/', '');

      // Map interval to Binance format if needed
      const binanceInterval = this.mapIntervalToBinanceFormat(interval);

      // Prepare parameters
      const params: Record<string, string | number> = {
        symbol: binanceSymbol,
        interval: binanceInterval,
        limit: Math.min(limit, 1000), // Binance has a max limit of 1000
      };

      // Add optional parameters if provided
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      // Make request to klines endpoint
      const response = await this.makeUnauthenticatedRequest<any[][]>(
        '/api/v3/klines',
        params,
        // Weight is 1 regardless of limit
        1,
      );

      // Check if the response contains data
      if (response && Array.isArray(response) && response.length > 0) {
        console.log(
          `[${this.exchangeId}] Received ${response.length} klines for ${symbol} with interval ${interval}`,
        );

        // Convert Binance kline format to our Kline format
        return response.map((kline) => ({
          symbol,
          exchangeId: this.exchangeId,
          interval,
          timestamp: kline[0], // Use openTime as timestamp for compatibility
          openTime: kline[0],
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5]),
          closeTime: kline[6],
          quoteVolume: parseFloat(kline[7]),
          trades: kline[8],
          takerBuyBaseVolume: parseFloat(kline[9]),
          takerBuyQuoteVolume: parseFloat(kline[10]),
        }));
      } else {
        console.warn(
          `[${this.exchangeId}] API returned empty klines for ${symbol} with interval ${interval}, using mock data`,
        );
      }
    } catch (error) {
      console.error(
        `[${this.exchangeId}] Error getting klines for ${symbol} with interval ${interval}:`,
        error,
      );
    }

    // Fallback to mock data if API request fails or returns empty data
    console.log(
      `[${this.exchangeId}] Falling back to mock klines for ${symbol} with interval ${interval}`,
    );
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
   * Map interval string to Binance format
   * @param interval The interval string (e.g., "1h", "4h", "1d")
   * @returns The Binance format interval
   */
  private mapIntervalToBinanceFormat(interval: string): string {
    // Binance uses lowercase intervals with no space
    // Most common formats: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M

    // If the interval is already in Binance format, return it
    const validIntervals = [
      '1m',
      '3m',
      '5m',
      '15m',
      '30m',
      '1h',
      '2h',
      '4h',
      '6h',
      '8h',
      '12h',
      '1d',
      '3d',
      '1w',
      '1M',
    ];

    if (validIntervals.includes(interval)) {
      return interval;
    }

    // Try to convert from other common formats
    const normalized = interval.toLowerCase().replace(/\s+/g, '');

    // Handle special cases
    switch (normalized) {
      case '1min':
        return '1m';
      case '1hour':
        return '1h';
      case '1day':
        return '1d';
      case '1week':
        return '1w';
      case '1month':
        return '1M';
      default:
        // Try to extract number and unit
        const match = normalized.match(/^(\d+)([mhdwM])$/);
        if (match) {
          return normalized; // Already in correct format
        }

        // Default to 1h if we can't parse it
        console.warn(
          `[${this.exchangeId}] Unknown interval format: ${interval}, defaulting to 1h`,
        );
        return '1h';
    }
  }

  /**
   * Get recent trades for a specific trading pair.
   */
  public async getRecentTrades(
    symbol: string,
    limit: number = 20,
  ): Promise<Trade[]> {
    try {
      // Convert symbol format from "BTC/USDT" to "BTCUSDT" for Binance API
      const binanceSymbol = symbol.replace('/', '');

      // Make request to trades endpoint
      const response = await this.makeUnauthenticatedRequest<
        Array<{
          id: number;
          price: string;
          qty: string;
          quoteQty: string;
          time: number;
          isBuyerMaker: boolean;
          isBestMatch: boolean;
        }>
      >(
        '/api/v3/trades',
        {
          symbol: binanceSymbol,
          limit: Math.min(limit, 1000), // Binance has a max limit of 1000
        },
        1, // Weight is 1
      );

      // Check if the response contains data
      if (response && Array.isArray(response) && response.length > 0) {
        console.log(
          `[${this.exchangeId}] Received ${response.length} recent trades for ${symbol}`,
        );

        // Convert Binance trade format to our Trade format
        return response.map((trade) => ({
          id: trade.id.toString(),
          price: parseFloat(trade.price),
          quantity: parseFloat(trade.qty),
          timestamp: trade.time,
          isBuyerMaker: trade.isBuyerMaker,
          isBestMatch: trade.isBestMatch,
        }));
      } else {
        console.warn(
          `[${this.exchangeId}] API returned empty trades for ${symbol}, using mock data`,
        );
      }
    } catch (error) {
      console.error(
        `[${this.exchangeId}] Error getting recent trades for ${symbol}:`,
        error,
      );
    }

    // Fallback to mock data if API request fails or returns empty data
    console.log(
      `[${this.exchangeId}] Falling back to mock trades for ${symbol}`,
    );
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
      if (symbol) {
        // Convert symbol format from "BTC/USDT" to "BTCUSDT" for Binance API
        // Make sure to handle both formats correctly
        const binanceSymbol = symbol.includes('/')
          ? symbol.replace('/', '')
          : symbol;

        console.log(
          `[${this.exchangeId}] Getting ticker stats for ${symbol} (Binance format: ${binanceSymbol})`,
        );

        // Try direct fetch first for better debugging
        try {
          // Construct the URL directly
          const url = `${this.baseUrl}/api/v3/ticker/24hr?symbol=${encodeURIComponent(binanceSymbol)}`;
          console.log(
            `[${this.exchangeId}] Trying direct fetch for ticker stats: ${url}`,
          );

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              contentType: 'application/json',
              accept: 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            console.log(
              `[${this.exchangeId}] Direct fetch successful for ticker stats:`,
              data,
            );

            // If we got a valid response, process it
            if (data && data.lastPrice) {
              // Ensure symbol is in the correct format (with slash)
              const formattedSymbol = symbol.includes('/')
                ? symbol
                : data.symbol
                  ? `${data.symbol.replace('USDT', '')}/USDT`
                  : symbol;

              // Parse the values from the response
              const parsedStats = {
                symbol: formattedSymbol, // Use our symbol format with "/"
                exchangeId: this.exchangeId,
                priceChange: parseFloat(data.priceChange || '0'),
                priceChangePercent: parseFloat(data.priceChangePercent || '0'),
                weightedAvgPrice: parseFloat(data.weightedAvgPrice || '0'),
                prevClosePrice: parseFloat(data.prevClosePrice || '0'),
                lastPrice: parseFloat(data.lastPrice || '0'),
                lastQty: parseFloat(data.lastQty || '0'),
                bidPrice: parseFloat(data.bidPrice || '0'),
                bidQty: parseFloat(data.bidQty || '0'),
                askPrice: parseFloat(data.askPrice || '0'),
                askQty: parseFloat(data.askQty || '0'),
                openPrice: parseFloat(data.openPrice || '0'),
                highPrice: parseFloat(data.highPrice || '0'),
                lowPrice: parseFloat(data.lowPrice || '0'),
                volume: parseFloat(data.volume || '0'),
                quoteVolume: parseFloat(data.quoteVolume || '0'),
                openTime: data.openTime || Date.now() - 24 * 60 * 60 * 1000,
                closeTime: data.closeTime || Date.now(),
                count: data.count || 0,
              };

              // Check if all important values are zero
              const allImportantValuesZero =
                parsedStats.lastPrice === 0 &&
                parsedStats.highPrice === 0 &&
                parsedStats.lowPrice === 0 &&
                parsedStats.volume === 0;

              if (allImportantValuesZero) {
                console.warn(
                  `[${this.exchangeId}] Direct fetch returned all zero values for ${symbol}, will try makeUnauthenticatedRequest`,
                );
              } else {
                // If we have valid non-zero values, return them
                return parsedStats;
              }
            }
          } else {
            console.warn(
              `[${this.exchangeId}] Direct fetch failed with status: ${response.status}, will try makeUnauthenticatedRequest`,
            );
          }
        } catch (directFetchError) {
          console.warn(
            `[${this.exchangeId}] Direct fetch error for ticker stats:`,
            directFetchError,
          );
        }

        // Fall back to makeUnauthenticatedRequest if direct fetch fails or returns zero values
        console.log(
          `[${this.exchangeId}] Trying makeUnauthenticatedRequest for ticker stats`,
        );

        // Make request to 24hr ticker endpoint for a specific symbol
        const response = await this.makeUnauthenticatedRequest<{
          symbol: string;
          priceChange: string;
          priceChangePercent: string;
          weightedAvgPrice: string;
          prevClosePrice: string;
          lastPrice: string;
          lastQty: string;
          bidPrice: string;
          bidQty: string;
          askPrice: string;
          askQty: string;
          openPrice: string;
          highPrice: string;
          lowPrice: string;
          volume: string;
          quoteVolume: string;
          openTime: number;
          closeTime: number;
          firstId: number;
          lastId: number;
          count: number;
        }>(
          '/api/v3/ticker/24hr',
          { symbol: binanceSymbol },
          1, // Weight is 1 for a single symbol
        );

        if (response && response.lastPrice) {
          // Log the full response for debugging
          console.log(
            `[${this.exchangeId}] Received ticker stats for ${symbol} with price: ${response.lastPrice}`,
            JSON.stringify(response, null, 2),
          );

          // Ensure symbol is in the correct format (with slash)
          const formattedSymbol = symbol.includes('/')
            ? symbol
            : response.symbol
              ? `${response.symbol.replace('USDT', '')}/USDT`
              : symbol;

          // Parse the values from the response
          const parsedStats = {
            symbol: formattedSymbol, // Use our symbol format with "/"
            exchangeId: this.exchangeId,
            priceChange: parseFloat(response.priceChange || '0'),
            priceChangePercent: parseFloat(response.priceChangePercent || '0'),
            weightedAvgPrice: parseFloat(response.weightedAvgPrice || '0'),
            prevClosePrice: parseFloat(response.prevClosePrice || '0'),
            lastPrice: parseFloat(response.lastPrice || '0'),
            lastQty: parseFloat(response.lastQty || '0'),
            bidPrice: parseFloat(response.bidPrice || '0'),
            bidQty: parseFloat(response.bidQty || '0'),
            askPrice: parseFloat(response.askPrice || '0'),
            askQty: parseFloat(response.askQty || '0'),
            openPrice: parseFloat(response.openPrice || '0'),
            highPrice: parseFloat(response.highPrice || '0'),
            lowPrice: parseFloat(response.lowPrice || '0'),
            volume: parseFloat(response.volume || '0'),
            quoteVolume: parseFloat(response.quoteVolume || '0'),
            openTime: response.openTime || Date.now() - 24 * 60 * 60 * 1000,
            closeTime: response.closeTime || Date.now(),
            count: response.count || 0,
          };

          // Check if all important values are zero, which might indicate an issue with the API
          const allImportantValuesZero =
            parsedStats.lastPrice === 0 &&
            parsedStats.highPrice === 0 &&
            parsedStats.lowPrice === 0 &&
            parsedStats.volume === 0;

          if (allImportantValuesZero) {
            console.warn(
              `[${this.exchangeId}] API returned all zero values for ${symbol}, using mock data instead`,
            );
            return this.mockDataService.generateTickerStats(
              this.exchangeId,
              symbol,
            );
          }

          return parsedStats;
        } else {
          console.warn(
            `[${this.exchangeId}] API returned empty or invalid ticker stats for ${symbol}, using mock data`,
          );
          return this.mockDataService.generateTickerStats(
            this.exchangeId,
            symbol,
          );
        }
      } else {
        console.log(`[${this.exchangeId}] Getting ticker stats for all pairs`);

        // Make request to 24hr ticker endpoint for all symbols
        const response = await this.makeUnauthenticatedRequest<
          Array<{
            symbol: string;
            priceChange: string;
            priceChangePercent: string;
            weightedAvgPrice: string;
            prevClosePrice: string;
            lastPrice: string;
            lastQty: string;
            bidPrice: string;
            bidQty: string;
            askPrice: string;
            askQty: string;
            openPrice: string;
            highPrice: string;
            lowPrice: string;
            volume: string;
            quoteVolume: string;
            openTime: number;
            closeTime: number;
            firstId: number;
            lastId: number;
            count: number;
          }>
        >(
          '/api/v3/ticker/24hr',
          {},
          40, // Weight is 40 for all symbols
        );

        if (response && Array.isArray(response) && response.length > 0) {
          console.log(
            `[${this.exchangeId}] Received ticker stats for ${response.length} symbols`,
          );

          // Convert Binance ticker format to our TickerStats format
          // Filter to include only USDT pairs for better performance
          const validTickers = response
            .filter((ticker) => ticker.symbol && ticker.symbol.endsWith('USDT'))
            .map((ticker) => {
              // Convert Binance symbol format to our format (e.g., "BTCUSDT" -> "BTC/USDT")
              const baseAsset = ticker.symbol.replace('USDT', '');
              const formattedSymbol = `${baseAsset}/USDT`;

              return {
                symbol: formattedSymbol,
                exchangeId: this.exchangeId,
                priceChange: parseFloat(ticker.priceChange || '0'),
                priceChangePercent: parseFloat(
                  ticker.priceChangePercent || '0',
                ),
                weightedAvgPrice: parseFloat(ticker.weightedAvgPrice || '0'),
                prevClosePrice: parseFloat(ticker.prevClosePrice || '0'),
                lastPrice: parseFloat(ticker.lastPrice || '0'),
                lastQty: parseFloat(ticker.lastQty || '0'),
                bidPrice: parseFloat(ticker.bidPrice || '0'),
                bidQty: parseFloat(ticker.bidQty || '0'),
                askPrice: parseFloat(ticker.askPrice || '0'),
                askQty: parseFloat(ticker.askQty || '0'),
                openPrice: parseFloat(ticker.openPrice || '0'),
                highPrice: parseFloat(ticker.highPrice || '0'),
                lowPrice: parseFloat(ticker.lowPrice || '0'),
                volume: parseFloat(ticker.volume || '0'),
                quoteVolume: parseFloat(ticker.quoteVolume || '0'),
                openTime: ticker.openTime || Date.now() - 24 * 60 * 60 * 1000,
                closeTime: ticker.closeTime || Date.now(),
                count: ticker.count || 0,
              };
            });

          if (validTickers.length > 0) {
            return validTickers;
          } else {
            console.warn(
              `[${this.exchangeId}] No valid USDT pairs found in API response, using mock data`,
            );
          }
        } else {
          console.warn(
            `[${this.exchangeId}] API returned empty ticker stats for all symbols, using mock data`,
          );
        }

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
  public async getCurrentPrice(symbol: string): Promise<number> {
    try {
      // Convert symbol format from "BTC/USDT" to "BTCUSDT" for Binance API
      // Make sure to handle both formats correctly
      const binanceSymbol = symbol.includes('/')
        ? symbol.replace('/', '')
        : symbol;

      console.log(
        `[${this.exchangeId}] Getting current price for ${symbol} (Binance format: ${binanceSymbol})`,
      );

      // Try direct fetch first for better debugging
      try {
        // Construct the URL directly
        const url = `${this.baseUrl}/api/v3/ticker/price?symbol=${encodeURIComponent(binanceSymbol)}`;
        console.log(
          `[${this.exchangeId}] Trying direct fetch for current price: ${url}`,
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            contentType: 'application/json',
            accept: 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log(
            `[${this.exchangeId}] Direct fetch successful for current price:`,
            data,
          );

          if (data && data.price) {
            const price = parseFloat(data.price);
            console.log(
              `[${this.exchangeId}] Current price for ${symbol}: ${price}`,
            );
            return price;
          } else {
            console.warn(
              `[${this.exchangeId}] Direct fetch returned empty price for ${symbol}, will try makeUnauthenticatedRequest`,
            );
          }
        } else {
          console.warn(
            `[${this.exchangeId}] Direct fetch failed with status: ${response.status}, will try makeUnauthenticatedRequest`,
          );
        }
      } catch (directFetchError) {
        console.warn(
          `[${this.exchangeId}] Direct fetch error for current price:`,
          directFetchError,
        );
      }

      // Fall back to makeUnauthenticatedRequest if direct fetch fails
      console.log(
        `[${this.exchangeId}] Trying makeUnauthenticatedRequest for current price`,
      );

      // Make request to price endpoint
      const response = await this.makeUnauthenticatedRequest<{
        symbol: string;
        price: string;
      }>(
        '/api/v3/ticker/price',
        { symbol: binanceSymbol },
        1, // Weight is 1
      );

      if (response && response.price) {
        const price = parseFloat(response.price);
        console.log(
          `[${this.exchangeId}] Current price for ${symbol}: ${price}`,
        );
        return price;
      } else {
        console.warn(
          `[${this.exchangeId}] API returned empty price for ${symbol}, using mock data`,
        );
      }
    } catch (error) {
      console.error(
        `[${this.exchangeId}] Error getting current price for ${symbol}:`,
        error,
      );
    }

    // Fallback to mock data if API request fails or returns empty data
    try {
      const mockPrice = this.mockDataService.getCurrentPrice(
        this.exchangeId,
        symbol,
      );
      console.log(
        `[${this.exchangeId}] Using mock price for ${symbol}: ${mockPrice}`,
      );
      return mockPrice;
    } catch (mockError) {
      console.error(
        `[${this.exchangeId}] Error getting mock price for ${symbol}:`,
        mockError,
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
  public async getOpenPositions(
    exchangeId?: string,
    apiKeyId?: string,
    symbol?: string,
  ): Promise<any[]> {
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

        // Get current price from API
        const currentPricePromise = this.getCurrentPrice(positionSymbol);

        // Calculate a random entry price that's slightly different from current price
        const randomFactor =
          side === 'long'
            ? 1 - Math.random() * 0.05 // For long positions, entry price is lower than current
            : 1 + Math.random() * 0.05; // For short positions, entry price is higher than current

        // Await the current price
        const currentPrice = await currentPricePromise;
        const entryPrice = currentPrice * randomFactor;

        const quantity = 0.1 + Math.random() * 0.9;
        const timestamp = Date.now() - Math.floor(Math.random() * 86400000); // Random time in the last 24 hours

        const positionId = `mock-${this.exchangeId}-${positionSymbol.replace('/', '')}-${side}-${timestamp}`;

        // Calculate unrealized PnL
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
