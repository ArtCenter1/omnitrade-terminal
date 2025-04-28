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
  // Special case for Binance Testnet API - proxy to the real API
  if (url.startsWith('/api/mock/binance_testnet')) {
    console.log(`Proxying Binance Testnet request to real API: ${url}`);

    // Extract the path after /api/mock/binance_testnet
    const pathMatch = url.match(/\/api\/mock\/binance_testnet\/(.*)/);
    const path = pathMatch ? pathMatch[1] : '';

    // Special case for exchangeInfo endpoint
    if (url.includes('exchangeInfo')) {
      console.log('Handling exchangeInfo request with direct proxy');
      return window.originalFetch(
        'https://testnet.binance.vision/api/v3/exchangeInfo',
      );
    }

    // Special case for depth endpoint (order book)
    if (url.includes('depth')) {
      // Parse the URL to extract parameters
      const urlObj = new URL(url, window.location.origin);
      const symbol = urlObj.searchParams.get('symbol');
      const limit = urlObj.searchParams.get('limit');

      // Construct the real Binance Testnet API URL with parameters
      let realUrl = 'https://testnet.binance.vision/api/v3/depth';
      if (symbol) {
        realUrl += `?symbol=${symbol}`;
        if (limit) {
          realUrl += `&limit=${limit}`;
        }
      }

      console.log('Handling depth request with direct proxy:', realUrl);
      return window.originalFetch(realUrl);
    }

    // Special case for ticker endpoint
    if (url.includes('ticker/24hr')) {
      // Parse the URL to extract parameters
      const urlObj = new URL(url, window.location.origin);
      const symbol = urlObj.searchParams.get('symbol');

      // Construct the real Binance Testnet API URL with parameters
      let realUrl = 'https://testnet.binance.vision/api/v3/ticker/24hr';
      if (symbol) {
        realUrl += `?symbol=${symbol}`;
      }

      console.log('Handling ticker request with direct proxy:', realUrl);
      return window.originalFetch(realUrl);
    }

    // Special case for trades endpoint
    if (url.includes('trades')) {
      // Parse the URL to extract parameters
      const urlObj = new URL(url, window.location.origin);
      const symbol = urlObj.searchParams.get('symbol');
      const limit = urlObj.searchParams.get('limit');

      // Construct the real Binance Testnet API URL with parameters
      let realUrl = 'https://testnet.binance.vision/api/v3/trades';
      if (symbol) {
        realUrl += `?symbol=${symbol}`;
        if (limit) {
          realUrl += `&limit=${limit}`;
        }
      }

      console.log('Handling trades request with direct proxy:', realUrl);
      return window.originalFetch(realUrl);
    }

    // Special case for klines endpoint
    if (url.includes('klines')) {
      // Parse the URL to extract parameters
      const urlObj = new URL(url, window.location.origin);
      const symbol = urlObj.searchParams.get('symbol');
      const interval = urlObj.searchParams.get('interval');
      const startTime = urlObj.searchParams.get('startTime');
      const endTime = urlObj.searchParams.get('endTime');
      const limit = urlObj.searchParams.get('limit');

      // Construct the real Binance Testnet API URL with parameters
      let realUrl = 'https://testnet.binance.vision/api/v3/klines';
      let params = [];

      if (symbol) params.push(`symbol=${symbol}`);
      if (interval) params.push(`interval=${interval}`);
      if (startTime) params.push(`startTime=${startTime}`);
      if (endTime) params.push(`endTime=${endTime}`);
      if (limit) params.push(`limit=${limit}`);

      if (params.length > 0) {
        realUrl += '?' + params.join('&');
      }

      console.log('Handling klines request with direct proxy:', realUrl);
      return window.originalFetch(realUrl);
    }

    // Construct the real Binance Testnet API URL for other endpoints
    const realUrl = `https://testnet.binance.vision/api/${path}`;
    console.log(`Proxying to: ${realUrl}`);

    try {
      // Forward the request to the real Binance Testnet API
      const response = await window.originalFetch(realUrl, init);
      console.log(`Proxy response status: ${response.status}`);

      // Clone the response to read it
      const clonedResponse = response.clone();
      try {
        const data = await clonedResponse.json();
        console.log(`Proxy response data:`, data);
      } catch (e) {
        console.log(`Couldn't parse response as JSON`);
      }

      return response;
    } catch (error) {
      console.error(`Error proxying to Binance Testnet API:`, error);
      return new Response(
        JSON.stringify({ error: 'Proxy error', message: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  // Add a small delay to simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Health check endpoints
  if (url.startsWith('/api/health') || url.startsWith('/api/health1')) {
    console.log(`Handling health check request: ${url}`);
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

  // Admin API endpoints
  if (
    url.startsWith('/api/users') ||
    url.startsWith('/api/roles') ||
    url.startsWith('/api/permissions')
  ) {
    // Forward to mockAdminApi
    console.log('Forwarding admin API request to mockAdminApi:', url);

    // For admin endpoints, we'll let the mockAdminApi handle it
    // We need to pass the original input to avoid 'input is not defined' errors
    return originalFetch(input, init);
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
