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

      // Check if we have cached data
      const cacheKey = 'binance_testnet_exchangeInfo';
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheExpiry = sessionStorage.getItem(`${cacheKey}_expiry`);

      // Use cached data if available and not expired (cache for 5 minutes)
      if (cachedData && cacheExpiry && parseInt(cacheExpiry) > Date.now()) {
        console.log('Using cached exchangeInfo data');
        return new Response(cachedData, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        // Make the direct API call with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        return window
          .originalFetch('https://testnet.binance.vision/api/v3/exchangeInfo', {
            signal: controller.signal,
          })
          .then(async (response) => {
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(
                `API returned ${response.status}: ${response.statusText}`,
              );
            }

            // Get the response data
            const data = await response.text();

            // Cache the response
            try {
              sessionStorage.setItem(cacheKey, data);
              sessionStorage.setItem(
                `${cacheKey}_expiry`,
                (Date.now() + 300000).toString(),
              ); // 5 minute cache
            } catch (e) {
              console.warn('Failed to cache exchangeInfo data:', e);
            }

            return new Response(data, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            console.error(
              'Error fetching exchangeInfo from Binance Testnet API:',
              error,
            );

            // If we have stale cached data, use it as a fallback
            if (cachedData) {
              console.warn(
                'Using stale cached exchangeInfo data due to API error',
              );
              return new Response(cachedData, {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            // Fall back to mock data
            console.warn('Falling back to mock exchangeInfo data');
            const mockData = {
              timezone: 'UTC',
              serverTime: Date.now(),
              rateLimits: [
                {
                  rateLimitType: 'REQUEST_WEIGHT',
                  interval: 'MINUTE',
                  intervalNum: 1,
                  limit: 1200,
                },
              ],
              symbols: [
                {
                  symbol: 'BTCUSDT',
                  status: 'TRADING',
                  baseAsset: 'BTC',
                  baseAssetPrecision: 8,
                  quoteAsset: 'USDT',
                  quotePrecision: 8,
                  filters: [
                    {
                      filterType: 'PRICE_FILTER',
                      minPrice: '0.01000000',
                      maxPrice: '1000000.00000000',
                      tickSize: '0.01000000',
                    },
                    {
                      filterType: 'LOT_SIZE',
                      minQty: '0.00000100',
                      maxQty: '9000.00000000',
                      stepSize: '0.00000100',
                    },
                    {
                      filterType: 'MIN_NOTIONAL',
                      minNotional: '10.00000000',
                    },
                  ],
                },
                {
                  symbol: 'ETHUSDT',
                  status: 'TRADING',
                  baseAsset: 'ETH',
                  baseAssetPrecision: 8,
                  quoteAsset: 'USDT',
                  quotePrecision: 8,
                  filters: [
                    {
                      filterType: 'PRICE_FILTER',
                      minPrice: '0.01000000',
                      maxPrice: '100000.00000000',
                      tickSize: '0.01000000',
                    },
                    {
                      filterType: 'LOT_SIZE',
                      minQty: '0.00001000',
                      maxQty: '9000.00000000',
                      stepSize: '0.00001000',
                    },
                    {
                      filterType: 'MIN_NOTIONAL',
                      minNotional: '10.00000000',
                    },
                  ],
                },
              ],
            };

            return new Response(JSON.stringify(mockData), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          });
      } catch (error) {
        console.error('Error in exchangeInfo request handler:', error);

        // Fall back to mock data
        console.warn(
          'Falling back to mock exchangeInfo data due to unexpected error',
        );
        const mockData = {
          timezone: 'UTC',
          serverTime: Date.now(),
          rateLimits: [
            {
              rateLimitType: 'REQUEST_WEIGHT',
              interval: 'MINUTE',
              intervalNum: 1,
              limit: 1200,
            },
          ],
          symbols: [
            {
              symbol: 'BTCUSDT',
              status: 'TRADING',
              baseAsset: 'BTC',
              baseAssetPrecision: 8,
              quoteAsset: 'USDT',
              quotePrecision: 8,
              filters: [
                {
                  filterType: 'PRICE_FILTER',
                  minPrice: '0.01000000',
                  maxPrice: '1000000.00000000',
                  tickSize: '0.01000000',
                },
                {
                  filterType: 'LOT_SIZE',
                  minQty: '0.00000100',
                  maxQty: '9000.00000000',
                  stepSize: '0.00000100',
                },
                {
                  filterType: 'MIN_NOTIONAL',
                  minNotional: '10.00000000',
                },
              ],
            },
          ],
        };

        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

      // Create a cache key based on the URL
      const cacheKey = `binance_testnet_depth_${symbol}_${limit || 'default'}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheExpiry = sessionStorage.getItem(`${cacheKey}_expiry`);

      // Use cached data if available and not expired (cache for 10 seconds for order book)
      if (cachedData && cacheExpiry && parseInt(cacheExpiry) > Date.now()) {
        console.log('Using cached depth data');
        return new Response(cachedData, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log('Handling depth request with direct proxy:', realUrl);

      try {
        // Make the direct API call with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        return window
          .originalFetch(realUrl, { signal: controller.signal })
          .then(async (response) => {
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(
                `API returned ${response.status}: ${response.statusText}`,
              );
            }

            // Get the response data
            const data = await response.text();

            // Cache the response (short cache time for order book data)
            try {
              sessionStorage.setItem(cacheKey, data);
              sessionStorage.setItem(
                `${cacheKey}_expiry`,
                (Date.now() + 10000).toString(),
              ); // 10 second cache
            } catch (e) {
              console.warn('Failed to cache depth data:', e);
            }

            return new Response(data, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            console.error(
              'Error fetching depth data from Binance Testnet API:',
              error,
            );

            // If we have stale cached data, use it as a fallback
            if (cachedData) {
              console.warn('Using stale cached depth data due to API error');
              return new Response(cachedData, {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            // Fall back to mock data
            console.warn('Falling back to mock depth data');
            const mockData = mockDataService.generateOrderBook(
              'binance_testnet',
              symbol || 'BTCUSDT',
              limit ? parseInt(limit) : 20,
            );

            return new Response(JSON.stringify(mockData), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          });
      } catch (error) {
        console.error('Error in depth request handler:', error);

        // Fall back to mock data
        console.warn('Falling back to mock depth data due to unexpected error');
        const mockData = mockDataService.generateOrderBook(
          'binance_testnet',
          symbol || 'BTCUSDT',
          limit ? parseInt(limit) : 20,
        );

        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

      // Create a cache key based on the URL
      const cacheKey = `binance_testnet_ticker_${symbol || 'all'}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheExpiry = sessionStorage.getItem(`${cacheKey}_expiry`);

      // Use cached data if available and not expired (cache for 30 seconds for ticker data)
      if (cachedData && cacheExpiry && parseInt(cacheExpiry) > Date.now()) {
        console.log('Using cached ticker data');
        return new Response(cachedData, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log('Handling ticker request with direct proxy:', realUrl);

      try {
        // Make the direct API call with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        return window
          .originalFetch(realUrl, { signal: controller.signal })
          .then(async (response) => {
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(
                `API returned ${response.status}: ${response.statusText}`,
              );
            }

            // Get the response data
            const data = await response.text();

            // Cache the response
            try {
              sessionStorage.setItem(cacheKey, data);
              sessionStorage.setItem(
                `${cacheKey}_expiry`,
                (Date.now() + 30000).toString(),
              ); // 30 second cache
            } catch (e) {
              console.warn('Failed to cache ticker data:', e);
            }

            return new Response(data, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            console.error(
              'Error fetching ticker data from Binance Testnet API:',
              error,
            );

            // If we have stale cached data, use it as a fallback
            if (cachedData) {
              console.warn('Using stale cached ticker data due to API error');
              return new Response(cachedData, {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            // Fall back to mock data
            console.warn('Falling back to mock ticker data');
            const mockData = symbol
              ? {
                  symbol: symbol,
                  priceChange: (Math.random() * 1000 - 500).toFixed(2),
                  priceChangePercent: (Math.random() * 10 - 5).toFixed(2),
                  weightedAvgPrice: (Math.random() * 50000 + 1000).toFixed(2),
                  prevClosePrice: (Math.random() * 50000 + 1000).toFixed(2),
                  lastPrice: (Math.random() * 50000 + 1000).toFixed(2),
                  lastQty: (Math.random() * 10).toFixed(4),
                  bidPrice: (Math.random() * 50000 + 1000).toFixed(2),
                  bidQty: (Math.random() * 10).toFixed(4),
                  askPrice: (Math.random() * 50000 + 1000).toFixed(2),
                  askQty: (Math.random() * 10).toFixed(4),
                  openPrice: (Math.random() * 50000 + 1000).toFixed(2),
                  highPrice: (Math.random() * 50000 + 1000).toFixed(2),
                  lowPrice: (Math.random() * 50000 + 1000).toFixed(2),
                  volume: (Math.random() * 1000).toFixed(4),
                  quoteVolume: (Math.random() * 10000000).toFixed(2),
                  openTime: Date.now() - 86400000,
                  closeTime: Date.now(),
                  firstId: 1,
                  lastId: 1000,
                  count: 1000,
                }
              : [
                  {
                    symbol: 'BTCUSDT',
                    priceChange: (Math.random() * 1000 - 500).toFixed(2),
                    priceChangePercent: (Math.random() * 10 - 5).toFixed(2),
                    weightedAvgPrice: (Math.random() * 50000 + 1000).toFixed(2),
                    prevClosePrice: (Math.random() * 50000 + 1000).toFixed(2),
                    lastPrice: (Math.random() * 50000 + 1000).toFixed(2),
                    lastQty: (Math.random() * 10).toFixed(4),
                    bidPrice: (Math.random() * 50000 + 1000).toFixed(2),
                    bidQty: (Math.random() * 10).toFixed(4),
                    askPrice: (Math.random() * 50000 + 1000).toFixed(2),
                    askQty: (Math.random() * 10).toFixed(4),
                    openPrice: (Math.random() * 50000 + 1000).toFixed(2),
                    highPrice: (Math.random() * 50000 + 1000).toFixed(2),
                    lowPrice: (Math.random() * 50000 + 1000).toFixed(2),
                    volume: (Math.random() * 1000).toFixed(4),
                    quoteVolume: (Math.random() * 10000000).toFixed(2),
                    openTime: Date.now() - 86400000,
                    closeTime: Date.now(),
                    firstId: 1,
                    lastId: 1000,
                    count: 1000,
                  },
                ];

            return new Response(JSON.stringify(mockData), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          });
      } catch (error) {
        console.error('Error in ticker request handler:', error);

        // Fall back to mock data
        console.warn(
          'Falling back to mock ticker data due to unexpected error',
        );
        const mockData = symbol
          ? {
              symbol: symbol,
              priceChange: (Math.random() * 1000 - 500).toFixed(2),
              priceChangePercent: (Math.random() * 10 - 5).toFixed(2),
              weightedAvgPrice: (Math.random() * 50000 + 1000).toFixed(2),
              prevClosePrice: (Math.random() * 50000 + 1000).toFixed(2),
              lastPrice: (Math.random() * 50000 + 1000).toFixed(2),
              lastQty: (Math.random() * 10).toFixed(4),
              bidPrice: (Math.random() * 50000 + 1000).toFixed(2),
              bidQty: (Math.random() * 10).toFixed(4),
              askPrice: (Math.random() * 50000 + 1000).toFixed(2),
              askQty: (Math.random() * 10).toFixed(4),
              openPrice: (Math.random() * 50000 + 1000).toFixed(2),
              highPrice: (Math.random() * 50000 + 1000).toFixed(2),
              lowPrice: (Math.random() * 50000 + 1000).toFixed(2),
              volume: (Math.random() * 1000).toFixed(4),
              quoteVolume: (Math.random() * 10000000).toFixed(2),
              openTime: Date.now() - 86400000,
              closeTime: Date.now(),
              firstId: 1,
              lastId: 1000,
              count: 1000,
            }
          : [
              {
                symbol: 'BTCUSDT',
                priceChange: (Math.random() * 1000 - 500).toFixed(2),
                priceChangePercent: (Math.random() * 10 - 5).toFixed(2),
                weightedAvgPrice: (Math.random() * 50000 + 1000).toFixed(2),
                prevClosePrice: (Math.random() * 50000 + 1000).toFixed(2),
                lastPrice: (Math.random() * 50000 + 1000).toFixed(2),
                lastQty: (Math.random() * 10).toFixed(4),
                bidPrice: (Math.random() * 50000 + 1000).toFixed(2),
                bidQty: (Math.random() * 10).toFixed(4),
                askPrice: (Math.random() * 50000 + 1000).toFixed(2),
                askQty: (Math.random() * 10).toFixed(4),
                openPrice: (Math.random() * 50000 + 1000).toFixed(2),
                highPrice: (Math.random() * 50000 + 1000).toFixed(2),
                lowPrice: (Math.random() * 50000 + 1000).toFixed(2),
                volume: (Math.random() * 1000).toFixed(4),
                quoteVolume: (Math.random() * 10000000).toFixed(2),
                openTime: Date.now() - 86400000,
                closeTime: Date.now(),
                firstId: 1,
                lastId: 1000,
                count: 1000,
              },
            ];

        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

  // Add a delay to simulate network latency and avoid overwhelming the API
  await new Promise((resolve) => setTimeout(resolve, 500));

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
