// Binance Testnet Exchange Adapter

import {
  Exchange,
  TradingPair,
  OrderBook,
  Kline,
  Portfolio,
  Order,
  PerformanceMetrics,
} from '@/types/exchange';

import { BaseExchangeAdapter } from './baseExchangeAdapter';
import { getExchangeEndpoint } from '@/config/exchangeConfig';
import { SUPPORTED_EXCHANGES } from '../mockData/mockDataUtils';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';
import { makeApiRequest } from '@/utils/apiUtils';

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
      // Build URL
      const url = `${this.baseUrl}${endpoint}`;

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
        '/api/v3/exchangeInfo',
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
        '/api/v3/exchangeInfo',
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
        '/api/v3/depth',
        {
          symbol: formattedSymbol,
          limit,
        },
        weight,
      );

      // Format response
      return {
        symbol,
        exchangeId: this.exchangeId,
        bids: response.bids.map((bid: string[]) => ({
          price: parseFloat(bid[0]),
          quantity: parseFloat(bid[1]),
        })),
        asks: response.asks.map((ask: string[]) => ({
          price: parseFloat(ask[0]),
          quantity: parseFloat(ask[1]),
        })),
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
        '/api/v3/klines',
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
        '/api/v3/account',
        'GET',
        apiKeyId,
        {},
        10, // Weight: 10
      );

      // Format response
      const balances = response.balances
        .filter(
          (balance: any) =>
            parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0,
        )
        .map((balance: any) => ({
          asset: balance.asset,
          free: parseFloat(balance.free),
          locked: parseFloat(balance.locked),
          total: parseFloat(balance.free) + parseFloat(balance.locked),
        }));

      return {
        exchangeId: this.exchangeId,
        balances,
        totalValueUSD: 0, // This would be calculated based on current prices
        timestamp: Date.now(),
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
   */
  public async placeOrder(
    apiKeyId: string,
    order: Partial<Order>,
  ): Promise<Order> {
    try {
      if (!order.symbol || !order.side || !order.type) {
        throw new Error('Missing required order parameters');
      }

      // Convert symbol format from BTC/USDT to BTCUSDT
      const formattedSymbol = order.symbol.replace('/', '');

      // Prepare params
      const params: Record<string, string | number> = {
        symbol: formattedSymbol,
        side: order.side.toUpperCase(),
        type: order.type.toUpperCase(),
      };

      // Add quantity
      if (order.quantity) {
        params.quantity = order.quantity;
      }

      // Add price for limit orders
      if (order.type === 'limit' && order.price) {
        params.price = order.price;
      }

      // Add timeInForce for limit orders
      if (order.type === 'limit') {
        params.timeInForce = 'GTC'; // Good Till Canceled
      }

      // Make authenticated request to order endpoint
      const response = await this.makeAuthenticatedRequest(
        '/api/v3/order',
        'POST',
        apiKeyId,
        params,
        1, // Weight: 1
      );

      // Format response
      return {
        orderId: response.orderId.toString(),
        symbol: order.symbol,
        exchangeId: this.exchangeId,
        side: order.side,
        type: order.type,
        price: parseFloat(response.price) || order.price || 0,
        quantity: parseFloat(response.origQty),
        filledQuantity: parseFloat(response.executedQty),
        status: this.mapOrderStatus(response.status),
        timestamp: response.transactTime,
      };
    } catch (error) {
      console.error('Error placing order:', error);

      // Fallback to mock data
      return this.mockDataService.createOrder(apiKeyId, this.exchangeId, order);
    }
  }

  /**
   * Cancel an existing order on Binance Testnet.
   */
  public async cancelOrder(
    apiKeyId: string,
    orderId: string,
    symbol: string,
  ): Promise<boolean> {
    try {
      // Convert symbol format from BTC/USDT to BTCUSDT
      const formattedSymbol = symbol.replace('/', '');

      // Make authenticated request to cancel order endpoint
      await this.makeAuthenticatedRequest(
        '/api/v3/order',
        'DELETE',
        apiKeyId,
        {
          symbol: formattedSymbol,
          orderId,
        },
        1,
      ); // Weight: 1

      return true;
    } catch (error) {
      console.error('Error canceling order:', error);

      // Fallback to mock data
      return this.mockDataService.cancelOrder(apiKeyId, orderId);
    }
  }

  /**
   * Get all open orders for the user on Binance Testnet.
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
        '/api/v3/openOrders',
        'GET',
        apiKeyId,
        params,
        weight,
      );

      // Format response
      return response.map((order: any) => ({
        orderId: order.orderId.toString(),
        symbol: this.formatSymbol(order.symbol),
        exchangeId: this.exchangeId,
        side: order.side.toLowerCase(),
        type: order.type.toLowerCase(),
        price: parseFloat(order.price),
        quantity: parseFloat(order.origQty),
        filledQuantity: parseFloat(order.executedQty),
        status: this.mapOrderStatus(order.status),
        timestamp: order.time,
      }));
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
   */
  public async getOrderHistory(
    apiKeyId: string,
    symbol?: string,
    limit: number = 50,
  ): Promise<Order[]> {
    try {
      if (!symbol) {
        throw new Error('Symbol is required for order history');
      }

      // Convert symbol format from BTC/USDT to BTCUSDT
      const formattedSymbol = symbol.replace('/', '');

      // Make authenticated request to order history endpoint
      const response = await this.makeAuthenticatedRequest(
        '/api/v3/allOrders',
        'GET',
        apiKeyId,
        {
          symbol: formattedSymbol,
          limit,
        },
        10, // Weight: 10
      );

      // Format response
      return response.map((order: any) => ({
        orderId: order.orderId.toString(),
        symbol: this.formatSymbol(order.symbol),
        exchangeId: this.exchangeId,
        side: order.side.toLowerCase(),
        type: order.type.toLowerCase(),
        price: parseFloat(order.price),
        quantity: parseFloat(order.origQty),
        filledQuantity: parseFloat(order.executedQty),
        status: this.mapOrderStatus(order.status),
        timestamp: order.time,
      }));
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
        url: `${this.baseUrl}/api/v3/account`,
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
   */
  private mapOrderStatus(
    binanceStatus: string,
  ):
    | 'new'
    | 'partially_filled'
    | 'filled'
    | 'canceled'
    | 'rejected'
    | 'expired' {
    const statusMap: Record<
      string,
      | 'new'
      | 'partially_filled'
      | 'filled'
      | 'canceled'
      | 'rejected'
      | 'expired'
    > = {
      NEW: 'new',
      PARTIALLY_FILLED: 'partially_filled',
      FILLED: 'filled',
      CANCELED: 'canceled',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
    };

    return statusMap[binanceStatus] || 'new';
  }

  /**
   * Format symbol from BTCUSDT to BTC/USDT
   */
  private formatSymbol(binanceSymbol: string): string {
    // This is a simplified implementation
    // In a real implementation, we would need to know the base and quote assets
    // For now, we'll assume common patterns

    if (binanceSymbol.endsWith('USDT')) {
      return `${binanceSymbol.slice(0, -4)}/USDT`;
    } else if (binanceSymbol.endsWith('BTC')) {
      return `${binanceSymbol.slice(0, -3)}/BTC`;
    } else if (binanceSymbol.endsWith('ETH')) {
      return `${binanceSymbol.slice(0, -3)}/ETH`;
    } else if (binanceSymbol.endsWith('BNB')) {
      return `${binanceSymbol.slice(0, -3)}/BNB`;
    } else {
      // Default fallback
      return binanceSymbol;
    }
  }
}
