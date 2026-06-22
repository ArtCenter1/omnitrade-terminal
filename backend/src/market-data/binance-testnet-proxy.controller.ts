import { Controller, All, Req, Logger, UseGuards } from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('proxy/binance-testnet')
@UseGuards(JwtAuthGuard)
export class BinanceTestnetProxyController {
  private readonly logger = new Logger(BinanceTestnetProxyController.name);
  private readonly baseUrl = 'https://testnet.binance.vision';

  /**
   * Handle all requests to the Binance Testnet API
   */
  @All('*')
  async proxyRequest(@Req() req: Request): Promise<any> {
    try {
      // Security: Validate path to prevent SSRF and path traversal
      const path = req.params?.[0] || '';
      if (
        path &&
        (path.includes('..') || path.includes('://') || path.includes('\0'))
      ) {
        return {
          error: true,
          status: 400,
          message: 'Invalid endpoint path',
        };
      }

      // Extract the path from the original URL
      const originalUrl = req.originalUrl;
      const proxyPrefix = '/api/proxy/binance-testnet';
      let endpoint = '';

      if (originalUrl.startsWith(proxyPrefix)) {
        endpoint = originalUrl.substring(proxyPrefix.length);
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
          message:
            error.response.status === 429
              ? 'Binance Testnet rate limit exceeded. Please try again later.'
              : 'An error occurred while fetching data from Binance Testnet.',
          // Security: Do not leak raw error data from upstream API
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
