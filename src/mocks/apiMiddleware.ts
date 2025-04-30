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

    // Check if this is a Binance Testnet request and if Binance Testnet is disabled
    if (url.includes('/api/mock/binance_testnet') && !flags.useBinanceTestnet) {
      console.log(`Binance Testnet is disabled. Using mock data for: ${url}`);
      return handleApiWithMockData(url, init);
    }

    // Log all API requests for debugging
    console.log(`API request: ${url}`);

    try {
      // First try the original fetch
      const response = await originalFetch(input, init);

      // If successful, return the response
      if (response.ok) {
        return response;
      }

      // If we get here, the request failed but the server responded
      console.warn(`API request failed with status ${response.status}: ${url}`);

      // If it's any Binance Testnet endpoint and it returned 404,
      // treat it as unavailable and use the proxy/mock logic.
      // This might be bypassed if RateLimitManager throws an error instead of returning the response.
      if (
        response.status === 404 &&
        url.includes('/api/mock/binance_testnet')
      ) {
        console.log(
          `Middleware: Detected 404 for ${url}, falling back to direct proxy/mock.`,
        );
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
      return handleApiWithMockData(url, init); // Or potentially re-throw for non-mocked endpoints?
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
    // Get current feature flags
    const flags = getFeatureFlags();

    // Check if Binance Testnet is enabled
    if (!flags.useBinanceTestnet) {
      console.log(`Binance Testnet is disabled. Using mock data for: ${url}`);

      // If the request is for exchangeInfo, return mock data
      if (url.includes('exchangeInfo')) {
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
      }

      // For other endpoints, use the appropriate mock data generator
      if (url.includes('depth')) {
        const urlObj = new URL(url, window.location.origin);
        const symbol = urlObj.searchParams.get('symbol') || 'BTCUSDT';
        const limit = parseInt(urlObj.searchParams.get('limit') || '20');

        // Convert symbol format if it contains a slash (e.g., BTC/USDT to BTCUSDT)
        const formattedSymbol = symbol.includes('/')
          ? symbol.replace('/', '')
          : symbol;

        console.log(
          `Generating mock order book for ${formattedSymbol} with limit ${limit}`,
        );

        // Ensure we're using the correct format for the mock data
        const mockOrderBook = mockDataService.generateOrderBook(
          'binance_testnet',
          formattedSymbol,
          limit,
        );

        // Convert to Binance API format
        const mockData = {
          lastUpdateId: Date.now(),
          bids: mockOrderBook.bids.map((entry) => [
            entry.price.toString(),
            entry.quantity.toString(),
          ]),
          asks: mockOrderBook.asks.map((entry) => [
            entry.price.toString(),
            entry.quantity.toString(),
          ]),
        };

        return new Response(
          JSON.stringify({
            lastUpdateId: Date.now(),
            bids: mockData.bids.map((entry) => [
              entry.price.toString(),
              entry.quantity.toString(),
            ]),
            asks: mockData.asks.map((entry) => [
              entry.price.toString(),
              entry.quantity.toString(),
            ]),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (url.includes('ticker/24hr')) {
        const urlObj = new URL(url, window.location.origin);
        const symbol = urlObj.searchParams.get('symbol') || 'BTCUSDT';

        // Convert symbol format if it contains a slash
        const formattedSymbol = symbol.includes('/')
          ? symbol.replace('/', '')
          : symbol;

        console.log(`Generating mock ticker stats for ${formattedSymbol}`);

        const mockData = mockDataService.generateTickerStats(
          'binance_testnet',
          formattedSymbol,
        );

        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('klines')) {
        const urlObj = new URL(url, window.location.origin);
        const symbol = urlObj.searchParams.get('symbol') || 'BTCUSDT';
        const interval = urlObj.searchParams.get('interval') || '1h';
        const limit = parseInt(urlObj.searchParams.get('limit') || '100');
        const mockData = mockDataService.generateKlines(
          'binance_testnet',
          symbol,
          interval,
          undefined,
          undefined,
          limit,
        );

        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Default fallback for unhandled endpoints
      return new Response(
        JSON.stringify({
          message: 'Mock endpoint not found (Binance Testnet is disabled)',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    console.log(`Proxying Binance Testnet request to real API: ${url}`);

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

        // Extract the path from the URL
        const urlPath = new URL(url, window.location.origin).pathname;
        const endpoint = urlPath.replace('/api/mock/binance_testnet', '');

        console.log(
          `Making direct request to Binance Testnet API for ${endpoint}`,
        );
        return window
          .originalFetch(`https://testnet.binance.vision/api${endpoint}`, {
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

      // Format symbol if needed (remove / if present)
      const formattedSymbol =
        symbol && symbol.includes('/') ? symbol.replace('/', '') : symbol;

      // Extract the path from the URL
      const urlPath = new URL(url, window.location.origin).pathname;
      const endpoint = urlPath.replace('/api/mock/binance_testnet', '');

      // Construct the real Binance Testnet API URL with parameters
      let realUrl = `https://testnet.binance.vision/api${endpoint}`;
      console.log(`Using Binance Testnet API URL: ${realUrl}`);
      if (formattedSymbol) {
        realUrl += `?symbol=${formattedSymbol}`;
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

      // Format symbol if needed (remove / if present)
      const formattedSymbol =
        symbol && symbol.includes('/') ? symbol.replace('/', '') : symbol;

      // Extract the path from the URL
      const urlPath = new URL(url, window.location.origin).pathname;
      const endpoint = urlPath.replace('/api/mock/binance_testnet', '');

      // Construct the real Binance Testnet API URL with parameters
      let realUrl = `https://testnet.binance.vision/api${endpoint}`;
      console.log(`Using Binance Testnet API URL for ticker: ${realUrl}`);
      if (formattedSymbol) {
        realUrl += `?symbol=${formattedSymbol}`;
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
            const mockData = mockDataService.generateTickerStats(
              // Corrected method name
              'binance_testnet',
              symbol || 'BTCUSDT',
            );

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
        const mockData = mockDataService.generateTickerStats(
          // Corrected method name
          'binance_testnet',
          symbol || 'BTCUSDT',
        );

        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Special case for klines endpoint
    if (url.includes('klines')) {
      // Parse the URL to extract parameters
      const urlObj = new URL(url, window.location.origin);
      const symbol = urlObj.searchParams.get('symbol');
      const interval = urlObj.searchParams.get('interval');
      const limit = urlObj.searchParams.get('limit');

      // Extract the path from the URL
      const urlPath = new URL(url, window.location.origin).pathname;
      const endpoint = urlPath.replace('/api/mock/binance_testnet', '');

      // Construct the real Binance Testnet API URL with parameters
      let realUrl = `https://testnet.binance.vision/api${endpoint}`;
      console.log(`Using Binance Testnet API URL for klines: ${realUrl}`);
      const params = new URLSearchParams();
      if (symbol) params.append('symbol', symbol);
      if (interval) params.append('interval', interval);
      if (limit) params.append('limit', limit);
      realUrl += `?${params.toString()}`;

      // Create a cache key based on the URL
      const cacheKey = `binance_testnet_klines_${symbol}_${interval}_${limit || 'default'}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheExpiry = sessionStorage.getItem(`${cacheKey}_expiry`);

      // Use cached data if available and not expired (cache for 1 minute for klines)
      if (cachedData && cacheExpiry && parseInt(cacheExpiry) > Date.now()) {
        console.log('Using cached klines data');
        return new Response(cachedData, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log('Handling klines request with direct proxy:', realUrl);

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
                (Date.now() + 60000).toString(),
              ); // 1 minute cache
            } catch (e) {
              console.warn('Failed to cache klines data:', e);
            }

            return new Response(data, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            console.error(
              'Error fetching klines data from Binance Testnet API:',
              error,
            );

            // If we have stale cached data, use it as a fallback
            if (cachedData) {
              console.warn('Using stale cached klines data due to API error');
              return new Response(cachedData, {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            // Fall back to mock data
            console.warn('Falling back to mock klines data');
            const mockData = mockDataService.generateKlines(
              'binance_testnet',
              symbol || 'BTCUSDT',
              interval || '1h',
              undefined, // startTime
              undefined, // endTime
              limit ? parseInt(limit) : 100, // Correct position for limit
            );

            return new Response(JSON.stringify(mockData), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          });
      } catch (error) {
        console.error('Error in klines request handler:', error);

        // Fall back to mock data
        console.warn(
          'Falling back to mock klines data due to unexpected error',
        );
        const mockData = mockDataService.generateKlines(
          'binance_testnet',
          symbol || 'BTCUSDT',
          interval || '1h',
          undefined, // startTime
          undefined, // endTime
          limit ? parseInt(limit) : 100, // Correct position for limit
        );

        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle any other Binance Testnet endpoints with direct proxy first, then fallback to mock data
    console.log(`Handling generic Binance Testnet request: ${url}`);

    // Parse the URL to extract the endpoint path
    const urlObj = new URL(url, window.location.origin);
    const path = urlObj.pathname;

    // Extract the endpoint from the URL
    const endpoint = path.replace('/api/mock/binance_testnet', '');

    // Try to proxy the request to the real Binance Testnet API
    try {
      // Make the direct API call with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Construct the real Binance Testnet API URL with all original parameters
      const realUrl = `https://testnet.binance.vision/api${endpoint}${
        urlObj.search ? urlObj.search : ''
      }`;

      console.log(
        `Proxying generic request to Binance Testnet API: ${realUrl}`,
      );

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

          return new Response(data, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.error('Error in generic Binance Testnet request:', error);

          // Fall back to mock data
          console.warn('Falling back to mock data for generic request');

          // Continue with the mock data fallback below
          throw error;
        });
    } catch (error) {
      // If direct proxy fails, fall back to mock data
      console.warn(
        `Using mock data for unhandled Binance Testnet request: ${url}`,
      );

      // Extract symbol parameter if present
      const symbol = urlObj.searchParams.get('symbol') || 'BTCUSDT';

      // Generate appropriate mock data based on the endpoint path
      if (path.includes('/depth')) {
        // Order book data
        const limit = parseInt(urlObj.searchParams.get('limit') || '20');
        const mockData = mockDataService.generateOrderBook(
          'binance_testnet',
          symbol,
          limit,
        );
        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (path.includes('/ticker/24hr')) {
        // Ticker data
        const mockData = mockDataService.generateTickerStats(
          'binance_testnet',
          symbol,
        );
        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (path.includes('/klines')) {
        // Klines data
        const interval = urlObj.searchParams.get('interval') || '1h';
        const limit = parseInt(urlObj.searchParams.get('limit') || '100');
        const mockData = mockDataService.generateKlines(
          'binance_testnet',
          symbol,
          interval,
          undefined,
          undefined,
          limit,
        );
        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // Generic response for other endpoints
        return new Response(
          JSON.stringify({
            message: 'Generic mock data for Binance Testnet',
            endpoint: path,
            params: Object.fromEntries(urlObj.searchParams.entries()),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // Handle other mock API requests
    if (url.startsWith('/api/portfolio')) {
      return handlePortfolioRequest(url);
    }
    if (url.startsWith('/api/trading-pairs')) {
      return handleTradingPairsRequest(url);
    }
    if (url.startsWith('/api/orderbook')) {
      return handleOrderBookRequest(url);
    }
    if (url.startsWith('/api/klines')) {
      return handleKlinesRequest(url);
    }
    if (url.startsWith('/api/orders')) {
      return handleOrdersRequest(url, init);
    }

    // Default fallback for unhandled API requests when mocking
    console.warn(`Unhandled mock API request: ${url}`);
    return new Response(
      JSON.stringify({ message: 'Mock endpoint not found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // --- Specific Mock Handlers ---

  /**
   * Handles mock portfolio requests
   */
  function handlePortfolioRequest(url: string): Response {
    const mockData = getMockPortfolioData();
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Handles mock trading pairs requests
   */
  function handleTradingPairsRequest(url: string): Response {
    const mockData = mockDataService.generateTradingPairs('mock'); // Corrected method name
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Handles mock order book requests
   */
  function handleOrderBookRequest(url: string): Response {
    const urlObj = new URL(url, window.location.origin);
    const symbol = urlObj.searchParams.get('symbol') || 'BTCUSDT';
    const limit = parseInt(urlObj.searchParams.get('limit') || '20');
    const mockData = mockDataService.generateOrderBook('mock', symbol, limit);
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Handles mock klines requests
   */
  function handleKlinesRequest(url: string): Response {
    const urlObj = new URL(url, window.location.origin);
    const symbol = urlObj.searchParams.get('symbol') || 'BTCUSDT';
    const interval = urlObj.searchParams.get('interval') || '1h';
    const limit = parseInt(urlObj.searchParams.get('limit') || '100');
    const mockData = mockDataService.generateKlines(
      'mock',
      symbol,
      interval,
      undefined, // startTime
      undefined, // endTime
      limit, // Correct position for limit
    );
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Handles mock orders requests
   */
  function handleOrdersRequest(url: string, init?: RequestInit): Response {
    if (init?.method === 'POST') {
      // Mock order creation
      const body = init.body ? JSON.parse(init.body.toString()) : {};
      const newOrder = {
        orderId: `mock-${Date.now()}`,
        symbol: body.symbol,
        side: body.side,
        type: body.type,
        quantity: body.quantity,
        price: body.price,
        status: 'NEW',
        timestamp: Date.now(),
      };
      return new Response(JSON.stringify(newOrder), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Mock fetching orders
      // Corrected arguments: userId, exchangeId, symbol, count
      const mockData = mockDataService.generateOrders(
        'mock',
        'mock',
        'BTCUSDT',
        10,
      );
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Close the handleApiWithMockData function
}
