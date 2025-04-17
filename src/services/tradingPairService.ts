import { TradingPair } from '@/components/terminal/TradingPairSelector';

// Mock trading pairs for different quote assets
export const mockTradingPairs: Record<string, TradingPair[]> = {
  USDT: [
    {
      symbol: 'BTC/USDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      price: '84,316.58',
      change24h: '+0.92%',
      volume24h: '1.62b',
      isFavorite: true,
    },
    {
      symbol: 'ETH/USDT',
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
      price: '1,595.60',
      change24h: '+1.08%',
      volume24h: '963.40m',
    },
    {
      symbol: 'USDC/USDT',
      baseAsset: 'USDC',
      quoteAsset: 'USDT',
      price: '1.00',
      change24h: '+0.0000%',
      volume24h: '807.24m',
    },
    {
      symbol: 'SOL/USDT',
      baseAsset: 'SOL',
      quoteAsset: 'USDT',
      price: '131.80',
      change24h: '+4.92%',
      volume24h: '688.79m',
    },
    {
      symbol: 'XRP/USDT',
      baseAsset: 'XRP',
      quoteAsset: 'USDT',
      price: '2.09',
      change24h: '+0.47%',
      volume24h: '293.55m',
    },
    {
      symbol: 'FDUSD/USDT',
      baseAsset: 'FDUSD',
      quoteAsset: 'USDT',
      price: '0.9983',
      change24h: '+0.03%',
      volume24h: '237.65m',
    },
    {
      symbol: 'WCT/USDT',
      baseAsset: 'WCT',
      quoteAsset: 'USDT',
      price: '0.4202',
      change24h: '+31.68%',
      volume24h: '226.03m',
    },
    {
      symbol: 'TRX/USDT',
      baseAsset: 'TRX',
      quoteAsset: 'USDT',
      price: '0.2453',
      change24h: '-2.01%',
      volume24h: '149.49m',
    },
    {
      symbol: 'OM/USDT',
      baseAsset: 'OM',
      quoteAsset: 'USDT',
      price: '0.699',
      change24h: '-10.42%',
      volume24h: '133.23m',
    },
    {
      symbol: 'PEPE/USDT',
      baseAsset: 'PEPE',
      quoteAsset: 'USDT',
      price: '0.00000719',
      change24h: '+2.13%',
      volume24h: '123.47m',
    },
  ],
  USDC: [
    {
      symbol: 'BTC/USDC',
      baseAsset: 'BTC',
      quoteAsset: 'USDC',
      price: '84,305.12',
      change24h: '+0.90%',
      volume24h: '0.82b',
    },
    {
      symbol: 'ETH/USDC',
      baseAsset: 'ETH',
      quoteAsset: 'USDC',
      price: '1,594.80',
      change24h: '+1.05%',
      volume24h: '463.20m',
    },
    {
      symbol: 'SOL/USDC',
      baseAsset: 'SOL',
      quoteAsset: 'USDC',
      price: '131.75',
      change24h: '+4.90%',
      volume24h: '388.45m',
    },
  ],
  BTC: [
    {
      symbol: 'ETH/BTC',
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
      price: '0.01892',
      change24h: '+0.15%',
      volume24h: '0.32b',
    },
    {
      symbol: 'SOL/BTC',
      baseAsset: 'SOL',
      quoteAsset: 'BTC',
      price: '0.00156',
      change24h: '+4.01%',
      volume24h: '188.32m',
    },
    {
      symbol: 'XRP/BTC',
      baseAsset: 'XRP',
      quoteAsset: 'BTC',
      price: '0.00002481',
      change24h: '-0.43%',
      volume24h: '93.21m',
    },
  ],
  ETH: [
    {
      symbol: 'BTC/ETH',
      baseAsset: 'BTC',
      quoteAsset: 'ETH',
      price: '52.84',
      change24h: '-0.15%',
      volume24h: '0.22b',
    },
    {
      symbol: 'SOL/ETH',
      baseAsset: 'SOL',
      quoteAsset: 'ETH',
      price: '0.0826',
      change24h: '+3.85%',
      volume24h: '88.45m',
    },
    {
      symbol: 'LINK/ETH',
      baseAsset: 'LINK',
      quoteAsset: 'ETH',
      price: '0.0118',
      change24h: '+1.23%',
      volume24h: '45.67m',
    },
  ],
};

// Available quote assets
export const quoteAssets = ['USDT', 'USDC', 'BTC', 'ETH'];

// Function to get trading pairs for a specific exchange and quote asset
export const getTradingPairs = async (
  exchangeId: string,
  quoteAsset: string = 'USDT',
): Promise<TradingPair[]> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Return mock data based on quote asset
  return mockTradingPairs[quoteAsset] || [];
};

// Function to get a specific trading pair
export const getTradingPair = async (
  exchangeId: string,
  symbol: string,
): Promise<TradingPair | null> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Find the pair in all available pairs
  const allPairs = Object.values(mockTradingPairs).flat();
  return allPairs.find((pair) => pair.symbol === symbol) || null;
};

// Function to toggle favorite status for a trading pair
export const toggleFavoritePair = async (
  exchangeId: string,
  symbol: string,
): Promise<boolean> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Find the pair in all available pairs
  const allPairs = Object.values(mockTradingPairs).flat();
  const pair = allPairs.find((pair) => pair.symbol === symbol);

  if (pair) {
    pair.isFavorite = !pair.isFavorite;
    return pair.isFavorite;
  }

  return false;
};
