import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { getRandomChange } from '../lib/utils';
import { useFeatureFlags } from '../config/featureFlags';

// Import the shared API instance from lib/api
import { api } from '../lib/api';

// Import optimized CoinGecko service
import * as optimizedCoinGeckoService from './optimizedCoinGeckoService';

// Import the TradingPair interface from shared types
import { TradingPair } from '../types/trading';

// Define API endpoints
const API_ENDPOINTS = {
  ALL_TRADING_PAIRS: '/trading-pairs',
  EXCHANGE_TRADING_PAIRS: (exchangeId: string) =>
    `/trading-pairs/${exchangeId}`,
  SPECIFIC_TRADING_PAIR: (exchangeId: string, symbol: string) =>
    `/trading-pairs/${exchangeId}/${symbol}`,
};

// Cache for trading pairs
const tradingPairsCache = new Map<string, TradingPair[]>();

// Socket.io connection for real-time price updates
let socket: Socket | null = null;
const priceUpdateCallbacks = new Map<string, Set<(price: string) => void>>();

/**
 * Initialize the Socket.io connection
 */
export const initializeTradingSocket = (): Socket => {
  if (socket) return socket;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  socket = io(`${apiUrl}/trading`, {
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Connected to trading socket');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from trading socket');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  // Set up listeners for price updates
  socket.onAny((event, data) => {
    if (event.startsWith('price:')) {
      const key = event.substring(6); // Remove 'price:' prefix
      const callbacks = priceUpdateCallbacks.get(key);
      if (callbacks) {
        callbacks.forEach((callback) => callback(data.price));
      }
    }
  });

  return socket;
};

/**
 * Subscribe to price updates for a trading pair
 */
export const subscribeToPriceUpdates = (
  exchangeId: string,
  symbol: string,
  callback: (price: string) => void,
): (() => void) => {
  const key = `${exchangeId}:${symbol}`;

  // Initialize socket if not already done
  const socketInstance = initializeTradingSocket();

  // Add callback to the set
  if (!priceUpdateCallbacks.has(key)) {
    priceUpdateCallbacks.set(key, new Set());
  }
  const callbacks = priceUpdateCallbacks.get(key)!;
  callbacks.add(callback);

  // Subscribe to the trading pair
  socketInstance.emit('subscribe', { exchangeId, symbol });

  // Return unsubscribe function
  return () => {
    const callbacks = priceUpdateCallbacks.get(key);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        priceUpdateCallbacks.delete(key);
        socketInstance.emit('unsubscribe', { exchangeId, symbol });
      }
    }
  };
};

/**
 * Get all trading pairs for a specific exchange
 * Prioritizes real data from CoinGecko, falls back to backend API, and finally to mock data
 */
export const getTradingPairs = async (
  exchangeId: string,
  quoteAsset?: string,
): Promise<TradingPair[]> => {
  try {
    // Get feature flags
    const featureFlags =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('omnitrade_feature_flags') || '{}')
        : {};

    const useMockData =
      featureFlags.useMockData !== undefined ? featureFlags.useMockData : true;

    const useRealMarketData =
      featureFlags.useRealMarketData !== undefined
        ? featureFlags.useRealMarketData
        : false;

    // If mock data is enabled and real market data is disabled, use mock data directly
    if (useMockData && !useRealMarketData) {
      console.log(
        `Using mock trading pairs data for ${exchangeId} as configured by feature flags`,
      );
      return generateMockTradingPairs(exchangeId.toLowerCase());
    }

    // Always clear the cache for the current exchange to ensure fresh data
    // This ensures we don't show stale data when switching exchanges
    if (tradingPairsCache.has(exchangeId)) {
      console.log(`Clearing cache for ${exchangeId} to ensure fresh data`);
      tradingPairsCache.delete(exchangeId);
    }

    // Try to get real data from CoinGecko
    try {
      console.log(`Fetching trading pairs from CoinGecko for ${exchangeId}`);
      const coinGeckoPairs =
        await optimizedCoinGeckoService.getTradingPairs(exchangeId);

      if (coinGeckoPairs.length > 0) {
        console.log(
          `Successfully fetched ${coinGeckoPairs.length} pairs from CoinGecko`,
        );
        // Update cache
        tradingPairsCache.set(exchangeId, coinGeckoPairs);

        // If quoteAsset is specified, filter the pairs
        if (quoteAsset) {
          return coinGeckoPairs.filter(
            (pair) => pair.quoteAsset === quoteAsset,
          );
        }

        return coinGeckoPairs;
      }
    } catch (coinGeckoError) {
      console.error('Error fetching from CoinGecko:', coinGeckoError);
    }

    // If CoinGecko fails, try the backend API
    try {
      console.log(`Fetching trading pairs from backend API for ${exchangeId}`);
      const response = await api.get<TradingPair[]>(
        API_ENDPOINTS.EXCHANGE_TRADING_PAIRS(exchangeId),
      );
      const pairs = response.data;

      // Update cache
      tradingPairsCache.set(exchangeId, pairs);

      // If quoteAsset is specified, filter the pairs
      if (quoteAsset) {
        return pairs.filter((pair) => pair.quoteAsset === quoteAsset);
      }

      return pairs;
    } catch (apiError) {
      // Log detailed error information
      if (axios.isAxiosError(apiError)) {
        console.error(
          `Error fetching trading pairs from API for ${exchangeId}:`,
          {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            url: apiError.config?.url,
          },
        );
      } else {
        console.error('Error fetching trading pairs from API:', apiError);
      }
    }

    // Fallback to mock data if both CoinGecko and API calls fail
    console.log(`Using mock trading pairs data as fallback for ${exchangeId}`);
    const mockPairs = generateMockTradingPairs(exchangeId.toLowerCase());

    // If quoteAsset is specified, filter the mock pairs
    if (quoteAsset) {
      return mockPairs.filter((pair) => pair.quoteAsset === quoteAsset);
    }

    return mockPairs;
  } catch (error) {
    console.error('Unexpected error in getTradingPairs:', error);
    const mockPairs = generateMockTradingPairs(exchangeId.toLowerCase());

    // If quoteAsset is specified, filter the mock pairs
    if (quoteAsset) {
      return mockPairs.filter((pair) => pair.quoteAsset === quoteAsset);
    }

    return mockPairs;
  }
};

/**
 * Get a specific trading pair by symbol and exchange
 * Prioritizes real data from CoinGecko, falls back to backend API, and finally to mock data
 */
export const getTradingPair = async (
  exchangeId: string,
  symbol: string,
): Promise<TradingPair | null> => {
  try {
    // Get feature flags
    const featureFlags =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('omnitrade_feature_flags') || '{}')
        : {};

    const useMockData =
      featureFlags.useMockData !== undefined ? featureFlags.useMockData : true;

    const useRealMarketData =
      featureFlags.useRealMarketData !== undefined
        ? featureFlags.useRealMarketData
        : false;

    // If mock data is enabled and real market data is disabled, use mock data directly
    if (useMockData && !useRealMarketData) {
      console.log(
        `Using mock trading pair data for ${symbol} on ${exchangeId} as configured by feature flags`,
      );
      const mockPairs = generateMockTradingPairs(exchangeId.toLowerCase());
      const mockPair = mockPairs.find((pair) => pair.symbol === symbol);

      if (mockPair) {
        return mockPair;
      }

      // If not found in mock data, try to create it
      if (symbol.includes('/')) {
        const [baseAsset, quoteAsset] = symbol.split('/');
        return createMockTradingPair(baseAsset, quoteAsset, exchangeId);
      }

      return null;
    }

    // Check cache first
    const cachedPairs = tradingPairsCache.get(exchangeId);
    if (cachedPairs) {
      const cachedPair = cachedPairs.find((pair) => pair.symbol === symbol);
      if (cachedPair) return cachedPair;
    }

    // Try to get all pairs from CoinGecko first
    try {
      // This will populate the cache with CoinGecko data
      await getTradingPairs(exchangeId);

      // Check cache again after populating
      const updatedCachedPairs = tradingPairsCache.get(exchangeId);
      if (updatedCachedPairs) {
        const cachedPair = updatedCachedPairs.find(
          (pair) => pair.symbol === symbol,
        );
        if (cachedPair) return cachedPair;
      }

      // If we have the symbol in format 'BTC/USDT', try to get price directly from CoinGecko
      if (symbol.includes('/')) {
        const [baseAsset, quoteAsset] = symbol.split('/');
        try {
          const price = await optimizedCoinGeckoService.getCurrentPrice(
            baseAsset,
            quoteAsset,
          );
          if (price > 0) {
            // Create a trading pair with real price data
            return {
              symbol,
              baseAsset,
              quoteAsset,
              exchangeId,
              priceDecimals: 2,
              quantityDecimals: 8,
              price: price.toString(),
              change24h: '+0.00%', // We don't have this data
              volume24h: '0', // We don't have this data
              isFavorite: false,
            };
          }
        } catch (priceError) {
          console.error(
            `Error getting price for ${baseAsset}/${quoteAsset}:`,
            priceError,
          );
        }
      }
    } catch (coinGeckoError) {
      console.error('Error fetching from CoinGecko:', coinGeckoError);
    }

    // If CoinGecko fails, try the backend API
    try {
      const response = await api.get<TradingPair>(
        API_ENDPOINTS.SPECIFIC_TRADING_PAIR(exchangeId, symbol),
      );
      return response.data;
    } catch (apiError) {
      // Log detailed error information
      if (axios.isAxiosError(apiError)) {
        console.error(
          `Error fetching trading pair ${symbol} for ${exchangeId}:`,
          {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            url: apiError.config?.url,
          },
        );
      } else {
        console.error('Error fetching trading pair from API:', apiError);
      }
    }

    // Generate mock pairs and find the requested one
    const mockPairs = generateMockTradingPairs(exchangeId.toLowerCase());
    const mockPair = mockPairs.find((pair) => pair.symbol === symbol);

    if (mockPair) {
      return mockPair;
    }

    // If not found in the mock data for this exchange, try to create it
    if (symbol.includes('/')) {
      const [baseAsset, quoteAsset] = symbol.split('/');
      return createMockTradingPair(baseAsset, quoteAsset, exchangeId);
    }

    return null;
  } catch (error) {
    console.error('Unexpected error in getTradingPair:', error);
    return null;
  }
};

/**
 * Get all trading pairs for all exchanges
 * Prioritizes real data from backend API, falls back to mock data
 */
export const getAllTradingPairs = async (): Promise<
  Record<string, TradingPair[]>
> => {
  try {
    // Get feature flags
    const featureFlags =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('omnitrade_feature_flags') || '{}')
        : {};

    const useMockData =
      featureFlags.useMockData !== undefined ? featureFlags.useMockData : true;

    const useRealMarketData =
      featureFlags.useRealMarketData !== undefined
        ? featureFlags.useRealMarketData
        : false;

    // If mock data is enabled and real market data is disabled, use mock data directly
    if (useMockData && !useRealMarketData) {
      console.log(
        'Using mock trading pairs data for all exchanges as configured by feature flags',
      );
      return {
        binance: generateMockTradingPairs('binance'),
        coinbase: generateMockTradingPairs('coinbase'),
        kraken: generateMockTradingPairs('kraken'),
      };
    }

    // Try the backend API
    try {
      const response = await api.get<Record<string, TradingPair[]>>(
        API_ENDPOINTS.ALL_TRADING_PAIRS,
      );

      // Update cache for each exchange
      Object.entries(response.data).forEach(([exchangeId, pairs]) => {
        tradingPairsCache.set(exchangeId, pairs as TradingPair[]);
      });

      return response.data;
    } catch (error) {
      // Log detailed error information
      if (axios.isAxiosError(error)) {
        console.error('Error fetching all trading pairs:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
      } else {
        console.error('Error fetching all trading pairs:', error);
      }
    }

    // Fallback to mock data
    console.log('Using mock trading pairs data as fallback for all exchanges');
    const mockData: Record<string, TradingPair[]> = {
      binance: generateMockTradingPairs('binance'),
      coinbase: generateMockTradingPairs('coinbase'),
      kraken: generateMockTradingPairs('kraken'),
    };

    return mockData;
  } catch (error) {
    console.error('Unexpected error in getAllTradingPairs:', error);

    // Fallback to mock data
    return {
      binance: generateMockTradingPairs('binance'),
      coinbase: generateMockTradingPairs('coinbase'),
      kraken: generateMockTradingPairs('kraken'),
    };
  }
};

/**
 * Toggle favorite status for a trading pair
 */
export const toggleFavoritePair = async (
  exchangeId: string,
  symbol: string,
): Promise<boolean> => {
  try {
    // Check cache first
    const cachedPairs = tradingPairsCache.get(exchangeId);
    if (cachedPairs) {
      const cachedPair = cachedPairs.find((pair) => pair.symbol === symbol);
      if (cachedPair) {
        cachedPair.isFavorite = !cachedPair.isFavorite;
        return cachedPair.isFavorite;
      }
    }

    // If not in cache, try to get the pair first
    const pair = await getTradingPair(exchangeId, symbol);
    if (pair) {
      pair.isFavorite = !pair.isFavorite;

      // Update cache
      if (cachedPairs) {
        const index = cachedPairs.findIndex((p) => p.symbol === symbol);
        if (index !== -1) {
          cachedPairs[index] = pair;
        } else {
          cachedPairs.push(pair);
        }
      } else {
        tradingPairsCache.set(exchangeId, [pair]);
      }

      return pair.isFavorite;
    }

    return false;
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    return false;
  }
};

/**
 * Create a mock trading pair
 */
function createMockTradingPair(
  baseAsset: string,
  quoteAsset: string,
  exchangeId: string,
): TradingPair {
  // Get a human-readable exchange name
  const exchangeMap: Record<string, string> = {
    binance: 'Binance',
    coinbase: 'Coinbase',
    kraken: 'Kraken',
    kucoin: 'KuCoin',
    bybit: 'Bybit',
    okx: 'OKX',
    sandbox: 'Sandbox',
  };

  const exchangeName = exchangeMap[exchangeId.toLowerCase()] || exchangeId;

  return {
    symbol: `${baseAsset}/${quoteAsset}`,
    baseAsset,
    quoteAsset,
    exchangeId,
    exchange: exchangeName,
    priceDecimals: 2,
    quantityDecimals: 8,
    price: baseAsset === 'BTC' ? '84316.58' : (Math.random() * 1000).toFixed(2),
    change24h: getRandomChange(),
    volume24h: (Math.random() * 100).toFixed(1) + 'm',
    isFavorite: false,
  };
}

/**
 * Generate mock trading pairs for a specific exchange
 */
export function generateMockTradingPairs(exchangeId: string): TradingPair[] {
  console.log(`Generating mock trading pairs for ${exchangeId}`);

  // Get a human-readable exchange name
  const exchangeMap: Record<string, string> = {
    binance: 'Binance',
    coinbase: 'Coinbase',
    kraken: 'Kraken',
    kucoin: 'KuCoin',
    bybit: 'Bybit',
    okx: 'OKX',
    sandbox: 'Sandbox',
  };

  const exchangeName = exchangeMap[exchangeId.toLowerCase()] || exchangeId;

  // Define different base assets for different exchanges
  let baseAssets: string[] = [];

  // Binance has all assets
  if (exchangeId.toLowerCase() === 'binance') {
    baseAssets = [
      'BTC',
      'ETH',
      'SOL',
      'XRP',
      'ADA',
      'DOGE',
      'DOT',
      'AVAX',
      'MATIC',
      'LINK',
      'BNB',
      'SHIB',
    ];
  }
  // Coinbase has a different set
  else if (
    exchangeId.toLowerCase() === 'coinbase' ||
    exchangeId.toLowerCase().includes('coinbase')
  ) {
    baseAssets = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'ALGO', 'ATOM'];
  }
  // Kraken has another set
  else if (exchangeId.toLowerCase() === 'kraken') {
    baseAssets = ['BTC', 'ETH', 'SOL', 'DOT', 'ADA', 'XMR', 'ATOM'];
  }
  // Default for other exchanges
  else {
    baseAssets = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA'];
  }

  // Quote assets - ensure USDT is always included
  const quoteAssets = ['USDT', 'USD', 'BTC', 'ETH'];

  // Generate pairs for each quote asset
  const pairs: TradingPair[] = [];

  // Ensure we always have some guaranteed pairs for each exchange
  // This guarantees that filtering by USDT will always return results
  let guaranteedPairs = [
    {
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      price: '84316.58',
      change24h: '+0.92%',
      volume24h: '1.62b',
      isFavorite: true,
    },
    {
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
      price: '3452.78',
      change24h: '+1.08%',
      volume24h: '963.40m',
      isFavorite: true,
    },
  ];

  // Add exchange-specific guaranteed pairs
  if (exchangeId.toLowerCase() === 'binance') {
    guaranteedPairs.push(
      {
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        price: '608.42',
        change24h: '+2.15%',
        volume24h: '412.79m',
        isFavorite: false,
      },
      {
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        price: '176.42',
        change24h: '+4.92%',
        volume24h: '688.79m',
        isFavorite: false,
      },
    );
  } else if (
    exchangeId.toLowerCase() === 'coinbase' ||
    exchangeId.toLowerCase().includes('coinbase')
  ) {
    guaranteedPairs.push(
      {
        baseAsset: 'ALGO',
        quoteAsset: 'USDT',
        price: '0.18',
        change24h: '+1.25%',
        volume24h: '45.79m',
        isFavorite: false,
      },
      {
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        price: '176.42',
        change24h: '+4.92%',
        volume24h: '688.79m',
        isFavorite: false,
      },
    );
  } else if (exchangeId.toLowerCase() === 'kraken') {
    guaranteedPairs.push(
      {
        baseAsset: 'XMR',
        quoteAsset: 'USDT',
        price: '178.92',
        change24h: '+0.75%',
        volume24h: '32.45m',
        isFavorite: false,
      },
      {
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        price: '176.42',
        change24h: '+4.92%',
        volume24h: '688.79m',
        isFavorite: false,
      },
    );
  }

  // Add guaranteed pairs first
  guaranteedPairs.forEach(
    ({ baseAsset, quoteAsset, price, change24h, volume24h, isFavorite }) => {
      pairs.push({
        symbol: `${baseAsset}/${quoteAsset}`,
        baseAsset,
        quoteAsset,
        exchangeId,
        exchange: exchangeName,
        priceDecimals: 2,
        quantityDecimals: 8,
        price,
        change24h,
        volume24h,
        isFavorite,
      });
    },
  );

  // Then add additional pairs
  quoteAssets.forEach((quoteAsset) => {
    // Skip BTC/BTC and ETH/ETH pairs and pairs we've already added
    const filteredBaseAssets = baseAssets.filter(
      (base) =>
        !(base === quoteAsset) &&
        !(base === 'BTC' && quoteAsset === 'BTC') &&
        !(base === 'ETH' && quoteAsset === 'ETH') &&
        // Skip pairs we've already added as guaranteed pairs
        !(
          quoteAsset === 'USDT' &&
          (base === 'BTC' || base === 'ETH' || base === 'SOL')
        ),
    );

    filteredBaseAssets.forEach((baseAsset) => {
      // Generate realistic price based on the asset
      let price = '';
      if (baseAsset === 'BTC') {
        price = '84316.58';
      } else if (baseAsset === 'ETH') {
        price = '3452.78';
      } else if (baseAsset === 'SOL') {
        price = '176.42';
      } else {
        // Generate random price based on the asset
        const basePrice =
          baseAsset === 'XRP'
            ? 0.5
            : baseAsset === 'ADA'
              ? 0.3
              : baseAsset === 'DOGE'
                ? 0.08
                : baseAsset === 'DOT'
                  ? 5
                  : baseAsset === 'AVAX'
                    ? 10
                    : baseAsset === 'MATIC'
                      ? 0.5
                      : baseAsset === 'LINK'
                        ? 7
                        : Math.random() * 100;

        price = (basePrice + Math.random() * basePrice * 0.1).toFixed(2);
      }

      // Generate random change
      const change24h = getRandomChange();

      // Generate random volume
      const volume24h =
        (Math.random() * 100).toFixed(1) + (Math.random() > 0.5 ? 'm' : 'k');

      pairs.push({
        symbol: `${baseAsset}/${quoteAsset}`,
        baseAsset,
        quoteAsset,
        exchangeId,
        exchange: exchangeName,
        priceDecimals: 2,
        quantityDecimals: 8,
        price,
        change24h,
        volume24h,
        isFavorite: baseAsset === 'BTC' || baseAsset === 'ETH',
      });
    });
  });

  console.log(`Generated ${pairs.length} trading pairs for ${exchangeId}`);
  return pairs;
}

/**
 * Clear the trading pairs cache
 */
export const clearTradingPairsCache = (): void => {
  tradingPairsCache.clear();
  console.log('Trading pairs cache cleared');
};
