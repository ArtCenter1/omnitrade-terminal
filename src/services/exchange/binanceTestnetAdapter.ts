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

// --- Interfaces for getAllAssetDetails (/sapi/v1/capital/config/getall) ---

/**
 * Represents network details for an asset from Binance API.
 */
interface BinanceNetworkDetail {
  network: string;
  coin: string;
  name: string;
  withdrawIntegerMultiple: string; // e.g., "0.00000001"
  isDefault: boolean;
  depositEnable: boolean;
  withdrawEnable: boolean;
  depositDesc?: string; // e.g., "Wallet Maintenance, Deposit Suspended"
  withdrawDesc?: string; // e.g., "Wallet Maintenance, Withdraw Suspended"
  specialTips?: string;
  resetAddressStatus?: boolean; // Not always present
  addressRegex: string;
  addressRule?: string; // Not always present
  memoRegex: string;
  withdrawFee: string; // Fee as a string number
  withdrawMin: string; // Min withdrawal amount as a string number
  withdrawMax: string; // Max withdrawal amount as a string number
  minConfirm: number; // Integer, min number for balance confirmation
  unLockConfirm: number; // Integer, min number for balance unlock confirmation
  sameAddress?: boolean; // If the deposit address is same for all networks
  estimatedArrivalTime?: number; // Not always present
  busy?: boolean; // Not always present
}

/**
 * Represents a single asset's details from the Binance /sapi/v1/capital/config/getall endpoint.
 */
interface BinanceAssetDetail {
  coin: string;
  depositAllEnable: boolean;
  withdrawAllEnable: boolean;
  name: string;
  free: string; // Not part of /sapi/v1/capital/config/getall, but often needed alongside
  locked: string; // Not part of /sapi/v1/capital/config/getall
  freeze: string; // Not part of /sapi/v1/capital/config/getall
  ipoing: string; // Not part of /sapi/v1/capital/config/getall
  ipoable: string; // Not part of /sapi/v1/capital/config/getall
  storage: string; // Not part of /sapi/v1/capital/config/getall
  withdrawing: string; // Not part of /sapi/v1/capital/config/getall
  isLegalMoney: boolean;
  trading: boolean;
  networkList: BinanceNetworkDetail[];
}

// --- Interfaces for Balance Updates ---
interface BalanceUpdatePayload {
  e: 'balanceUpdate'; // Event type
  E: number; // Event time
  a: string; // Asset
  d: string; // Balance delta
  T: number; // Clear time
}

interface OutboundAccountPositionPayload {
  e: 'outboundAccountPosition'; // Event type
  E: number; // Event time
  u: number; // Time of last account update
  B: Array<{
    a: string; // Asset
    f: string; // Free amount
    l: string; // Locked amount
  }>;
}

// --- Interfaces for getAccountInfo ---

/**
 * Represents a single balance entry from the Binance /api/v3/account endpoint.
 */
interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

/**
 * Represents the raw account information structure returned by the Binance /api/v3/account endpoint.
 */
interface BinanceAccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number; // Included for completeness, often same as taker
  sellerCommission: number; // Included for completeness, often same as maker
  commissionRates?: {
    // Newer structure for commission rates (optional)
    maker: string;
    taker: string;
    buyer: string;
    seller: string;
  };
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: BinanceBalance[];
  permissions: string[];
  uid?: number; // Added based on potential API response structure (optional)
}

/**
 * Represents the normalized account information returned by our getAccountInfo method.
 * Exported for use in tests and potentially other parts of the application.
 */
export interface NormalizedAccountInfo {
  exchangeId: string;
  accountType: string;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  makerCommission: number; // Commission rate (e.g., 0.001 for 0.1%)
  takerCommission: number; // Commission rate (e.g., 0.001 for 0.1%)
  balances: Record<string, { free: number; locked: number }>; // Normalized balances map (Asset -> {free, locked})
  updateTime: number;
  rawResponse?: BinanceAccountInfo; // Optional: include raw response for debugging
}

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
   * Ensure exchange information is fetched and cached.
   */
  private async ensureExchangeInfoCached(): Promise<void> {
    if (!this.cachedExchangeInfo) {
      try {
        logger.info(`[${this.exchangeId}] Caching exchange info...`);
        // Use the actual getExchangeInfo method, not the mock one directly
        // Use type assertion to handle the symbols property
        this.cachedExchangeInfo =
          (await this.getExchangeInfo()) as BinanceExchangeInfo;
        logger.info(`[${this.exchangeId}] Exchange info cached successfully.`);
      } catch (error) {
        logger.error(
          `[${this.exchangeId}] Failed to fetch or cache exchange info:`,
          error,
        );
        // Decide if we should re-throw or handle differently. Re-throwing for now.
        throw new Error(
          `Failed to load exchange information needed for order validation: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  /**
   * Generate HMAC-SHA256 signature for Binance API requests
   * @param queryString The query string to sign
   * @param apiSecret The API secret to use for signing
   * @returns The signature
   */
  private generateSignature(queryString: string, apiSecret: string): string {
    return HmacSHA256(queryString, apiSecret).toString(Hex);
  }

  /**
   * Build authentication headers for Binance API requests
   * @param apiKey The API key to use
   * @returns Headers object with API key
   */
  private buildAuthHeaders(apiKey: string): Record<string, string> {
    return {
      'X-MBX-APIKEY': apiKey,
    };
  }

  /**
   * Add timestamp and signature to query parameters
   * @param params The query parameters
   * @param apiSecret The API secret to use for signing
   * @returns The query parameters with timestamp and signature
   */
  private addSignature(
    params: Record<string, string | number>,
    apiSecret: string,
  ): Record<string, string | number> {
    // Add timestamp
    const timestamp = Date.now();
    const paramsWithTimestamp = {
      ...params,
      timestamp,
    };

    // Convert params to query string
    const queryString = Object.entries(paramsWithTimestamp)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Generate signature
    const signature = this.generateSignature(queryString, apiSecret);

    // Return params with timestamp and signature
    return {
      ...paramsWithTimestamp,
      signature,
    };
  }

  /**
   * Get API credentials for a user
   * @param apiKeyId The API key ID
   * @returns The API key and secret
   */
  private async getApiCredentials(
    apiKeyId: string,
  ): Promise<{ apiKey: string; apiSecret: string }> {
    try {
      // Import the ApiKeyManager
      const { ApiKeyManager } = await import(
        '@/services/apiKeys/apiKeyManager'
      );

      // Get the API key manager instance
      const apiKeyManager = ApiKeyManager.getInstance();

      // Try to get the API key by ID first
      let apiKeyPair = await apiKeyManager.getApiKeyById(apiKeyId);

      // If not found by ID, try to get the default key for Binance Testnet
      if (!apiKeyPair) {
        apiKeyPair = await apiKeyManager.getDefaultApiKey('binance_testnet');
      }

      // If we found a key, update the last used timestamp and return it
      if (apiKeyPair) {
        await apiKeyManager.updateLastUsed(apiKeyPair.id);

        return {
          apiKey: apiKeyPair.apiKey,
          apiSecret: apiKeyPair.apiSecret,
        };
      }

      // Check if we have environment variables for API keys
      const envApiKey = import.meta.env.VITE_BINANCE_TESTNET_API_KEY;
      const envApiSecret = import.meta.env.VITE_BINANCE_TESTNET_API_SECRET;

      if (envApiKey && envApiSecret) {
        return {
          apiKey: envApiKey,
          apiSecret: envApiSecret,
        };
      }

      // If we still don't have credentials, use mock data
      console.warn(
        'No API credentials found for Binance Testnet. Using mock data.',
      );
      return {
        apiKey: 'testnet_api_key',
        apiSecret: 'testnet_api_secret',
      };
    } catch (error) {
      console.error('Error getting API credentials:', error);

      // Fallback to mock data
      return {
        apiKey: 'testnet_api_key',
        apiSecret: 'testnet_api_secret',
      };
    }
  }

  /**
   * Make an authenticated request to the Binance API
   * @param endpoint The API endpoint
   * @param method The HTTP method
   * @param apiKeyId The API key ID
   * @param params The query parameters
   * @param weight The request weight
   * @returns The response data
   */
  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', // Added PUT for listenKey keep-alive
    apiKeyId: string,
    params: Record<string, string | number> = {},
    weight: number = 1,
  ): Promise<T> {
    try {
      // Get API credentials
      const { apiKey, apiSecret } = await this.getApiCredentials(apiKeyId);

      // Check if we're using mock credentials
      const isMockCredentials =
        apiKey === 'testnet_api_key' ||
        apiSecret === 'testnet_api_secret' ||
        apiKey === 'invalid_api_key' ||
        apiSecret === 'invalid_api_secret';

      if (isMockCredentials) {
        console.warn(
          'Using mock credentials for authenticated request. This will not work with real Binance Testnet API.',
        );
        // For listenKey operations, we might need mock responses
        if (endpoint === '/api/v3/userDataStream') {
          if (method === 'POST')
            return { listenKey: 'mockListenKey12345' } as T;
          if (method === 'PUT') return {} as T; // Keep-alive success
          if (method === 'DELETE') return {} as T; // Delete success
        }
        throw new Error(
          'Invalid API credentials: Using mock or invalid API keys',
        );
      }

      // Add signature for methods that require it (GET, DELETE usually use query string)
      let requestParams: Record<string, string | number> = params;
      let requestBody: Record<string, string | number> | undefined = undefined;
      let url = `${this.baseUrl}${endpoint}`;

      if (method === 'POST' || method === 'PUT') {
        // POST/PUT requests usually send params in the body and require signing the body
        requestBody = this.addSignature(params, apiSecret);
      } else {
        // GET/DELETE requests usually send params in the query string and sign the query string
        requestParams = this.addSignature(params, apiSecret);
        const queryString = Object.entries(requestParams)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&');
        url = `${url}?${queryString}`;
      }

      try {
        // Make request with rate limiting
        return await makeApiRequest<T>(this.exchangeId, url, {
          method,
          weight,
          // Send body only for POST/PUT, params are already in URL for GET/DELETE
          body: method === 'POST' || method === 'PUT' ? requestBody : undefined,
          headers: this.buildAuthHeaders(apiKey),
          parseJson: true,
          retries: 3,
          retryDelay: 1000,
        });
      } catch (requestError: any) {
        // Check for authentication errors
        const errorMessage =
          requestError instanceof Error
            ? requestError.message
            : String(requestError);
        const responseText = requestError.responseText || '';

        // Handle specific authentication errors
        if (
          errorMessage.includes('Invalid API-key') ||
          errorMessage.includes('API-key format invalid') ||
          errorMessage.includes('Signature') ||
          errorMessage.includes('authorization') ||
          errorMessage.includes('authenticate') ||
          errorMessage.includes('API key') ||
          responseText.includes('Invalid API-key') ||
          responseText.includes('Signature')
        ) {
          console.error('Authentication error:', errorMessage);
          throw new Error(`Authentication failed: ${errorMessage}`);
        }

        // Re-throw other errors
        throw requestError;
      }
    } catch (error) {
      console.error(
        `Error making authenticated request to ${endpoint}:`,
        error,
      );

      // Enhance error message for authentication errors
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (
          errorMessage.includes('Invalid API-key') ||
          errorMessage.includes('API-key format invalid') ||
          errorMessage.includes('Signature') ||
          errorMessage.includes('authorization') ||
          errorMessage.includes('authenticate') ||
          errorMessage.includes('API key')
        ) {
          throw new Error(
            `Authentication failed: ${errorMessage}. Please check your API key and secret.`,
          );
        }
      }

      throw error;
    }
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

      // Add query parameters if provided
      if (Object.keys(params).length > 0) {
        const queryString = Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&');
        url = `${url}?${queryString}`;
      }

      console.log(`[BinanceTestnetAdapter] Making request to: ${url}`);

      // Check if we're in mock mode and adjust the URL if needed
      const { isMockMode } = await import('@/config/exchangeConfig');
      if (isMockMode()) {
        // In mock mode, we need to ensure the URL is properly formatted for the mock API
        console.log(
          '[BinanceTestnetAdapter] Using mock mode for Binance Testnet request',
        );

        // If the URL is already a mock URL, use it as is
        if (url.includes('/api/mock/')) {
          console.log(
            '[BinanceTestnetAdapter] URL is already a mock URL:',
            url,
          );
        } else {
          // Otherwise, convert it to a mock URL
          const mockUrl = url.replace(
            'https://testnet.binance.vision/api',
            '/api/mock/binance_testnet',
          );
          console.log(
            `[BinanceTestnetAdapter] Converting URL from ${url} to ${mockUrl}`,
          );
          url = mockUrl;
        }
      }

      // Make request with rate limiting
      return await makeApiRequest<T>(this.exchangeId, url, {
        method: 'GET',
        weight,
        body: undefined,
        headers: {},
        parseJson: true,
        retries: 3,
        retryDelay: 1000,
      });
    } catch (error) {
      console.error(
        `[BinanceTestnetAdapter] Error making unauthenticated request to ${endpoint}:`,
        error,
      );

      // Log more details about the error
      console.log('[BinanceTestnetAdapter] Error details:', {
        endpoint,
        params,
        baseUrl: this.baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });

      // If we get a 404 error, try to use the mock data service directly
      if (error instanceof Error && error.message.includes('404')) {
        console.log(
          '[BinanceTestnetAdapter] Got 404 error, falling back to mock data service',
        );

        // Determine what kind of data to generate based on the endpoint
        if (endpoint.includes('/ticker/24hr')) {
          const symbol = (params.symbol as string) || 'BTCUSDT';
          console.log(
            `[BinanceTestnetAdapter] Generating mock ticker stats for ${symbol}`,
          );

          // Convert BTCUSDT format to BTC/USDT if needed
          const formattedSymbol = symbol.includes('/')
            ? symbol
            : `${symbol.slice(0, -4)}/${symbol.slice(-4)}`;

          return this.mockDataService.generateTickerStats(
            this.exchangeId,
            formattedSymbol,
          ) as unknown as T;
        } else if (endpoint.includes('/depth')) {
          const symbol = (params.symbol as string) || 'BTCUSDT';
          const limit = (params.limit as number) || 100;
          console.log(
            `[BinanceTestnetAdapter] Generating mock order book for ${symbol}`,
          );

          // Convert BTCUSDT format to BTC/USDT if needed
          const formattedSymbol = symbol.includes('/')
            ? symbol
            : `${symbol.slice(0, -4)}/${symbol.slice(-4)}`;

          const orderBook = this.mockDataService.generateOrderBook(
            this.exchangeId,
            formattedSymbol,
            limit,
          );

          // Convert to Binance API format
          const binanceFormat = {
            lastUpdateId: Date.now(),
            bids: orderBook.bids.map((bid) => [
              bid.price.toString(),
              bid.quantity.toString(),
            ]),
            asks: orderBook.asks.map((ask) => [
              ask.price.toString(),
              ask.quantity.toString(),
            ]),
          };

          return binanceFormat as unknown as T;
        }
        // Add more mock fallbacks here if needed for other endpoints
      }

      // Enhance error message with more details
      if (error instanceof Error) {
        const errorMessage = error.message;
        const enhancedMessage = `Error requesting ${this.baseUrl}${endpoint}: ${errorMessage}`;
        throw new Error(enhancedMessage);
      }

      throw error;
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

      // Return formatted exchange info with symbols included
      return {
        id: this.exchangeId,
        name: 'Binance Testnet',
        logo: '/exchanges/binance.svg',
        website: 'https://testnet.binance.vision',
        description: 'Binance Testnet for sandbox trading',
        isActive: true,
        // Include symbols from the response for order validation
        symbols: response.symbols || [],
      };
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

      // Generate mock symbols for common trading pairs
      const mockSymbols = [
        'BTCUSDT',
        'ETHUSDT',
        'BNBUSDT',
        'ADAUSDT',
        'DOGEUSDT',
        'XRPUSDT',
        'LTCUSDT',
        'DOTUSDT',
        'LINKUSDT',
        'BCHUSDT',
      ].map((symbol) => ({
        symbol,
        status: 'TRADING',
        baseAsset: symbol.slice(0, -4),
        quoteAsset: 'USDT',
        baseAssetPrecision: 8,
        quoteAssetPrecision: 8,
        orderTypes: ['LIMIT', 'MARKET', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'],
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
      }));

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
   * Get all available trading pairs on Binance Testnet.
   */
  public async getTradingPairs(): Promise<TradingPair[]> {
    try {
      // Make request to exchange info endpoint
      const response = await this.makeUnauthenticatedRequest<{
        symbols: Array<{
          symbol: string;
          status: string;
          baseAsset: string;
          quoteAsset: string;
          baseAssetPrecision: number;
          quoteAssetPrecision: number;
          orderTypes: string[];
          icebergAllowed: boolean;
          ocoAllowed: boolean;
          quoteOrderQtyMarketAllowed: boolean;
          allowTrailingStop: boolean;
          cancelReplaceAllowed: boolean;
          isSpotTradingAllowed: boolean;
          isMarginTradingAllowed: boolean;
          filters: Array<{
            filterType: string;
            tickSize?: string;
            minQty?: string;
            maxQty?: string;
            stepSize?: string;
            minPrice?: string;
            maxPrice?: string;
            minNotional?: string;
            // Add other filter types as needed
          }>;
          permissions: string[];
          defaultSelfTradePreventionMode: string;
          allowedSelfTradePreventionModes: string[];
        }>;
      }>(
        '/api/v3/exchangeInfo', // Corrected endpoint
        {},
        10, // Weight: 10
      );

      // Extract and format trading pairs
      const pairs: TradingPair[] = response.symbols
        .filter(
          (symbol) =>
            symbol.status === 'TRADING' && symbol.isSpotTradingAllowed,
        )
        .map((symbol) => {
          // Find price filter
          const priceFilter = symbol.filters.find(
            (filter: any) => filter.filterType === 'PRICE_FILTER',
          );

          // Find lot size filter
          const lotSizeFilter = symbol.filters.find(
            (filter: any) => filter.filterType === 'LOT_SIZE',
          );

          // Find notional filter
          const notionalFilter = symbol.filters.find(
            (filter: any) =>
              filter.filterType === 'NOTIONAL' ||
              filter.filterType === 'MIN_NOTIONAL', // Handle both possible names
          );

          return {
            symbol: this.formatSymbol(symbol.symbol), // Format like BTC/USDT
            baseAsset: symbol.baseAsset,
            quoteAsset: symbol.quoteAsset,
            exchangeId: this.exchangeId,
            priceDecimals: priceFilter?.tickSize
              ? this.getPrecision(priceFilter.tickSize)
              : 8, // Default precision
            quantityDecimals: lotSizeFilter?.stepSize
              ? this.getPrecision(lotSizeFilter.stepSize)
              : 8, // Default precision
            minQuantity: lotSizeFilter?.minQty
              ? parseFloat(lotSizeFilter.minQty)
              : 0,
            maxQuantity: lotSizeFilter?.maxQty
              ? parseFloat(lotSizeFilter.maxQty)
              : Infinity,
            minNotional: notionalFilter?.minNotional
              ? parseFloat(notionalFilter.minNotional)
              : 0,
            // Add other relevant fields if needed
            // e.g., allowed order types: symbol.orderTypes
          };
        });

      return pairs;
    } catch (error) {
      console.error('Error getting trading pairs:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Helper function to determine precision from step size or tick size.
   * e.g., "0.001" -> 3; "1.0" -> 0; "10.0" -> 0
   */
  private getPrecision(value: string): number {
    if (!value || parseFloat(value) === 0) return 8; // Default or error case
    const parts = value.split('.');
    if (parts.length === 1) return 0; // Integer precision
    // Find the first non-zero digit after the decimal point
    const decimalPart = parts[1];
    // The number of decimal places seems the most reliable indicator for Binance.
    return decimalPart.length;
  }

  /**
   * Get the order book for a specific trading pair.
   */
  public async getOrderBook(
    symbol: string,
    limit: number = 100,
  ): Promise<OrderBook> {
    try {
      // Convert symbol format if needed (e.g., BTC/USDT to BTCUSDT)
      const binanceSymbol = symbol.replace('/', '');

      // Log the symbol conversion for debugging
      console.log(
        `[BinanceTestnetAdapter] Getting order book for ${symbol} (${binanceSymbol}) with limit ${limit}`,
      );

      try {
        // Make the request to the Binance Testnet API
        console.log(
          `[BinanceTestnetAdapter] Making request to /api/v3/depth with symbol=${binanceSymbol} and limit=${limit}`,
        );

        const response = await this.makeUnauthenticatedRequest<{
          lastUpdateId: number;
          bids: string[][]; // [price, quantity]
          asks: string[][]; // [price, quantity]
        }>(
          '/api/v3/depth', // Endpoint path
          { symbol: binanceSymbol, limit }, // Query parameters
          this.calculateOrderBookWeight(limit), // Calculate weight based on limit
        );

        // Validate the response
        if (!response || !response.bids || !response.asks) {
          console.error(
            `[BinanceTestnetAdapter] Invalid order book response for ${symbol}:`,
            response,
          );
          throw new Error('Invalid order book response');
        }

        console.log(
          `[BinanceTestnetAdapter] Successfully fetched order book for ${symbol} with ${response.bids.length} bids and ${response.asks.length} asks`,
        );

        // Convert the response to our OrderBook format
        return {
          symbol: symbol,
          exchangeId: this.exchangeId,
          timestamp: Date.now(), // Use current time as Binance doesn't provide timestamp here
          lastUpdateId: response.lastUpdateId,
          bids: response.bids.map((bid: string[]) => ({
            price: parseFloat(bid[0]),
            quantity: parseFloat(bid[1]),
          })),
          asks: response.asks.map((ask: string[]) => ({
            price: parseFloat(ask[0]),
            quantity: parseFloat(ask[1]),
          })),
        };
      } catch (apiError) {
        // Log the detailed error for debugging
        console.error(
          `[BinanceTestnetAdapter] API error getting order book for ${symbol}:`,
          apiError,
        );

        // Always fall back to mock data on API errors
        console.log(
          `[BinanceTestnetAdapter] Falling back to mock data service for ${symbol}`,
        );

        // Generate mock order book data
        const mockOrderBook = this.mockDataService.generateOrderBook(
          this.exchangeId,
          symbol,
          limit,
        );

        // Log the mock data for debugging
        console.log(
          `[BinanceTestnetAdapter] Generated mock order book with ${mockOrderBook.bids.length} bids and ${mockOrderBook.asks.length} asks`,
        );

        return {
          ...mockOrderBook,
          timestamp: Date.now(), // Ensure timestamp is current
        };
      }
    } catch (error) {
      console.error(
        `[BinanceTestnetAdapter] Error getting order book for ${symbol}:`,
        error,
      );

      // Always fall back to mock data on any error
      console.log(
        `[BinanceTestnetAdapter] Falling back to mock data due to error`,
      );

      const mockOrderBook = this.mockDataService.generateOrderBook(
        this.exchangeId,
        symbol,
        limit,
      );

      console.log(
        `[BinanceTestnetAdapter] Generated mock order book with ${mockOrderBook.bids.length} bids and ${mockOrderBook.asks.length} asks`,
      );

      return {
        ...mockOrderBook,
        timestamp: Date.now(), // Ensure timestamp is current
      };
    }
  }

  /** Calculate request weight for order book based on limit */
  private calculateOrderBookWeight(limit: number): number {
    if (limit <= 100) return 1;
    if (limit <= 500) return 5;
    if (limit <= 1000) return 10;
    return 50; // Limit 5000
  }

  /**
   * Get ticker statistics for a specific trading pair or all pairs.
   */
  public async getTickerStats(
    symbol?: string,
  ): Promise<TickerStats | TickerStats[]> {
    try {
      const endpoint = '/api/v3/ticker/24hr'; // Corrected endpoint
      let params: Record<string, string> = {};
      let weight = 1; // Default weight for single symbol

      if (symbol) {
        const binanceSymbol = symbol.replace('/', '');
        params = { symbol: binanceSymbol };
        console.log(
          `[BinanceTestnetAdapter] Fetching ticker stats for ${symbol} (${binanceSymbol})`,
        );
      } else {
        weight = 40; // Weight for all symbols
        console.log(
          `[BinanceTestnetAdapter] Fetching ticker stats for all symbols`,
        );
      }

      const response = await this.makeUnauthenticatedRequest<any>( // Use 'any' as response can be object or array
        endpoint,
        params,
        weight,
      );

      // Log the raw response for debugging
      console.log(
        `[BinanceTestnetAdapter] Received ticker response:`,
        Array.isArray(response)
          ? `Array with ${response.length} items`
          : response,
      );

      if (Array.isArray(response)) {
        // Response for all symbols
        console.log(
          `[BinanceTestnetAdapter] Processing array response with ${response.length} ticker items`,
        );
        return response.map((ticker: any) => {
          const formattedSymbol = this.formatSymbol(ticker.symbol);
          console.log(
            `[BinanceTestnetAdapter] Formatting ticker for ${ticker.symbol} -> ${formattedSymbol}`,
          );
          return this.formatTickerStats(ticker, formattedSymbol);
        });
      } else if (response && typeof response === 'object' && response.symbol) {
        // Response for a single symbol
        const formattedSymbol = this.formatSymbol(response.symbol);
        console.log(
          `[BinanceTestnetAdapter] Formatting single ticker for ${response.symbol} -> ${formattedSymbol}`,
        );
        return this.formatTickerStats(response, formattedSymbol);
      } else {
        console.error(
          `[BinanceTestnetAdapter] Invalid ticker response format:`,
          response,
        );
        throw new Error('Invalid ticker response format');
      }
    } catch (error) {
      console.error(
        `[BinanceTestnetAdapter] Error getting ticker stats for ${symbol || 'all pairs'}:`,
        error,
      );

      // Fall back to mock data
      console.warn(
        `[BinanceTestnetAdapter] Falling back to mock data for ${symbol || 'all pairs'}`,
      );

      if (symbol) {
        // Generate mock data for a single symbol
        return this.mockDataService.generateTickerStats(
          this.exchangeId,
          symbol,
        );
      } else {
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
    }
  }

  /** Format Binance symbol (BTCUSDT) to standard (BTC/USDT) */
  private formatSymbol(binanceSymbol: string): string {
    // Common quote assets to check first for better accuracy
    const quoteAssets = [
      'USDT',
      'BUSD',
      'TUSD',
      'USDC',
      'DAI',
      'BTC',
      'ETH',
      'BNB',
      'XRP',
      'EUR',
      'GBP',
      'AUD',
      'JPY',
      'TRY',
    ];

    for (const quote of quoteAssets) {
      if (binanceSymbol.endsWith(quote)) {
        const base = binanceSymbol.substring(
          0,
          binanceSymbol.length - quote.length,
        );
        if (base) {
          // Ensure base is not empty
          return `${base}/${quote}`;
        }
      }
    }

    // Fallback guess if no common quote asset found (less reliable)
    // Assume quote is last 3 or 4 chars, prioritize 4 if possible
    if (binanceSymbol.length > 4) {
      const base = binanceSymbol.substring(0, binanceSymbol.length - 4);
      const quote = binanceSymbol.substring(binanceSymbol.length - 4);
      return `${base}/${quote}`;
    } else if (binanceSymbol.length > 3) {
      const base = binanceSymbol.substring(0, binanceSymbol.length - 3);
      const quote = binanceSymbol.substring(binanceSymbol.length - 3);
      return `${base}/${quote}`;
    }

    return binanceSymbol; // Return original if formatting fails
  }

  /** Format raw Binance ticker response into standard TickerStats */
  private formatTickerStats(response: any, symbol: string): TickerStats {
    // Log the raw response for debugging
    console.log(
      `[BinanceTestnetAdapter] Raw ticker response for ${symbol}:`,
      response,
    );

    const safeParseFloat = (value: any): number => {
      // If value is undefined or null, return 0
      if (value === undefined || value === null) {
        return 0;
      }

      // If value is already a number, return it
      if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
      }

      // Try to parse the value as a float
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    // Check if the response is empty or invalid
    if (!response || typeof response !== 'object') {
      console.warn(
        `[BinanceTestnetAdapter] Invalid ticker response for ${symbol}, using mock data`,
      );

      // Generate mock data as a fallback
      return this.mockDataService.generateTickerStats(this.exchangeId, symbol);
    }

    // Check if the response has the expected properties
    const hasExpectedProperties =
      'lastPrice' in response &&
      'priceChange' in response &&
      'priceChangePercent' in response;

    if (!hasExpectedProperties) {
      console.warn(
        `[BinanceTestnetAdapter] Ticker response for ${symbol} is missing expected properties, using mock data`,
      );

      // Generate mock data as a fallback
      return this.mockDataService.generateTickerStats(this.exchangeId, symbol);
    }

    // Create the ticker stats object with safe parsing
    const tickerStats = {
      symbol: symbol,
      exchangeId: this.exchangeId,
      priceChange: safeParseFloat(response.priceChange),
      priceChangePercent: safeParseFloat(response.priceChangePercent),
      weightedAvgPrice: safeParseFloat(response.weightedAvgPrice),
      prevClosePrice: safeParseFloat(
        response.prevClosePrice || response.lastPrice,
      ), // Use lastPrice as fallback for prevClose
      lastPrice: safeParseFloat(response.lastPrice),
      lastQty: safeParseFloat(response.lastQty),
      bidPrice: safeParseFloat(response.bidPrice),
      bidQty: safeParseFloat(response.bidQty),
      askPrice: safeParseFloat(response.askPrice),
      askQty: safeParseFloat(response.askQty),
      openPrice: safeParseFloat(response.openPrice),
      highPrice: safeParseFloat(response.highPrice),
      lowPrice: safeParseFloat(response.lowPrice),
      volume: safeParseFloat(response.volume),
      quoteVolume: safeParseFloat(response.quoteVolume),
      openTime: response.openTime || Date.now() - 24 * 60 * 60 * 1000, // Default to 24 hours ago
      closeTime: response.closeTime || Date.now(), // Default to now
      count: response.count || 0, // Number of trades
    };

    // Log the formatted ticker stats
    console.log(
      `[BinanceTestnetAdapter] Formatted ticker stats for ${symbol}:`,
      tickerStats,
    );

    // Check if all values are zero, which might indicate an issue
    const allValuesZero =
      tickerStats.lastPrice === 0 &&
      tickerStats.highPrice === 0 &&
      tickerStats.lowPrice === 0 &&
      tickerStats.volume === 0;

    if (allValuesZero) {
      console.warn(
        `[BinanceTestnetAdapter] All ticker values are zero for ${symbol}, using mock data as fallback`,
      );

      // Generate mock data as a fallback
      return this.mockDataService.generateTickerStats(this.exchangeId, symbol);
    }

    return tickerStats;
  }

  /**
   * Get recent trades for a specific trading pair.
   */
  public async getRecentTrades(
    symbol: string,
    limit: number = 100,
  ): Promise<Trade[]> {
    try {
      const binanceSymbol = symbol.replace('/', '');
      // Define the expected response structure for a single trade
      interface TradeResponse {
        id: number;
        price: string;
        qty: string;
        quoteQty: string;
        time: number;
        isBuyerMaker: boolean;
        isBestMatch: boolean;
      }

      const response = await this.makeUnauthenticatedRequest<TradeResponse[]>(
        '/api/v3/trades', // Corrected endpoint
        { symbol: binanceSymbol, limit },
        1, // Weight: 1
      );

      return response.map((trade) => ({
        id: trade.id.toString(),
        symbol: symbol,
        price: parseFloat(trade.price),
        quantity: parseFloat(trade.qty),
        timestamp: trade.time,
        isBuyerMaker: trade.isBuyerMaker, // Include isBuyerMaker
        isBestMatch: trade.isBestMatch, // Include isBestMatch
        exchangeId: this.exchangeId, // Add exchangeId
      }));
    } catch (error) {
      console.error(`Error getting recent trades for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get Kline/candlestick data for a specific trading pair.
   */
  public async getKlines(
    symbol: string,
    interval: string, // e.g., '1m', '5m', '1h', '1d'
    startTime?: number,
    endTime?: number,
    limit: number = 500,
  ): Promise<Kline[]> {
    try {
      const binanceSymbol = symbol.replace('/', '');
      const params: Record<string, string | number> = {
        symbol: binanceSymbol,
        interval: interval,
        limit: limit,
      };
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      // Define the expected response structure for Kline data
      // [ OpenTime, Open, High, Low, Close, Volume, CloseTime, QuoteAssetVolume, NumberOfTrades, TakerBuyBaseAssetVolume, TakerBuyQuoteAssetVolume, Ignore ]
      type BinanceKlineResponse = [
        number, // Open time
        string, // Open
        string, // High
        string, // Low
        string, // Close
        string, // Volume
        number, // Close time
        string, // Quote asset volume
        number, // Number of trades
        string, // Taker buy base asset volume
        string, // Taker buy quote asset volume
        string, // Ignore
      ];

      const response = await this.makeUnauthenticatedRequest<
        BinanceKlineResponse[]
      >(
        '/api/v3/klines', // Corrected endpoint
        params,
        1, // Weight: 1
      );

      return response.map((kline) => ({
        timestamp: kline[0], // Use open time as timestamp
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        // Add other fields if needed, e.g., closeTime: kline[6], quoteVolume: parseFloat(kline[7]), trades: kline[8],
      }));
    } catch (error) {
      console.error(`Error getting klines for ${symbol} (${interval}):`, error);
      return [];
    }
  }

  /**
   * Get the user's portfolio/balances.
   * Note: This uses getAccountInfo internally as the /account endpoint provides balances.
   */
  public async getPortfolio(apiKeyId: string): Promise<Portfolio> {
    try {
      const accountInfo = await this.getAccountInfo(apiKeyId);
      const balances = Object.entries(accountInfo.balances).map(
        ([asset, balance]) => ({
          asset: asset,
          free: balance.free,
          locked: balance.locked,
          total: balance.free + balance.locked,
          usdValue: 0, // Placeholder, requires market data to calculate
          exchangeId: this.exchangeId, // Add exchangeId
          exchangeSources: [
            {
              exchangeId: this.exchangeId,
              amount: balance.free + balance.locked,
            },
          ], // Add source
        }),
      );

      return {
        exchangeId: this.exchangeId, // Add exchangeId
        totalUsdValue: 0, // Placeholder
        assets: balances,
        lastUpdated: new Date(accountInfo.updateTime || Date.now()), // Use updateTime if available
      };
    } catch (error) {
      console.error(`Error getting portfolio for ${this.exchangeId}:`, error);
      // Return empty portfolio on error
      return {
        exchangeId: this.exchangeId, // Add exchangeId
        totalUsdValue: 0,
        assets: [],
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Get detailed account information, including balances and permissions.
   * @param apiKeyId The API key ID to use for authentication.
   * @returns Normalized account information.
   */
  public async getAccountInfo(
    apiKeyId: string,
  ): Promise<NormalizedAccountInfo> {
    // Validate apiKeyId
    if (!apiKeyId) {
      const errorMsg = 'Missing apiKeyId for getAccountInfo';
      logger.error(`[${this.exchangeId}] ${errorMsg}`);
      throw new Error('API Key ID is required to fetch account information.');
    }

    logger.info(
      `[${this.exchangeId}] Fetching account info for API key: ${apiKeyId}`,
    );

    try {
      const response = await this.makeAuthenticatedRequest<BinanceAccountInfo>(
        '/api/v3/account',
        'GET',
        apiKeyId,
        {}, // No params needed for GET
        10, // Weight: 10
      );

      logger.debug(
        `[${this.exchangeId}] Received raw account info - Type: ${response.accountType}, Balances: ${response.balances.length}, Updated: ${new Date(response.updateTime).toISOString()}`,
      );

      // Normalize balances
      const normalizedBalances: Record<
        string,
        { free: number; locked: number }
      > = {};

      let nonZeroBalanceCount = 0;
      response.balances.forEach((balance) => {
        const free = parseFloat(balance.free);
        const locked = parseFloat(balance.locked);
        // Only include assets with a non-zero balance
        if (free > 0 || locked > 0) {
          normalizedBalances[balance.asset] = {
            free: isNaN(free) ? 0 : free,
            locked: isNaN(locked) ? 0 : locked,
          };
          nonZeroBalanceCount++;
        }
      });

      // Determine commission rates (prefer newer structure if available)
      let makerCommission = response.makerCommission / 10000; // Convert basis points to decimal
      let takerCommission = response.takerCommission / 10000; // Convert basis points to decimal

      if (response.commissionRates) {
        makerCommission = parseFloat(response.commissionRates.maker);
        takerCommission = parseFloat(response.commissionRates.taker);
      }

      // Update local balance cache upon fetching full account info
      this.balanceCache = { ...normalizedBalances };
      logger.info(
        `[${this.exchangeId}] Balance cache updated from getAccountInfo.`,
      );

      // Emit updates for all fetched balances
      Object.keys(this.balanceCache).forEach((asset) =>
        this.emitBalanceUpdate(asset),
      );

      const result = {
        exchangeId: this.exchangeId,
        accountType: response.accountType,
        canTrade: response.canTrade,
        canWithdraw: response.canWithdraw,
        canDeposit: response.canDeposit,
        makerCommission: isNaN(makerCommission) ? 0.001 : makerCommission, // Default if NaN
        takerCommission: isNaN(takerCommission) ? 0.001 : takerCommission, // Default if NaN
        balances: normalizedBalances,
        updateTime: response.updateTime,
        rawResponse: response, // Optionally include raw response
      };

      logger.info(
        `[${this.exchangeId}] Successfully fetched and normalized account info with ${nonZeroBalanceCount} non-zero assets`,
      );

      return result;
    } catch (error) {
      logger.error(`[${this.exchangeId}] Error fetching account info`, error);

      // Handle authentication errors specifically
      if (
        error instanceof Error &&
        (error.message.includes('Authentication failed') ||
          error.message.includes('Invalid API-key') ||
          error.message.includes('API key') ||
          error.message.includes('Signature'))
      ) {
        throw new Error(
          `Binance Testnet authentication failed. Please check your API keys for ID: ${apiKeyId}. Original error: ${error.message}`,
        );
      }

      // Handle Binance API errors with error codes
      if (
        error instanceof Error &&
        error.message.includes('Binance API error')
      ) {
        throw error; // Pass through formatted API errors
      }

      // Generic error handling
      throw new Error(
        `Failed to fetch account info from Binance Testnet: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Place a new order.
   */
  public async placeOrder(
    apiKeyId: string,
    order: Partial<Order>, // Use Partial<Order> to allow flexibility before full validation
  ): Promise<Order> {
    // Basic validation
    if (
      !order.symbol ||
      !order.side ||
      !order.type ||
      (!order.quantity && !order.quoteOrderQty)
    ) {
      throw new Error(
        'Missing required order parameters: symbol, side, type, and quantity or quoteOrderQty.',
      );
    }
    if (order.type === OrderType.LIMIT && !order.price) {
      throw new Error('Price is required for LIMIT orders.');
    }
    if (
      order.type === OrderType.MARKET &&
      order.quantity &&
      order.quoteOrderQty
    ) {
      throw new Error(
        'Cannot specify both quantity and quoteOrderQty for MARKET orders.',
      );
    }
    if (
      (order.type === OrderType.STOP_LIMIT ||
        order.type === OrderType.STOP_MARKET) &&
      !order.stopPrice
    ) {
      throw new Error(
        'stopPrice is required for STOP_LIMIT and STOP_MARKET orders.',
      );
    }

    // Ensure exchange info is loaded for checks
    await this.ensureExchangeInfoCached();
    if (!this.cachedExchangeInfo) {
      // Should have been thrown by ensureExchangeInfoCached, but double-check
      throw new Error(
        'Exchange information is not available for limit checks.',
      );
    }

    const symbolInfo = this.cachedExchangeInfo.symbols.find(
      (s: any) => s.symbol === order.symbol?.replace('/', ''), // Ensure symbol format matches exchange info
    );

    if (!symbolInfo) {
      throw new Error(
        `Trading rules/limits not found for symbol: ${order.symbol}. Cannot place order.`,
      );
    }

    // --- Trading Limits Checking ---
    const { quantity, price, type, symbol, quoteOrderQty } = order;
    // Use Big.js for quantity and price from the start if they exist
    const quantityBig = quantity ? new Big(quantity) : undefined;
    const priceBig = price ? new Big(price) : undefined;

    // Find relevant filters (handle potential missing filters)
    const priceFilter = symbolInfo.filters.find(
      (f: any) => f.filterType === 'PRICE_FILTER',
    );
    const lotSizeFilter = symbolInfo.filters.find(
      (f: any) => f.filterType === 'LOT_SIZE',
    );
    // Binance uses NOTIONAL or MIN_NOTIONAL depending on the API/version/symbol
    const notionalFilter = symbolInfo.filters.find(
      (f: any) =>
        f.filterType === 'NOTIONAL' || f.filterType === 'MIN_NOTIONAL',
    );
    const marketLotSizeFilter = symbolInfo.filters.find(
      (f: any) => f.filterType === 'MARKET_LOT_SIZE',
    ); // Check for market-specific lot size

    // Determine which lot size filter to use
    const applicableLotSizeFilter =
      type === OrderType.MARKET && marketLotSizeFilter
        ? marketLotSizeFilter
        : lotSizeFilter;

    // --- Quantity Checks (LOT_SIZE or MARKET_LOT_SIZE) ---
    // Only check quantity if it's provided (MARKET orders might use quoteOrderQty)
    if (quantityBig && applicableLotSizeFilter) {
      const minQty = new Big(applicableLotSizeFilter.minQty);
      const maxQty = new Big(applicableLotSizeFilter.maxQty);
      const stepSize = new Big(applicableLotSizeFilter.stepSize);

      if (quantityBig.lt(minQty)) {
        throw new Error(
          `Order quantity (${quantityBig.toString()}) is less than the minimum allowed (${minQty.toString()}) for ${symbol}.`,
        );
      }
      if (quantityBig.gt(maxQty)) {
        throw new Error(
          `Order quantity (${quantityBig.toString()}) is greater than the maximum allowed (${maxQty.toString()}) for ${symbol}.`,
        );
      }
      // Check step size using Big.js for precision
      if (stepSize.gt(0)) {
        // Check if (quantity - minQty) is a multiple of stepSize
        const remainder = quantityBig.minus(minQty).mod(stepSize);
        // Use a small tolerance for floating point comparisons
        const tolerance = new Big(1e-9); // Adjust tolerance if needed
        if (
          remainder.abs().gt(tolerance) &&
          stepSize.minus(remainder.abs()).gt(tolerance)
        ) {
          throw new Error(
            `Order quantity (${quantityBig.toString()}) does not meet the step size (${stepSize.toString()}) requirement for ${symbol}. Quantity must be a multiple of stepSize starting from minQty.`,
          );
        }
      }
    } else if (quantityBig && !applicableLotSizeFilter) {
      logger.warn(
        `[${this.exchangeId}] Applicable LOT_SIZE filter not found for symbol ${symbol} and order type ${type}. Skipping quantity checks.`,
      );
    }

    // --- Price Checks (PRICE_FILTER) --- - Only for orders with a price (LIMIT, STOP_LIMIT)
    if (
      priceBig &&
      (type === OrderType.LIMIT || type === OrderType.STOP_LIMIT)
    ) {
      if (priceFilter) {
        const minPrice = new Big(priceFilter.minPrice);
        const maxPrice = new Big(priceFilter.maxPrice);
        const tickSize = new Big(priceFilter.tickSize);

        if (minPrice.gt(0) && priceBig.lt(minPrice)) {
          // Check minPrice > 0 as it can be 0
          throw new Error(
            `Order price (${priceBig.toString()}) is less than the minimum allowed (${minPrice.toString()}) for ${symbol}.`,
          );
        }
        if (maxPrice.gt(0) && priceBig.gt(maxPrice)) {
          // Check maxPrice > 0 as it might be unset (0 or large number)
          throw new Error(
            `Order price (${priceBig.toString()}) is greater than the maximum allowed (${maxPrice.toString()}) for ${symbol}.`,
          );
        }
        // Check tick size using Big.js for precision
        if (tickSize.gt(0)) {
          // Check if (price - minPrice) is a multiple of tickSize
          const remainder = priceBig.minus(minPrice).mod(tickSize);
          // Use a small tolerance for floating point comparisons
          const tolerance = new Big(1e-9); // Adjust tolerance if needed
          if (
            remainder.abs().gt(tolerance) &&
            tickSize.minus(remainder.abs()).gt(tolerance)
          ) {
            throw new Error(
              `Order price (${priceBig.toString()}) does not meet the tick size (${tickSize.toString()}) requirement for ${symbol}. Price must be a multiple of tickSize starting from minPrice.`,
            );
          }
        }
      } else {
        logger.warn(
          `[${this.exchangeId}] PRICE_FILTER not found for symbol ${symbol}. Skipping price checks.`,
        );
      }
    }

    // --- Notional Value Check (NOTIONAL / MIN_NOTIONAL) ---
    // Apply check if filter exists. For LIMIT orders, use price * quantity.
    // For MARKET orders using quoteOrderQty, the check might be implicitly handled by Binance or use quoteOrderQty directly.
    // For MARKET orders using quantity, the actual notional value depends on the execution price.
    if (notionalFilter) {
      const minNotionalValueStr =
        notionalFilter.minNotional ?? notionalFilter.notional;
      if (minNotionalValueStr !== undefined) {
        const minNotional = new Big(minNotionalValueStr);

        if (type === OrderType.LIMIT && priceBig && quantityBig) {
          const notionalValue = quantityBig.times(priceBig);
          if (notionalValue.lt(minNotional)) {
            throw new Error(
              `Order notional value (${notionalValue.toFixed(8)}) is less than the minimum required (${minNotional.toString()}) for ${symbol}.`,
            );
          }
        } else if (type === OrderType.MARKET && quoteOrderQty) {
          const quoteOrderQtyBig = new Big(quoteOrderQty);
          // Check if quoteOrderQty itself meets minNotional, as it represents the target spending/receiving amount
          if (quoteOrderQtyBig.lt(minNotional)) {
            throw new Error(
              `Order quoteOrderQty (${quoteOrderQtyBig.toString()}) is less than the minimum notional value required (${minNotional.toString()}) for ${symbol}.`,
            );
          }
        } else if (type === OrderType.MARKET && quantityBig) {
          // For MARKET orders with quantity, the 'applyMinToMarket' flag determines if the check applies.
          // Pre-checking is difficult as the execution price isn't known.
          const applyMin =
            notionalFilter.applyMinToMarket ?? notionalFilter.applyToMarket; // Check flags
          if (applyMin) {
            logger.warn(
              `[${this.exchangeId}] MIN_NOTIONAL check might apply to this MARKET order for ${symbol} based on quantity, but pre-check requires execution price. Order might fail at execution if value is too low.`,
            );
          } else {
            logger.info(
              `[${this.exchangeId}] MIN_NOTIONAL check does not apply to MARKET orders (by quantity) for ${symbol} according to filter rules.`,
            );
          }
        }
        // Note: Binance 'NOTIONAL' filter might also have maxNotional. Add checks if needed.
      } else {
        logger.warn(
          `[${this.exchangeId}] Could not determine minNotional value from filter for symbol ${symbol}. Skipping notional check.`,
        );
      }
    } else {
      logger.warn(
        `[${this.exchangeId}] MIN_NOTIONAL/NOTIONAL filter not found for symbol ${symbol}. Skipping notional value check.`,
      );
    }

    // --- End Trading Limits Checking ---
    // Prepare parameters for Binance API
    try {
      const binanceSymbol = order.symbol.replace('/', ''); // Use the validated symbol
      const params: Record<string, string | number> = {
        symbol: binanceSymbol,
        side: order.side.toUpperCase(), // 'BUY' or 'SELL'
      };

      // Map order type and add specific parameters
      switch (order.type) {
        case OrderType.MARKET: // Use enum
          params.type = 'MARKET';
          if (order.quoteOrderQty) {
            params.quoteOrderQty = order.quoteOrderQty;
          } else if (order.quantity) {
            params.quantity = order.quantity;
          } // Validation already ensured one exists
          break;
        case OrderType.LIMIT: // Use enum
          params.type = 'LIMIT';
          params.price = order.price; // Already validated
          params.quantity = order.quantity; // Already validated
          params.timeInForce = order.timeInForce || TimeInForce.GTC; // Use enum and default
          break;
        case OrderType.STOP_LIMIT: // Use enum
          params.type = 'STOP_LOSS_LIMIT'; // Binance uses STOP_LOSS_LIMIT for both buy/sell stop limits
          params.price = order.price; // Already validated
          params.stopPrice = order.stopPrice; // Already validated
          params.quantity = order.quantity; // Already validated
          params.timeInForce = order.timeInForce || TimeInForce.GTC; // Use enum and default
          break;
        case OrderType.STOP_MARKET: // Use enum
          // Binance uses STOP_LOSS for sell stops and TAKE_PROFIT_MARKET for buy stops
          params.type =
            order.side === 'sell' ? 'STOP_LOSS' : 'TAKE_PROFIT_MARKET';
          params.stopPrice = order.stopPrice; // Already validated
          params.quantity = order.quantity; // Already validated
          // TimeInForce is not typically used with STOP_LOSS/TAKE_PROFIT_MARKET
          break;
        default:
          // Should not happen due to initial validation, but good practice
          throw new Error(`Unsupported order type: ${order.type}`);
      }

      // Add clientOrderId if provided
      if (order.clientOrderId) {
        params.newClientOrderId = order.clientOrderId;
      }

      // Define expected response structure
      interface BinanceOrderResponse {
        symbol: string;
        orderId: number;
        orderListId: number; // -1 if not part of an OCO
        clientOrderId: string;
        transactTime: number;
        price: string;
        origQty: string;
        executedQty: string;
        cummulativeQuoteQty: string; // Correct spelling might be cumulative
        status: string;
        timeInForce: string;
        type: string;
        side: string;
        // Optional fields for fills
        fills?: Array<{
          price: string;
          qty: string;
          commission: string;
          commissionAsset: string;
          tradeId: number;
        }>;
      }

      const response =
        await this.makeAuthenticatedRequest<BinanceOrderResponse>(
          '/api/v3/order', // Corrected endpoint
          'POST',
          apiKeyId,
          params,
          1, // Weight: 1
        );

      // Format the response into our standard Order type
      return {
        id: response.orderId.toString(),
        clientOrderId: response.clientOrderId,
        exchangeId: this.exchangeId, // Add exchangeId
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        status: this.mapOrderStatus(response.status),
        price: parseFloat(response.price),
        quantity: parseFloat(response.origQty),
        executed: parseFloat(response.executedQty), // Map executedQty to executed
        remaining:
          parseFloat(response.origQty) - parseFloat(response.executedQty), // Calculate remaining
        cost: parseFloat(response.cummulativeQuoteQty), // Map cummulativeQuoteQty to cost
        timestamp: response.transactTime, // Use creation time
        lastUpdated: response.transactTime, // Use creation time for lastUpdated initially
        // timeInForce: response.timeInForce as TimeInForce, // Include if applicable and mapped
        // stopPrice: order.stopPrice, // Include if applicable
        // quoteOrderQty: order.quoteOrderQty, // Include if applicable
        // Add fill details if needed from response.fills
      };
    } catch (error) {
      console.error(`Error placing order for ${order.symbol}:`, error);
      // Try to parse Binance error response
      let errorMessage = `Failed to place order: ${error instanceof Error ? error.message : String(error)}`;
      if (axios.isAxiosError(error) && error.response?.data?.msg) {
        errorMessage = `Failed to place order: ${error.response.data.msg} (Code: ${error.response.data.code})`;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Cancel an existing order.
   */
  public async cancelOrder(
    apiKeyId: string,
    orderId: string,
    symbol: string, // Binance requires symbol for cancellation
    clientOrderId?: string, // Optional: Use clientOrderId for cancellation
  ): Promise<boolean> {
    // Changed return type to Promise<boolean>
    try {
      const binanceSymbol = symbol.replace('/', '');
      const params: Record<string, string | number> = {
        symbol: binanceSymbol,
      };

      if (clientOrderId) {
        params.origClientOrderId = clientOrderId;
      } else {
        params.orderId = parseInt(orderId, 10); // Binance expects integer orderId
        if (isNaN(params.orderId as number)) {
          throw new Error('Invalid orderId format for cancellation.');
        }
      }

      // Define expected response structure (may vary slightly)
      interface CancelResponse {
        symbol: string;
        origClientOrderId?: string;
        orderId?: number;
        orderListId: number;
        clientOrderId: string; // This is the cancel request's ID, not the original order's
        price: string;
        origQty: string;
        executedQty: string;
        cummulativeQuoteQty: string;
        status: string;
        timeInForce: string;
        type: string;
        side: string;
      }

      const response = await this.makeAuthenticatedRequest<CancelResponse>(
        '/api/v3/order', // Corrected endpoint
        'DELETE',
        apiKeyId,
        params,
        1, // Weight: 1
      );

      // Check response status to confirm cancellation
      // Binance returns the details of the cancelled order upon success
      if (
        response &&
        (response.status === 'CANCELED' || response.status === 'EXPIRED')
      ) {
        return true; // Return true on success
      } else {
        // This case might indicate the order was already filled or didn't exist
        logger.warn(
          `Cancel order request for ${orderId} returned status: ${response?.status}. Assuming success if no error was thrown.`,
        );
        // Consider it potentially successful if no error was thrown, but log warning
        return true; // Return true even in this ambiguous case
      }
    } catch (error) {
      console.error(`Error canceling order ${orderId} for ${symbol}:`, error);
      // Try to parse Binance error response
      if (axios.isAxiosError(error) && error.response?.data?.msg) {
        // Example: {"code":-2011,"msg":"Unknown order sent."}
        const errorMsg = `Failed to cancel order: ${error.response.data.msg} (Code: ${error.response.data.code})`;
        logger.error(errorMsg);

        if (error.response.data.code === -2011) {
          // Order doesn't exist (already filled or cancelled) - treat as success?
          logger.warn(
            `Attempted to cancel non-existent/filled order ${orderId}. Treating as success.`,
          );
          return true; // Return true if order already gone
        }
      } else {
        logger.error(
          `Failed to cancel order: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      // Return failure
      return false; // Return false on error
    }
  }

  /**
   * Get all open orders for a specific trading pair or all pairs.
   */
  public async getOpenOrders(
    apiKeyId: string,
    symbol?: string,
  ): Promise<Order[]> {
    try {
      const params: Record<string, string> = {};
      if (symbol) {
        params.symbol = symbol.replace('/', '');
      }

      // Define expected response structure for open orders
      interface BinanceOrder {
        symbol: string;
        orderId: number;
        orderListId: number;
        clientOrderId: string;
        price: string;
        origQty: string;
        executedQty: string;
        cummulativeQuoteQty: string;
        status: string;
        timeInForce: string;
        type: string;
        side: string;
        stopPrice: string;
        icebergQty: string;
        time: number; // Order creation time
        updateTime: number; // Last update time
        isWorking: boolean;
        origQuoteOrderQty: string;
      }

      const response = await this.makeAuthenticatedRequest<BinanceOrder[]>(
        '/api/v3/openOrders', // Corrected endpoint
        'GET',
        apiKeyId,
        params,
        symbol ? 3 : 40, // Weight: 3 for single symbol, 40 for all
      );

      return response.map((order) => ({
        id: order.orderId.toString(),
        clientOrderId: order.clientOrderId,
        exchangeId: this.exchangeId, // Add exchangeId
        symbol: this.formatSymbol(order.symbol),
        side: order.side.toLowerCase() as 'buy' | 'sell',
        type: order.type.toLowerCase() as OrderType,
        status: this.mapOrderStatus(order.status),
        price: parseFloat(order.price),
        quantity: parseFloat(order.origQty),
        executed: parseFloat(order.executedQty), // Map executedQty to executed
        remaining: parseFloat(order.origQty) - parseFloat(order.executedQty), // Calculate remaining
        cost: parseFloat(order.cummulativeQuoteQty), // Map cummulativeQuoteQty to cost
        timestamp: order.time, // Use creation time as primary timestamp
        lastUpdated: order.updateTime, // Use update time
        timeInForce: order.timeInForce as TimeInForce,
        stopPrice: parseFloat(order.stopPrice) || undefined, // Include stop price if present
      }));
    } catch (error) {
      console.error(
        `Error getting open orders for ${symbol || 'all pairs'}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Get order history for a specific trading pair.
   */
  public async getOrderHistory(
    apiKeyId: string,
    symbol: string,
    limit: number = 500,
    startTime?: number,
    endTime?: number,
    fromOrderId?: string, // Fetch orders starting from this order ID
  ): Promise<Order[]> {
    try {
      const binanceSymbol = symbol.replace('/', '');
      const params: Record<string, string | number> = {
        symbol: binanceSymbol,
        limit: limit > 1000 ? 1000 : limit, // Max limit 1000
      };
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;
      if (fromOrderId) params.orderId = parseInt(fromOrderId, 10); // Binance uses 'orderId' for this param

      // Define expected response structure (same as open orders)
      interface BinanceOrder {
        symbol: string;
        orderId: number;
        orderListId: number;
        clientOrderId: string;
        price: string;
        origQty: string;
        executedQty: string;
        cummulativeQuoteQty: string;
        status: string;
        timeInForce: string;
        type: string;
        side: string;
        stopPrice: string;
        icebergQty: string;
        time: number; // Order creation time
        updateTime: number; // Last update time
        isWorking: boolean;
        origQuoteOrderQty: string;
      }

      const response = await this.makeAuthenticatedRequest<BinanceOrder[]>(
        '/api/v3/allOrders', // Corrected endpoint
        'GET',
        apiKeyId,
        params,
        10, // Weight: 10
      );

      return response.map((order) => ({
        id: order.orderId.toString(),
        clientOrderId: order.clientOrderId,
        exchangeId: this.exchangeId, // Add exchangeId
        symbol: this.formatSymbol(order.symbol),
        side: order.side.toLowerCase() as 'buy' | 'sell',
        type: order.type.toLowerCase() as OrderType,
        status: this.mapOrderStatus(order.status),
        price: parseFloat(order.price),
        quantity: parseFloat(order.origQty),
        executed: parseFloat(order.executedQty), // Map executedQty to executed
        remaining: parseFloat(order.origQty) - parseFloat(order.executedQty), // Calculate remaining
        cost: parseFloat(order.cummulativeQuoteQty), // Map cummulativeQuoteQty to cost
        timestamp: order.time, // Use creation time
        lastUpdated: order.updateTime, // Use update time
        timeInForce: order.timeInForce as TimeInForce,
        stopPrice: parseFloat(order.stopPrice) || undefined,
      }));
    } catch (error) {
      console.error(`Error getting order history for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get performance metrics (not directly supported by Binance API, needs calculation).
   */
  public async getPerformanceMetrics(
    _apiKeyId: string, // Prefix with underscore to indicate it's unused
  ): Promise<PerformanceMetrics> {
    // Requires fetching order history, trades, and potentially balance snapshots
    // to calculate metrics like PnL, win rate, etc.
    console.warn(
      'getPerformanceMetrics is not implemented for BinanceTestnetAdapter',
    );
    return {
      exchangeId: this.exchangeId, // Add exchangeId
      roi: 0, // Placeholder
      profitLoss: 0, // Corrected typo
      winRate: 0,
      trades: 0, // Total number of trades
      drawdown: 0, // Maximum drawdown (%)
      sharpeRatio: 0, // Requires risk-free rate and return volatility
      period: {
        // Add period
        start: new Date(0),
        end: new Date(),
      },
    };
  }

  // --- User Data Stream Methods ---

  /**
   * Fetches a new listenKey from Binance to start a user data stream.
   * @param apiKeyId The API key ID to use for authentication.
   * @returns The listenKey string.
   * @throws Error if the listenKey cannot be obtained.
   */
  private async _getListenKey(apiKeyId: string): Promise<string> {
    logger.info(`[${this.exchangeId}] Fetching new listenKey...`);
    try {
      const response = await this.makeAuthenticatedRequest<{
        listenKey: string;
      }>(
        '/api/v3/userDataStream',
        'POST',
        apiKeyId,
        {}, // No params needed for POST
        1, // Weight: 1
      );
      if (!response || !response.listenKey) {
        throw new Error('Invalid response format when fetching listenKey');
      }
      logger.info(
        `[${this.exchangeId}] Obtained listenKey: ${response.listenKey.substring(0, 10)}...`,
      );
      return response.listenKey;
    } catch (error) {
      logger.error(`[${this.exchangeId}] Failed to get listenKey:`, error);
      throw new Error(
        `Failed to obtain listenKey: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Sends a keep-alive request for the current listenKey.
   * Binance requires this every 60 minutes. We'll do it every 30 minutes.
   * @throws Error if the keep-alive request fails.
   */
  private async _keepListenKeyAlive(): Promise<void> {
    if (!this.listenKey || !this.currentApiKeyId) {
      logger.warn(
        `[${this.exchangeId}] Cannot keep listenKey alive: listenKey or apiKeyId missing.`,
      );
      // Attempt to reconnect if essential components are missing
      this.disconnect();
      this.connectUserDataStream().catch((err) => {
        logger.error(
          `[${this.exchangeId}] Failed to reconnect user data stream after missing key components during keep-alive:`,
          err,
        );
      });
      return;
    }
    logger.debug(
      `[${this.exchangeId}] Sending keep-alive for listenKey: ${this.listenKey.substring(0, 10)}...`,
    );
    try {
      await this.makeAuthenticatedRequest<{}>(
        '/api/v3/userDataStream',
        'PUT',
        this.currentApiKeyId,
        { listenKey: this.listenKey },
        1, // Weight: 1
      );
      logger.debug(`[${this.exchangeId}] listenKey keep-alive successful.`);
    } catch (error) {
      logger.error(
        `[${this.exchangeId}] Failed to keep listenKey alive:`,
        error,
      );
      // If keep-alive fails, the key might be expired. We should attempt to reconnect.
      this.disconnect(); // Disconnect the current stream
      this.connectUserDataStream().catch((err) => {
        logger.error(
          `[${this.exchangeId}] Failed to reconnect user data stream after keep-alive failure:`,
          err,
        );
      });
      // Don't throw here, as reconnect is attempted. Let the reconnect handle errors.
      // throw new Error(`Failed to keep listenKey alive: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Establishes the WebSocket connection for the user data stream.
   * Handles fetching the listenKey, connecting via WebSocketManager, and setting up keep-alive.
   * @param apiKeyId Optional API key ID. If not provided, uses the stored `currentApiKeyId`.
   */
  public async connectUserDataStream(apiKeyId?: string): Promise<void> {
    if (this.isConnectingUserDataStream) {
      logger.warn(
        `[${this.exchangeId}] User data stream connection already in progress.`,
      );
      return;
    }
    // Use provided apiKeyId or the currently stored one
    const targetApiKeyId = apiKeyId || this.currentApiKeyId;

    if (!targetApiKeyId) {
      logger.error(
        `[${this.exchangeId}] Cannot connect user data stream: API Key ID is missing.`,
      );
      throw new Error('API Key ID is required to connect user data stream.');
    }

    // Check if already connected with the *same* API key
    if (
      this.listenKey &&
      this.currentApiKeyId === targetApiKeyId &&
      this.userDataStreamId
    ) {
      // Verify connection status with WebSocketManager if possible
      const status = this.webSocketManager.getConnectionStatus(
        this.userDataStreamId,
      );
      if (status === 'connected' || status === 'connecting') {
        logger.info(
          `[${this.exchangeId}] User data stream already connected or connecting for API key ${targetApiKeyId}.`,
        );
        return;
      } else {
        logger.warn(
          `[${this.exchangeId}] Stream ID exists but status is ${status}. Attempting to reconnect.`,
        );
        this.disconnect(); // Clean up potentially stale state before reconnecting
      }
    }

    // If connecting with a *different* API key, disconnect the old one first
    if (this.listenKey && this.currentApiKeyId !== targetApiKeyId) {
      logger.info(
        `[${this.exchangeId}] API key changed. Disconnecting previous user data stream (${this.currentApiKeyId}) before connecting new one (${targetApiKeyId}).`,
      );
      this.disconnect();
    }

    this.isConnectingUserDataStream = true;
    this.currentApiKeyId = targetApiKeyId; // Store the key ID being used

    try {
      logger.info(
        `[${this.exchangeId}] Connecting user data stream for API Key ID: ${this.currentApiKeyId}`,
      );
      this.listenKey = await this._getListenKey(this.currentApiKeyId);

      const wsUrl = `${this.wsBaseUrl}/${this.listenKey}`;
      // Use a consistent but unique ID based on exchange and API key ID
      this.userDataStreamId = `${this.exchangeId}_userdata_${this.currentApiKeyId}`;

      logger.info(
        `[${this.exchangeId}] Creating WebSocket connection to: ${wsUrl} with Stream ID: ${this.userDataStreamId}`,
      );
      this.webSocketManager.createConnection(this.userDataStreamId, wsUrl);

      logger.info(
        `[${this.exchangeId}] Subscribing to user data stream with ID: ${this.userDataStreamId}`,
      );
      // Ensure we unsubscribe previous listener if ID somehow existed before connection creation
      try {
        this.webSocketManager.unsubscribe(this.userDataStreamId);
      } catch (e) {
        /* Ignore if no subscription existed */
      }

      this.webSocketManager.subscribe(
        this.userDataStreamId,
        'userdata',
        { listenKey: this.listenKey }, // Pass listenKey in params for potential future use
        this.handleUserDataMessage.bind(this), // Bind 'this' context
      );

      // Clear previous interval if any
      if (this.listenKeyRefreshInterval)
        clearInterval(this.listenKeyRefreshInterval);
      // Set up keep-alive interval (every 30 minutes)
      this.listenKeyRefreshInterval = setInterval(
        () => {
          this._keepListenKeyAlive().catch((error) => {
            // Error logging and reconnect attempt is handled within _keepListenKeyAlive
            logger.error(
              `[${this.exchangeId}] Uncaught error during scheduled listenKey keep-alive execution:`,
              error,
            );
          });
        },
        30 * 60 * 1000,
      ); // 30 minutes

      // Initial balance fetch and start reconciliation
      await this.reconcileBalances(); // Fetch initial balances
      this.startReconciliation(); // Start periodic reconciliation

      logger.info(
        `[${this.exchangeId}] User data stream connected successfully for API Key ${this.currentApiKeyId}.`,
      );
      this.eventEmitter.emit('userDataStreamConnected', {
        exchangeId: this.exchangeId,
        apiKeyId: this.currentApiKeyId,
      });
    } catch (error) {
      logger.error(
        `[${this.exchangeId}] Failed to connect user data stream for API Key ${this.currentApiKeyId}:`,
        error,
      );
      this.listenKey = null; // Clear listenKey on failure
      // Don't clear currentApiKeyId here, allow retry attempts
      this.eventEmitter.emit('userDataStreamError', {
        exchangeId: this.exchangeId,
        apiKeyId: this.currentApiKeyId,
        error,
      });
      // Clean up intervals if connection failed partway through
      if (this.listenKeyRefreshInterval)
        clearInterval(this.listenKeyRefreshInterval);
      this.stopReconciliation();
      throw error; // Re-throw the error
    } finally {
      this.isConnectingUserDataStream = false;
    }
  }

  /**
   * Handles incoming messages from the user data WebSocket stream.
   * This method is the callback registered with WebSocketManager.
   * @param message The raw WebSocket message data.
   */
  private handleUserDataMessage(message: any): void {
    // logger.debug(`[${this.exchangeId}] Received user data message:`, message); // Log raw message if needed
    try {
      if (!message || !message.e) {
        // Handle potential non-JSON messages or ping frames if necessary
        // logger.warn(`[${this.exchangeId}] Received invalid user data message format or non-event message:`, message);
        return;
      }

      switch (message.e) {
        case 'balanceUpdate':
          this._handleBalanceUpdate(message as BalanceUpdatePayload);
          break;
        case 'outboundAccountPosition':
          // This provides a snapshot of balances, useful for initial sync or recovery
          this._handleAccountPositionUpdate(
            message as OutboundAccountPositionPayload,
          );
          break;
        case 'executionReport':
          // Order updates, potentially affecting locked balances
          this._handleExecutionReport(message); // Define this method later
          break;
        default:
          logger.debug(
            `[${this.exchangeId}] Unhandled user data event type: ${message.e}`,
          );
      }
    } catch (error) {
      // Corrected logger call: Pass error and message in context object
      logger.error(
        `[${this.exchangeId}] Error processing user data message: ${error instanceof Error ? error.message : String(error)}`,
        message,
      );
    }
  }

  /**
   * Processes the 'balanceUpdate' event from the WebSocket stream.
   * Updates the local balance cache for a single asset based on the delta.
   * @param payload The balanceUpdate message payload.
   */
  private _handleBalanceUpdate(payload: BalanceUpdatePayload): void {
    const asset = payload.a;
    const delta = parseFloat(payload.d);
    const currentBalance = this.balanceCache[asset] || { free: 0, locked: 0 };

    // IMPORTANT: Binance 'balanceUpdate' provides the *delta*, not the new total.
    // It typically reflects changes to the 'free' balance due to deposits, withdrawals, etc.
    // It does NOT reflect changes due to trading (those come via executionReport).
    // We assume this delta applies to the 'free' balance.
    const newFree = currentBalance.free + delta;

    logger.info(
      `[${this.exchangeId}] Balance Update (Delta): Asset=${asset}, Delta=${delta}, New Free=${newFree.toFixed(8)}`,
    );

    this.balanceCache[asset] = {
      ...currentBalance,
      free: Math.max(0, newFree), // Ensure free doesn't go negative
    };

    // Emit balance update event
    this.emitBalanceUpdate(asset);
  }

  /**
   * Processes the 'outboundAccountPosition' event from the WebSocket stream.
   * Updates the entire balance cache based on the snapshot provided.
   * This is crucial for initial synchronization and recovery after disconnects.
   * @param payload The outboundAccountPosition message payload.
   */
  private _handleAccountPositionUpdate(
    payload: OutboundAccountPositionPayload,
  ): void {
    logger.info(
      `[${this.exchangeId}] Received Account Position Update (Snapshot) at ${payload.E}`,
    );
    let updated = false;
    const snapshotBalances: Record<string, { free: number; locked: number }> =
      {};

    payload.B.forEach((balanceInfo) => {
      const asset = balanceInfo.a;
      const free = parseFloat(balanceInfo.f);
      const locked = parseFloat(balanceInfo.l);
      if (isNaN(free) || isNaN(locked)) {
        logger.warn(
          `[${this.exchangeId}] Invalid balance number in snapshot for ${asset}: free=${balanceInfo.f}, locked=${balanceInfo.l}`,
        );
        return;
      }
      // Only include assets with non-zero balance in the snapshot representation
      if (free > 0 || locked > 0) {
        snapshotBalances[asset] = { free, locked };
      }

      const cached = this.balanceCache[asset];
      if (!cached || cached.free !== free || cached.locked !== locked) {
        logger.info(
          `[${this.exchangeId}] Updating balance from snapshot: Asset=${asset}, Free=${free.toFixed(8)}, Locked=${locked.toFixed(8)} (Cache: Free=${cached?.free.toFixed(8)}, Locked=${cached?.locked.toFixed(8)})`,
        );
        this.balanceCache[asset] = { free, locked };
        this.emitBalanceUpdate(asset); // Emit for each changed asset
        updated = true;
      }
    });

    // Check for assets in cache that are NOT in the snapshot (meaning they are now zero)
    for (const asset in this.balanceCache) {
      if (!(asset in snapshotBalances)) {
        // Only log/emit if the cached balance wasn't already zero
        if (
          this.balanceCache[asset].free > 1e-9 ||
          this.balanceCache[asset].locked > 1e-9
        ) {
          logger.info(
            `[${this.exchangeId}] Asset ${asset} zeroed in REST response (was F:${this.balanceCache[asset].free.toFixed(8)}, L:${this.balanceCache[asset].locked.toFixed(8)}). Removing from cache.`,
          );
          this.emitBalanceUpdate(asset, { free: 0, locked: 0 }); // Emit zero balance
          updated = true; // Mark as updated
        }
        delete this.balanceCache[asset];
      }
    }

    if (updated) {
      logger.info(
        `[${this.exchangeId}] Balance cache updated from account position snapshot.`,
      );
      // Optionally emit a full snapshot event if needed by consumers
      // this.eventEmitter.emit('balanceSnapshot', { exchangeId: this.exchangeId, balances: this.getBalanceCache() });
    } else {
      logger.debug(
        `[${this.exchangeId}] Account position snapshot matched cache. No updates needed.`,
      );
    }
  }

  /**
   * Processes the 'executionReport' event from the WebSocket stream.
   * Updates locked/free balances based on order status changes (NEW, FILLED, CANCELED, etc.).
   * @param payload The executionReport message payload.
   */
  private _handleExecutionReport(payload: any): void {
    // This is crucial for accurate available balance tracking.
    // Needs careful implementation based on Binance executionReport fields.
    // See: https://binance-docs.github.io/apidocs/spot/en/#payload-order-update

    const symbol = this.formatSymbol(payload.s); // BTC/USDT
    const baseAsset = symbol.split('/')[0];
    const quoteAsset = symbol.split('/')[1];

    if (!baseAsset || !quoteAsset) {
      logger.error(
        `[${this.exchangeId}] Could not parse base/quote asset from symbol: ${payload.s}`,
      );
      return;
    }

    const orderStatus = payload.X; // Order status (e.g., NEW, FILLED, CANCELED)
    const orderSide = payload.S; // BUY or SELL
    const orderType = payload.o; // LIMIT, MARKET, etc.
    const quantity = parseFloat(payload.q); // Original order quantity
    const price = parseFloat(payload.p); // Order price (for LIMIT orders)
    // const stopPrice = parseFloat(payload.P); // Stop price - commented out as unused
    const lastExecutedQuantity = parseFloat(payload.l); // Quantity of the last fill
    const cumulativeFilledQuantity = parseFloat(payload.z); // Total filled quantity for the order
    const lastExecutedPrice = parseFloat(payload.L); // Price of the last fill
    const commissionAmount = parseFloat(payload.n); // Commission amount
    const commissionAsset = payload.N; // Asset commission was paid in
    const orderTime = payload.T; // Transaction time (for the event)
    const orderId = payload.i; // Order ID

    logger.debug(
      `[${this.exchangeId}] Execution Report: ID=${orderId}, Symbol=${symbol}, Status=${orderStatus}, Side=${orderSide}, LastFillQty=${lastExecutedQuantity.toFixed(8)}, CumulQty=${cumulativeFilledQuantity.toFixed(8)}`,
    );

    // --- Balance Update Logic ---
    let baseAssetChanged = false;
    let quoteAssetChanged = false;
    let commissionAssetChanged = false;

    const currentBaseBalance = this.balanceCache[baseAsset] || {
      free: 0,
      locked: 0,
    };
    const currentQuoteBalance = this.balanceCache[quoteAsset] || {
      free: 0,
      locked: 0,
    };

    // Note: This logic assumes the executionReport arrives *after* the action
    // (e.g., after NEW order confirmation, after a fill occurs).
    // It adjusts the *current* cache based on the event's implications.

    if (orderStatus === 'NEW') {
      // Lock funds when a new order is placed
      if (orderSide === 'BUY') {
        // Lock quote asset
        // For LIMIT: lock price * quantity
        // For MARKET: This is tricky. Binance might lock estimated cost or max possible.
        // We'll lock price * quantity for LIMIT, and rely on reconciliation/snapshot for MARKET accuracy initially.
        // A better approach for MARKET might be to lock a % of free balance or use quoteOrderQty if available.
        const amountToLock =
          orderType === 'LIMIT' ||
          orderType === 'STOP_LOSS_LIMIT' ||
          orderType === 'TAKE_PROFIT_LIMIT'
            ? quantity * price
            : 0; // Don't try to guess market lock, wait for snapshot/fill report

        if (amountToLock > 0 && currentQuoteBalance.free >= amountToLock) {
          this.balanceCache[quoteAsset] = {
            free: currentQuoteBalance.free - amountToLock,
            locked: currentQuoteBalance.locked + amountToLock,
          };
          quoteAssetChanged = true;
          logger.debug(
            `[${this.exchangeId}] Locked ~${amountToLock.toFixed(8)} ${quoteAsset} for NEW ${orderType} BUY order ${orderId}.`,
          );
        } else if (amountToLock > 0) {
          logger.warn(
            `[${this.exchangeId}] Insufficient free ${quoteAsset} to lock for NEW ${orderType} BUY order ${orderId}. Needed ${amountToLock.toFixed(8)}, have ${currentQuoteBalance.free.toFixed(8)}`,
          );
        } else {
          logger.debug(
            `[${this.exchangeId}] No immediate lock applied for NEW ${orderType} BUY order ${orderId}. Awaiting fill/snapshot.`,
          );
        }
      } else {
        // SELL
        // Lock base asset
        if (currentBaseBalance.free >= quantity) {
          this.balanceCache[baseAsset] = {
            free: currentBaseBalance.free - quantity,
            locked: currentBaseBalance.locked + quantity,
          };
          baseAssetChanged = true;
          logger.debug(
            `[${this.exchangeId}] Locked ${quantity.toFixed(8)} ${baseAsset} for NEW ${orderType} SELL order ${orderId}.`,
          );
        } else {
          logger.warn(
            `[${this.exchangeId}] Insufficient free ${baseAsset} to lock for NEW ${orderType} SELL order ${orderId}. Needed ${quantity.toFixed(8)}, have ${currentBaseBalance.free.toFixed(8)}`,
          );
        }
      }
    } else if (orderStatus === 'FILLED' || orderStatus === 'PARTIALLY_FILLED') {
      // Adjust balances based on the fill (using lastExecutedQuantity and lastExecutedPrice)
      const cost = lastExecutedQuantity * lastExecutedPrice; // Cost/proceeds of this specific fill

      if (orderSide === 'BUY') {
        // Reduce locked quote (if it was locked), increase free base
        const quoteToUnlock =
          orderType === 'LIMIT' ||
          orderType === 'STOP_LOSS_LIMIT' ||
          orderType === 'TAKE_PROFIT_LIMIT'
            ? cost // Unlock actual cost for limit types
            : 0; // Don't assume unlock for market, rely on snapshot

        if (quoteToUnlock > 0 && this.balanceCache[quoteAsset]) {
          this.balanceCache[quoteAsset].locked = Math.max(
            0,
            this.balanceCache[quoteAsset].locked - quoteToUnlock,
          );
          quoteAssetChanged = true;
        }
        this.balanceCache[baseAsset] = {
          free: currentBaseBalance.free + lastExecutedQuantity, // Increase free base
          locked: currentBaseBalance.locked, // Locked base shouldn't change on BUY fill
        };
        baseAssetChanged = true;
        logger.debug(
          `[${this.exchangeId}] Fill Update (BUY ${orderType} ${orderId}): Unlocked ~${quoteToUnlock.toFixed(8)} ${quoteAsset}, Added ${lastExecutedQuantity.toFixed(8)} ${baseAsset}`,
        );
      } else {
        // SELL
        // Reduce locked base, increase free quote
        if (this.balanceCache[baseAsset]) {
          this.balanceCache[baseAsset].locked = Math.max(
            0,
            this.balanceCache[baseAsset].locked - lastExecutedQuantity,
          ); // Reduce locked base
          baseAssetChanged = true;
        }
        this.balanceCache[quoteAsset] = {
          free: currentQuoteBalance.free + cost, // Increase free quote
          locked: currentQuoteBalance.locked, // Locked quote shouldn't change on SELL fill
        };
        quoteAssetChanged = true;
        logger.debug(
          `[${this.exchangeId}] Fill Update (SELL ${orderType} ${orderId}): Unlocked ${lastExecutedQuantity.toFixed(8)} ${baseAsset}, Added ${cost.toFixed(8)} ${quoteAsset}`,
        );
      }

      // Handle commissions
      if (commissionAmount > 0 && commissionAsset) {
        const commissionBalance = this.balanceCache[commissionAsset] || {
          free: 0,
          locked: 0,
        };
        // Deduct commission from free balance
        this.balanceCache[commissionAsset] = {
          ...commissionBalance,
          free: Math.max(0, commissionBalance.free - commissionAmount),
        };
        if (commissionAsset === baseAsset) baseAssetChanged = true;
        if (commissionAsset === quoteAsset) quoteAssetChanged = true;
        if (commissionAsset !== baseAsset && commissionAsset !== quoteAsset)
          commissionAssetChanged = true; // Track if separate asset changed
        logger.debug(
          `[${this.exchangeId}] Commission for ${orderId}: Deducted ${commissionAmount.toFixed(8)} ${commissionAsset}`,
        );
      }

      // If order is fully FILLED, ensure any remaining locked funds are released
      // This is crucial for MARKET orders or potential precision issues.
      if (orderStatus === 'FILLED') {
        if (
          orderSide === 'BUY' &&
          this.balanceCache[quoteAsset]?.locked > 1e-9
        ) {
          // Use tolerance for float comparison
          logger.debug(
            `[${this.exchangeId}] Releasing remaining ${this.balanceCache[quoteAsset].locked.toFixed(8)} locked ${quoteAsset} for FILLED BUY order ${orderId}.`,
          );
          this.balanceCache[quoteAsset].free +=
            this.balanceCache[quoteAsset].locked;
          this.balanceCache[quoteAsset].locked = 0;
          quoteAssetChanged = true; // Ensure update is emitted
        } else if (
          orderSide === 'SELL' &&
          this.balanceCache[baseAsset]?.locked > 1e-9
        ) {
          // Use tolerance for float comparison
          logger.debug(
            `[${this.exchangeId}] Releasing remaining ${this.balanceCache[baseAsset].locked.toFixed(8)} locked ${baseAsset} for FILLED SELL order ${orderId}.`,
          );
          this.balanceCache[baseAsset].free +=
            this.balanceCache[baseAsset].locked;
          this.balanceCache[baseAsset].locked = 0;
          baseAssetChanged = true; // Ensure update is emitted
        }
      }
    } else if (
      orderStatus === 'CANCELED' ||
      orderStatus === 'EXPIRED' ||
      orderStatus === 'REJECTED'
    ) {
      // Unlock funds for orders that didn't execute fully or were rejected
      // Calculate the amount that *was* locked but not filled.
      const remainingQty = quantity - cumulativeFilledQuantity;

      if (remainingQty > 1e-9) {
        // Use tolerance for float comparison
        if (orderSide === 'BUY') {
          // Unlock remaining quote asset
          // Use the originally calculated lock amount for LIMIT, or rely on current locked amount for others
          const amountToUnlock =
            orderType === 'LIMIT' ||
            orderType === 'STOP_LOSS_LIMIT' ||
            orderType === 'TAKE_PROFIT_LIMIT'
              ? remainingQty * price // Unlock based on remaining qty * price
              : this.balanceCache[quoteAsset]?.locked || 0; // Unlock whatever is left for non-limit

          if (
            this.balanceCache[quoteAsset] &&
            this.balanceCache[quoteAsset].locked >= amountToUnlock - 1e-9
          ) {
            // Use tolerance
            this.balanceCache[quoteAsset] = {
              free: currentQuoteBalance.free + amountToUnlock,
              locked: currentQuoteBalance.locked - amountToUnlock,
            };
            quoteAssetChanged = true;
            logger.debug(
              `[${this.exchangeId}] Unlocked ~${amountToUnlock.toFixed(8)} ${quoteAsset} for ${orderStatus} BUY order ${orderId}.`,
            );
          } else if (this.balanceCache[quoteAsset]?.locked > 1e-9) {
            // If there's still locked balance, unlock it
            logger.warn(
              `[${this.exchangeId}] Mismatch unlocking ${quoteAsset} for ${orderStatus} BUY order ${orderId}. Attempting to unlock ${amountToUnlock.toFixed(8)}, but only ${this.balanceCache[quoteAsset].locked.toFixed(8)} is locked. Unlocking available locked amount.`,
            );
            this.balanceCache[quoteAsset].free +=
              this.balanceCache[quoteAsset].locked;
            this.balanceCache[quoteAsset].locked = 0;
            quoteAssetChanged = true;
          }
        } else {
          // SELL
          // Unlock remaining base asset
          if (
            this.balanceCache[baseAsset] &&
            this.balanceCache[baseAsset].locked >= remainingQty - 1e-9
          ) {
            // Use tolerance
            this.balanceCache[baseAsset] = {
              free: currentBaseBalance.free + remainingQty,
              locked: currentBaseBalance.locked - remainingQty,
            };
            baseAssetChanged = true;
            logger.debug(
              `[${this.exchangeId}] Unlocked ${remainingQty.toFixed(8)} ${baseAsset} for ${orderStatus} SELL order ${orderId}.`,
            );
          } else if (this.balanceCache[baseAsset]?.locked > 1e-9) {
            // If there's still locked balance, unlock it
            logger.warn(
              `[${this.exchangeId}] Mismatch unlocking ${baseAsset} for ${orderStatus} SELL order ${orderId}. Attempting to unlock ${remainingQty.toFixed(8)}, but only ${this.balanceCache[baseAsset].locked.toFixed(8)} is locked. Unlocking available locked amount.`,
            );
            this.balanceCache[baseAsset].free +=
              this.balanceCache[baseAsset].locked;
            this.balanceCache[baseAsset].locked = 0;
            baseAssetChanged = true;
          }
        }
      } else {
        logger.debug(
          `[${this.exchangeId}] Order ${orderId} (${orderStatus}) had no remaining quantity to unlock.`,
        );
      }
    }

    // Ensure balances don't go negative due to precision issues or logic errors
    if (this.balanceCache[baseAsset]) {
      this.balanceCache[baseAsset].free = Math.max(
        0,
        this.balanceCache[baseAsset].free,
      );
      this.balanceCache[baseAsset].locked = Math.max(
        0,
        this.balanceCache[baseAsset].locked,
      );
    }
    if (this.balanceCache[quoteAsset]) {
      this.balanceCache[quoteAsset].free = Math.max(
        0,
        this.balanceCache[quoteAsset].free,
      );
      this.balanceCache[quoteAsset].locked = Math.max(
        0,
        this.balanceCache[quoteAsset].locked,
      );
    }
    if (commissionAsset && this.balanceCache[commissionAsset]) {
      this.balanceCache[commissionAsset].free = Math.max(
        0,
        this.balanceCache[commissionAsset].free,
      );
      // Locked commission balance shouldn't change here
    }

    // Emit updates for changed assets
    if (baseAssetChanged) {
      this.emitBalanceUpdate(baseAsset);
    }
    if (quoteAssetChanged) {
      this.emitBalanceUpdate(quoteAsset);
    }
    if (commissionAssetChanged) {
      this.emitBalanceUpdate(commissionAsset); // Emit for commission asset if different and changed
    }

    // Also emit an order update event
    // Format the payload slightly to match our Order type better if possible
    const formattedOrderUpdate = {
      id: orderId.toString(),
      clientOrderId: payload.c,
      exchangeId: this.exchangeId, // Add exchangeId
      symbol: symbol,
      side: orderSide.toLowerCase() as 'buy' | 'sell',
      type: orderType.toLowerCase() as OrderType,
      status: this.mapOrderStatus(orderStatus),
      price: parseFloat(payload.p), // Original order price
      quantity: parseFloat(payload.q), // Original order quantity
      executed: cumulativeFilledQuantity, // Map cumulativeFilledQuantity to executed
      remaining: parseFloat(payload.q) - cumulativeFilledQuantity, // Calculate remaining
      cost: parseFloat(payload.cummulativeQuoteQty), // Map cummulativeQuoteQty to cost
      timestamp: orderTime, // Use transaction time from event
      lastUpdated: orderTime, // Use transaction time for lastUpdated
      timeInForce: payload.f as TimeInForce,
      stopPrice: parseFloat(payload.P) || undefined,
      // Include fill details if needed
      lastExecutedPrice: lastExecutedPrice,
      lastExecutedQuantity: lastExecutedQuantity,
      commissionAmount: commissionAmount,
      commissionAsset: commissionAsset,
      rawPayload: payload, // Include raw payload for detailed consumers
    };
    this.eventEmitter.emit('orderUpdate', {
      exchangeId: this.exchangeId,
      order: formattedOrderUpdate,
    });
  }

  /**
   * Fetches the full account balances via REST API and compares with the cache.
   * Corrects any discrepancies found.
   * This method can be called manually to force a balance refresh.
   */
  public async reconcileBalances(): Promise<void> {
    if (!this.currentApiKeyId) {
      logger.warn(
        `[${this.exchangeId}] Cannot reconcile balances: API Key ID missing.`,
      );
      return;
    }
    logger.info(
      `[${this.exchangeId}] Starting balance reconciliation for API Key ${this.currentApiKeyId}...`,
    );
    try {
      const accountInfo = await this.getAccountInfo(this.currentApiKeyId); // Use existing method
      const restBalances = accountInfo.balances;
      let discrepanciesFound = false;
      // Variable 'updated' was removed as it's not used
      const now = Date.now();

      // Check REST balances against cache
      for (const asset in restBalances) {
        const restBalance = restBalances[asset];
        const cachedBalance = this.balanceCache[asset];

        // Use a small tolerance for floating point comparisons
        const tolerance = 1e-9; // Adjust as needed
        const freeDiff = cachedBalance
          ? Math.abs(restBalance.free - cachedBalance.free)
          : restBalance.free;
        const lockedDiff = cachedBalance
          ? Math.abs(restBalance.locked - cachedBalance.locked)
          : restBalance.locked;

        if (!cachedBalance || freeDiff > tolerance || lockedDiff > tolerance) {
          logger.warn(
            `[${this.exchangeId}] Reconciliation Discrepancy for ${asset}: REST=(F:${restBalance.free.toFixed(8)}, L:${restBalance.locked.toFixed(8)}), WS Cache=(F:${cachedBalance?.free.toFixed(8)}, L:${cachedBalance?.locked.toFixed(8)}). Updating cache.`,
          );
          this.balanceCache[asset] = { ...restBalance }; // Update cache with REST data
          this.emitBalanceUpdate(asset);
          discrepanciesFound = true;
        }
      }

      // Check cache balances that might not be in REST response (e.g., zero balances after trading)
      for (const asset in this.balanceCache) {
        if (!(asset in restBalances)) {
          // Only log/emit if the cached balance wasn't already zero
          if (
            this.balanceCache[asset].free > 1e-9 ||
            this.balanceCache[asset].locked > 1e-9
          ) {
            logger.info(
              `[${this.exchangeId}] Asset ${asset} zeroed in REST response (was F:${this.balanceCache[asset].free.toFixed(8)}, L:${this.balanceCache[asset].locked.toFixed(8)}). Removing from cache.`,
            );
            this.emitBalanceUpdate(asset, { free: 0, locked: 0 }); // Emit zero balance
            // updated = true; // Removed unused update
          }
          delete this.balanceCache[asset];
        }
      }

      if (discrepanciesFound) {
        logger.info(
          `[${this.exchangeId}] Balance reconciliation completed at ${now}. Discrepancies found and corrected.`,
        );
        this.eventEmitter.emit('balancesReconciled', {
          exchangeId: this.exchangeId,
          apiKeyId: this.currentApiKeyId,
          status: 'corrected',
          timestamp: now,
        });
      } else {
        logger.info(
          `[${this.exchangeId}] Balance reconciliation completed at ${now}. No discrepancies found.`,
        );
        this.eventEmitter.emit('balancesReconciled', {
          exchangeId: this.exchangeId,
          apiKeyId: this.currentApiKeyId,
          status: 'ok',
          timestamp: now,
        });
      }
    } catch (error) {
      const now = Date.now();
      logger.error(
        `[${this.exchangeId}] Error during balance reconciliation at ${now}:`,
        error,
      );
      this.eventEmitter.emit('balancesReconciled', {
        exchangeId: this.exchangeId,
        apiKeyId: this.currentApiKeyId,
        status: 'error',
        error,
        timestamp: now,
      });
    }
  }

  /** Starts the periodic balance reconciliation process. */
  private startReconciliation(): void {
    if (this.reconciliationInterval) {
      logger.debug(
        `[${this.exchangeId}] Reconciliation interval already running.`,
      );
      return; // Already running
    }
    // Reconcile every 5 minutes
    this.reconciliationInterval = setInterval(
      () => {
        this.reconcileBalances().catch((error) => {
          logger.error(
            `[${this.exchangeId}] Error during scheduled balance reconciliation:`,
            error,
          );
        });
      },
      5 * 60 * 1000,
    );
    logger.info(
      `[${this.exchangeId}] Periodic balance reconciliation started (every 5 minutes).`,
    );
  }

  /** Stops the periodic balance reconciliation process. */
  private stopReconciliation(): void {
    if (this.reconciliationInterval) {
      clearInterval(this.reconciliationInterval);
      this.reconciliationInterval = null;
      logger.info(
        `[${this.exchangeId}] Periodic balance reconciliation stopped.`,
      );
    }
  }

  /**
   * Emits a balance update event for a specific asset.
   * @param asset The asset symbol (e.g., 'BTC', 'USDT').
   * @param specificBalance Optional balance to emit, otherwise uses cache. If provided, represents the *new* state.
   */
  private emitBalanceUpdate(
    asset: string,
    specificBalance?: { free: number; locked: number },
  ): void {
    const balance = specificBalance ??
      this.balanceCache[asset] ?? { free: 0, locked: 0 };
    const available = balance.free; // Available is just the free balance for spot

    // Ensure values are numbers and handle potential NaN
    const freeNum = Number.isFinite(balance.free) ? balance.free : 0;
    const lockedNum = Number.isFinite(balance.locked) ? balance.locked : 0;
    const availableNum = Number.isFinite(available) ? available : 0;
    const totalNum = freeNum + lockedNum;

    const updateData = {
      exchangeId: this.exchangeId,
      apiKeyId: this.currentApiKeyId, // Include API key ID for context
      asset: asset,
      balance: {
        free: freeNum,
        locked: lockedNum,
        total: totalNum,
        available: availableNum, // Available for trading
      },
      timestamp: Date.now(),
    };
    // logger.debug(`[${this.exchangeId}] Emitting balanceUpdate for ${asset}:`, updateData.balance);
    this.eventEmitter.emit('balanceUpdate', updateData);
  }

  /**
   * Disconnects the user data stream, stops keep-alive and reconciliation.
   */
  public disconnect(): void {
    logger.info(
      `[${this.exchangeId}] Disconnecting user data stream (API Key: ${this.currentApiKeyId}, Stream ID: ${this.userDataStreamId})...`,
    );

    // Stop keep-alive interval
    if (this.listenKeyRefreshInterval) {
      clearInterval(this.listenKeyRefreshInterval);
      this.listenKeyRefreshInterval = null;
      logger.debug(`[${this.exchangeId}] Cleared listenKey refresh interval.`);
    }

    // Stop reconciliation interval
    this.stopReconciliation();

    // Close WebSocket connection via manager
    if (this.userDataStreamId) {
      logger.debug(
        `[${this.exchangeId}] Closing WebSocket connection via manager for stream ID: ${this.userDataStreamId}`,
      );
      this.webSocketManager.closeConnection(this.userDataStreamId);
      // Note: WebSocketManager handles removing subscriptions associated with the closed connection ID
      this.userDataStreamId = null;
    }

    // Optionally delete the listenKey on Binance side (consider if needed - might interfere with other connections using the same key)
    // Generally, let keys expire naturally unless explicitly required to delete.
    // if (this.listenKey && this.currentApiKeyId) {
    //   const keyToDelete = this.listenKey; // Capture key before clearing
    //   this.makeAuthenticatedRequest('/api/v3/userDataStream', 'DELETE', this.currentApiKeyId, { listenKey: keyToDelete })
    //     .then(() => logger.info(`[${this.exchangeId}] Successfully requested deletion of listenKey ${keyToDelete.substring(0,5)}...`))
    //     .catch(err => logger.error(`[${this.exchangeId}] Failed to request deletion of listenKey ${keyToDelete.substring(0,5)}...:`, err));
    // }

    // Clear local state associated with the stream
    this.listenKey = null;
    // Don't clear currentApiKeyId here, as the adapter instance might persist for this key
    this.balanceCache = {}; // Clear balance cache on disconnect
    this.isConnectingUserDataStream = false; // Reset connection flag

    logger.info(
      `[${this.exchangeId}] User data stream disconnected for API Key ${this.currentApiKeyId}.`,
    );
    this.eventEmitter.emit('userDataStreamDisconnected', {
      exchangeId: this.exchangeId,
      apiKeyId: this.currentApiKeyId,
    });
  }

  /**
   * Provides access to the event emitter for subscribing to updates.
   * Example: adapter.getEventEmitter().on('balanceUpdate', (data) => { ... });
   */
  public getEventEmitter(): BrowserEventEmitter {
    return this.eventEmitter;
  }

  /**
   * Retrieves the current cached balance for a specific asset.
   * @param asset The asset symbol (e.g., 'BTC').
   * @returns The cached balance { free, locked } or undefined if not cached.
   */
  public getCachedBalance(
    asset: string,
  ): { free: number; locked: number } | undefined {
    // Return a copy to prevent external modification
    const balance = this.balanceCache[asset];
    return balance ? { ...balance } : undefined;
  }

  /**
   * Retrieves the entire balance cache.
   * @returns A copy of the balance cache object.
   */
  public getBalanceCache(): Record<string, { free: number; locked: number }> {
    return { ...this.balanceCache }; // Return a copy
  }

  /**
   * Validate API key and secret by making a request to the account endpoint.
   * @param apiKey The API key to validate.
   * @param apiSecret The API secret to validate.
   * @returns True if the credentials are valid, false otherwise.
   */
  public async validateApiKey(
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean> {
    // Create temporary credentials object for signing
    const tempCredentials = { apiKey, apiSecret };
    try {
      // Add timestamp and signature using the provided secret
      const timestamp = Date.now();
      const params = { timestamp };
      const queryString = `timestamp=${timestamp}`;
      // Use the provided apiSecret directly for signature generation
      const signature = this.generateSignature(
        queryString,
        tempCredentials.apiSecret,
      );
      const signedParams = { ...params, signature };

      // Make request to account endpoint using the provided credentials directly
      // We use axios directly here to bypass the adapter's credential fetching logic
      await axios({
        method: 'GET',
        url: `${this.baseUrl}/api/v3/account`,
        params: signedParams,
        headers: { 'X-MBX-APIKEY': tempCredentials.apiKey },
        timeout: 5000, // Add a timeout
      });

      // If the request succeeds without throwing an auth error, the key is valid
      logger.info(
        `[${this.exchangeId}] API Key validation successful for key starting with ${apiKey.substring(0, 5)}...`,
      );
      return true;
    } catch (error: any) {
      // Log the error but return false for validation purposes
      let isAuthError = false;
      const errorMessage = error?.message?.toLowerCase() || '';
      const responseData = error?.response?.data; // Axios error structure
      const responseStatus = error?.response?.status;

      // Check common indicators of authentication failure
      if (responseStatus === 401 || responseStatus === 403) {
        isAuthError = true;
      } else if (responseData && responseData.code) {
        // Check Binance specific error codes for auth issues (e.g., -2015, -2014, -1022)
        const errorCode = responseData.code;
        if (errorCode === -2015 || errorCode === -2014 || errorCode === -1022) {
          isAuthError = true;
        }
      } else if (
        errorMessage.includes('invalid api-key') ||
        errorMessage.includes('signature for this request is not valid') ||
        errorMessage.includes('api-key format invalid')
      ) {
        isAuthError = true;
      }

      if (isAuthError) {
        logger.warn(
          `[${this.exchangeId}] API Key validation failed for key starting with ${apiKey.substring(0, 5)}... (Authentication Error): ${responseData?.msg || errorMessage}`,
        );
      } else {
        logger.error(
          `[${this.exchangeId}] Error during API key validation for key starting with ${apiKey.substring(0, 5)}...:`,
          error,
        );
      }
      return false;
    }
  }

  /**
   * Map Binance order status to our order status
   *
   * @param binanceStatus The Binance order status
   * @returns The mapped order status in our system
   */
  private mapOrderStatus(binanceStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      NEW: 'new',
      PARTIALLY_FILLED: 'partially_filled',
      FILLED: 'filled',
      CANCELED: 'canceled',
      PENDING_CANCEL: 'canceling', // Map to 'canceling' state
      REJECTED: 'rejected',
      EXPIRED: 'expired',
      // PENDING: 'new', // Binance doesn't typically use PENDING for spot orders status
    };

    // If we don't have a mapping, log a warning and default to 'unknown'
    const mappedStatus = statusMap[binanceStatus];
    if (!mappedStatus) {
      logger.warn(
        `[${this.exchangeId}] Unknown Binance order status encountered: ${binanceStatus}. Mapping to 'unknown'.`,
      );
      return 'unknown';
    }
    return mappedStatus;
  }

  // --- Asset Information ---

  /**
   * Fetches detailed information for all assets available on the exchange.
   * Uses the /sapi/v1/capital/config/getall endpoint.
   * Requires API key with Wallet permissions.
   *
   * @param apiKeyId The API key ID to use for authentication.
   * @returns A promise that resolves to an array of normalized AssetInfo objects.
   */
  public async getAllAssetDetails(apiKeyId: string): Promise<AssetInfo[]> {
    if (!apiKeyId) {
      const errorMsg = 'Missing apiKeyId for getAllAssetDetails';
      logger.error(`[${this.exchangeId}] ${errorMsg}`);
      throw new Error('API Key ID is required to fetch asset details.');
    }

    logger.info(
      `[${this.exchangeId}] Fetching all asset details for API key: ${apiKeyId}`,
    );

    try {
      // TODO: Implement the actual API call and normalization
      const response = await this.makeAuthenticatedRequest<
        BinanceAssetDetail[]
      >(
        '/sapi/v1/capital/config/getall',
        'GET',
        apiKeyId,
        {},
        10, // Weight: 10
      );

      logger.debug(
        `[${this.exchangeId}] Received raw asset details for ${response.length} assets.`,
      );

      // --- Normalization Logic --- TODO
      const normalizedAssets: AssetInfo[] = response.map((asset) => {
        const networks: AssetNetwork[] = asset.networkList.map((net) => ({
          network: net.network,
          name: net.name,
          isDefault: net.isDefault,
          depositEnabled: net.depositEnable,
          withdrawEnabled: net.withdrawEnable,
          withdrawFee: parseFloat(net.withdrawFee) || undefined,
          minWithdraw: parseFloat(net.withdrawMin) || undefined,
          maxWithdraw: parseFloat(net.withdrawMax) || undefined,
          addressRegex: net.addressRegex,
          memoRegex: net.memoRegex,
        }));

        return {
          symbol: asset.coin,
          name: asset.name,
          // fullName: asset.name, // Assuming name is sufficient for fullName initially
          precision: 8, // Default precision, might need adjustment based on other endpoints or context
          // withdrawPrecision: undefined, // Determine from networkList if possible or another source
          exchangeId: this.exchangeId,
          // iconUrl: undefined, // Needs a separate source
          networks: networks,
          isActive: asset.trading, // Assuming 'trading' status indicates activity
          isFiat: asset.isLegalMoney,
          // isStablecoin: undefined, // Needs external data or heuristics
          // description, website, explorer, etc. need external data source
          lastUpdated: Date.now(),
        };
      });

      logger.info(
        `[${this.exchangeId}] Successfully fetched and normalized ${normalizedAssets.length} asset details.`,
      );

      return normalizedAssets;
    } catch (error) {
      logger.error(
        `[${this.exchangeId}] Error fetching all asset details:`,
        error,
      );
      // Re-throw or handle specific errors as needed
      if (error instanceof Error) {
        throw new Error(`Failed to fetch asset details: ${error.message}`);
      } else {
        throw new Error(
          'An unknown error occurred while fetching asset details.',
        );
      }
    }
  }
} // End of BinanceTestnetAdapter class
