import axios from 'axios';
import { TradingPair } from '@/types/trading';

// Define the base URL for CoinGecko API
// Use our backend proxy to avoid CORS issues and benefit from caching and rate limit handling
const COINGECKO_API_URL = '/api/proxy/coingecko';

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

// Cache for coin data to avoid excessive API calls
const coinDataCache: Record<string, CoinGeckoData> = {};
const symbolToIdCache: Record<string, string> = {};
let allCoinsCache: CoinGeckoData[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes (increased from 15)

/**
 * Helper function to retry API calls with exponential backoff
 */
async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  initialBackoff: number = 1000
): Promise<T> {
  let retryCount = 0;

  while (true) {
    try {
      return await apiCall();
    } catch (error) {
      retryCount++;

      // If we've reached max retries or it's not a retryable error, throw
      if (
        retryCount >= maxRetries ||
        !(axios.isAxiosError(error) &&
          (error.response?.status === 429 || // Rate limit
           error.response?.status === 500 || // Server error
           error.response?.status === 502 || // Bad gateway
           error.response?.status === 503 || // Service unavailable
           error.response?.status === 504 || // Gateway timeout
           !error.response)) // Network error
      ) {
        throw error;
      }

      // Calculate backoff time with jitter
      const backoffTime = initialBackoff * Math.pow(2, retryCount - 1);
      const jitter = backoffTime * 0.2 * (Math.random() * 2 - 1);
      const waitTime = Math.max(1, Math.floor(backoffTime + jitter));

      console.warn(`API call failed, retrying in ${waitTime}ms (${retryCount}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Fetch top cryptocurrencies from CoinGecko
 */
export async function getTopCoins(limit = 100): Promise<CoinGeckoData[]> {
  try {
    // Check if cache is valid
    const now = Date.now();
    if (allCoinsCache.length > 0 && now - lastCacheUpdate < CACHE_DURATION) {
      return allCoinsCache.slice(0, limit);
    }

    // Fetch data from CoinGecko with retry
    const response = await retryApiCall(() =>
      axios.get(`${COINGECKO_API_URL}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: true,
          price_change_percentage: '24h',
        },
        timeout: 15000, // 15 second timeout
      })
    );

    // Update cache
    allCoinsCache = response.data;
    lastCacheUpdate = now;

    // Also update the symbol to ID mapping
    response.data.forEach((coin: CoinGeckoData) => {
      const normalizedSymbol = coin.symbol.toLowerCase();
      symbolToIdCache[normalizedSymbol] = coin.id;
      coinDataCache[coin.id] = coin;
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);

    // Check if it's a rate limit error
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.warn('CoinGecko rate limit reached. Using cached data.');
    }

    // Return cached data if available, otherwise empty array
    if (allCoinsCache.length > 0) {
      console.log(`Using cached data (${allCoinsCache.length} coins)`);
      return allCoinsCache.slice(0, limit);
    }

    console.warn('No cached data available. Returning empty array.');
    return [];
  }
}

/**
 * Get coin data by symbol
 */
export async function getCoinBySymbol(
  symbol: string,
): Promise<CoinGeckoData | null> {
  try {
    const normalizedSymbol = symbol.toLowerCase();

    // Check if we have the ID for this symbol
    if (!symbolToIdCache[normalizedSymbol]) {
      // If we don't have the mapping, fetch top coins to populate the cache
      await getTopCoins();

      // If still not found, try to search for it
      if (!symbolToIdCache[normalizedSymbol]) {
        return null;
      }
    }

    const coinId = symbolToIdCache[normalizedSymbol];

    // Check if we have cached data for this coin
    if (
      coinDataCache[coinId] &&
      Date.now() - lastCacheUpdate < CACHE_DURATION
    ) {
      return coinDataCache[coinId];
    }

    // Fetch specific coin data with retry
    const response = await retryApiCall(() =>
      axios.get(`${COINGECKO_API_URL}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
        timeout: 15000, // 15 second timeout
      })
    );

    // Format the response to match our interface
    const coinData: CoinGeckoData = {
      id: response.data.id,
      symbol: response.data.symbol,
      name: response.data.name,
      image: response.data.image.large,
      current_price: response.data.market_data.current_price.usd,
      market_cap: response.data.market_data.market_cap.usd,
      market_cap_rank: response.data.market_cap_rank,
      price_change_percentage_24h:
        response.data.market_data.price_change_percentage_24h,
    };

    // Update cache
    coinDataCache[coinId] = coinData;

    return coinData;
  } catch (error) {
    console.error(`Error fetching data for symbol ${symbol}:`, error);
    return null;
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
 * Get multiple coin data by symbols
 */
export async function getCoinsBySymbols(
  symbols: string[],
): Promise<Record<string, CoinGeckoData>> {
  // First, try to get all top coins to populate the cache
  await getTopCoins();

  const result: Record<string, CoinGeckoData> = {};

  // For any symbols not in the cache, fetch them individually
  const fetchPromises = symbols.map(async (symbol) => {
    const normalizedSymbol = symbol.toLowerCase();
    const coin = await getCoinBySymbol(normalizedSymbol);
    if (coin) {
      result[normalizedSymbol] = coin;
    }
  });

  await Promise.all(fetchPromises);

  return result;
}

/**
 * Get trading pairs for a specific exchange
 * This function converts CoinGecko data to our TradingPair format
 */
export async function getTradingPairsFromCoinGecko(
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
    console.error('Error generating trading pairs from CoinGecko data:', error);
    return [];
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
  try {
    const response = await retryApiCall(() =>
      axios.get(
        `${COINGECKO_API_URL}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days: days,
            interval: interval,
          },
          timeout: 15000, // 15 second timeout
        },
      )
    );

    return response.data;
  } catch (error) {
    console.error(`Error fetching historical data for ${coinId}:`, error);
    return { prices: [] };
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
      // For other quote assets, we would need to calculate the relative price
      // This is a simplified implementation
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
