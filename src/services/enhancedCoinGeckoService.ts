import axios, { AxiosRequestConfig } from 'axios';
import { TradingPair } from '@/types/trading';
import { Orderbook } from '@/types/marketData';

import { getCoinGeckoApiKey } from '@/utils/env';

// Define the base URLs for CoinGecko APIs
// Use our backend proxy to avoid CORS issues
const PUBLIC_API_URL = '/api/proxy/coingecko';
const PRO_API_URL = '/api/proxy/coingecko';

// Get API key from frontend environment variables
const API_KEY = getCoinGeckoApiKey();

// Log API configuration for debugging
console.log(`Enhanced CoinGecko Service initialized with:`);
console.log(`- Public API URL: ${PUBLIC_API_URL}`);
console.log(`- Pro API URL: ${PRO_API_URL}`);
console.log(`- API Key available: ${API_KEY ? 'Yes' : 'No'}`);

// Rate limiting configuration
const PUBLIC_RATE_LIMIT = 3; // requests per minute (reduced from 5 for extreme safety)
const PRO_RATE_LIMIT = 10; // requests per minute (reduced from 15 for extreme safety)

// Throttling configuration
const THROTTLE_DELAY = 3000; // ms between requests (increased from 2000ms)
let lastRequestTime = 0;

// In-flight request tracking to prevent duplicate requests
const inFlightRequests: Record<string, Promise<any>> = {};

// Circuit breaker configuration
const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 3, // Number of failures before opening circuit (reduced from 5)
  RESET_TIMEOUT: 300 * 1000, // 5 minutes timeout before trying again (increased from 1 minute)
  state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
  failures: 0,
  lastFailure: 0,
  lastReset: 0,
};

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  COINS: 30 * 60 * 1000, // 30 minutes (increased from 10)
  MARKETS: 10 * 60 * 1000, // 10 minutes (increased from 2)
  TICKERS: 5 * 60 * 1000, // 5 minutes (increased from 30 seconds)
  ORDERBOOK: 60 * 1000, // 1 minute (increased from 15 seconds)
  PRICE: 5 * 60 * 1000, // 5 minutes (increased from 30 seconds)

  // Add stale durations - how long to use expired cache data
  STALE_COINS: 4 * 60 * 60 * 1000, // 4 hours (increased from 1 hour)
  STALE_MARKETS: 60 * 60 * 1000, // 1 hour (increased from 10 minutes)
  STALE_TICKERS: 30 * 60 * 1000, // 30 minutes (increased from 2 minutes)
  STALE_ORDERBOOK: 10 * 60 * 1000, // 10 minutes (increased from 1 minute)
  STALE_PRICE: 30 * 60 * 1000, // 30 minutes (increased from 2 minutes)
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

// Interface for CoinGecko ticker data
export interface CoinGeckoTicker {
  base: string;
  target: string;
  market: {
    name: string;
    identifier: string;
  };
  last: number;
  volume: number;
  converted_last: {
    btc: number;
    eth: number;
    usd: number;
  };
  converted_volume: {
    btc: number;
    eth: number;
    usd: number;
  };
  bid_ask_spread_percentage: number;
  timestamp: string;
  last_traded_at: string;
  last_fetch_at: string;
  is_anomaly: boolean;
  is_stale: boolean;
  trade_url: string;
  token_info_url: string;
  coin_id: string;
  target_coin_id?: string;
  // Additional properties for price statistics
  highPrice?: number;
  lowPrice?: number;
  openPrice?: number;
  bidPrice?: number;
  askPrice?: number;
}

// Interface for CoinGecko ticker response
export interface CoinGeckoTickerResponse {
  name: string;
  tickers: CoinGeckoTicker[];
}

// Using Orderbook interface from marketData.ts

// Cache for data to avoid excessive API calls
const cache = {
  coins: new Map<string, { data: CoinGeckoData; timestamp: number }>(),
  markets: new Map<string, { data: CoinGeckoData[]; timestamp: number }>(),
  tickers: new Map<
    string,
    { data: CoinGeckoTickerResponse; timestamp: number }
  >(),
  symbolToId: new Map<string, string>(),
};

// Constants for persistent cache
const SYMBOL_CACHE_KEY = 'coingecko_symbol_to_id_cache';
const SYMBOL_CACHE_TIMESTAMP_KEY = 'coingecko_symbol_to_id_cache_timestamp';
const SYMBOL_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days (increased from 24 hours)

// Initialize symbol to ID cache from localStorage if available
function initializeSymbolCache() {
  try {
    // Load cached mappings from localStorage
    const cachedMappings = localStorage.getItem(SYMBOL_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(SYMBOL_CACHE_TIMESTAMP_KEY);

    if (cachedMappings && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp < SYMBOL_CACHE_DURATION) {
        const mappings = JSON.parse(cachedMappings);
        console.log(
          `Loaded ${Object.keys(mappings).length} symbol mappings from cache`,
        );

        // Populate the in-memory cache
        Object.entries(mappings).forEach(([symbol, id]) => {
          cache.symbolToId.set(symbol, id as string);
        });

        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error initializing symbol cache:', error);
    return false;
  }
}

// Save the current symbol mappings to localStorage
function saveSymbolCache() {
  try {
    const mappings: Record<string, string> = {};
    cache.symbolToId.forEach((id, symbol) => {
      mappings[symbol] = id;
    });

    localStorage.setItem(SYMBOL_CACHE_KEY, JSON.stringify(mappings));
    localStorage.setItem(SYMBOL_CACHE_TIMESTAMP_KEY, Date.now().toString());

    console.log(
      `Saved ${Object.keys(mappings).length} symbol mappings to cache`,
    );
  } catch (error) {
    console.error('Error saving symbol cache:', error);
  }
}

// Initialize cache from localStorage or use fallback for common coins
const cacheInitialized = initializeSymbolCache();

if (!cacheInitialized) {
  console.log('No valid cache found, initializing with common coins');

  // Initialize common cryptocurrency mappings as a fallback
  // This ensures we always have mappings for the most common coins
  cache.symbolToId.set('btc', 'bitcoin');
  cache.symbolToId.set('eth', 'ethereum');
  cache.symbolToId.set('usdt', 'tether');
  cache.symbolToId.set('usdc', 'usd-coin');
  cache.symbolToId.set('bnb', 'binancecoin');
  cache.symbolToId.set('xrp', 'ripple');
  cache.symbolToId.set('sol', 'solana');
  cache.symbolToId.set('ada', 'cardano');
  cache.symbolToId.set('doge', 'dogecoin');
  cache.symbolToId.set('dot', 'polkadot');
}

// Schedule a background check of the symbol cache health
// This will refresh the cache if needed (either it's empty or has too few symbols)
setTimeout(() => {
  checkSymbolCacheHealth(!cacheInitialized) // Force refresh if cache wasn't initialized
    .then((symbolCount) => {
      console.log(`Symbol cache initialized with ${symbolCount} symbols`);
    })
    .catch((error) => {
      console.error('Error checking symbol cache health:', error);
    });
}, 1000);

// Rate limiting state
const rateLimitState = {
  publicLastReset: Date.now(),
  publicRequestCount: 0,
  proLastReset: Date.now(),
  proRequestCount: 0,
};

/**
 * Check if we can make a request to the public API
 */
function canUsePublicApi(): boolean {
  const now = Date.now();

  // Reset counter if a minute has passed
  if (now - rateLimitState.publicLastReset > 60 * 1000) {
    rateLimitState.publicLastReset = now;
    rateLimitState.publicRequestCount = 0;
    return true;
  }

  return rateLimitState.publicRequestCount < PUBLIC_RATE_LIMIT;
}

/**
 * Check if we can make a request to the pro API
 */
function canUseProApi(): boolean {
  // If no API key, we can't use the pro API
  if (!API_KEY) return false;

  const now = Date.now();

  // Reset counter if a minute has passed
  if (now - rateLimitState.proLastReset > 60 * 1000) {
    rateLimitState.proLastReset = now;
    rateLimitState.proRequestCount = 0;
    return true;
  }

  return rateLimitState.proRequestCount < PRO_RATE_LIMIT;
}

/**
 * Check circuit breaker state
 * @returns true if the circuit is closed (requests allowed), false if open (requests blocked)
 */
function checkCircuitBreaker(): boolean {
  const now = Date.now();

  // If circuit is OPEN, check if we should try half-open
  if (CIRCUIT_BREAKER.state === 'OPEN') {
    if (now - CIRCUIT_BREAKER.lastFailure > CIRCUIT_BREAKER.RESET_TIMEOUT) {
      console.log('Circuit breaker transitioning from OPEN to HALF_OPEN');
      CIRCUIT_BREAKER.state = 'HALF_OPEN';
      return true; // Allow one test request
    }
    return false; // Circuit still open, block requests
  }

  // If circuit is HALF_OPEN, we're testing with one request
  // The result of that request will determine if we close or re-open the circuit
  return true; // Allow requests in CLOSED or HALF_OPEN state
}

/**
 * Record a successful API call for circuit breaker
 */
function recordSuccess(): void {
  if (CIRCUIT_BREAKER.state === 'HALF_OPEN') {
    console.log('Circuit breaker test request succeeded, closing circuit');
    CIRCUIT_BREAKER.state = 'CLOSED';
    CIRCUIT_BREAKER.failures = 0;
    CIRCUIT_BREAKER.lastReset = Date.now();
  }
}

/**
 * Record a failed API call for circuit breaker
 */
function recordFailure(): void {
  const now = Date.now();
  CIRCUIT_BREAKER.failures++;
  CIRCUIT_BREAKER.lastFailure = now;

  // If we're in HALF_OPEN state, any failure reopens the circuit
  if (CIRCUIT_BREAKER.state === 'HALF_OPEN') {
    console.warn('Circuit breaker test request failed, reopening circuit');
    CIRCUIT_BREAKER.state = 'OPEN';
    return;
  }

  // If we've reached the failure threshold, open the circuit
  if (CIRCUIT_BREAKER.state === 'CLOSED' &&
      CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
    console.warn(`Circuit breaker threshold reached (${CIRCUIT_BREAKER.failures} failures), opening circuit`);
    CIRCUIT_BREAKER.state = 'OPEN';
  }
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
    // Remove adding the key as a header, query parameter is standard
    // config.headers = { 'x-cg-pro-api-key': API_KEY };
  }

  try {
    // Create a promise that will be used for the in-flight request tracking
    const requestPromise = axios.get<T>(`${baseUrl}${endpoint}`, config);

    // Track this request
    inFlightRequests[requestKey] = requestPromise;

    // Wait for the response
    const response = await requestPromise;

    // Record success for circuit breaker
    recordSuccess();

    // Update rate limit counters
    if (useProApi) {
      rateLimitState.proRequestCount++;
    } else {
      rateLimitState.publicRequestCount++;
    }

    // Cache the response
    cacheMap.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });

    // Remove from in-flight requests
    delete inFlightRequests[requestKey];

    return response.data;
  } catch (error) {
    // Remove from in-flight requests
    delete inFlightRequests[requestKey];

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
    const cachedData = cacheMap.get(cacheKey);
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
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Increased wait time
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
        const cachedData = cacheMap.get(cacheKey);
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
  }
}

/**
 * Fetch top cryptocurrencies from CoinGecko
 *
 * @param limit The number of coins to fetch
 * @returns An array of coin data
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
      false, // Prefer pro API for this endpoint
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
 * Get coin data by symbol
 */
/**
 * Search for coins by query string
 * This is useful for finding coins by name or symbol when they're not in the cache
 */
export async function searchCoins(query: string): Promise<any[]> {
  if (!query || query.length < 2) return [];

  const cacheKey = `search_${query.toLowerCase()}`;

  try {
    const response = await makeApiRequest<{ coins: any[] }>(
      '/search',
      { query },
      60 * 1000, // Cache for 1 minute
      cacheKey,
      new Map<string, { data: { coins: any[] }; timestamp: number }>(),
      false,
    );

    if (response.coins && response.coins.length > 0) {
      // Update the symbol to ID cache with results
      response.coins.forEach((coin) => {
        if (coin.symbol && coin.id) {
          cache.symbolToId.set(coin.symbol.toLowerCase(), coin.id);
        }
      });

      // Save the updated cache
      saveSymbolCache();

      return response.coins;
    }

    return [];
  } catch (error) {
    console.error(`Error searching for coins with query "${query}":`, error);
    return [];
  }
}

/**
 * Helper function to check if a string is likely a CoinGecko ID already
 * @param str The string to check
 * @returns True if the string appears to be a CoinGecko ID
 */
function isLikelyCoinGeckoId(str: string): boolean {
  // Common known IDs that don't follow the typical pattern
  const knownIds = [
    'bitcoin',
    'ethereum',
    'tether',
    'binancecoin',
    'ripple',
    'cardano',
    'solana',
    'dogecoin',
    'polkadot',
    'usd-coin',
  ];

  if (knownIds.includes(str)) {
    return true;
  }

  // Check if it follows CoinGecko ID format:
  // - lowercase
  // - may contain hyphens
  // - no special characters except hyphens
  // - typically contains hyphens for multi-word names
  return /^[a-z0-9-]+$/.test(str) && str.includes('-');
}

/**
 * Resolve a symbol or ID to a CoinGecko coin ID
 * This function tries multiple strategies to find the correct ID
 *
 * @param input The symbol or ID to resolve (e.g., "BTC", "bitcoin", "binance-coin")
 * @returns The resolved CoinGecko ID or null if not found
 */
export async function resolveSymbolToId(input: string): Promise<string | null> {
  // Normalize the input to lowercase
  const normalizedInput = input.toLowerCase();

  // 0. Check if input is already a valid CoinGecko ID
  if (isLikelyCoinGeckoId(normalizedInput)) {
    console.log(
      `Input "${input}" appears to be a CoinGecko ID already, using as is`,
    );
    return normalizedInput;
  }

  // 1. Check for special cases that need direct mapping
  if (normalizedInput === 'btc' || normalizedInput === 'xbt') return 'bitcoin';
  if (normalizedInput === 'eth') return 'ethereum';
  if (normalizedInput === 'usdt') return 'tether';
  if (normalizedInput === 'usdc') return 'usd-coin';
  if (normalizedInput === 'bnb') return 'binancecoin';
  if (normalizedInput === 'xrp') return 'ripple';
  if (normalizedInput === 'sol') return 'solana';
  if (normalizedInput === 'ada') return 'cardano';
  if (normalizedInput === 'doge') return 'dogecoin';
  if (normalizedInput === 'dot') return 'polkadot';

  // 2. Check in-memory cache
  if (cache.symbolToId.has(normalizedInput)) {
    const id = cache.symbolToId.get(normalizedInput)!;
    console.log(`Found symbol "${input}" in cache, resolved to "${id}"`);
    return id;
  }

  // 3. Try to fetch top coins to populate the cache
  try {
    console.log(`Symbol "${input}" not found in cache, fetching top coins...`);
    await getTopCoins(250);

    if (cache.symbolToId.has(normalizedInput)) {
      const id = cache.symbolToId.get(normalizedInput)!;
      console.log(`After fetching top coins, resolved "${input}" to "${id}"`);
      return id;
    }
  } catch (error) {
    console.error(`Error fetching top coins for symbol resolution:`, error);
  }

  // 4. Try to search for the coin
  try {
    console.log(`Symbol "${input}" not found in top coins, searching...`);
    const searchResults = await searchCoins(input);

    // Look for exact symbol match
    const exactMatch = searchResults.find(
      (coin) => coin.symbol.toLowerCase() === normalizedInput,
    );

    if (exactMatch) {
      console.log(`Found exact match for "${input}": "${exactMatch.id}"`);
      return exactMatch.id;
    }

    // If no exact match but we have results, use the first one
    if (searchResults.length > 0) {
      console.warn(
        `No exact match for "${input}", using best match: "${searchResults[0].id}"`,
      );
      return searchResults[0].id;
    }
  } catch (error) {
    console.error(`Error searching for coin with input "${input}":`, error);
  }

  // 5. No resolution found
  console.error(
    `Could not resolve "${input}" to a CoinGecko ID after trying all methods`,
  );
  return null;
}

// Request batching for coins
const coinBatchQueue: Map<string, {
  resolve: (data: CoinGeckoData | null) => void;
  reject: (error: Error) => void;
}> = new Map();

let batchTimeout: NodeJS.Timeout | null = null;
const BATCH_DELAY = 100; // ms to wait before processing batch

/**
 * Process the batch of coin requests
 */
async function processCoinBatch() {
  if (coinBatchQueue.size === 0) return;

  console.log(`Processing batch of ${coinBatchQueue.size} coin requests`);

  // Get all coin IDs from the queue
  const coinIds = Array.from(coinBatchQueue.keys());

  // Create a map to store results
  const results = new Map<string, CoinGeckoData | null>();

  try {
    // If we have only one coin, use the single coin endpoint
    if (coinIds.length === 1) {
      const coinId = coinIds[0];
      const result = await fetchSingleCoin(coinId);
      results.set(coinId, result);
    }
    // If we have multiple coins, use the markets endpoint with the ids parameter
    else {
      const marketData = await makeApiRequest<CoinGeckoData[]>(
        '/coins/markets',
        {
          vs_currency: 'usd',
          ids: coinIds.join(','),
          per_page: coinIds.length,
          page: 1,
          sparkline: true,
          price_change_percentage: '24h',
        },
        CACHE_DURATIONS.MARKETS,
        `batch_coins_${coinIds.join('_')}`,
        cache.markets as Map<string, { data: CoinGeckoData[]; timestamp: number }>,
        true, // Prefer pro API for batched requests
        true, // Mark as essential
      );

      // Map results by coin ID
      marketData.forEach(coin => {
        results.set(coin.id, coin);

        // Also cache individual coins
        cache.coins.set(`coin_${coin.id}`, {
          data: coin,
          timestamp: Date.now()
        });
      });

      // For any coins not found in the market data, set null
      coinIds.forEach(id => {
        if (!results.has(id)) {
          results.set(id, null);
        }
      });
    }
  } catch (error) {
    console.error('Error processing coin batch:', error);
    // Reject all promises with the error
    coinBatchQueue.forEach(({ reject }) => {
      reject(error as Error);
    });
    coinBatchQueue.clear();
    return;
  }

  // Resolve all promises with their respective results
  coinBatchQueue.forEach(({ resolve }, coinId) => {
    resolve(results.get(coinId) || null);
  });

  // Clear the queue
  coinBatchQueue.clear();
}

/**
 * Fetch a single coin directly (not batched)
 */
async function fetchSingleCoin(coinId: string): Promise<CoinGeckoData | null> {
  const cacheKey = `coin_${coinId}`;

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
    return null;
  }
}

/**
 * Get coin data by symbol or ID (with batching)
 *
 * @param symbolOrId The symbol or ID of the coin (e.g., "BTC", "bitcoin")
 * @returns The coin data or null if not found
 */
export async function getCoinBySymbol(
  symbolOrId: string,
): Promise<CoinGeckoData | null> {
  // First, resolve the input to a valid CoinGecko ID
  const resolvedId = await resolveSymbolToId(symbolOrId);

  if (!resolvedId) {
    console.error(
      `getCoinBySymbol: Could not resolve "${symbolOrId}" to a valid CoinGecko ID`,
    );
    return null;
  }

  // Use the resolved ID for the cache key and API call
  const coinId = resolvedId;
  const cacheKey = `coin_${coinId}`;

  console.log(
    `getCoinBySymbol: Using resolved ID "${coinId}" for "${symbolOrId}"`,
  );

  // Check cache first
  const cachedData = cache.coins.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATIONS.COINS) {
    console.log(`Using cached data for ${coinId}`);
    return cachedData.data;
  }

  // If circuit breaker is open, check for stale data
  if (CIRCUIT_BREAKER.state === 'OPEN') {
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATIONS.STALE_COINS) {
      console.log(`Using stale cache for ${coinId} due to open circuit breaker`);
      return cachedData.data;
    }
  }

  // Add to batch queue
  return new Promise<CoinGeckoData | null>((resolve, reject) => {
    coinBatchQueue.set(coinId, { resolve, reject });

    // Set timeout to process batch if not already set
    if (!batchTimeout) {
      batchTimeout = setTimeout(() => {
        batchTimeout = null;
        processCoinBatch();
      }, BATCH_DELAY);
    }
  });
}

/**
 * Get current price for a trading pair
 *
 * @param baseAsset The base asset symbol or ID (e.g., "BTC", "bitcoin")
 * @param quoteAsset The quote asset symbol or ID (e.g., "USD", "USDT")
 * @returns The current price or 0 if not found
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

      // Check if we got both coins
      if (!baseCoin) {
        console.error(
          `getCurrentPrice: Could not get data for base asset "${baseAsset}"`,
        );
        return 0;
      }

      if (!quoteCoin || quoteCoin.current_price === 0) {
        console.error(
          `getCurrentPrice: Could not get data for quote asset "${quoteAsset}"`,
        );
        return 0;
      }

      const relativePrice = baseCoin.current_price / quoteCoin.current_price;
      console.log(
        `getCurrentPrice: ${baseAsset}/${quoteAsset} price is ${relativePrice}`,
      );
      return relativePrice;
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
 * Get trading pairs for a specific exchange
 */
export async function getTradingPairs(
  exchangeId: string = 'binance',
): Promise<TradingPair[]> {
  try {
    // Get top coins to use as base assets
    const topCoins = await getTopCoins(20);

    // Common quote assets
    const quoteAssets = ['USDT', 'USD', 'BTC', 'ETH'];

    // Generate trading pairs
    const tradingPairs: TradingPair[] = [];

    for (const coin of topCoins) {
      for (const quoteAsset of quoteAssets) {
        // Skip if base and quote are the same
        if (coin.symbol.toUpperCase() === quoteAsset) continue;

        // Format price with appropriate precision
        const price = coin.current_price.toString();

        // Format 24h change
        const change24h =
          coin.price_change_percentage_24h >= 0
            ? `+${coin.price_change_percentage_24h.toFixed(2)}%`
            : `${coin.price_change_percentage_24h.toFixed(2)}%`;

        // Format volume (simplified)
        const volume = (coin.market_cap / 1000000).toFixed(2) + 'm';

        tradingPairs.push({
          symbol: `${coin.symbol.toUpperCase()}/${quoteAsset}`,
          baseAsset: coin.symbol.toUpperCase(),
          quoteAsset: quoteAsset,
          price: price,
          change24h: change24h,
          volume24h: volume,
          exchangeId: exchangeId,
          priceDecimals: 2,
          quantityDecimals: 8,
        });
      }
    }

    return tradingPairs;
  } catch (error) {
    console.error('Error generating trading pairs:', error);
    return [];
  }
}

/**
 * Get tickers for a specific coin
 * This is used to build the order book
 *
 * @param coinId The coin ID or symbol
 * @param exchangeIds Optional array of exchange IDs to filter by
 * @returns A response containing tickers for the coin
 */
export async function getCoinTickers(
  coinIdOrSymbol: string,
  exchangeIds: string[] = [],
): Promise<CoinGeckoTickerResponse> {
  // First, resolve the input to a valid CoinGecko ID
  const resolvedId = await resolveSymbolToId(coinIdOrSymbol);

  if (!resolvedId) {
    console.error(
      `getCoinTickers: Could not resolve "${coinIdOrSymbol}" to a valid CoinGecko ID`,
    );
    return { name: '', tickers: [] };
  }

  // Use the resolved ID for the cache key and API call
  const coinId = resolvedId;
  const cacheKey = `tickers_${coinId}_${exchangeIds.join('_')}`;

  console.log(
    `getCoinTickers: Using resolved ID "${coinId}" for "${coinIdOrSymbol}"`,
  );

  try {
    // Prepare params
    const params: Record<string, any> = {};
    if (exchangeIds.length > 0) {
      params.exchange_ids = exchangeIds.join(',');
    }

    console.log(`Fetching tickers for coin ${coinId} with params:`, params);

    try {
      const response = await makeApiRequest<CoinGeckoTickerResponse>(
        `/coins/${coinId}/tickers`,
        params,
        CACHE_DURATIONS.TICKERS,
        cacheKey,
        cache.tickers as Map<
          string,
          { data: CoinGeckoTickerResponse; timestamp: number }
        >,
        false, // Prefer pro API for this endpoint (Changed to false for testing)
      );

      console.log(
        `Successfully fetched ${response.tickers?.length || 0} tickers for ${coinId}`,
      );
      return response;
    } catch (apiError) {
      console.error(`API error fetching tickers for ${coinId}:`, apiError);

      // Check for cached data
      const cachedData = cache.tickers.get(cacheKey);
      if (cachedData) {
        console.warn(`Using cached tickers for ${coinId} due to API error`);
        return cachedData.data;
      }

      // If no cached data, return empty response
      return { name: '', tickers: [] };
    }
  } catch (error) {
    console.error(`Error in getCoinTickers for ${coinId}:`, error);

    // Return empty response if we have no cached data
    const cachedData = cache.tickers.get(cacheKey);
    return cachedData ? cachedData.data : { name: '', tickers: [] };
  }
}

/**
 * Convert CoinGecko tickers to our orderbook format
 * This is a simplified implementation since CoinGecko doesn't provide full orderbook data
 */
export function tickersToOrderbook(
  tickers: CoinGeckoTicker[],
  depth: number = 10,
): Orderbook {
  // Sort tickers by price
  const sortedTickers = [...tickers].sort((a, b) => a.last - b.last);

  // Generate bids and asks
  const bids: [string, string][] = [];
  const asks: [string, string][] = [];

  // Use the median price as a reference
  const medianPrice =
    sortedTickers.length > 0
      ? sortedTickers[Math.floor(sortedTickers.length / 2)].last
      : 0;

  // Generate bids (slightly below median price)
  for (let i = 0; i < depth; i++) {
    const price = Math.max(0.01, medianPrice * (1 - 0.001 * (i + 1)));
    const quantity = Math.random() * 2 + 0.1; // Random quantity between 0.1 and 2.1
    bids.push([price.toFixed(2), quantity.toFixed(8)]);
  }

  // Generate asks (slightly above median price)
  for (let i = 0; i < depth; i++) {
    const price = medianPrice * (1 + 0.001 * (i + 1));
    const quantity = Math.random() * 2 + 0.1; // Random quantity between 0.1 and 2.1
    asks.push([price.toFixed(2), quantity.toFixed(8)]);
  }

  // Sort bids in descending order (highest price first)
  bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));

  // Sort asks in ascending order (lowest price first)
  asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

  return { bids, asks };
}

/**
 * Get orderbook for a trading pair
 *
 * @param symbol The trading pair symbol (e.g., BTC/USDT)
 * @param exchangeId The exchange ID (e.g., binance, coinbase)
 * @param depth The number of orders to include in the orderbook
 * @returns An orderbook with bids and asks
 */
export async function getOrderbook(
  symbol: string,
  exchangeId: string = 'binance',
  depth: number = 10,
): Promise<Orderbook> {
  // Create a cache key for this specific orderbook request
  const cacheKey = `orderbook_${symbol}_${exchangeId}_${depth}`;

  // Check if we have a cached orderbook
  const cachedOrderbook = localStorage.getItem(cacheKey);
  if (cachedOrderbook) {
    try {
      const parsed = JSON.parse(cachedOrderbook);
      const timestamp = parsed.timestamp || 0;

      // Use cached data if it's less than 30 seconds old
      if (Date.now() - timestamp < 30000) {
        console.log(
          `Using cached orderbook for ${symbol} from ${new Date(timestamp).toLocaleTimeString()}`,
        );
        return parsed.data;
      }
    } catch (e) {
      console.warn('Error parsing cached orderbook:', e);
      // Continue with fetching fresh data
    }
  }

  try {
    // Parse the symbol to get base and quote assets
    const [baseAsset, quoteAsset] = symbol.split('/');
    if (!baseAsset || !quoteAsset) {
      console.error(`Invalid symbol format: ${symbol}`);
      return generateFallbackOrderbook(symbol, depth);
    }

    // Get the coin ID for the base asset using our comprehensive resolution system
    const coinId = await resolveSymbolToId(baseAsset);

    if (!coinId) {
      console.warn(
        `getOrderbook: Could not resolve symbol ${baseAsset} to a coin ID, using fallback data`,
      );
      return generateFallbackOrderbook(symbol, depth);
    }

    console.log(`getOrderbook: Resolved ${baseAsset} to coin ID: ${coinId}`);

    // Get tickers for the coin
    console.log(`Fetching tickers for ${coinId} on ${exchangeId}`);
    try {
      const tickerResponse = await getCoinTickers(coinId, [exchangeId]);

      // Check if we got any tickers
      if (!tickerResponse.tickers || tickerResponse.tickers.length === 0) {
        console.warn(
          `No tickers found for ${coinId} on ${exchangeId}, using fallback data`,
        );
        return generateFallbackOrderbook(symbol, depth);
      }

      // Filter tickers for the specific trading pair
      // Handle special cases for exchanges that use different symbols
      const filteredTickers = tickerResponse.tickers.filter((ticker) => {
        // Handle BTC/XBT case for Kraken
        const baseMatches =
          ticker.base.toLowerCase() === baseAsset.toLowerCase() ||
          (exchangeId.toLowerCase() === 'kraken' &&
            baseAsset.toLowerCase() === 'btc' &&
            ticker.base.toLowerCase() === 'xbt');

        const targetMatches =
          ticker.target.toLowerCase() === quoteAsset.toLowerCase();

        return baseMatches && targetMatches;
      });

      // Check if we have any matching tickers after filtering
      if (filteredTickers.length === 0) {
        console.warn(
          `No matching tickers found for ${symbol} on ${exchangeId}, using fallback data`,
        );
        return generateFallbackOrderbook(symbol, depth);
      }

      // Convert tickers to orderbook format
      const orderbook = tickersToOrderbook(filteredTickers, depth);

      // Cache the orderbook
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: orderbook,
            timestamp: Date.now(),
          }),
        );
      } catch (e) {
        console.warn('Error caching orderbook:', e);
      }

      return orderbook;
    } catch (tickersError) {
      console.error(`Error fetching tickers for ${coinId}:`, tickersError);
      throw tickersError; // Let the outer catch block handle this
    }
  } catch (error) {
    console.error(`Error getting orderbook for ${symbol}:`, error);

    // Try to use cached data even if it's older than our normal threshold
    const cachedOrderbook = localStorage.getItem(cacheKey);
    if (cachedOrderbook) {
      try {
        const parsed = JSON.parse(cachedOrderbook);
        console.warn(
          `Using stale cached orderbook for ${symbol} due to API error`,
        );
        return parsed.data;
      } catch (e) {
        console.warn('Error parsing cached orderbook:', e);
      }
    }

    // If all else fails, generate a fallback orderbook
    return generateFallbackOrderbook(symbol, depth);
  }
}

/**
 * Generate a fallback orderbook when API calls fail
 */
function generateFallbackOrderbook(
  symbol: string,
  depth: number = 10,
): Orderbook {
  console.log(`Generating fallback orderbook for ${symbol}`);

  // Parse the symbol to get base asset
  const [baseAsset] = symbol.split('/');

  // Get a base price based on the asset
  let basePrice = 100; // Default fallback price

  // Use realistic prices for common assets
  switch (baseAsset.toUpperCase()) {
    case 'BTC':
      basePrice = 84000;
      break;
    case 'ETH':
      basePrice = 3500;
      break;
    case 'SOL':
      basePrice = 175;
      break;
    case 'XRP':
      basePrice = 0.48;
      break;
    case 'ADA':
      basePrice = 0.38;
      break;
    case 'DOT':
      basePrice = 5.8;
      break;
    case 'AVAX':
      basePrice = 25;
      break;
    case 'MATIC':
      basePrice = 0.54;
      break;
    case 'LINK':
      basePrice = 15;
      break;
    case 'DOGE':
      basePrice = 0.08;
      break;
  }

  const bids: [string, string][] = [];
  const asks: [string, string][] = [];

  // Generate bids (buy orders) with percentage-based price decreases
  for (let i = 0; i < depth; i++) {
    const percentDecrease = (i + 1) * 0.001; // 0.1% decrease per level
    const price = Math.max(0.01, basePrice * (1 - percentDecrease));
    const quantity = Math.random() * 2 + 0.1; // Random quantity between 0.1 and 2.1
    bids.push([price.toFixed(2), quantity.toFixed(8)]);
  }

  // Generate asks (sell orders) with percentage-based price increases
  for (let i = 0; i < depth; i++) {
    const percentIncrease = (i + 1) * 0.001; // 0.1% increase per level
    const price = basePrice * (1 + percentIncrease);
    const quantity = Math.random() * 2 + 0.1; // Random quantity between 0.1 and 2.1
    asks.push([price.toFixed(2), quantity.toFixed(8)]);
  }

  // Sort bids in descending order (highest price first)
  bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));

  // Sort asks in ascending order (lowest price first)
  asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

  return { bids, asks };
}

/**
 * Get historical price data for a specific coin
 */
export async function getHistoricalPriceData(
  coinIdOrSymbol: string,
  days: number = 7,
  interval: string = 'daily',
): Promise<{ prices: [number, number][] }> {
  // First, resolve the input to a valid CoinGecko ID
  const resolvedId = await resolveSymbolToId(coinIdOrSymbol);

  if (!resolvedId) {
    console.error(
      `getHistoricalPriceData: Could not resolve "${coinIdOrSymbol}" to a valid CoinGecko ID`,
    );
    return { prices: [] };
  }

  // Use the resolved ID for the cache key and API call
  const coinId = resolvedId;
  const cacheKey = `historical_${coinId}_${days}_${interval}`;

  console.log(
    `getHistoricalPriceData: Using resolved ID "${coinId}" for "${coinIdOrSymbol}"`,
  );

  try {
    // Use a custom cache map for historical data
    const historicalCache = new Map<
      string,
      { data: { prices: [number, number][] }; timestamp: number }
    >();

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

/**
 * Get coin icon URL by symbol
 */
export async function getCoinIconUrl(symbol: string): Promise<string> {
  try {
    const coin = await getCoinBySymbol(symbol);
    return coin?.image || '/placeholder.svg';
  } catch (error) {
    console.error(`Error fetching icon for ${symbol}:`, error);
    return '/placeholder.svg';
  }
}

/**
 * Reset the cache
 */
export function resetCache(): void {
  cache.coins.clear();
  cache.markets.clear();
  cache.tickers.clear();
  // Don't clear symbolToId cache as it's useful to keep
}

/**
 * Get cache statistics
 */
export function getCacheStats(): Record<string, number> {
  return {
    coins: cache.coins.size,
    markets: cache.markets.size,
    tickers: cache.tickers.size,
    symbolToId: cache.symbolToId.size,
    publicRequestCount: rateLimitState.publicRequestCount,
    proRequestCount: rateLimitState.proRequestCount,
  };
}

/**
 * Check the health of the symbol cache and refresh it if needed
 * This is useful to call periodically to ensure the cache is up-to-date
 *
 * @param forceRefresh Whether to force a refresh regardless of cache state
 * @returns The number of symbols in the cache after the check
 */
export async function checkSymbolCacheHealth(
  forceRefresh: boolean = false,
): Promise<number> {
  // Check if we have a reasonable number of symbols in the cache
  const minExpectedSymbols = 100; // We should have at least this many symbols
  const currentSymbolCount = cache.symbolToId.size;

  console.log(
    `Symbol cache health check: ${currentSymbolCount} symbols in cache`,
  );

  // Check if we need to refresh the cache
  const needsRefresh = forceRefresh || currentSymbolCount < minExpectedSymbols;

  if (needsRefresh) {
    console.log(
      `Refreshing symbol cache (current size: ${currentSymbolCount}, minimum expected: ${minExpectedSymbols})`,
    );

    try {
      // Fetch a large number of coins to populate the cache
      await getTopCoins(250);

      // Save the updated cache to localStorage
      saveSymbolCache();

      console.log(`Symbol cache refreshed, new size: ${cache.symbolToId.size}`);
    } catch (error) {
      console.error('Error refreshing symbol cache:', error);
    }
  } else {
    console.log('Symbol cache is healthy, no refresh needed');
  }

  return cache.symbolToId.size;
}
