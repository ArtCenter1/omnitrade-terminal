import axios from 'axios';

// Define the base URL for CoinGecko API
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

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
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

    // Fetch data from CoinGecko
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h',
      },
    });

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
    // Return cached data if available, otherwise empty array
    return allCoinsCache.length > 0 ? allCoinsCache.slice(0, limit) : [];
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

    // Fetch specific coin data
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
      },
    });

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
