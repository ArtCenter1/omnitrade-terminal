// src/mocks/apiMiddleware.ts
import { getMockPortfolioData } from './mockPortfolio';
import { MockDataService } from '@/services/mockData/mockDataService';
import { getFeatureFlags } from '@/config/featureFlags.tsx';

// Create a singleton instance of MockDataService
const mockDataService = new MockDataService();

/**
 * Intercepts fetch requests and provides mock data when the backend is unavailable
 * This allows the application to function without a running backend server
 */
export function setupApiMiddleware() {
  // Store the original fetch function
  const originalFetch = window.fetch;

  // Override the fetch function
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    // Get current feature flags
    const flags = getFeatureFlags();

    // Only intercept API requests
    if (!url.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    // If mock data is explicitly enabled, use it
    if (flags.useMockData) {
      console.log(`Using mock data for API request: ${url}`);
      return handleApiWithMockData(url, init);
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
      // Network error or server not available
      console.warn(`API request failed (server unavailable): ${url}`, error);
      console.log('Falling back to mock data due to network error');
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
  // Add a small delay to simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Health check endpoint
  if (url.startsWith('/api/health')) {
    return new Response(JSON.stringify({ status: 'ok', mode: 'mock' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Portfolio endpoint
  if (url.startsWith('/api/portfolio')) {
    return handlePortfolioRequest(url);
  }

  // Trading pairs endpoint
  if (url.startsWith('/api/trading-pairs')) {
    return handleTradingPairsRequest(url);
  }

  // Order book endpoint
  if (url.startsWith('/api/order-book')) {
    return handleOrderBookRequest(url);
  }

  // Klines endpoint
  if (url.startsWith('/api/klines')) {
    return handleKlinesRequest(url);
  }

  // Orders endpoint
  if (url.startsWith('/api/orders')) {
    return handleOrdersRequest(url, init);
  }

  // For unhandled endpoints, return a 404 response
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handles portfolio requests with mock data
 */
function handlePortfolioRequest(url: string): Response {
  // Extract exchange_id from query params if present
  const exchangeId = new URL(url, window.location.origin).searchParams.get(
    'exchange_id',
  );

  // Generate a consistent API key ID based on the exchange ID
  const apiKeyId = exchangeId ? `mock-key-${exchangeId}` : 'portfolio-overview';

  // Get mock portfolio data
  const portfolioData = getMockPortfolioData(apiKeyId).data;

  return new Response(JSON.stringify(portfolioData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handles trading pairs requests with mock data
 */
function handleTradingPairsRequest(url: string): Response {
  // Extract exchange_id from query params if present
  const exchangeId =
    new URL(url, window.location.origin).searchParams.get('exchange_id') ||
    'binance';

  // Get mock trading pairs
  const tradingPairs = mockDataService.getTradingPairs(exchangeId);

  return new Response(JSON.stringify(tradingPairs), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handles order book requests with mock data
 */
function handleOrderBookRequest(url: string): Response {
  // Extract parameters from query
  const urlObj = new URL(url, window.location.origin);
  const exchangeId = urlObj.searchParams.get('exchange_id') || 'binance';
  const symbol = urlObj.searchParams.get('symbol') || 'BTC/USDT';
  const limit = parseInt(urlObj.searchParams.get('limit') || '20');

  // Get mock order book
  const orderBook = mockDataService.getOrderBook(exchangeId, symbol, limit);

  return new Response(JSON.stringify(orderBook), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handles klines requests with mock data
 */
function handleKlinesRequest(url: string): Response {
  // Extract parameters from query
  const urlObj = new URL(url, window.location.origin);
  const exchangeId = urlObj.searchParams.get('exchange_id') || 'binance';
  const symbol = urlObj.searchParams.get('symbol') || 'BTC/USDT';
  const interval = urlObj.searchParams.get('interval') || '1h';
  const startTime = urlObj.searchParams.get('start_time')
    ? parseInt(urlObj.searchParams.get('start_time')!)
    : undefined;
  const endTime = urlObj.searchParams.get('end_time')
    ? parseInt(urlObj.searchParams.get('end_time')!)
    : undefined;
  const limit = parseInt(urlObj.searchParams.get('limit') || '100');

  // Get mock klines
  const klines = mockDataService.generateKlines(
    exchangeId,
    symbol,
    interval,
    startTime,
    endTime,
    limit,
  );

  return new Response(JSON.stringify(klines), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handles orders requests with mock data
 */
function handleOrdersRequest(url: string, init?: RequestInit): Response {
  // Extract parameters from query
  const urlObj = new URL(url, window.location.origin);
  const exchangeId = urlObj.searchParams.get('exchange_id') || 'binance';
  const symbol = urlObj.searchParams.get('symbol') || 'BTC/USDT';

  // For GET requests, return mock orders
  if (!init || init.method === 'GET' || init.method === undefined) {
    const orders = mockDataService.getOrders(
      'mock-user-id',
      exchangeId,
      symbol,
    );

    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // For POST requests (placing an order)
  if (init.method === 'POST' && init.body) {
    try {
      const orderData = JSON.parse(init.body.toString());
      const order = mockDataService.placeOrder('mock-user-id', {
        exchangeId,
        symbol,
        ...orderData,
      });

      return new Response(JSON.stringify(order), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid order data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // For other methods
  return new Response(JSON.stringify({ error: 'Method not supported' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
