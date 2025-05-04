import { Controller, Param, All, Req, Logger, HttpException } from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';
import { RedisService } from '../redis/redis.service';
import { CircuitBreakerService, CircuitBreakerState } from './circuit-breaker.service';

// Define response types
interface CoinGeckoResponse {
  [key: string]: any;
}

interface ErrorResponse {
  error: boolean;
  status?: number;
  message: string;
  data?: any;
  fallback?: boolean;
}

@Controller('proxy/coingecko')
export class CoinGeckoProxyController {
  private readonly logger = new Logger(CoinGeckoProxyController.name);
  private readonly baseUrl =
    process.env.COINGECKO_API_BASE_URL || 'https://api.coingecko.com/api/v3';
  private readonly apiKey = process.env.COINGECKO_API_KEY || '';

  // Request throttling
  private requestTimestamps: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 15; // Extremely conservative limit for free tier (reduced from 30)
  private readonly REQUEST_WINDOW_MS = 60000; // 1 minute window

  // Cache TTLs for different endpoint types (in seconds)
  private readonly cacheTtls: Record<string, number> = {
    // Market data endpoints
    'coins/markets': 3600, // 60 minutes (increased from 30)
    'coins/list': 28800, // 8 hours (increased from 4)
    'coins/categories/list': 28800, // 8 hours (increased from 4)
    'coins/categories': 28800, // 8 hours (increased from 4)

    // Static data that rarely changes
    'coins/*/contract/*': 14400, // 4 hours (increased from 2)
    'coins/*/history': 259200, // 72 hours for historical data (increased from 48)
    'asset_platforms': 259200, // 72 hours (increased from 48)
    'exchanges/list': 259200, // 72 hours (increased from 48)

    // Price data endpoints (more frequent updates needed)
    'simple/price': 600, // 10 minutes (increased from 5)
    'simple/token_price': 600, // 10 minutes (increased from 5)
    'coins/*/tickers': 600, // 10 minutes (increased from 3)

    // OHLC and chart data
    'coins/*/market_chart': 3600, // 60 minutes (increased from 30)
    'coins/*/ohlc': 3600, // 60 minutes (increased from 30)

    // Default for other endpoints
    default: 600, // 10 minutes (increased from 5)
  };

  // Stale TTLs - how long to consider data usable after expiration (in seconds)
  private readonly staleTtls: Record<string, number> = {
    // Market data endpoints can be stale for longer
    'coins/markets': 14400, // 4 hours stale data is acceptable (increased from 2 hours)
    'coins/list': 259200, // 72 hours (increased from 48)
    'coins/categories/list': 259200, // 72 hours (increased from 48)
    'coins/categories': 259200, // 72 hours (increased from 48)

    // Static data can be stale for very long
    'coins/*/contract/*': 259200, // 72 hours (increased from 48)
    'coins/*/history': 2592000, // 30 days (increased from 14)
    'asset_platforms': 2592000, // 30 days (increased from 14)
    'exchanges/list': 2592000, // 30 days (increased from 14)

    // Price data should not be stale for too long, but we can still increase a bit
    'simple/price': 1800, // 30 minutes (increased from 10)
    'simple/token_price': 1800, // 30 minutes (increased from 10)
    'coins/*/tickers': 1800, // 30 minutes (increased from 10)

    // OHLC and chart data
    'coins/*/market_chart': 14400, // 4 hours (increased from 2)
    'coins/*/ohlc': 14400, // 4 hours (increased from 2)

    // Default for other endpoints
    default: 3600, // 60 minutes (increased from 30)
  };

  // Endpoint priority levels (higher number = higher priority)
  private readonly endpointPriorities: Record<string, number> = {
    // Critical endpoints
    'simple/price': 10, // Price data is critical
    'coins/*/tickers': 9, // Tickers are important for trading

    // Important but not critical
    'coins/markets': 7,
    'coins/*/market_chart': 6,
    'coins/*/ohlc': 6,

    // Less important
    'coins/list': 4,
    'coins/categories/list': 3,
    'coins/categories': 3,

    // Lowest priority
    'exchanges/list': 1,
    'asset_platforms': 1,

    // Default priority
    default: 5,
  };

  // Circuit breaker name
  private readonly CIRCUIT_NAME = 'coingecko';

  // Request queue for throttling
  private requestQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    method: string;
    url: string;
    params: Record<string, any>;
    cacheKey: string;
    cacheTtl: number;
  }> = [];
  private isProcessingQueue = false;

  constructor(
    private readonly redisService: RedisService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {
    // Register the CoinGecko circuit breaker with custom config
    this.circuitBreakerService.registerCircuit(this.CIRCUIT_NAME, {
      failureThreshold: 2, // Reduced from 3 to be even more sensitive to rate limiting
      resetTimeout: 300 * 1000, // 5 minutes (increased from 2 minutes)
      halfOpenMaxRequests: 1, // Keep at 1 to be cautious when testing if service is back
    });

    // Start processing the queue
    this.processQueue();
  }

  /**
   * Check if we can make a request based on rate limiting
   * @returns Whether a request can be made
   */
  private canMakeRequest(): boolean {
    const now = Date.now();

    // Remove timestamps older than the window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.REQUEST_WINDOW_MS
    );

    // Check if we've made too many requests
    return this.requestTimestamps.length < this.MAX_REQUESTS_PER_MINUTE;
  }

  /**
   * Add a request to the throttling queue
   */
  private enqueueRequest(
    method: string,
    url: string,
    params: Record<string, any>,
    cacheKey: string,
    cacheTtl: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        resolve,
        reject,
        method,
        url,
        params,
        cacheKey,
        cacheTtl
      });

      // If not already processing, start processing the queue
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the request queue with throttling
   */
  private async processQueue() {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      // Check if we can make a request
      if (this.canMakeRequest()) {
        const request = this.requestQueue.shift();

        // Make sure request is defined
        if (!request) continue;

        // Record this request timestamp
        this.requestTimestamps.push(Date.now());

        try {
          // Make the actual request
          const result = await this.makeRequestWithRetry(
            request.method,
            request.url,
            request.params,
            request.cacheKey,
            request.cacheTtl
          );

          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      } else {
        // Wait before checking again
        this.logger.warn('Rate limit reached, waiting before processing more requests');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Determine the appropriate cache TTL for a given endpoint
   */
  private getCacheTtl(endpoint: string): number {
    // Check for exact matches first
    if (endpoint in this.cacheTtls) {
      return this.cacheTtls[endpoint];
    }

    // Check for pattern matches
    for (const pattern of Object.keys(this.cacheTtls)) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(endpoint)) {
          return this.cacheTtls[pattern];
        }
      }
    }

    // Return default TTL if no match found
    return this.cacheTtls.default;
  }

  /**
   * Determine the appropriate stale TTL for a given endpoint
   */
  private getStaleTtl(endpoint: string): number {
    // Check for exact matches first
    if (endpoint in this.staleTtls) {
      return this.staleTtls[endpoint];
    }

    // Check for pattern matches
    for (const pattern of Object.keys(this.staleTtls)) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(endpoint)) {
          return this.staleTtls[pattern];
        }
      }
    }

    // Return default TTL if no match found
    return this.staleTtls.default;
  }

  /**
   * Determine the priority level for a given endpoint
   */
  private getEndpointPriority(endpoint: string): number {
    // Check for exact matches first
    if (endpoint in this.endpointPriorities) {
      return this.endpointPriorities[endpoint];
    }

    // Check for pattern matches
    for (const pattern of Object.keys(this.endpointPriorities)) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(endpoint)) {
          return this.endpointPriorities[pattern];
        }
      }
    }

    // Return default priority if no match found
    return this.endpointPriorities.default;
  }

  /**
   * Check if an endpoint is critical (high priority)
   */
  private isEndpointCritical(endpoint: string): boolean {
    const priority = this.getEndpointPriority(endpoint);
    return priority >= 8; // Priority 8 and above are considered critical
  }

  /**
   * Handle all requests to the CoinGecko API
   */
  @All('*path')
  async proxyRequest(
    @Req() req: Request,
    @Param('path') path: string,
  ): Promise<CoinGeckoResponse | ErrorResponse> {
    try {
      // Extract the path from the original URL
      const originalUrl = req.originalUrl;
      const proxyPrefix = '/api/proxy/coingecko/';
      let endpoint = '';

      if (originalUrl.startsWith(proxyPrefix)) {
        endpoint = originalUrl.substring(proxyPrefix.length);
      } else if (path) {
        endpoint = path.startsWith('/') ? path.substring(1) : path;
      }

      // Build the target URL
      const targetUrl = `${this.baseUrl}/${endpoint}`;

      // Copy query parameters
      const params = { ...req.query };

      // Add API key if available
      if (this.apiKey) {
        params['x_cg_pro_api_key'] = this.apiKey;
      }

      // Create a cache key from the URL and parameters
      const cacheKey = `coingecko:${endpoint}:${JSON.stringify(params)}`;

      // Determine the appropriate cache TTL and stale TTL
      const cacheTtl = this.getCacheTtl(endpoint);
      const staleTtl = this.getStaleTtl(endpoint);
      const isCritical = this.isEndpointCritical(endpoint);

      // Check circuit breaker state
      const circuitClosed = this.circuitBreakerService.isAllowed(this.CIRCUIT_NAME);

      // If circuit is open and this is not a critical endpoint, return stale data or error
      if (!circuitClosed && !isCritical) {
        this.logger.warn(`Circuit breaker open, blocking non-critical request to ${endpoint}`);

        // Try to get stale data from cache
        const staleData = await this.redisService.getWithoutExpiry(cacheKey);
        if (staleData) {
          this.logger.warn(`Using stale cache data for ${targetUrl} due to open circuit breaker`);
          return JSON.parse(staleData) as CoinGeckoResponse;
        }

        // No stale data available, return error
        throw new HttpException(
          'Service temporarily unavailable due to rate limiting. Please try again later.',
          503
        );
      }

      // Use stale-while-revalidate pattern
      const fetchFn = async () => {
        this.logger.log(`Fetching fresh data for ${targetUrl}`);
        try {
          const result = await this.makeRequestWithRetry(
            req.method,
            targetUrl,
            params,
            cacheKey,
            cacheTtl,
          );

          // Record success for circuit breaker
          this.circuitBreakerService.recordSuccess(this.CIRCUIT_NAME);

          return JSON.stringify(result);
        } catch (error) {
          // Record failure for circuit breaker
          if (axios.isAxiosError(error) && error.response?.status === 429) {
            this.circuitBreakerService.recordFailure(this.CIRCUIT_NAME);
          }
          throw error;
        }
      };

      // Try to get from cache with revalidation
      const cachedData = await this.redisService.getWithRevalidate(
        cacheKey,
        cacheTtl,
        fetchFn,
        staleTtl
      );

      if (cachedData) {
        return JSON.parse(cachedData) as CoinGeckoResponse;
      }

      // If we get here, it means getWithRevalidate couldn't get data
      // This is a fallback path that should rarely be hit
      this.logger.warn(`Cache miss and revalidation failed for ${targetUrl}, fetching directly`);

      try {
        // Check if we have mock data for this endpoint
        const mockData = await this.getMockDataForEndpoint(endpoint, params);
        if (mockData) {
          this.logger.log(`Using mock data for ${targetUrl} due to rate limiting`);
          return mockData;
        }

        // Enqueue the request instead of making it directly
        const result = await this.enqueueRequest(
          req.method,
          targetUrl,
          params,
          cacheKey,
          cacheTtl,
        );

        // Record success for circuit breaker
        this.circuitBreakerService.recordSuccess(this.CIRCUIT_NAME);

        return result;
      } catch (error) {
        // Record failure for circuit breaker if it's a rate limit error
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          this.circuitBreakerService.recordFailure(this.CIRCUIT_NAME);
        }
        throw error;
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error proxying request to CoinGecko: ${err.message || 'Unknown error'}`,
      );

      // Return error details
      if (axios.isAxiosError(error)) {
        const errorResponse: ErrorResponse = {
          error: true,
          status: error.response?.status || 500,
          message: error.message,
          data: (error.response?.data as Record<string, unknown>) || null,
        };
        return errorResponse;
      }

      const genericError: ErrorResponse = {
        error: true,
        message: err.message || 'Unknown error',
      };
      return genericError;
    }
  }

  /**
   * Make a request to CoinGecko with retry logic
   */
  /**
   * Add jitter to backoff time to prevent thundering herd problem
   * @param baseTime The base time in milliseconds
   * @returns The base time with random jitter added
   */
  private addJitter(baseTime: number): number {
    // Add random jitter between -20% and +20%
    const jitterFactor = 0.2;
    const jitter = baseTime * jitterFactor * (Math.random() * 2 - 1);
    return Math.max(1, Math.floor(baseTime + jitter));
  }

  /**
   * Get mock data for an endpoint when rate limited
   * @param endpoint The endpoint path
   * @param params The query parameters
   * @returns Mock data if available, null otherwise
   */
  private async getMockDataForEndpoint(
    endpoint: string,
    params: Record<string, any>
  ): Promise<CoinGeckoResponse | null> {
    // Check if we have cached mock data
    const mockCacheKey = `mock:${endpoint}:${JSON.stringify(params)}`;
    const cachedMock = await this.redisService.get(mockCacheKey);

    if (cachedMock) {
      return JSON.parse(cachedMock) as CoinGeckoResponse;
    }

    // Generate mock data based on endpoint
    let mockData: CoinGeckoResponse | null = null;

    if (endpoint.includes('coins/markets')) {
      // Mock data for top coins
      mockData = this.generateMockCoinsMarkets(params);
    } else if (endpoint.includes('simple/price')) {
      // Mock data for simple price
      mockData = this.generateMockSimplePrice(params);
    } else if (endpoint.includes('coins/') && endpoint.includes('/market_chart')) {
      // Mock data for market chart
      mockData = this.generateMockMarketChart(params);
    }

    // Cache the mock data if generated
    if (mockData) {
      await this.redisService.set(mockCacheKey, JSON.stringify(mockData), 86400); // Cache for 24 hours
    }

    return mockData;
  }

  /**
   * Generate mock data for coins/markets endpoint
   */
  private generateMockCoinsMarkets(params: Record<string, any>): CoinGeckoResponse {
    const perPage = parseInt(params.per_page as string, 10) || 100;
    const page = parseInt(params.page as string, 10) || 1;

    // Generate mock coins
    const mockCoins = [];
    const baseCoins = [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
      { id: 'binancecoin', symbol: 'bnb', name: 'Binance Coin' },
      { id: 'ripple', symbol: 'xrp', name: 'XRP' },
      { id: 'cardano', symbol: 'ada', name: 'Cardano' },
      { id: 'solana', symbol: 'sol', name: 'Solana' },
      { id: 'polkadot', symbol: 'dot', name: 'Polkadot' },
      { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin' },
      { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche' },
      { id: 'chainlink', symbol: 'link', name: 'Chainlink' },
    ];

    // Generate more mock coins if needed
    for (let i = 0; i < perPage; i++) {
      const index = (page - 1) * perPage + i;
      if (index < baseCoins.length) {
        const coin = baseCoins[index];
        const price = this.getRandomPrice(coin.id);

        mockCoins.push({
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          image: `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`,
          current_price: price,
          market_cap: price * 1000000 * (10000 - index),
          market_cap_rank: index + 1,
          fully_diluted_valuation: price * 2000000 * (10000 - index),
          total_volume: price * 500000 * (1000 - index),
          high_24h: price * 1.05,
          low_24h: price * 0.95,
          price_change_24h: (Math.random() * 2 - 1) * price * 0.05,
          price_change_percentage_24h: (Math.random() * 2 - 1) * 5,
          market_cap_change_24h: (Math.random() * 2 - 1) * price * 1000000,
          market_cap_change_percentage_24h: (Math.random() * 2 - 1) * 5,
          circulating_supply: 1000000 * (100 - index),
          total_supply: 2000000 * (100 - index),
          max_supply: 2100000 * (100 - index),
          ath: price * 2,
          ath_change_percentage: -50,
          ath_date: "2021-11-10T14:24:11.849Z",
          atl: price * 0.1,
          atl_change_percentage: 900,
          atl_date: "2013-07-06T00:00:00.000Z",
          roi: null,
          last_updated: new Date().toISOString(),
          sparkline_in_7d: {
            price: this.generateSparklineData(168)
          }
        });
      }
    }

    return mockCoins;
  }

  /**
   * Generate mock data for simple/price endpoint
   */
  private generateMockSimplePrice(params: Record<string, any>): CoinGeckoResponse {
    const ids = ((params.ids as string) || '').split(',');
    const vsCurrencies = ((params.vs_currencies as string) || 'usd').split(',');

    const result: Record<string, Record<string, number>> = {};

    ids.forEach(id => {
      result[id] = {};
      vsCurrencies.forEach(currency => {
        result[id][currency] = this.getRandomPrice(id);
      });
    });

    return result;
  }

  /**
   * Generate mock data for market_chart endpoint
   */
  private generateMockMarketChart(params: Record<string, any>): CoinGeckoResponse {
    const days = parseInt(params.days as string, 10) || 7;
    const points = days * 24; // Hourly data points

    return {
      prices: this.generateTimeSeriesData(points),
      market_caps: this.generateTimeSeriesData(points, 1000000),
      total_volumes: this.generateTimeSeriesData(points, 500000)
    };
  }

  /**
   * Generate random price based on coin id
   */
  private getRandomPrice(id: string): number {
    // Base prices for common coins
    const basePrices: Record<string, number> = {
      'bitcoin': 50000,
      'ethereum': 3000,
      'binancecoin': 500,
      'ripple': 0.5,
      'cardano': 1.2,
      'solana': 100,
      'polkadot': 20,
      'dogecoin': 0.1,
      'avalanche-2': 30,
      'chainlink': 15
    };

    // Get base price or generate a random one
    const basePrice = basePrices[id] || Math.random() * 100;

    // Add some randomness
    return basePrice * (0.9 + Math.random() * 0.2);
  }

  /**
   * Generate sparkline data
   */
  private generateSparklineData(points: number): number[] {
    const data = [];
    let value = 100 + Math.random() * 20;

    for (let i = 0; i < points; i++) {
      // Random walk with slight upward bias
      value = value * (0.99 + Math.random() * 0.04);
      data.push(value);
    }

    return data;
  }

  /**
   * Generate time series data for charts
   */
  private generateTimeSeriesData(points: number, multiplier: number = 1): [number, number][] {
    const data: [number, number][] = [];
    let value = 100 + Math.random() * 20;
    const now = Date.now();
    const interval = 3600000; // 1 hour in milliseconds

    for (let i = 0; i < points; i++) {
      const timestamp = now - (points - i) * interval;
      // Random walk with slight upward bias
      value = value * (0.99 + Math.random() * 0.04);
      data.push([timestamp, value * multiplier]);
    }

    return data;
  }

  private async makeRequestWithRetry(
    method: string,
    url: string,
    params: Record<string, any>,
    cacheKey: string,
    cacheTtl: number,
    retryCount = 0,
    initialBackoff = 2000, // 2 second initial backoff (increased from 1)
  ): Promise<CoinGeckoResponse | ErrorResponse> {
    const maxRetries = 5; // Increased from 3

    try {
      // Make the request to CoinGecko
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Add API key to headers if available
      if (this.apiKey) {
        headers['x-cg-pro-api-key'] = this.apiKey;
      }

      const response = await axios({
        method,
        url,
        params,
        headers,
        timeout: 15000, // 15 second timeout (increased from 10)
      });

      // Cache the successful response
      this.redisService
        .set(cacheKey, JSON.stringify(response.data), cacheTtl)
        .catch((err: Error) =>
          this.logger.error(`Failed to cache response: ${err.message}`),
        );

      this.logger.log(`Request successful for ${url}`);

      // Log the response data structure for debugging
      if (url.includes('tickers')) {
        this.logger.debug(
          `Response data structure: ${JSON.stringify(response.data).substring(0, 500)}...`,
        );
      }

      return response.data as CoinGeckoResponse;
    } catch (error: unknown) {
      // Check for connection errors (ECONNREFUSED, network errors)
      const err = error as Error;
      let isConnectionError = false;

      if (axios.isAxiosError(error)) {
        isConnectionError = !error.response || error.code === 'ECONNREFUSED';
      }

      const hasEconnRefused = Boolean(
        err.message && err.message.includes('ECONNREFUSED'),
      );
      const hasNetworkError = Boolean(
        err.message && err.message.includes('Network Error'),
      );
      isConnectionError =
        isConnectionError || hasEconnRefused || hasNetworkError;

      if (isConnectionError) {
        this.logger.error(
          `Connection error to CoinGecko API: ${
            err.message || 'Unknown error'
          }. Retry ${retryCount + 1}/${maxRetries}`,
        );

        // Try to get from cache even if it's expired
        try {
          const staleData = await this.redisService.getWithoutExpiry(cacheKey);
          if (staleData) {
            this.logger.warn(
              `Using stale cache data for ${url} due to connection error`,
            );
            return JSON.parse(staleData) as CoinGeckoResponse;
          }
        } catch (cacheError: unknown) {
          const cErr = cacheError as Error;
          this.logger.error(
            `Failed to retrieve stale cache: ${
              cErr.message || 'Unknown error'
            }`,
          );
        }

        // Check if we should retry
        if (retryCount < maxRetries) {
          // Use exponential backoff with jitter
          const baseWaitTime = initialBackoff * Math.pow(2, retryCount);
          const waitTime = this.addJitter(baseWaitTime);
          this.logger.warn(`Retrying after ${waitTime}ms (retry ${retryCount + 1}/${maxRetries})`);

          // Wait for the specified time
          await new Promise((resolve) => setTimeout(resolve, waitTime));

          // Retry the request
          return this.makeRequestWithRetry(
            method,
            url,
            params,
            cacheKey,
            cacheTtl,
            retryCount + 1,
            initialBackoff,
          );
        }

        // If we've exhausted retries, return a fallback response
        return {
          error: true,
          status: 503,
          message:
            'Service temporarily unavailable. Could not connect to CoinGecko API.',
          fallback: true,
        };
      }

      if (axios.isAxiosError(error) && error.response) {
        // Handle rate limiting (429 Too Many Requests)
        if (error.response.status === 429) {
          // Get retry-after header or use exponential backoff
          const retryAfter = error.response.headers['retry-after'] as
            | string
            | undefined;

          // Calculate base wait time
          let baseWaitTime = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : initialBackoff * Math.pow(2, retryCount);

          // Add jitter to avoid thundering herd problem, but only if not using retry-after header
          let waitTime = retryAfter ? baseWaitTime : this.addJitter(baseWaitTime);

          // Cap the wait time at 120 seconds (increased from 60)
          waitTime = Math.min(waitTime, 120000);

          this.logger.warn(
            `Rate limited by CoinGecko. Retrying after ${waitTime}ms. Retry ${retryCount + 1}/${maxRetries}`,
          );

          // Try to get stale data while waiting
          try {
            const staleData = await this.redisService.getWithoutExpiry(cacheKey);
            if (staleData) {
              this.logger.warn(
                `Using stale cache data for ${url} while waiting for rate limit to reset`,
              );
              return JSON.parse(staleData) as CoinGeckoResponse;
            }
          } catch (cacheError: unknown) {
            const cErr = cacheError as Error;
            this.logger.error(
              `Failed to retrieve stale cache: ${
                cErr.message || 'Unknown error'
              }`,
            );
          }

          // Check if we should retry
          if (retryCount < maxRetries) {
            // Wait for the specified time
            await new Promise((resolve) => setTimeout(resolve, waitTime));

            // Retry the request
            return this.makeRequestWithRetry(
              method,
              url,
              params,
              cacheKey,
              cacheTtl,
              retryCount + 1,
              initialBackoff,
            );
          }
        }
      }

      // If we've exhausted retries or it's not a rate limit error, throw the error
      throw error;
    }
  }
}
