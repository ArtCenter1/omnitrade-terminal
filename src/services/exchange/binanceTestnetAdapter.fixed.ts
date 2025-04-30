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
}
