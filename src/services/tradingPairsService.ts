import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { getRandomChange } from '@/lib/utils';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define the TradingPair interface
export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  exchangeId: string;
  priceDecimals: number;
  quantityDecimals: number;
  minQuantity?: number;
  maxQuantity?: number;
  minPrice?: number;
  maxPrice?: number;
  minNotional?: number;
  price?: string;
  change24h?: string;
  volume24h?: string;
  isFavorite?: boolean;
}

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
  priceUpdateCallbacks.get(key)?.add(callback);

  // Subscribe to updates
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
 */
export const getTradingPairs = async (
  exchangeId: string,
): Promise<TradingPair[]> => {
  try {
    // Check cache first
    if (tradingPairsCache.has(exchangeId)) {
      return tradingPairsCache.get(exchangeId) || [];
    }

    // Fetch from API
    const response = await api.get<TradingPair[]>(
      `/trading-pairs/${exchangeId}`,
    );
    const pairs = response.data;

    // Update cache
    tradingPairsCache.set(exchangeId, pairs);

    return pairs;
  } catch (error) {
    console.error('Error fetching trading pairs:', error);

    // Fallback to mock data if API call fails
    console.log('Using mock trading pairs data as fallback');
    return generateMockTradingPairs(exchangeId.toLowerCase());
  }
};

/**
 * Get a specific trading pair by symbol and exchange
 */
export const getTradingPair = async (
  exchangeId: string,
  symbol: string,
): Promise<TradingPair | null> => {
  try {
    // Check cache first
    const cachedPairs = tradingPairsCache.get(exchangeId);
    if (cachedPairs) {
      const cachedPair = cachedPairs.find((pair) => pair.symbol === symbol);
      if (cachedPair) return cachedPair;
    }

    // Fetch from API
    const response = await api.get<TradingPair>(
      `/trading-pairs/${exchangeId}/${symbol}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching trading pair:', error);

    // Generate mock pairs and find the requested one
    const mockPairs = generateMockTradingPairs(exchangeId.toLowerCase());
    const mockPair = mockPairs.find((pair) => pair.symbol === symbol);

    if (mockPair) {
      return mockPair;
    }

    // If not found in the mock data for this exchange, try to create it
    if (symbol.includes('/')) {
      const [baseAsset, quoteAsset] = symbol.split('/');

      // Generate a mock pair
      return {
        symbol,
        baseAsset,
        quoteAsset,
        exchangeId,
        priceDecimals: 2,
        quantityDecimals: 8,
        price:
          baseAsset === 'BTC' ? '84316.58' : (Math.random() * 1000).toFixed(2),
        change24h: getRandomChange(),
        volume24h: (Math.random() * 100).toFixed(1) + 'm',
        isFavorite: false,
      };
    }

    return null;
  }
};

/**
 * Generate mock trading pairs for testing
 */
const generateMockTradingPairs = (exchangeId: string): TradingPair[] => {
  // Common base assets
  const baseAssets = [
    'BTC',
    'ETH',
    'SOL',
    'XRP',
    'ADA',
    'DOT',
    'AVAX',
    'MATIC',
    'LINK',
    'UNI',
  ];

  // Quote assets
  const quoteAssets = ['USDT', 'USD', 'BTC', 'ETH'];

  // Generate pairs for each quote asset
  const pairs: TradingPair[] = [];

  quoteAssets.forEach((quoteAsset) => {
    // Skip BTC/BTC and ETH/ETH pairs
    const filteredBaseAssets = baseAssets.filter(
      (base) =>
        !(base === quoteAsset) &&
        !(base === 'BTC' && quoteAsset === 'BTC') &&
        !(base === 'ETH' && quoteAsset === 'ETH'),
    );

    filteredBaseAssets.forEach((baseAsset) => {
      // Generate random price based on the asset
      let price = '0.00';
      if (baseAsset === 'BTC') price = '84316.58';
      else if (baseAsset === 'ETH') price = '3452.78';
      else if (baseAsset === 'SOL') price = '176.42';
      else price = (Math.random() * 1000).toFixed(2);

      // Generate random change
      const change24h = getRandomChange();

      // Generate random volume
      const volume = Math.random() * 1000;
      let volume24h = '0';
      if (volume > 500) volume24h = (volume / 1000).toFixed(1) + 'b';
      else volume24h = volume.toFixed(1) + 'm';

      pairs.push({
        symbol: `${baseAsset}/${quoteAsset}`,
        baseAsset,
        quoteAsset,
        exchangeId,
        priceDecimals: 2,
        quantityDecimals: 8,
        price,
        change24h,
        volume24h,
        isFavorite: baseAsset === 'BTC' || baseAsset === 'ETH',
      });
    });
  });

  return pairs;
};

/**
 * Get all trading pairs for all exchanges
 */
export const getAllTradingPairs = async (): Promise<
  Record<string, TradingPair[]>
> => {
  try {
    const response =
      await api.get<Record<string, TradingPair[]>>('/trading-pairs');

    // Update cache for each exchange
    Object.entries(response.data).forEach(([exchangeId, pairs]) => {
      tradingPairsCache.set(exchangeId, pairs);
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching all trading pairs:', error);

    // Fallback to mock data
    const mockData: Record<string, TradingPair[]> = {
      binance: generateMockTradingPairs('binance'),
      coinbase: generateMockTradingPairs('coinbase'),
      kraken: generateMockTradingPairs('kraken'),
    };

    return mockData;
  }
};
