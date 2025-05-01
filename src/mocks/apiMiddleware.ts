// src/mocks/apiMiddleware.ts
import { getFeatureFlags } from '@/config/featureFlags.tsx';
import { createErrorResponse, parseUrl } from './utils/apiUtils';
import { shouldUseMockData } from './handlers/commonHandlers';

// Import handlers
import { handleExchangeInfoRequest } from './handlers/exchangeInfoHandler';
import { handleDepthRequest } from './handlers/depthHandler';
import { handleTickerRequest } from './handlers/tickerHandler';
import { handleKlinesRequest } from './handlers/klinesHandler';
import { handleTradesRequest } from './handlers/tradesHandler';
import { handleOrdersRequest } from './handlers/ordersHandler';
import { handlePortfolioRequest } from './handlers/portfolioHandler';
import { handleHealthRequest } from './handlers/healthHandler';

/**
 * Intercepts fetch requests and provides mock data when the backend is unavailable
 * This allows the application to function without a running backend server
 */
export function setupApiMiddleware() {
  // Store a reference to the original fetch function
  // Make sure we don't override it if it's already been overridden
  const originalFetch = window.originalFetch || window.fetch;

  // Store the original fetch for other modules to use
  if (!window.originalFetch) {
    window.originalFetch = originalFetch;
  }

  // Override the fetch function
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    // Only intercept API requests
    if (!url.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    // Special case for health endpoint
    if (url.includes('/api/health')) {
      // Check if we should use mock data to avoid unnecessary health checks
      const flags = getFeatureFlags();
      if (flags.useMockData) {
        console.log('Using mock data for health check, skipping API call');
        return handleHealthRequest();
      }

      // Log health check requests for debugging
      console.log('Making health check API request');

      // If we're not using mock data, try the real endpoint first
      try {
        const response = await originalFetch(input, init);
        if (response.ok) {
          return response;
        }
        // If the real endpoint fails, fall back to mock
        console.warn('Health check API request failed, using mock response');
        return handleHealthRequest();
      } catch (error) {
        console.warn(
          'Health check API request error, using mock response:',
          error,
        );
        return handleHealthRequest();
      }
    }

    // Special case for exchangeInfo endpoint
    if (
      url.includes('/api/v3/exchangeInfo') ||
      url.includes('/api/mock/binance_testnet/api/v3/exchangeInfo')
    ) {
      return handleExchangeInfoRequest(url);
    }

    // If mock data should be used, route to the appropriate handler
    if (shouldUseMockData(url)) {
      return handleApiWithMockData(url, init);
    }

    // Log all API requests for debugging
    console.log(`API request: ${url}`);

    // Add more detailed logging for Binance Testnet requests
    if (url.includes('/api/mock/binance_testnet')) {
      const { path, params } = parseUrl(url);
      console.log(`Binance Testnet request details:`, {
        path,
        params,
        method: init?.method || 'GET',
        useBinanceTestnet: getFeatureFlags().useBinanceTestnet,
        connectionMode: getFeatureFlags().connectionMode,
      });
    }

    try {
      // First try the original fetch
      const response = await originalFetch(input, init);

      // If successful, return the response
      if (response.ok) {
        return response;
      }

      // If we get here, the request failed but the server responded
      console.warn(`API request failed with status ${response.status}: ${url}`);

      // If it's any Binance Testnet endpoint and it returned an error,
      // treat it as unavailable and use the proxy/mock logic.
      if (
        (response.status === 404 ||
          response.status === 400 ||
          response.status >= 500) &&
        url.includes('/api/mock/binance_testnet')
      ) {
        console.log(
          `Middleware: Detected ${response.status} error for ${url}, falling back to direct proxy/mock.`,
        );

        // Log more details about the error
        try {
          const errorText = await response.text();
          console.error(`Error details: ${errorText}`);
        } catch (e) {
          console.error('Could not read error details');
        }

        return handleApiWithMockData(url, init);
      }

      // For 5xx errors, we'll provide mock data
      if (response.status >= 500) {
        console.log(
          `Server error (${response.status}), falling back to mock data`,
        );
        return handleApiWithMockData(url, init);
      }

      // For other errors, return the original response
      return response;
    } catch (error) {
      // Network error, server not available, or error thrown by RateLimitManager
      console.warn(`API request failed for ${url}:`, error);

      // Explicitly check if the failed request was for any Binance Testnet endpoint
      if (url.includes('/api/mock/binance_testnet')) {
        console.log(
          `Middleware catch block: Falling back to proxy/mock for ${url} due to error.`,
        );
        return handleApiWithMockData(url, init);
      }

      // Generic fallback for other errors if backend is unavailable
      console.log(
        `Middleware catch block: Falling back to generic mock data for ${url} due to error.`,
      );
      return handleApiWithMockData(url, init);
    }
  };

  console.log(
    'API middleware initialized - providing mock data when backend is unavailable',
  );
}

/**
 * Handles API requests with mock data when the backend is unavailable
 */
async function handleApiWithMockData(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  // Route to the appropriate handler based on the URL

  // Special case for exchangeInfo endpoint
  if (url.includes('/api/v3/exchangeInfo') || url.includes('exchangeInfo')) {
    return handleExchangeInfoRequest(url);
  }

  // Special case for Binance Testnet API
  if (url.startsWith('/api/mock/binance_testnet')) {
    // Route to the appropriate handler based on the endpoint
    if (url.includes('depth')) {
      return handleDepthRequest(url);
    }

    if (url.includes('ticker/24hr')) {
      return handleTickerRequest(url);
    }

    if (url.includes('klines')) {
      return handleKlinesRequest(url);
    }

    if (url.includes('trades')) {
      return handleTradesRequest(url);
    }

    // Default fallback for unhandled Binance Testnet endpoints
    return createErrorResponse(
      'Mock endpoint not found (Binance Testnet)',
      404,
    );
  }

  // Handle other mock API requests
  if (url.startsWith('/api/portfolio')) {
    return handlePortfolioRequest(url);
  }

  if (url.startsWith('/api/orders')) {
    return handleOrdersRequest(url, init);
  }

  // Default fallback for unhandled API requests when mocking
  console.warn(`Unhandled mock API request: ${url}`);
  return createErrorResponse('Mock endpoint not found', 404);
}
