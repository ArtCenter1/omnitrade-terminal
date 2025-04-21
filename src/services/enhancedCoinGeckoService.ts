import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TradingPair } from '@/types/trading';
import { useFeatureFlags } from '@/config/featureFlags';

// Define the base URLs for CoinGecko APIs
const PUBLIC_API_URL = 'https://api.coingecko.com/api/v3';
const PRO_API_URL = 'https://pro-api.coingecko.com/api/v3';

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY || '';

// Rate limiting configuration
const PUBLIC_RATE_LIMIT = 30; // requests per minute
const PRO_RATE_LIMIT = 50; // requests per minute

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

// Interface for our orderbook format
export interface Orderbook {
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
}

// Cache for data to avoid excessive API calls
const cache = {
  coins: new Map<string, { data: CoinGeckoData; timestamp: number }>(),
  markets: new Map<string, { data: CoinGeckoData[]; timestamp: number }>(),
  tickers: new Map<string, { data: CoinGeckoTickerResponse; timestamp: number }>(),
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
  preferPro: boolean = false
): Promise<T> {
  // Check cache first
  const cachedData = cacheMap.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < cacheDuration) {
    return cachedData.data;
  }
  
  // Determine which API to use
  let useProApi = preferPro && API_KEY && canUseProApi();
  const baseUrl = useProApi ? PRO_API_URL : PUBLIC_API_URL;
  
  // Prepare request config
  const config: AxiosRequestConfig = {
    params: { ...params },
  };
  
  // Add API key if using pro API
  if (useProApi) {
    config.params.x_cg_pro_api_key = API_KEY;
  }
  
  try {
    // Make the request
    if (useProApi) {
      rateLimitState.proRequestCount++;
    } else {
      rateLimitState.publicRequestCount++;
    }
    
    const response = await axios.get<T>(`${baseUrl}${endpoint}`, config);
    
    // Cache the response
    cacheMap.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
    
    return response.data;
  } catch (error) {
    // If we get a rate limit error and we were using the public API, try the pro API
    if (
      !useProApi && 
      API_KEY && 
      canUseProApi() && 
      axios.isAxiosError(error) && 
      (error.response?.status === 429 || error.response?.status === 403)
    ) {
      console.warn('Rate limited on public API, trying pro API');
      return makeApiRequest(endpoint, params, cacheDuration, cacheKey, cacheMap, true);
    }
    
    // If we get a rate limit error on the pro API, wait and retry
    if (
      useProApi && 
      axios.isAxiosError(error) && 
      (error.response?.status === 429 || error.response?.status === 403)
    ) {
      console.warn('Rate limited on pro API, waiting and retrying');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeApiRequest(endpoint, params, cacheDuration, cacheKey, cacheMap, true);
    }
    
    // Otherwise, throw the error
    console.error(`Error making API request to ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Fetch top cryptocurrencies from CoinGecko
 */
export async function getTopCoins(limit = 100): Promise<CoinGeckoData[]> {
  const cacheKey = `top_coins_${limit}`;
  
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
      cache.markets as Map<string, { data: CoinGeckoData[]; timestamp: number }>,
      true // Prefer pro API for this endpoint
    );
    
    // Update symbol to ID mapping
    data.forEach((coin) => {
      cache.symbolToId.set(coin.symbol.toLowerCase(), coin.id);
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    
    // Return empty array if we have no cached data
    const cachedData = cache.markets.get(cacheKey);
    return cachedData ? cachedData.data : [];
  }
}

/**
 * Get coin data by symbol
 */
export async function getCoinBySymbol(symbol: string): Promise<CoinGeckoData | null> {
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
      false // Use public API first for this endpoint
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
    console.error(`Error getting current price for ${baseAsset}/${quoteAsset}:`, error);
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
 */
export async function getCoinTickers(
  coinId: string,
  exchangeIds: string[] = []
): Promise<CoinGeckoTickerResponse> {
  const cacheKey = `tickers_${coinId}_${exchangeIds.join('_')}`;
  
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
    
    // Prepare params
    const params: Record<string, any> = {};
    if (exchangeIds.length > 0) {
      params.exchange_ids = exchangeIds.join(',');
    }
    
    return await makeApiRequest<CoinGeckoTickerResponse>(
      `/coins/${coinId}/tickers`,
      params,
      CACHE_DURATIONS.TICKERS,
      cacheKey,
      cache.tickers as Map<string, { data: CoinGeckoTickerResponse; timestamp: number }>,
      true // Prefer pro API for this endpoint
    );
  } catch (error) {
    console.error(`Error fetching tickers for ${coinId}:`, error);
    
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
  depth: number = 10
): Orderbook {
  // Sort tickers by price
  const sortedTickers = [...tickers].sort((a, b) => a.last - b.last);
  
  // Generate bids and asks
  const bids: [string, string][] = [];
  const asks: [string, string][] = [];
  
  // Use the median price as a reference
  const medianPrice = sortedTickers.length > 0
    ? sortedTickers[Math.floor(sortedTickers.length / 2)].last
    : 0;
  
  // Generate bids (slightly below median price)
  for (let i = 0; i < depth; i++) {
    const price = medianPrice * (1 - 0.001 * (i + 1));
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
 */
export async function getOrderbook(
  symbol: string,
  exchangeId: string = 'binance',
  depth: number = 10
): Promise<Orderbook> {
  try {
    // Parse the symbol to get base and quote assets
    const [baseAsset, quoteAsset] = symbol.split('/');
    
    // Get the coin ID for the base asset
    let coinId = '';
    if (cache.symbolToId.has(baseAsset.toLowerCase())) {
      coinId = cache.symbolToId.get(baseAsset.toLowerCase())!;
    } else {
      // Try to fetch top coins to populate the cache
      await getTopCoins();
      if (cache.symbolToId.has(baseAsset.toLowerCase())) {
        coinId = cache.symbolToId.get(baseAsset.toLowerCase())!;
      } else {
        throw new Error(`Could not find coin ID for ${baseAsset}`);
      }
    }
    
    // Get tickers for the coin
    const tickerResponse = await getCoinTickers(coinId, [exchangeId]);
    
    // Filter tickers for the specific trading pair
    const filteredTickers = tickerResponse.tickers.filter(
      ticker => 
        ticker.base.toLowerCase() === baseAsset.toLowerCase() &&
        ticker.target.toLowerCase() === quoteAsset.toLowerCase()
    );
    
    // Convert tickers to orderbook format
    return tickersToOrderbook(filteredTickers, depth);
  } catch (error) {
    console.error(`Error getting orderbook for ${symbol}:`, error);
    
    // Return empty orderbook
    return { bids: [], asks: [] };
  }
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
    const historicalCache = new Map<string, { data: { prices: [number, number][] }; timestamp: number }>();
    
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
      false // Use public API first for this endpoint
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
