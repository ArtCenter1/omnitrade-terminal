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
} from '@/types/exchange';

import { BaseExchangeAdapter } from './baseExchangeAdapter';
import { getExchangeEndpoint } from '@/config/exchangeConfig';
import { SUPPORTED_EXCHANGES } from '../mockData/mockDataUtils';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';
import { makeApiRequest } from '@/utils/apiUtils';
import { BinanceTestnetOrderTrackingService } from './binanceTestnetOrderTrackingService';

/**
 * Adapter for the Binance Testnet exchange.
 * This connects to the Binance Testnet API for sandbox trading.
 */
export class BinanceTestnetAdapter extends BaseExchangeAdapter {
  private baseUrl: string;
  private wsBaseUrl: string;

  constructor() {
    super('binance_testnet');
    this.baseUrl = getExchangeEndpoint('binance_testnet');
    this.wsBaseUrl = 'wss://testnet.binance.vision/ws';
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
    method: 'GET' | 'POST' | 'DELETE',
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
        throw new Error(
          'Invalid API credentials: Using mock or invalid API keys',
        );
      }

      // Add signature
      const signedParams = this.addSignature(params, apiSecret);

      // Build URL
      const url = `${this.baseUrl}${endpoint}`;

      try {
        // Make request with rate limiting
        return await makeApiRequest<T>(this.exchangeId, url, {
          method,
          weight,
          body: method !== 'GET' ? signedParams : undefined,
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

      console.log(`Making request to: ${url}`);

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

  /**
   * Get basic information about Binance Testnet.
   */
  public async getExchangeInfo(): Promise<Exchange> {
    try {
      // Make request to exchange info endpoint
      const response = await this.makeUnauthenticatedRequest(
        '/v3/exchangeInfo',
        {},
        10, // Weight: 10
      );

      // Return formatted exchange info
      return {
        id: this.exchangeId,
        name: 'Binance Testnet',
        logo: '/exchanges/binance.svg',
        website: 'https://testnet.binance.vision',
        description: 'Binance Testnet for sandbox trading',
        isActive: true,
      };
    } catch (error) {
      console.error('Error getting exchange info:', error);

      // Fallback to mock data
      const exchange = SUPPORTED_EXCHANGES.find((e) => e.id === 'binance');
      if (!exchange) {
        throw new Error(`Exchange ${this.exchangeId} not found`);
      }

      return {
        ...exchange,
        id: this.exchangeId,
        name: 'Binance Testnet',
        description: 'Binance Testnet for sandbox trading',
      };
    }
  }

  /**
   * Get all available trading pairs on Binance Testnet.
   */
  public async getTradingPairs(): Promise<TradingPair[]> {
    try {
      // Make request to exchange info endpoint
      const response = await this.makeUnauthenticatedRequest(
        '/v3/exchangeInfo',
        {},
        10, // Weight: 10
      );

      // Extract and format trading pairs
      const pairs: TradingPair[] = response.symbols
        .filter((symbol: any) => symbol.status === 'TRADING')
        .map((symbol: any) => {
          // Find price filter
          const priceFilter = symbol.filters.find(
            (filter: any) => filter.filterType === 'PRICE_FILTER',
          );

          // Find lot size filter
          const lotSizeFilter = symbol.filters.find(
            (filter: any) => filter.filterType === 'LOT_SIZE',
          );

          // Find min notional filter
          const minNotionalFilter = symbol.filters.find(
            (filter: any) => filter.filterType === 'MIN_NOTIONAL',
          );

          // Calculate price decimals
          const priceDecimals = priceFilter
            ? Math.max(0, priceFilter.tickSize.indexOf('1') - 1)
            : 8;

          // Calculate quantity decimals
          const quantityDecimals = lotSizeFilter
            ? Math.max(0, lotSizeFilter.stepSize.indexOf('1') - 1)
            : 8;

          return {
            symbol: `${symbol.baseAsset}/${symbol.quoteAsset}`,
            baseAsset: symbol.baseAsset,
            quoteAsset: symbol.quoteAsset,
            exchangeId: this.exchangeId,
            priceDecimals,
            quantityDecimals,
            minQuantity: lotSizeFilter
              ? parseFloat(lotSizeFilter.minQty)
              : undefined,
            maxQuantity: lotSizeFilter
              ? parseFloat(lotSizeFilter.maxQty)
              : undefined,
            minPrice: priceFilter
              ? parseFloat(priceFilter.minPrice)
              : undefined,
            maxPrice: priceFilter
              ? parseFloat(priceFilter.maxPrice)
              : undefined,
            minNotional: minNotionalFilter
              ? parseFloat(minNotionalFilter.minNotional)
              : undefined,
          };
        });

      return pairs;
    } catch (error) {
      console.error('Error getting trading pairs:', error);

      // Fallback to mock data
      return this.mockDataService.generateTradingPairs(this.exchangeId, 50);
    }
  }

  /**
   * Get the order book for a specific trading pair on Binance Testnet.
   */
  public async getOrderBook(
    symbol: string,
    limit: number = 20,
  ): Promise<OrderBook> {
    try {
      // Convert symbol format from BTC/USDT to BTCUSDT
      const formattedSymbol = symbol.replace('/', '');

      // Make request to order book endpoint
      // Weight varies based on limit: 1 for limit ≤ 100, 5 for limit ≤ 500, 10 for limit ≤ 1000, 50 for limit > 1000
      let weight = 1;
      if (limit > 1000) {
        weight = 50;
      } else if (limit > 500) {
        weight = 10;
      } else if (limit > 100) {
        weight = 5;
      }

      const response = await this.makeUnauthenticatedRequest(
        '/v3/depth',
        {
          symbol: formattedSymbol,
          limit,
        },
        weight,
      );

      // Validate response before processing
      if (!response || !response.bids || !response.asks) {
        console.error('Invalid order book response:', response);
        throw new Error('Invalid order book response structure');
      }

      // Format response
      return {
        symbol,
        exchangeId: this.exchangeId,
        bids: Array.isArray(response.bids)
          ? response.bids.map((bid: string[]) => ({
              price: parseFloat(bid[0]),
              quantity: parseFloat(bid[1]),
            }))
          : [],
        asks: Array.isArray(response.asks)
          ? response.asks.map((ask: string[]) => ({
              price: parseFloat(ask[0]),
              quantity: parseFloat(ask[1]),
            }))
          : [],
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error getting order book for ${symbol}:`, error);

      // Fallback to mock data
      return this.mockDataService.generateOrderBook(
        this.exchangeId,
        symbol,
        limit,
      );
    }
  }

  /**
   * Get 24hr ticker price statistics for a specific trading pair or all pairs on Binance Testnet.
   */
  public async getTickerStats(
    symbol?: string,
  ): Promise<TickerStats | TickerStats[]> {
    try {
      // If symbol is provided, get stats for that symbol only
      if (symbol) {
        // Convert symbol format from BTC/USDT to BTCUSDT
        const formattedSymbol = symbol.replace('/', '');

        // Make request to 24hr ticker endpoint
        const response = await this.makeUnauthenticatedRequest(
          '/v3/ticker/24hr',
          {
            symbol: formattedSymbol,
          },
          1, // Weight: 1 for a single symbol
        );

        // Format response
        return this.formatTickerStats(response, symbol);
      } else {
        // Get stats for all symbols
        // Make request to 24hr ticker endpoint
        const response = await this.makeUnauthenticatedRequest(
          '/v3/ticker/24hr',
          {},
          40, // Weight: 40 for all symbols
        );

        // Format response
        return (response as any[]).map((ticker: any) => {
          // Convert symbol format from BTCUSDT to BTC/USDT
          const formattedSymbol = this.formatSymbol(ticker.symbol);
          return this.formatTickerStats(ticker, formattedSymbol);
        });
      }
    } catch (error) {
      console.error(
        `Error getting ticker stats for ${symbol || 'all symbols'}:`,
        error,
      );

      // Fallback to mock data
      if (symbol) {
        return this.mockDataService.generateTickerStats(
          this.exchangeId,
          symbol,
        );
      } else {
        // Generate stats for a few common pairs
        const pairs = [
          'BTC/USDT',
          'ETH/USDT',
          'BNB/USDT',
          'SOL/USDT',
          'XRP/USDT',
        ];
        return pairs.map((pair) =>
          this.mockDataService.generateTickerStats(this.exchangeId, pair),
        );
      }
    }
  }

  /**
   * Format symbol from Binance format (BTCUSDT) to standard format (BTC/USDT)
   */
  private formatSymbol(binanceSymbol: string): string {
    // Common quote assets to check
    const quoteAssets = [
      'USDT',
      'BUSD',
      'BTC',
      'ETH',
      'BNB',
      'USD',
      'EUR',
      'GBP',
    ];

    // Try to find a matching quote asset
    for (const quote of quoteAssets) {
      if (binanceSymbol.endsWith(quote)) {
        const base = binanceSymbol.substring(
          0,
          binanceSymbol.length - quote.length,
        );
        return `${base}/${quote}`;
      }
    }

    // If no match found, make a best guess (assume last 4 characters are the quote asset)
    const base = binanceSymbol.substring(0, binanceSymbol.length - 4);
    const quote = binanceSymbol.substring(binanceSymbol.length - 4);
    return `${base}/${quote}`;
  }

  /**
   * Format ticker statistics from Binance response
   */
  private formatTickerStats(response: any, symbol: string): TickerStats {
    return {
      symbol: symbol,
      exchangeId: this.exchangeId,
      priceChange: parseFloat(response.priceChange),
      priceChangePercent: parseFloat(response.priceChangePercent),
      weightedAvgPrice: parseFloat(response.weightedAvgPrice),
      prevClosePrice: parseFloat(response.prevClosePrice),
      lastPrice: parseFloat(response.lastPrice),
      lastQty: parseFloat(response.lastQty),
      bidPrice: parseFloat(response.bidPrice),
      bidQty: parseFloat(response.bidQty),
      askPrice: parseFloat(response.askPrice),
      askQty: parseFloat(response.askQty),
      openPrice: parseFloat(response.openPrice),
      highPrice: parseFloat(response.highPrice),
      lowPrice: parseFloat(response.lowPrice),
      volume: parseFloat(response.volume),
      quoteVolume: parseFloat(response.quoteVolume),
      openTime: response.openTime,
      closeTime: response.closeTime,
      count: response.count,
    };
  }

  /**
   * Get recent trades for a specific trading pair on Binance Testnet.
   */
  public async getRecentTrades(
    symbol: string,
    limit: number = 500,
  ): Promise<Trade[]> {
    try {
      // Convert symbol format from BTC/USDT to BTCUSDT
      const formattedSymbol = symbol.replace('/', '');

      // Make request to recent trades endpoint
      const response = await this.makeUnauthenticatedRequest(
        '/v3/trades',
        {
          symbol: formattedSymbol,
          limit: Math.min(limit, 1000), // Maximum 1000 trades
        },
        1, // Weight: 1
      );

      // Format response
      return response.map((trade: any) => ({
        id: trade.id.toString(),
        price: parseFloat(trade.price),
        quantity: parseFloat(trade.qty),
        timestamp: trade.time,
        isBuyerMaker: trade.isBuyerMaker,
        isBestMatch: trade.isBestMatch,
      }));
    } catch (error) {
      console.error(`Error getting recent trades for ${symbol}:`, error);

      // Fallback to mock data
      return this.mockDataService.generateRecentTrades(
        this.exchangeId,
        symbol,
        limit,
      );
    }
  }

  /**
   * Get candlestick/kline data for a specific trading pair on Binance Testnet.
   */
  public async getKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100,
  ): Promise<Kline[]> {
    try {
      // Convert symbol format from BTC/USDT to BTCUSDT
      const formattedSymbol = symbol.replace('/', '');

      // Map interval to Binance format
      const intervalMap: Record<string, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '4h': '4h',
        '1d': '1d',
        '1w': '1w',
        '1M': '1M',
      };

      const binanceInterval = intervalMap[interval] || '1h';

      // Prepare params
      const params: Record<string, string | number> = {
        symbol: formattedSymbol,
        interval: binanceInterval,
        limit,
      };

      if (startTime) {
        params.startTime = startTime;
      }

      if (endTime) {
        params.endTime = endTime;
      }

      // Make request to klines endpoint
      const response = await this.makeUnauthenticatedRequest(
        '/v3/klines',
        params,
        1, // Weight: 1
      );

      // Format response
      return response.map((kline: any[]) => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      }));
    } catch (error) {
      console.error(`Error getting klines for ${symbol}:`, error);

      // Fallback to mock data
      return this.mockDataService.generateKlines(
        this.exchangeId,
        symbol,
        interval,
        startTime,
        endTime,
        limit,
      );
    }
  }

  /**
   * Get the user's portfolio (balances) from Binance Testnet.
   */
  public async getPortfolio(apiKeyId: string): Promise<Portfolio> {
    try {
      // Make authenticated request to account endpoint
      const response = await this.makeAuthenticatedRequest(
        '/v3/account',
        'GET',
        apiKeyId,
        {},
        10, // Weight: 10
      );

      // Format response
      const assets = response.balances
        .filter(
          (balance: any) =>
            parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0,
        )
        .map((balance: any) => ({
          asset: balance.asset,
          free: parseFloat(balance.free),
          locked: parseFloat(balance.locked),
          total: parseFloat(balance.free) + parseFloat(balance.locked),
          usdValue: 0, // This would be calculated based on current prices
        }));

      return {
        totalUsdValue: 0, // This would be calculated based on current prices
        assets,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting portfolio:', error);

      // Fallback to mock data
      const seed = parseInt(apiKeyId.replace(/[^0-9]/g, '')) || undefined;
      return this.mockDataService.generatePortfolio(this.exchangeId, seed);
    }
  }

  /**
   * Place a new order on Binance Testnet.
   * Supports market, limit, stop_limit, and stop_market orders.
   *
   * @param apiKeyId The API key ID to use for authentication
   * @param order The order details
   * @returns The created order
   */
  public async placeOrder(
    apiKeyId: string,
    order: Partial<Order>,
  ): Promise<Order> {
    try {
      // Validate required parameters
      if (!order.symbol || !order.side || !order.type) {
        throw new Error(
          'Missing required order parameters: symbol, side, or type',
        );
      }

      if (order.type === 'limit' && !order.price) {
        throw new Error('Price is required for limit orders');
      }

      if (!order.quantity) {
        throw new Error('Quantity is required for all order types');
      }

      // Convert symbol format from BTC/USDT to BTCUSDT
      const formattedSymbol = order.symbol.replace('/', '');

      // Prepare base params
      const params: Record<string, string | number> = {
        symbol: formattedSymbol,
        side: order.side.toUpperCase(),
      };

      // Handle different order types
      switch (order.type) {
        case 'market':
          params.type = 'MARKET';
          params.quantity = order.quantity;
          break;

        case 'limit':
          params.type = 'LIMIT';
          params.quantity = order.quantity;
          params.price = order.price as number;
          params.timeInForce = 'GTC'; // Good Till Canceled
          break;

        case 'stop_limit':
          params.type = 'STOP_LOSS_LIMIT';
          params.quantity = order.quantity;
          params.price = order.price as number;
          params.stopPrice = order.stopPrice || order.price; // Use price as stopPrice if not provided
          params.timeInForce = 'GTC'; // Good Till Canceled
          break;

        case 'stop_market':
          params.type = 'STOP_LOSS';
          params.quantity = order.quantity;
          params.stopPrice = order.stopPrice || (order.price as number); // Use price as stopPrice if not provided
          break;

        default:
          throw new Error(`Unsupported order type: ${order.type}`);
      }

      // Make authenticated request to order endpoint
      const response = await this.makeAuthenticatedRequest(
        '/v3/order',
        'POST',
        apiKeyId,
        params,
        1, // Weight: 1
      );

      // Format response to match our Order interface
      const newOrder: Order = {
        id: response.orderId.toString(),
        clientOrderId: response.clientOrderId,
        exchangeId: this.exchangeId,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        status: this.mapOrderStatus(response.status),
        price: parseFloat(response.price) || order.price || 0,
        quantity: parseFloat(response.origQty),
        executed: parseFloat(response.executedQty),
        remaining:
          parseFloat(response.origQty) - parseFloat(response.executedQty),
        cost: parseFloat(response.cummulativeQuoteQty) || 0,
        timestamp: response.transactTime,
        lastUpdated: response.updateTime || response.transactTime,
      };

      // Track the order in the order tracking service
      const orderTrackingService =
        BinanceTestnetOrderTrackingService.getInstance();
      orderTrackingService.trackOrder(newOrder);

      return newOrder;
    } catch (error) {
      console.error('Error placing order:', error);

      // Enhance error message for user feedback
      if (error instanceof Error) {
        const errorMessage = error.message;

        // Check for specific Binance error messages
        if (errorMessage.includes('MIN_NOTIONAL')) {
          throw new Error(
            'Order value is too small. Please increase the quantity or price.',
          );
        }

        if (errorMessage.includes('LOT_SIZE')) {
          throw new Error(
            'Invalid quantity. Please check the minimum and maximum quantity limits.',
          );
        }

        if (errorMessage.includes('PRICE_FILTER')) {
          throw new Error(
            'Invalid price. Please check the minimum and maximum price limits.',
          );
        }

        if (errorMessage.includes('INSUFFICIENT_BALANCE')) {
          throw new Error('Insufficient balance to place this order.');
        }
      }

      // If we get here, use mock data as fallback
      return this.mockDataService.placeOrder(apiKeyId, {
        ...order,
        exchangeId: this.exchangeId,
      });
    }
  }

  /**
   * Cancel an existing order on Binance Testnet.
   *
   * @param apiKeyId The API key ID to use for authentication
   * @param orderId The ID of the order to cancel
   * @param symbol The trading pair symbol (e.g., BTC/USDT)
   * @returns True if the order was successfully canceled, false otherwise
   */
  public async cancelOrder(
    apiKeyId: string,
    orderId: string,
    symbol: string,
  ): Promise<boolean> {
    try {
      if (!symbol) {
        throw new Error('Symbol is required for canceling an order');
      }

      if (!orderId) {
        throw new Error('Order ID is required for canceling an order');
      }

      // Convert symbol format from BTC/USDT to BTCUSDT
      const formattedSymbol = symbol.replace('/', '');

      // Make authenticated request to cancel order endpoint
      const response = await this.makeAuthenticatedRequest(
        '/v3/order',
        'DELETE',
        apiKeyId,
        {
          symbol: formattedSymbol,
          orderId,
        },
        1,
      ); // Weight: 1

      console.log('Cancel order response:', response);

      // Update order status in the tracking service
      const orderTrackingService =
        BinanceTestnetOrderTrackingService.getInstance();
      orderTrackingService.updateOrder(orderId, {
        status: 'canceled',
        lastUpdated: Date.now(),
      });

      return true;
    } catch (error) {
      console.error('Error canceling order:', error);

      // Check for specific error messages
      if (error instanceof Error) {
        const errorMessage = error.message;

        // If the order does not exist or is already canceled
        if (errorMessage.includes('UNKNOWN_ORDER')) {
          throw new Error('Order not found or already canceled');
        }
      }

      // Fallback to mock data
      return this.mockDataService.cancelOrder(apiKeyId, orderId);
    }
  }

  /**
   * Get all open orders for the user on Binance Testnet.
   *
   * @param apiKeyId The API key ID to use for authentication
   * @param symbol Optional symbol to filter orders
   * @returns Array of open orders
   */
  public async getOpenOrders(
    apiKeyId: string,
    symbol?: string,
  ): Promise<Order[]> {
    try {
      // Prepare params
      const params: Record<string, string | number> = {};

      if (symbol) {
        // Convert symbol format from BTC/USDT to BTCUSDT
        params.symbol = symbol.replace('/', '');
      }

      // Make authenticated request to open orders endpoint
      // Weight: 3 for a single symbol, 40 for all symbols
      const weight = symbol ? 3 : 40;

      const response = await this.makeAuthenticatedRequest(
        '/v3/openOrders',
        'GET',
        apiKeyId,
        params,
        weight,
      );

      // Format response to match our Order interface
      return response.map((order: any) => {
        // Map Binance order type to our order type
        let orderType: 'market' | 'limit' | 'stop_limit' | 'stop_market' =
          'limit';

        if (order.type === 'MARKET') {
          orderType = 'market';
        } else if (order.type === 'LIMIT') {
          orderType = 'limit';
        } else if (order.type === 'STOP_LOSS_LIMIT') {
          orderType = 'stop_limit';
        } else if (order.type === 'STOP_LOSS') {
          orderType = 'stop_market';
        }

        const origQty = parseFloat(order.origQty);
        const executedQty = parseFloat(order.executedQty);

        return {
          id: order.orderId.toString(),
          symbol: this.formatSymbol(order.symbol),
          exchangeId: this.exchangeId,
          side: order.side.toLowerCase() as 'buy' | 'sell',
          type: orderType,
          price: parseFloat(order.price),
          quantity: origQty,
          executed: executedQty,
          remaining: origQty - executedQty,
          cost: parseFloat(order.cummulativeQuoteQty) || 0,
          status: this.mapOrderStatus(order.status),
          timestamp: order.time,
          lastUpdated: order.updateTime || order.time,
        };
      });
    } catch (error) {
      console.error('Error getting open orders:', error);

      // Fallback to mock data
      return this.mockDataService.getOpenOrders(
        apiKeyId,
        this.exchangeId,
        symbol,
      );
    }
  }

  /**
   * Get order history for the user on Binance Testnet.
   *
   * @param apiKeyId The API key ID to use for authentication
   * @param symbol Symbol to filter orders (required by Binance)
   * @param limit Maximum number of orders to return (default: 50)
   * @returns Array of historical orders
   */
  public async getOrderHistory(
    apiKeyId: string,
    symbol?: string,
    limit: number = 50,
  ): Promise<Order[]> {
    try {
      if (!symbol) {
        throw new Error(
          'Symbol is required for order history on Binance Testnet',
        );
      }

      // Convert symbol format from BTC/USDT to BTCUSDT
      const formattedSymbol = symbol.replace('/', '');

      // Make authenticated request to order history endpoint
      const response = await this.makeAuthenticatedRequest(
        '/v3/allOrders',
        'GET',
        apiKeyId,
        {
          symbol: formattedSymbol,
          limit,
        },
        10, // Weight: 10
      );

      // Format response to match our Order interface
      return response.map((order: any) => {
        // Map Binance order type to our order type
        let orderType: 'market' | 'limit' | 'stop_limit' | 'stop_market' =
          'limit';

        if (order.type === 'MARKET') {
          orderType = 'market';
        } else if (order.type === 'LIMIT') {
          orderType = 'limit';
        } else if (order.type === 'STOP_LOSS_LIMIT') {
          orderType = 'stop_limit';
        } else if (order.type === 'STOP_LOSS') {
          orderType = 'stop_market';
        }

        const origQty = parseFloat(order.origQty);
        const executedQty = parseFloat(order.executedQty);

        return {
          id: order.orderId.toString(),
          symbol: this.formatSymbol(order.symbol),
          exchangeId: this.exchangeId,
          side: order.side.toLowerCase() as 'buy' | 'sell',
          type: orderType,
          price: parseFloat(order.price),
          quantity: origQty,
          executed: executedQty,
          remaining: origQty - executedQty,
          cost: parseFloat(order.cummulativeQuoteQty) || 0,
          status: this.mapOrderStatus(order.status),
          timestamp: order.time,
          lastUpdated: order.updateTime || order.time,
        };
      });
    } catch (error) {
      console.error('Error getting order history:', error);

      // Fallback to mock data
      return this.mockDataService.getOrderHistory(
        apiKeyId,
        this.exchangeId,
        symbol,
        limit,
      );
    }
  }

  /**
   * Get performance metrics for the user's trading activity on Binance Testnet.
   */
  public async getPerformanceMetrics(
    apiKeyId: string,
    period: string = '1m',
  ): Promise<PerformanceMetrics> {
    // This would require custom implementation as Binance doesn't provide this directly
    // For now, we'll use mock data
    return this.mockDataService.generatePerformanceMetrics(period);
  }

  /**
   * Validate API key credentials with Binance Testnet.
   */
  public async validateApiKey(
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean> {
    try {
      // Generate timestamp
      const timestamp = Date.now();

      // Generate signature
      const signature = this.generateSignature(
        `timestamp=${timestamp}`,
        apiSecret,
      );

      // Make request to account endpoint
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/v3/account`,
        params: {
          timestamp,
          signature,
        },
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      });

      // If we get a response, the API key is valid
      return true;
    } catch (error) {
      console.error('Error validating API key:', error);
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
      PENDING_CANCEL: 'canceled', // Treated as canceled in our system
      REJECTED: 'rejected',
      EXPIRED: 'expired',
      PENDING: 'new', // Treated as new in our system
    };

    // If we don't have a mapping, default to 'new'
    return statusMap[binanceStatus] || 'new';
  }
}
