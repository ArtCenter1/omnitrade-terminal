import {
  Controller,
  All,
  Req,
  Logger,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('proxy/binance-testnet')
@UseGuards(JwtAuthGuard)
export class BinanceTestnetProxyController {
  private readonly logger = new Logger(BinanceTestnetProxyController.name);
  private readonly baseUrl = 'https://testnet.binance.vision';

  /**
   * Validates the path to prevent path traversal, protocol injection, and null bytes.
   */
  private isValidPath(path: string): boolean {
    if (!path) return true;
    // Check for path traversal, protocol injection, and null bytes
    return (
      !path.includes('..') && !path.includes('://') && !path.includes('\0')
    );
  }

  /**
   * Handle all requests to the Binance Testnet API
   */
  @All('*')
  async proxyRequest(@Req() req: Request): Promise<any> {
    try {
      // Extract the path from the original URL
      const originalUrl = req.originalUrl;
      const proxyPrefix = '/api/proxy/binance-testnet';
      let endpoint = '';

      if (originalUrl.startsWith(proxyPrefix)) {
        endpoint = originalUrl.substring(proxyPrefix.length);
      }

      // Validate the requested endpoint and originalUrl path
      if (!this.isValidPath(endpoint) || !this.isValidPath(originalUrl)) {
        this.logger.warn(`Blocked potentially malicious request to: ${endpoint}`);
        // For security reasons, we throw the error directly so it's not caught by the internal catch block
        throw new HttpException('Invalid request path', 400);
      }

      // Ensure endpoint starts with /api if it doesn't already
      if (!endpoint.startsWith('/api')) {
        endpoint = `/api${endpoint}`;
      }

      // Extract the endpoint without query parameters
      const targetUrl = `${this.baseUrl}${endpoint.split('?')[0]}`;

      // Parse the query parameters from the original URL
      const urlObj = new URL(req.url, 'http://localhost');
      const searchParams = urlObj.searchParams;

      // Create a clean URL with properly formatted query parameters
      const finalUrl = searchParams.toString()
        ? `${targetUrl}?${searchParams.toString()}`
        : targetUrl;

      this.logger.log(`Proxying request to: ${finalUrl}`);
      this.logger.debug(`Query parameters: ${searchParams.toString()}`);

      // Make the request to Binance Testnet
      const response = await axios({
        method: req.method,
        url: finalUrl,
        // Don't pass params separately since they're already in the URL
        headers: {
          // Minimal headers to avoid CORS issues
          Accept: 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      this.logger.log(`Request successful for ${finalUrl}`);
      return response.data;
    } catch (error) {
      // Re-throw HttpExceptions so they are handled by NestJS
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error proxying request: ${error.message}`);

      // Return error details
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(`Response error status: ${error.response.status}`);
        this.logger.error(
          `Response error data (internal only): ${JSON.stringify(error.response.data)}`,
        );

        return {
          error: true,
          status: error.response.status,
          // Security: Do not leak raw error data from upstream API
          message:
            error.response.status === 429
              ? 'Binance Testnet rate limit exceeded. Please try again later.'
              : 'An error occurred while fetching data from Binance Testnet.',
        };
      } else if (error.request) {
        // The request was made but no response was received
        this.logger.error(`No response received: ${error.request}`);

        return {
          error: true,
          message: `No response from Binance Testnet API: ${error.message}`,
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        return {
          error: true,
          message: `Error setting up request: ${error.message}`,
        };
      }
    }
  }
}
