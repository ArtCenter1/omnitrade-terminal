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
  private readonly MAX_REQUESTS_PER_MINUTE = 10; // Ultra conservative limit for free tier (reduced from 15)
  private readonly REQUEST_WINDOW_MS = 60000; // 1 minute window
  private readonly RATE_LIMIT_COOLDOWN_MS = 300000; // 5 minute cooldown after hitting rate limit

  // Cache TTLs for different endpoint types (in seconds)
  private readonly cacheTtls: Record<string, number> = {
    // Market data endpoints
    'coins/markets': 7200, // 120 minutes (increased from 60)
    'coins/list': 86400, // 24 hours (increased from 8)
    'coins/categories/list': 86400, // 24 hours (increased from 8)
    'coins/categories': 86400, // 24 hours (increased from 8)

    // Static data that rarely changes
    'coins/*/contract/*': 28800, // 8 hours (increased from 4)
    'coins/*/history': 604800, // 7 days for historical data (increased from 72 hours)
    'asset_platforms': 604800, // 7 days (increased from 72 hours)
    'exchanges/list': 604800, // 7 days (increased from 72 hours)

    // Price data endpoints (more frequent updates needed)
    'simple/price': 900, // 15 minutes (increased from 10)
    'simple/token_price': 900, // 15 minutes (increased from 10)
    'coins/*/tickers': 900, // 15 minutes (increased from 10)

    // OHLC and chart data
    'coins/*/market_chart': 7200, // 120 minutes (increased from 60)
    'coins/*/ohlc': 7200, // 120 minutes (increased from 60)

    // Default for other endpoints
    default: 1800, // 30 minutes (increased from 10)
  };

  // Stale TTLs - how long to consider data usable after expiration (in seconds)
  private readonly staleTtls: Record<string, number> = {
    // Market data endpoints can be stale for longer
    'coins/markets': 86400, // 24 hours stale data is acceptable (increased from 4 hours)
    'coins/list': 604800, // 7 days (increased from 72 hours)
    'coins/categories/list': 604800, // 7 days (increased from 72 hours)
    'coins/categories': 604800, // 7 days (increased from 72 hours)

    // Static data can be stale for very long
    'coins/*/contract/*': 604800, // 7 days (increased from 72 hours)
    'coins/*/history': 5184000, // 60 days (increased from 30 days)
    'asset_platforms': 5184000, // 60 days (increased from 30 days)
    'exchanges/list': 5184000, // 60 days (increased from 30 days)

    // Price data should not be stale for too long, but we can still increase a bit
    'simple/price': 3600, // 60 minutes (increased from 30)
    'simple/token_price': 3600, // 60 minutes (increased from 30)
    'coins/*/tickers': 3600, // 60 minutes (increased from 30)

    // OHLC and chart data
    'coins/*/market_chart': 86400, // 24 hours (increased from 4)
    'coins/*/ohlc': 86400, // 24 hours (increased from 4)

    // Default for other endpoints
    default: 7200, // 120 minutes (increased from 60)
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
      failureThreshold: 1, // Reduced from 2 to be immediately sensitive to rate limiting
      resetTimeout: 600 * 1000, // 10 minutes (increased from 5 minutes)
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
    const underRateLimit = this.requestTimestamps.length < this.MAX_REQUESTS_PER_MINUTE;

    // Check if we've had a recent rate limit error
    const lastRateLimitError = this.circuitBreakerService.getLastFailureTime(this.CIRCUIT_NAME);
    const inCooldownPeriod = lastRateLimitError && (now - lastRateLimitError < this.RATE_LIMIT_COOLDOWN_MS);

    if (inCooldownPeriod) {
      this.logger.warn(`In rate limit cooldown period (${Math.round((now - lastRateLimitError) / 1000)}s elapsed of ${this.RATE_LIMIT_COOLDOWN_MS / 1000}s cooldown)`);
      // If we're in cooldown, only allow 1 request per minute (ultra conservative)
      return this.requestTimestamps.length === 0;
    }

    return underRateLimit;
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

      // If circuit is open and this is not a critical endpoint, return stale data, mock data, or error
      if (!circuitClosed && !isCritical) {
        this.logger.warn(`Circuit breaker open, blocking non-critical request to ${endpoint}`);

        // Try to get stale data from cache
        const staleData = await this.redisService.getWithoutExpiry(cacheKey);
        if (staleData) {
          this.logger.warn(`Using stale cache data for ${targetUrl} due to open circuit breaker`);
          return JSON.parse(staleData) as CoinGeckoResponse;
        }

        // Try to get mock data
        const mockData = await this.getMockDataForEndpoint(endpoint, params);
        if (mockData) {
          this.logger.warn(`Using mock data for ${targetUrl} due to open circuit breaker`);
          return mockData;
        }

        // No stale or mock data available, return error
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

          // Cache the mock data as real data with a short TTL
          // This helps prevent repeated mock data generation
          await this.redisService.set(cacheKey, JSON.stringify(mockData), 300); // 5 minutes

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
      this.logger.log(`Using cached mock data for ${endpoint}`);
      return JSON.parse(cachedMock) as CoinGeckoResponse;
    }

    // Try to get the most recent real data from cache, even if expired
    // This is better than generating mock data if we have real data
    const realCacheKey = `coingecko:${endpoint}:${JSON.stringify(params)}`;
    const staleRealData = await this.redisService.getWithoutExpiry(realCacheKey);

    if (staleRealData) {
      this.logger.log(`Using stale real data as mock for ${endpoint}`);
      const realData = JSON.parse(staleRealData) as CoinGeckoResponse;

      // Cache this as mock data for future use
      await this.redisService.set(mockCacheKey, staleRealData, 86400 * 30); // Cache for 30 days

      return realData;
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
    } else if (endpoint.match(/coins\/[^\/]+$/)) {
      // Mock data for any coin details, not just bitcoin
      const coinId = endpoint.split('/').pop() || 'bitcoin';
      mockData = this.generateMockCoinData(coinId, params);
    } else if (endpoint.includes('/tickers')) {
      // Mock data for tickers
      mockData = this.generateMockTickers(params);
    } else if (endpoint.includes('coins/list')) {
      // Mock data for coins list
      mockData = this.generateMockCoinsList();
    } else if (endpoint.includes('search')) {
      // Mock data for search
      mockData = this.generateMockSearch(params);
    } else {
      // For any other endpoint, generate a generic response
      mockData = { mock: true, endpoint, timestamp: new Date().toISOString() };
    }

    // Cache the mock data if generated
    if (mockData) {
      this.logger.log(`Generated and cached mock data for ${endpoint}`);
      await this.redisService.set(mockCacheKey, JSON.stringify(mockData), 86400 * 30); // Cache for 30 days
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

  /**
   * Generate mock data for any coin
   */
  private generateMockCoinData(coinId: string, params: Record<string, any>): CoinGeckoResponse {
    this.logger.log(`Generating mock data for coin: ${coinId}`);

    // Get coin info from our base coins list
    const baseCoins = [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', algorithm: 'SHA-256', category: 'Layer 1' },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', algorithm: 'Ethash', category: 'Layer 1' },
      { id: 'binancecoin', symbol: 'bnb', name: 'Binance Coin', algorithm: 'BEP-2', category: 'Exchange Token' },
      { id: 'ripple', symbol: 'xrp', name: 'XRP', algorithm: 'RPCA', category: 'Payment' },
      { id: 'cardano', symbol: 'ada', name: 'Cardano', algorithm: 'Ouroboros', category: 'Layer 1' },
      { id: 'solana', symbol: 'sol', name: 'Solana', algorithm: 'Proof of History', category: 'Layer 1' },
      { id: 'polkadot', symbol: 'dot', name: 'Polkadot', algorithm: 'NPoS', category: 'Layer 0' },
      { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', algorithm: 'Scrypt', category: 'Meme' },
      { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', algorithm: 'Avalanche', category: 'Layer 1' },
      { id: 'chainlink', symbol: 'link', name: 'Chainlink', algorithm: 'n/a', category: 'Oracle' },
    ];

    // Find the coin or use bitcoin as default
    const coinInfo = baseCoins.find(c => c.id === coinId) ||
                    { id: coinId, symbol: coinId.substring(0, 4), name: coinId.charAt(0).toUpperCase() + coinId.slice(1), algorithm: 'Unknown', category: 'Other' };

    // Generate price based on the coin
    const price = this.getRandomPrice(coinInfo.id);

    return {
      id: coinInfo.id,
      symbol: coinInfo.symbol,
      name: coinInfo.name,
      asset_platform_id: null,
      platforms: {
        '': '',
      },
      block_time_in_minutes: 10,
      hashing_algorithm: coinInfo.algorithm,
      categories: [coinInfo.category, 'Cryptocurrency'],
      public_notice: null,
      additional_notices: [],
      localization: {
        en: coinInfo.name,
        de: coinInfo.name,
        es: coinInfo.name,
        fr: coinInfo.name,
        it: coinInfo.name,
        pl: coinInfo.name,
        ro: coinInfo.name,
        hu: coinInfo.name,
        nl: coinInfo.name,
        pt: coinInfo.name,
        sv: coinInfo.name,
        vi: coinInfo.name,
        tr: coinInfo.name,
        ru: coinInfo.name,
        ja: coinInfo.name,
        zh: coinInfo.name,
        'zh-tw': coinInfo.name,
        ko: coinInfo.name,
        ar: coinInfo.name,
        th: coinInfo.name,
        id: coinInfo.name,
      },
      description: {
        en: `${coinInfo.name} is a cryptocurrency that aims to provide a decentralized solution for digital transactions.`,
      },
      image: {
        thumb: `https://assets.coingecko.com/coins/images/1/thumb/${coinInfo.id}.png?1547033579`,
        small: `https://assets.coingecko.com/coins/images/1/small/${coinInfo.id}.png?1547033579`,
        large: `https://assets.coingecko.com/coins/images/1/large/${coinInfo.id}.png?1547033579`,
      },
      market_data: {
        current_price: {
          usd: price,
          eur: price * 0.93,
          jpy: price * 150,
          gbp: price * 0.78,
          btc: price / this.getRandomPrice('bitcoin'),
          eth: price / this.getRandomPrice('ethereum'),
        },
        market_cap: {
          usd: price * 20000000,
          eur: price * 18600000,
          jpy: price * 3000000000,
          gbp: price * 15600000,
        },
        total_volume: {
          usd: price * 500000,
          eur: price * 465000,
          jpy: price * 75000000,
          gbp: price * 390000,
        },
        high_24h: {
          usd: price * 1.05,
          eur: price * 0.93 * 1.05,
        },
        low_24h: {
          usd: price * 0.95,
          eur: price * 0.93 * 0.95,
        },
        price_change_24h: (Math.random() * 2 - 1) * price * 0.05,
        price_change_percentage_24h: (Math.random() * 2 - 1) * 5,
        price_change_percentage_7d: (Math.random() * 2 - 1) * 10,
        price_change_percentage_14d: (Math.random() * 2 - 1) * 15,
        price_change_percentage_30d: (Math.random() * 2 - 1) * 20,
        price_change_percentage_60d: (Math.random() * 2 - 1) * 25,
        price_change_percentage_200d: (Math.random() * 2 - 1) * 40,
        price_change_percentage_1y: (Math.random() * 2 - 1) * 60,
        market_cap_change_24h: (Math.random() * 2 - 1) * price * 1000000,
        market_cap_change_percentage_24h: (Math.random() * 2 - 1) * 5,
        price_change_24h_in_currency: {
          usd: (Math.random() * 2 - 1) * price * 0.05,
          eur: (Math.random() * 2 - 1) * price * 0.05 * 0.93,
        },
        price_change_percentage_1h_in_currency: {
          usd: (Math.random() * 2 - 1) * 1,
          eur: (Math.random() * 2 - 1) * 1,
        },
        price_change_percentage_24h_in_currency: {
          usd: (Math.random() * 2 - 1) * 5,
          eur: (Math.random() * 2 - 1) * 5,
        },
        price_change_percentage_7d_in_currency: {
          usd: (Math.random() * 2 - 1) * 10,
          eur: (Math.random() * 2 - 1) * 10,
        },
        market_cap_change_24h_in_currency: {
          usd: (Math.random() * 2 - 1) * price * 1000000,
          eur: (Math.random() * 2 - 1) * price * 1000000 * 0.93,
        },
        market_cap_change_percentage_24h_in_currency: {
          usd: (Math.random() * 2 - 1) * 5,
          eur: (Math.random() * 2 - 1) * 5,
        },
        total_supply: 100000000,
        max_supply: coinInfo.id === 'bitcoin' ? 21000000 : 100000000,
        circulating_supply: 50000000,
        last_updated: new Date().toISOString(),
      },
      community_data: {
        facebook_likes: null,
        twitter_followers: Math.floor(Math.random() * 1000000),
        reddit_average_posts_48h: Math.floor(Math.random() * 50),
        reddit_average_comments_48h: Math.floor(Math.random() * 500),
        reddit_subscribers: Math.floor(Math.random() * 1000000),
        reddit_accounts_active_48h: Math.floor(Math.random() * 20000),
        telegram_channel_user_count: null,
      },
      developer_data: {
        forks: Math.floor(Math.random() * 10000),
        stars: Math.floor(Math.random() * 20000),
        subscribers: Math.floor(Math.random() * 5000),
        total_issues: Math.floor(Math.random() * 2000),
        closed_issues: Math.floor(Math.random() * 1800),
        pull_requests_merged: Math.floor(Math.random() * 3000),
        pull_request_contributors: Math.floor(Math.random() * 500),
        code_additions_deletions_4_weeks: {
          additions: Math.floor(Math.random() * 5000),
          deletions: Math.floor(Math.random() * 3000),
        },
        commit_count_4_weeks: Math.floor(Math.random() * 200),
      },
      public_interest_stats: {
        alexa_rank: Math.floor(Math.random() * 20000),
        bing_matches: null,
      },
      status_updates: [],
      last_updated: new Date().toISOString(),
      tickers: this.generateMockTickers({ coin: coinInfo.id }).tickers || [],
    };
  }

  /**
   * Generate mock data for Bitcoin (for backward compatibility)
   */
  private generateMockBitcoinData(params: Record<string, any>): CoinGeckoResponse {
    return this.generateMockCoinData('bitcoin', params);
  }

  /**
   * Generate mock data for tickers endpoint
   */
  private generateMockTickers(params: Record<string, any>): CoinGeckoResponse {
    const coinId = params.coin || 'bitcoin';
    const basePrice = this.getRandomPrice(coinId);

    const exchanges = [
      { name: 'Binance', identifier: 'binance', url: 'https://binance.com' },
      { name: 'Coinbase Exchange', identifier: 'coinbase', url: 'https://exchange.coinbase.com' },
      { name: 'Kraken', identifier: 'kraken', url: 'https://kraken.com' },
      { name: 'KuCoin', identifier: 'kucoin', url: 'https://kucoin.com' },
      { name: 'Huobi', identifier: 'huobi', url: 'https://huobi.com' },
      { name: 'Bitfinex', identifier: 'bitfinex', url: 'https://bitfinex.com' },
      { name: 'OKX', identifier: 'okx', url: 'https://okx.com' },
      { name: 'Bybit', identifier: 'bybit', url: 'https://bybit.com' },
      { name: 'Gate.io', identifier: 'gate', url: 'https://gate.io' },
      { name: 'Gemini', identifier: 'gemini', url: 'https://gemini.com' },
    ];

    const pairs = [
      { base: coinId, target: 'USD', market_type: 'spot' },
      { base: coinId, target: 'USDT', market_type: 'spot' },
      { base: coinId, target: 'BTC', market_type: 'spot' },
      { base: coinId, target: 'ETH', market_type: 'spot' },
      { base: coinId, target: 'EUR', market_type: 'spot' },
      { base: coinId, target: 'USDT', market_type: 'futures' },
      { base: coinId, target: 'USDT', market_type: 'perpetual' },
    ];

    const tickers = [];

    for (const exchange of exchanges) {
      // Each exchange has a random subset of pairs
      const exchangePairs = pairs.filter(() => Math.random() > 0.3);

      for (const pair of exchangePairs) {
        // Add some randomness to the price
        const tickerPrice = basePrice * (0.95 + Math.random() * 0.1);
        const volume = Math.random() * 10000 * basePrice;

        tickers.push({
          base: pair.base,
          target: pair.target,
          market: {
            name: exchange.name,
            identifier: exchange.identifier,
            has_trading_incentive: false,
          },
          last: tickerPrice,
          volume: volume,
          converted_last: {
            btc: tickerPrice / this.getRandomPrice('bitcoin'),
            eth: tickerPrice / this.getRandomPrice('ethereum'),
            usd: tickerPrice,
          },
          converted_volume: {
            btc: volume / this.getRandomPrice('bitcoin'),
            eth: volume / this.getRandomPrice('ethereum'),
            usd: volume,
          },
          trust_score: ['green', 'yellow', 'red'][Math.floor(Math.random() * 3)],
          bid_ask_spread_percentage: Math.random() * 2,
          timestamp: new Date().toISOString(),
          last_traded_at: new Date().toISOString(),
          last_fetch_at: new Date().toISOString(),
          is_anomaly: false,
          is_stale: false,
          trade_url: `${exchange.url}/trade/${pair.base}_${pair.target}`,
          token_info_url: null,
          coin_id: coinId,
          target_coin_id: pair.target.toLowerCase(),
        });
      }
    }

    return {
      name: coinId,
      tickers,
    };
  }

  /**
   * Generate mock data for coins/list endpoint
   */
  private generateMockCoinsList(): CoinGeckoResponse {
    const coins = [
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
      { id: 'polygon', symbol: 'matic', name: 'Polygon' },
      { id: 'litecoin', symbol: 'ltc', name: 'Litecoin' },
      { id: 'uniswap', symbol: 'uni', name: 'Uniswap' },
      { id: 'stellar', symbol: 'xlm', name: 'Stellar' },
      { id: 'cosmos', symbol: 'atom', name: 'Cosmos' },
      { id: 'tron', symbol: 'trx', name: 'TRON' },
      { id: 'monero', symbol: 'xmr', name: 'Monero' },
      { id: 'ethereum-classic', symbol: 'etc', name: 'Ethereum Classic' },
      { id: 'filecoin', symbol: 'fil', name: 'Filecoin' },
      { id: 'hedera-hashgraph', symbol: 'hbar', name: 'Hedera' },
    ];

    // Generate 100 more random coins
    for (let i = 0; i < 100; i++) {
      const id = `mock-coin-${i}`;
      const symbol = `mc${i}`;
      const name = `MockCoin ${i}`;

      coins.push({ id, symbol, name });
    }

    return coins;
  }

  /**
   * Generate mock data for search endpoint
   */
  private generateMockSearch(params: Record<string, any>): CoinGeckoResponse {
    const query = (params.query as string || '').toLowerCase();
    const coins = this.generateMockCoinsList() as any[];

    // Filter coins based on query
    const filteredCoins = coins.filter(coin =>
      coin.id.includes(query) ||
      coin.symbol.includes(query) ||
      coin.name.toLowerCase().includes(query)
    ).slice(0, 10);

    return {
      coins: filteredCoins,
      exchanges: [],
      icos: [],
      categories: [],
      nfts: [],
    };
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

          // Cap the wait time at 300 seconds (increased from 120)
          waitTime = Math.min(waitTime, 300000);

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
