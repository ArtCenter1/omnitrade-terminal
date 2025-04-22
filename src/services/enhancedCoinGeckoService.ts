import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
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
const PUBLIC_RATE_LIMIT = 10; // requests per minute (reduced for safety)
const PRO_RATE_LIMIT = 30; // requests per minute (reduced for safety)

// Throttling configuration
const THROTTLE_DELAY = 500; // ms between requests
let lastRequestTime = 0;

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  COINS: 5 * 60 * 1000, // 5 minutes
  MARKETS: 1 * 60 * 1000, // 1 minute
  TICKERS: 10 * 1000, // 10 seconds
  ORDERBOOK: 5 * 1000, // 5 seconds
  PRICE: 10 * 1000, // 10 seconds
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
 * Make an API request with rate limiting and caching
 */
async function makeApiRequest<T>(
  endpoint: string,
  params: Record<string, any> = {},
  cacheDuration: number,
  cacheKey: string,
  cacheMap: Map<string, { data: T; timestamp: number }>,
  preferPro: boolean = false,
): Promise<T> {
  // Check cache first
  const cachedData = cacheMap.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < cacheDuration) {
    return cachedData.data;
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
      timeout: 10000, // 10 second timeout
    });

    console.log(`Request successful: ${baseUrl}${endpoint}`);
    console.log(`Response data:`, response.data);

    // Cache the response
    cacheMap.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });

    return response.data;
  } catch (error) {
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
      console.warn(`Using stale cached data for ${endpoint} due to API error`);
      return cachedData.data;
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

    // If we get a timeout or network error, wait and retry once
    if (
      axios.isAxiosError(error) &&
      (error.code === 'ECONNABORTED' ||
        !error.response ||
        error.code === 'ECONNREFUSED')
    ) {
      console.warn(`Network error or timeout for ${endpoint}, retrying once`);
      console.warn(`Error details: ${error.message}, Code: ${error.code}`);

      // For ECONNREFUSED errors, we might be having issues with the network
      if (error.code === 'ECONNREFUSED') {
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

        // If no cached data, throw a more specific error
        throw new Error(
          `API server connection refused. Please check your network connection or API server status.`,
        );
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
      false, // Prefer pro API for this endpoint (Changed to false for testing)
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
export async function getCoinBySymbol(
  symbol: string,
): Promise<CoinGeckoData | null> {
  const normalizedSymbol = symbol.toLowerCase();

  // Check if we have the ID for this symbol
  if (!cache.symbolToId.has(normalizedSymbol)) {
    // If we don't have the mapping, fetch top coins to populate the cache
    await getTopCoins();

    // If still not found, return null
    if (!cache.symbolToId.has(normalizedSymbol)) {
      return null;
    }
  }

  const coinId = cache.symbolToId.get(normalizedSymbol)!;
  const cacheKey = `coin_${coinId}`;

  try {
    return await makeApiRequest<CoinGeckoData>(
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
      false, // Use public API first for this endpoint
    );
  } catch (error) {
    console.error(`Error fetching coin data for ${symbol}:`, error);
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
    const coin = await getCoinBySymbol(baseAsset);
    if (!coin) return 0;

    if (
      quoteAsset.toLowerCase() === 'usd' ||
      quoteAsset.toLowerCase() === 'usdt'
    ) {
      return coin.current_price;
    } else {
      // For other quote assets, we need to calculate the relative price
      const quoteCoin = await getCoinBySymbol(quoteAsset);
      if (!quoteCoin || quoteCoin.current_price === 0) return 0;

      return coin.current_price / quoteCoin.current_price;
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
  coinId: string,
  exchangeIds: string[] = [],
): Promise<CoinGeckoTickerResponse> {
  const cacheKey = `tickers_${coinId}_${exchangeIds.join('_')}`;

  try {
    // Handle special cases for exchanges that use different symbols
    // Kraken uses XBT instead of BTC
    if (
      coinId.toLowerCase() === 'btc' &&
      exchangeIds.some((id) => id.toLowerCase() === 'kraken')
    ) {
      console.log('Using bitcoin ID directly for BTC on Kraken');
      coinId = 'bitcoin';
    } else if (coinId.toLowerCase() === 'xbt') {
      console.log('Converting XBT to bitcoin ID');
      coinId = 'bitcoin';
    } else if (!coinId.includes('-')) {
      // If we don't have the coin ID, try to get it from the symbol
      const normalizedSymbol = coinId.toLowerCase();
      if (cache.symbolToId.has(normalizedSymbol)) {
        coinId = cache.symbolToId.get(normalizedSymbol)!;
        console.log(`Resolved symbol ${normalizedSymbol} to coin ID ${coinId}`);
      } else {
        // Try to fetch top coins to populate the cache
        console.log(
          `Symbol ${normalizedSymbol} not found in cache, fetching top coins`,
        );
        await getTopCoins();
        if (cache.symbolToId.has(normalizedSymbol)) {
          coinId = cache.symbolToId.get(normalizedSymbol)!;
          console.log(
            `After fetching top coins, resolved symbol ${normalizedSymbol} to coin ID ${coinId}`,
          );
        } else {
          console.warn(
            `Could not resolve symbol ${normalizedSymbol} to a coin ID`,
          );
          return { name: '', tickers: [] };
        }
      }
    }

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

    // Get the coin ID for the base asset
    let coinId = '';
    if (cache.symbolToId.has(baseAsset.toLowerCase())) {
      coinId = cache.symbolToId.get(baseAsset.toLowerCase())!;
    } else {
      // Try to fetch top coins to populate the cache
      console.log(`Fetching top coins to find ID for ${baseAsset}`);
      try {
        await getTopCoins();
        if (cache.symbolToId.has(baseAsset.toLowerCase())) {
          coinId = cache.symbolToId.get(baseAsset.toLowerCase())!;
          console.log(`Found coin ID for ${baseAsset}: ${coinId}`);
        } else {
          console.warn(
            `Could not find coin ID for ${baseAsset}, using fallback data`,
          );
          return generateFallbackOrderbook(symbol, depth);
        }
      } catch (topCoinsError) {
        console.error(
          `Error fetching top coins for ${baseAsset}:`,
          topCoinsError,
        );
        return generateFallbackOrderbook(symbol, depth);
      }
    }

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
  coinId: string,
  days: number = 7,
  interval: string = 'daily',
): Promise<{ prices: [number, number][] }> {
  const cacheKey = `historical_${coinId}_${days}_${interval}`;

  try {
    // If we don't have the coin ID, try to get it from the symbol
    if (!coinId.includes('-')) {
      const normalizedSymbol = coinId.toLowerCase();
      if (cache.symbolToId.has(normalizedSymbol)) {
        coinId = cache.symbolToId.get(normalizedSymbol)!;
      } else {
        // Try to fetch top coins to populate the cache
        await getTopCoins();
        if (cache.symbolToId.has(normalizedSymbol)) {
          coinId = cache.symbolToId.get(normalizedSymbol)!;
        }
      }
    }

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
