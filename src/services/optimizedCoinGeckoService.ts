import axios, { AxiosRequestConfig } from 'axios';
import { TradingPair } from '@/types/trading';
import { getCoinGeckoApiKey } from '@/utils/env';
import { getFeatureFlags } from '@/config/featureFlags';

// Define the base URLs for CoinGecko APIs
// Use our backend proxy to avoid CORS issues
const PUBLIC_API_URL = '/api/proxy/coingecko';
const PRO_API_URL = '/api/proxy/coingecko';

// Get API key from frontend environment variables
const API_KEY = getCoinGeckoApiKey();

// Log API configuration for debugging
console.log(`Optimized CoinGecko Service initialized with:`);
console.log(`- Public API URL: ${PUBLIC_API_URL}`);
console.log(`- Pro API URL: ${PRO_API_URL}`);
console.log(`- API Key available: ${API_KEY ? 'Yes' : 'No'}`);

// Rate limiting configuration
const PUBLIC_RATE_LIMIT = 3; // requests per minute (very conservative)
const PRO_RATE_LIMIT = 10; // requests per minute (conservative)

// Throttling configuration
const THROTTLE_DELAY = 3000; // ms between requests
let lastRequestTime = 0;

// In-flight request tracking to prevent duplicate requests
const inFlightRequests: Record<string, Promise<any>> = {};

// Circuit breaker configuration
const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 3, // Number of failures before opening circuit
  RESET_TIMEOUT: 300 * 1000, // 5 minutes timeout before trying again
  state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
  failures: 0,
  lastFailure: 0,
  lastReset: 0,
};

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  COINS: 30 * 60 * 1000, // 30 minutes
  MARKETS: 15 * 60 * 1000, // 15 minutes
  TICKERS: 5 * 60 * 1000, // 5 minutes
  ORDERBOOK: 60 * 1000, // 1 minute
  PRICE: 5 * 60 * 1000, // 5 minutes

  // Stale durations - how long to use expired cache data
  STALE_COINS: 4 * 60 * 60 * 1000, // 4 hours
  STALE_MARKETS: 60 * 60 * 1000, // 1 hour
  STALE_TICKERS: 30 * 60 * 1000, // 30 minutes
  STALE_ORDERBOOK: 10 * 60 * 1000, // 10 minutes
  STALE_PRICE: 30 * 60 * 1000, // 30 minutes
};

// Interface for CoinGecko coin data
export interface CoinGeckoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

// Cache for coin data
const cache = {
  coins: new Map<string, { data: CoinGeckoData; timestamp: number }>(),
  markets: new Map<string, { data: CoinGeckoData[]; timestamp: number }>(),
  tickers: new Map<string, { data: any; timestamp: number }>(),
  symbolToId: new Map<string, string>(),
};

// Rate limit state
const rateLimitState = {
  publicRequestCount: 0,
  proRequestCount: 0,
  lastResetTime: Date.now(),
};

// Reset rate limit counters every minute
setInterval(() => {
  rateLimitState.publicRequestCount = 0;
  rateLimitState.proRequestCount = 0;
  rateLimitState.lastResetTime = Date.now();
}, 60000);

/**
 * Check if we can use the public API based on rate limits
 */
function canUsePublicApi(): boolean {
  return rateLimitState.publicRequestCount < PUBLIC_RATE_LIMIT;
}

/**
 * Check if we can use the pro API based on rate limits
 */
function canUseProApi(): boolean {
  return rateLimitState.proRequestCount < PRO_RATE_LIMIT;
}

/**
 * Record a success for the circuit breaker
 */
function recordSuccess(): void {
  if (CIRCUIT_BREAKER.state === 'HALF_OPEN') {
    console.log('Circuit breaker success in HALF_OPEN state, closing circuit');
    CIRCUIT_BREAKER.state = 'CLOSED';
    CIRCUIT_BREAKER.failures = 0;
  }
}

/**
 * Record a failure for the circuit breaker
 */
function recordFailure(): void {
  CIRCUIT_BREAKER.failures++;
  CIRCUIT_BREAKER.lastFailure = Date.now();

  if (
    CIRCUIT_BREAKER.state === 'CLOSED' &&
    CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD
  ) {
    console.warn(
      `Circuit breaker threshold reached (${CIRCUIT_BREAKER.failures} failures), opening circuit`,
    );
    CIRCUIT_BREAKER.state = 'OPEN';
  }
}

/**
 * Check if the circuit breaker allows requests
 */
function checkCircuitBreaker(): boolean {
  if (CIRCUIT_BREAKER.state === 'CLOSED') {
    return true;
  }

  if (CIRCUIT_BREAKER.state === 'OPEN') {
    const now = Date.now();
    if (now - CIRCUIT_BREAKER.lastFailure > CIRCUIT_BREAKER.RESET_TIMEOUT) {
      console.log(
        'Circuit breaker timeout elapsed, moving to HALF_OPEN state',
      );
      CIRCUIT_BREAKER.state = 'HALF_OPEN';
      return true;
    }
    return false;
  }

  // In HALF_OPEN state, allow one request to test the waters
  return true;
}

/**
 * Get the appropriate stale duration for an endpoint
 */
function getStaleDuration(endpoint: string): number {
  if (endpoint.includes('coins/markets')) {
    return CACHE_DURATIONS.STALE_MARKETS;
  } else if (endpoint.includes('tickers')) {
    return CACHE_DURATIONS.STALE_TICKERS;
  } else if (endpoint.includes('orderbook')) {
    return CACHE_DURATIONS.STALE_ORDERBOOK;
  } else if (endpoint.includes('price')) {
    return CACHE_DURATIONS.STALE_PRICE;
  } else if (endpoint.includes('coins')) {
    return CACHE_DURATIONS.STALE_COINS;
  }

  // Default stale duration
  return CACHE_DURATIONS.STALE_MARKETS;
}

/**
 * Make an API request with rate limiting, caching, and circuit breaker
 */
async function makeApiRequest<T>(
  endpoint: string,
  params: Record<string, any> = {},
  cacheDuration: number,
  cacheKey: string,
  cacheMap: Map<string, { data: T; timestamp: number }>,
  preferPro: boolean = false,
  isEssential: boolean = false, // Flag for critical requests that should bypass circuit breaker
): Promise<T> {
  // Check if CoinGecko API is disabled via feature flag
  const { disableCoinGeckoApi } = getFeatureFlags();
  if (disableCoinGeckoApi) {
    console.warn(`CoinGecko API is disabled via feature flag, blocking request to ${endpoint}`);

    // If we have any cached data (even if stale), return it
    const cachedData = cacheMap.get(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${endpoint} due to disabled CoinGecko API`);
      return cachedData.data;
    }

    // No cache available, return empty result based on expected type
    console.warn(`No cached data available for ${endpoint}, returning empty result`);
    if (Array.isArray(params)) {
      return [] as unknown as T;
    }
    return {} as T;
  }

  // Create a unique request key to deduplicate in-flight requests
  const requestKey = `${endpoint}:${JSON.stringify(params)}`;

  // Check if this exact request is already in flight
  if (inFlightRequests[requestKey]) {
    console.log(`Request already in flight for ${endpoint}, reusing promise`);
    return inFlightRequests[requestKey] as Promise<T>;
  }

  // Check cache first (including stale cache)
  const cachedData = cacheMap.get(cacheKey);
  const now = Date.now();

  // If we have fresh cache data, return it
  if (cachedData && now - cachedData.timestamp < cacheDuration) {
    return cachedData.data;
  }

  // Check circuit breaker (unless this is an essential request)
  if (!isEssential && !checkCircuitBreaker()) {
    console.warn(`Circuit breaker open, blocking request to ${endpoint}`);

    // If we have stale cache data, return it
    if (cachedData) {
      const staleDuration = getStaleDuration(endpoint);
      if (now - cachedData.timestamp < staleDuration) {
        console.log(`Using stale cache for ${endpoint} due to open circuit breaker`);
        return cachedData.data;
      }
    }

    // No usable cache, throw error
    throw new Error('Service temporarily unavailable (circuit breaker open)');
  }

  // Determine which API to use
  let useProApi = preferPro && API_KEY && canUseProApi();

  // If we can't use the Pro API but we're not rate limited on the public API, use that
  if (!useProApi && !canUsePublicApi()) {
    console.warn('Rate limited on public API, waiting for reset');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const baseUrl = useProApi ? PRO_API_URL : PUBLIC_API_URL;

  // Prepare request config
  const config: AxiosRequestConfig = {
    params: { ...params },
  };

  // Add API key if using pro API
  if (useProApi) {
    // CoinGecko Pro API expects the key in the x_cg_pro_api_key parameter
    config.params.x_cg_pro_api_key = API_KEY;
  }

  // Create a promise for this request and store it in the in-flight requests map
  const requestPromise = (async () => {
    try {
      // Apply throttling to avoid rapid requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;

      if (timeSinceLastRequest < THROTTLE_DELAY) {
        // Wait for the remaining time before making the request
        await new Promise((resolve) =>
          setTimeout(resolve, THROTTLE_DELAY - timeSinceLastRequest),
        );
      }

      // Update last request time
      lastRequestTime = Date.now();

      // Make the request
      if (useProApi) {
        rateLimitState.proRequestCount++;
      } else {
        rateLimitState.publicRequestCount++;
      }

      // Add a timeout to the request
      console.log(`Making request to: ${baseUrl}${endpoint}`);

      const response = await axios.get<T>(`${baseUrl}${endpoint}`, {
        ...config,
        timeout: 15000, // 15 second timeout
      });

      console.log(`Request successful: ${baseUrl}${endpoint}`);

      // Record success for circuit breaker
      recordSuccess();

      // Cache the response
      cacheMap.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error: any) {
      // Record failure for circuit breaker (unless it's a 404, which is a valid response)
      if (axios.isAxiosError(error) && error.response?.status !== 404) {
        recordFailure();
      }

      // Log detailed error information
      console.error(`Error making request to ${baseUrl}${endpoint}:`, error);
      if (axios.isAxiosError(error)) {
        console.error(`Axios error details:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
        });
      }

      // Check if we have cached data we can return instead
      if (cachedData) {
        // Check if the cache is still within stale window
        const staleDuration = getStaleDuration(endpoint);
        if (Date.now() - cachedData.timestamp < staleDuration) {
          console.warn(`Using stale cached data for ${endpoint} due to API error`);
          return cachedData.data;
        } else {
          console.warn(`Stale cache for ${endpoint} is too old to use`);
        }
      }

      // If we get a rate limit error and we were using the public API, try the pro API
      if (
        !useProApi &&
        API_KEY &&
        canUseProApi() &&
        axios.isAxiosError(error) &&
        (error.response?.status === 429 || error.response?.status === 403)
      ) {
        console.warn('Rate limited on public API, trying pro API');
        return makeApiRequest(
          endpoint,
          params,
          cacheDuration,
          cacheKey,
          cacheMap,
          true,
        );
      }

      // If we get a rate limit error on the pro API, wait and retry
      if (
        useProApi &&
        axios.isAxiosError(error) &&
        (error.response?.status === 429 || error.response?.status === 403)
      ) {
        console.warn('Rate limited on pro API, waiting and retrying');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return makeApiRequest(
          endpoint,
          params,
          cacheDuration,
          cacheKey,
          cacheMap,
          true,
        );
      }

      // If we get a timeout or network error, wait and retry with exponential backoff
      if (
        axios.isAxiosError(error) &&
        (error.code === 'ECONNABORTED' ||
          !error.response ||
          error.code === 'ECONNREFUSED' ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('Network Error'))
      ) {
        console.warn(
          `Network error or timeout for ${endpoint}, retrying with backoff`,
        );
        console.warn(`Error details: ${error.message}, Code: ${error.code}`);

        // For ECONNREFUSED errors, we might be having issues with the network
        const isConnectionRefused =
          error.code === 'ECONNREFUSED' ||
          error.message?.includes('ECONNREFUSED');

        if (isConnectionRefused) {
          console.warn(
            'Connection refused error detected. This usually means the API server is not reachable.',
          );

          // Check if we have cached data we can return
          if (cachedData) {
            console.warn(
              `Using stale cached data for ${endpoint} due to connection refused error`,
            );
            return cachedData.data;
          }

          // If no cached data and we've already retried, return a fallback response or mock data
          if (typeof window !== 'undefined') {
            // Show a user-friendly toast message in the browser
            console.error(
              'Backend server connection failed. Please check if the backend server is running.',
            );
          }

          // Return a fallback empty response based on the expected type
          // This is better than throwing an error that might crash the UI
          return {} as T;
        }

        // For other network errors, wait and retry
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          // Add a longer timeout for the retry
          const retryResponse = await axios.get<T>(`${baseUrl}${endpoint}`, {
            ...config,
            timeout: 15000, // 15 second timeout for retry
          });

          // Cache the response
          cacheMap.set(cacheKey, {
            data: retryResponse.data,
            timestamp: Date.now(),
          });

          return retryResponse.data;
        } catch (retryError) {
          console.error(`Retry failed for ${endpoint}:`, retryError);
          // Fall through to throw the original error
        }
      }

      // Log the error with more details
      if (axios.isAxiosError(error)) {
        console.error(`API Error for ${endpoint}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
        });
      } else {
        console.error(`Unknown error for ${endpoint}:`, error);
      }

      // Throw a more informative error
      throw new Error(
        `Failed to fetch data from CoinGecko API: ${error.message || 'Unknown error'}`,
      );
    } finally {
      // Remove this request from the in-flight requests map when done
      delete inFlightRequests[requestKey];
    }
  })();

  // Store the promise in the in-flight requests map
  inFlightRequests[requestKey] = requestPromise;

  // Return the promise
  return requestPromise;
}

/**
 * Fetch top cryptocurrencies from CoinGecko
 */
export async function getTopCoins(limit = 100): Promise<CoinGeckoData[]> {
  const cacheKey = `top_coins_${limit}`;

  // First check if we have cached data
  const cachedData = cache.markets.get(cacheKey);
  if (
    cachedData &&
    Date.now() - cachedData.timestamp < CACHE_DURATIONS.MARKETS
  ) {
    console.log(
      `Using cached top coins data (${cachedData.data.length} coins)`,
    );
    return cachedData.data;
  }

  console.log(`Fetching top ${limit} coins from CoinGecko`);
  try {
    const data = await makeApiRequest<CoinGeckoData[]>(
      '/coins/markets',
      {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h',
      },
      CACHE_DURATIONS.MARKETS,
      cacheKey,
      cache.markets as Map<
        string,
        { data: CoinGeckoData[]; timestamp: number }
      >,
      false, // Prefer public API for this endpoint
    );

    if (!data || data.length === 0) {
      console.warn('Received empty data from CoinGecko API');
      // Try to use cached data even if it's expired
      if (cachedData) {
        console.log(
          `Using expired cached data (${cachedData.data.length} coins)`,
        );
        return cachedData.data;
      }
      return [];
    }

    console.log(`Successfully fetched ${data.length} coins from CoinGecko`);

    // Update symbol to ID mapping
    data.forEach((coin) => {
      cache.symbolToId.set(coin.symbol.toLowerCase(), coin.id);
    });

    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);

    // Return cached data if we have it, even if it's expired
    if (cachedData) {
      console.warn(
        `Using stale cached data (${cachedData.data.length} coins) due to API error`,
      );
      return cachedData.data;
    }

    // Return empty array if we have no cached data
    return [];
  }
}

/**
 * Get coin data by symbol or ID
 */
export async function getCoinBySymbol(
  symbolOrId: string,
): Promise<CoinGeckoData | null> {
  // Normalize the input to lowercase
  const normalizedInput = symbolOrId.toLowerCase();

  // Check for special cases that need direct mapping
  let coinId = normalizedInput;
  if (normalizedInput === 'btc' || normalizedInput === 'xbt') coinId = 'bitcoin';
  else if (normalizedInput === 'eth') coinId = 'ethereum';
  else if (normalizedInput === 'usdt') coinId = 'tether';
  else if (normalizedInput === 'usdc') coinId = 'usd-coin';
  else if (normalizedInput === 'bnb') coinId = 'binancecoin';
  else if (normalizedInput === 'xrp') coinId = 'ripple';
  else if (normalizedInput === 'sol') coinId = 'solana';
  else if (normalizedInput === 'ada') coinId = 'cardano';
  else if (normalizedInput === 'doge') coinId = 'dogecoin';
  else if (normalizedInput === 'dot') coinId = 'polkadot';
  else if (cache.symbolToId.has(normalizedInput)) {
    coinId = cache.symbolToId.get(normalizedInput)!;
  }

  const cacheKey = `coin_${coinId}`;

  // Check cache first
  const cachedData = cache.coins.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATIONS.COINS) {
    console.log(`Using cached data for ${coinId}`);
    return cachedData.data;
  }

  try {
    const data = await makeApiRequest<CoinGeckoData>(
      `/coins/${coinId}`,
      {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
      },
      CACHE_DURATIONS.COINS,
      cacheKey,
      cache.coins as Map<string, { data: CoinGeckoData; timestamp: number }>,
      false,
      true, // Mark as essential
    );

    return data;
  } catch (error) {
    console.error(`Error fetching coin data for ${coinId}:`, error);

    // Try to use cached data even if it's expired
    if (cachedData) {
      console.warn(`Using stale cached data for ${coinId} due to API error`);
      return cachedData.data;
    }

    return null;
  }
}

/**
 * Get current price for a trading pair
 */
export async function getCurrentPrice(
  baseAsset: string,
  quoteAsset: string = 'usd',
): Promise<number> {
  try {
    console.log(
      `getCurrentPrice: Getting price for ${baseAsset}/${quoteAsset}`,
    );

    // For USD or USDT quote assets, we only need the base coin
    if (
      quoteAsset.toLowerCase() === 'usd' ||
      quoteAsset.toLowerCase() === 'usdt'
    ) {
      // Get the base coin data
      const coin = await getCoinBySymbol(baseAsset);
      if (!coin) {
        console.error(
          `getCurrentPrice: Could not get data for base asset "${baseAsset}"`,
        );
        return 0;
      }

      console.log(
        `getCurrentPrice: ${baseAsset}/${quoteAsset} price is ${coin.current_price}`,
      );
      return coin.current_price;
    } else {
      // For other quote assets, we need both coins - fetch them in parallel
      const [baseCoin, quoteCoin] = await Promise.all([
        getCoinBySymbol(baseAsset),
        getCoinBySymbol(quoteAsset)
      ]);

      if (!baseCoin || !quoteCoin || quoteCoin.current_price === 0) {
        console.error(
          `getCurrentPrice: Could not get data for ${baseAsset}/${quoteAsset}`,
        );
        return 0;
      }

      const price = baseCoin.current_price / quoteCoin.current_price;
      console.log(
        `getCurrentPrice: ${baseAsset}/${quoteAsset} price is ${price}`,
      );
      return price;
    }
  } catch (error) {
    console.error(
      `Error getting current price for ${baseAsset}/${quoteAsset}:`,
      error,
    );
    return 0;
  }
}

/**
 * Get historical price data for a specific coin
 */
export async function getHistoricalPriceData(
  coinIdOrSymbol: string,
  days: number = 7,
  interval: string = 'daily',
): Promise<{ prices: [number, number][] }> {
  // Normalize the input to lowercase
  const normalizedInput = coinIdOrSymbol.toLowerCase();

  // Check for special cases that need direct mapping
  let coinId = normalizedInput;
  if (normalizedInput === 'btc' || normalizedInput === 'xbt') coinId = 'bitcoin';
  else if (normalizedInput === 'eth') coinId = 'ethereum';
  else if (normalizedInput === 'usdt') coinId = 'tether';
  else if (normalizedInput === 'usdc') coinId = 'usd-coin';
  else if (normalizedInput === 'bnb') coinId = 'binancecoin';
  else if (normalizedInput === 'xrp') coinId = 'ripple';
  else if (normalizedInput === 'sol') coinId = 'solana';
  else if (normalizedInput === 'ada') coinId = 'cardano';
  else if (normalizedInput === 'doge') coinId = 'dogecoin';
  else if (normalizedInput === 'dot') coinId = 'polkadot';
  else if (cache.symbolToId.has(normalizedInput)) {
    coinId = cache.symbolToId.get(normalizedInput)!;
  }

  const cacheKey = `historical_${coinId}_${days}_${interval}`;

  // Use a custom cache map for historical data
  const historicalCache = new Map<
    string,
    { data: { prices: [number, number][] }; timestamp: number }
  >();

  try {
    return await makeApiRequest<{ prices: [number, number][] }>(
      `/coins/${coinId}/market_chart`,
      {
        vs_currency: 'usd',
        days,
        interval,
      },
      CACHE_DURATIONS.MARKETS,
      cacheKey,
      historicalCache,
      false, // Use public API first for this endpoint
    );
  } catch (error) {
    console.error(`Error fetching historical data for ${coinId}:`, error);
    return { prices: [] };
  }
}
