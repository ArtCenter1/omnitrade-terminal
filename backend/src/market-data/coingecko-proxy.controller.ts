import {
  Controller,
  Get,
  Query,
  Param,
  All,
  Req,
  Injectable,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';
import { RedisService } from '../redis/redis.service';

@Controller('proxy/coingecko')
export class CoinGeckoProxyController {
  private readonly logger = new Logger(CoinGeckoProxyController.name);
  private readonly defaultCacheTtl = 60; // Default cache TTL in seconds
  private readonly baseUrl =
    process.env.COINGECKO_API_BASE_URL || 'https://api.coingecko.com/api/v3';
  private readonly apiKey = process.env.COINGECKO_API_KEY || '';

  // Cache TTLs for different endpoint types (in seconds)
  private readonly cacheTtls: Record<string, number> = {
    // Market data endpoints
    'coins/markets': 300, // 5 minutes
    'coins/list': 3600, // 1 hour
    'coins/categories/list': 3600, // 1 hour

    // Price data endpoints
    'simple/price': 60, // 1 minute
    'simple/token_price': 60, // 1 minute
    'coins/*/tickers': 30, // 30 seconds

    // OHLC and chart data
    'coins/*/market_chart': 300, // 5 minutes
    'coins/*/ohlc': 300, // 5 minutes

    // Default for other endpoints
    default: 60, // 1 minute
  };

  constructor(private readonly redisService: RedisService) {}

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
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(endpoint)) {
          return this.cacheTtls[pattern];
        }
      }
    }

    // Return default TTL if no match found
    return this.cacheTtls.default;
  }

  /**
   * Handle all requests to the CoinGecko API
   */
  @All('*path')
  async proxyRequest(@Req() req: Request, @Param('path') path: string) {
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

      // Try to get from cache first
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        this.logger.debug(`Cache hit for ${targetUrl}`);
        return JSON.parse(cachedData);
      }

      this.logger.log(`Proxying request to: ${targetUrl}`);
      this.logger.debug(`Query params: ${JSON.stringify(params)}`);

      // Determine the appropriate cache TTL
      const cacheTtl = this.getCacheTtl(endpoint);

      // Make the request to CoinGecko with retry logic
      return await this.makeRequestWithRetry(
        req.method,
        targetUrl,
        params,
        cacheKey,
        cacheTtl,
      );
    } catch (error) {
      this.logger.error(
        `Error proxying request to CoinGecko: ${error.message}`,
      );

      // Return error details
      if (axios.isAxiosError(error)) {
        return {
          error: true,
          status: error.response?.status || 500,
          message: error.message,
          data: error.response?.data || null,
        };
      }

      return {
        error: true,
        message: error.message || 'Unknown error',
      };
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
  ): Promise<any> {
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
        .catch((err) =>
          this.logger.error(`Failed to cache response: ${err.message}`),
        );

      this.logger.log(`Request successful for ${url}`);

      // Log the response data structure for debugging
      if (url.includes('tickers')) {
        this.logger.debug(
          `Response data structure: ${JSON.stringify(response.data).substring(0, 500)}...`,
        );
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Handle rate limiting (429 Too Many Requests)
        if (error.response.status === 429) {
          // Get retry-after header or use exponential backoff
          const retryAfter = error.response.headers['retry-after'];
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
