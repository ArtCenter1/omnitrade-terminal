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

  // Cache TTLs for different endpoint types (in seconds)
  private readonly cacheTtls: Record<string, number> = {
    // Market data endpoints
    'coins/markets': 600, // 10 minutes (increased from 5)
    'coins/list': 7200, // 2 hours (increased from 1)
    'coins/categories/list': 7200, // 2 hours (increased from 1)
    'coins/categories': 7200, // 2 hours

    // Static data that rarely changes
    'coins/*/contract/*': 3600, // 1 hour
    'coins/*/history': 86400, // 24 hours for historical data
    'asset_platforms': 86400, // 24 hours
    'exchanges/list': 86400, // 24 hours

    // Price data endpoints (more frequent updates needed)
    'simple/price': 120, // 2 minutes (increased from 1)
    'simple/token_price': 120, // 2 minutes (increased from 1)
    'coins/*/tickers': 60, // 1 minute (increased from 30 seconds)

    // OHLC and chart data
    'coins/*/market_chart': 600, // 10 minutes (increased from 5)
    'coins/*/ohlc': 600, // 10 minutes (increased from 5)

    // Default for other endpoints
    default: 120, // 2 minutes (increased from 1)
  };

  // Stale TTLs - how long to consider data usable after expiration (in seconds)
  private readonly staleTtls: Record<string, number> = {
    // Market data endpoints can be stale for longer
    'coins/markets': 3600, // 1 hour stale data is acceptable
    'coins/list': 86400, // 24 hours
    'coins/categories/list': 86400, // 24 hours
    'coins/categories': 86400, // 24 hours

    // Static data can be stale for very long
    'coins/*/contract/*': 86400, // 24 hours
    'coins/*/history': 604800, // 7 days
    'asset_platforms': 604800, // 7 days
    'exchanges/list': 604800, // 7 days

    // Price data should not be stale for too long
    'simple/price': 300, // 5 minutes
    'simple/token_price': 300, // 5 minutes
    'coins/*/tickers': 300, // 5 minutes

    // OHLC and chart data
    'coins/*/market_chart': 3600, // 1 hour
    'coins/*/ohlc': 3600, // 1 hour

    // Default for other endpoints
    default: 600, // 10 minutes
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

  constructor(
    private readonly redisService: RedisService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {
    // Register the CoinGecko circuit breaker with custom config
    this.circuitBreakerService.registerCircuit(this.CIRCUIT_NAME, {
      failureThreshold: 5,
      resetTimeout: 60 * 1000, // 1 minute
      halfOpenMaxRequests: 3,
    });
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
        // Make the request to CoinGecko with retry logic as a last resort
        const result = await this.makeRequestWithRetry(
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
  private async makeRequestWithRetry(
    method: string,
    url: string,
    params: Record<string, any>,
    cacheKey: string,
    cacheTtl: number,
    retryCount = 0,
    initialBackoff = 1000, // 1 second initial backoff
  ): Promise<CoinGeckoResponse | ErrorResponse> {
    const maxRetries = 3;

    try {
      // Make the request to CoinGecko
      const response = await axios({
        method,
        url,
        params,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
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
          // Use exponential backoff
          const waitTime = initialBackoff * Math.pow(2, retryCount);
          this.logger.warn(`Retrying after ${waitTime}ms`);

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
          let waitTime = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : initialBackoff * Math.pow(2, retryCount);

          // Cap the wait time at 60 seconds
          waitTime = Math.min(waitTime, 60000);

          this.logger.warn(
            `Rate limited by CoinGecko. Retrying after ${waitTime}ms. Retry ${retryCount + 1}/${maxRetries}`,
          );

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
