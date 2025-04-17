import { Asset } from '@/lib/utils';
import { TradingPair } from '@/components/terminal/TradingPairSelector';

// Define exchange-specific assets
export const exchangeAssets: Record<string, Asset[]> = {
  binance: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 84316.58,
      change: -1.97,
      amount: 0.01797199,
      value: 1515.45,
      chart: [84000, 84100, 83900, 84200, 84150, 84300, 84250, 84316.58],
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 1595.6,
      change: -4.65,
      amount: 0.95,
      value: 1515.82,
      chart: [1600, 1590, 1585, 1580, 1590, 1595, 1592, 1595.6],
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 131.8,
      change: -4.77,
      amount: 15.12,
      value: 1992.82,
      chart: [135, 134, 133, 132, 131, 130, 131.5, 131.8],
    },
    {
      symbol: 'BNB',
      name: 'BNB',
      price: 606.25,
      change: -3.28,
      amount: 2.04651185,
      value: 1240.7,
      chart: [610, 608, 605, 603, 604, 605, 606, 606.25],
    },
    {
      symbol: 'LINK',
      name: 'Chainlink',
      price: 14.37,
      change: -2.58,
      amount: 82.22,
      value: 1181.5,
      chart: [14.5, 14.4, 14.3, 14.2, 14.3, 14.35, 14.36, 14.37],
    },
  ],
  coinbase: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 84298.45,
      change: -1.92,
      amount: 0.01234567,
      value: 1040.75,
      chart: [84300, 84250, 84200, 84150, 84200, 84250, 84275, 84298.45],
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 1594.2,
      change: -4.55,
      amount: 1.25,
      value: 1992.75,
      chart: [1600, 1595, 1590, 1585, 1590, 1592, 1593, 1594.2],
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 131.65,
      change: -4.7,
      amount: 8.75,
      value: 1151.94,
      chart: [134, 133, 132, 131, 130, 131, 131.5, 131.65],
    },
    {
      symbol: 'AVAX',
      name: 'Avalanche',
      price: 25.87,
      change: -2.34,
      amount: 45.32,
      value: 1172.43,
      chart: [26.5, 26.3, 26.1, 25.9, 25.8, 25.85, 25.86, 25.87],
    },
    {
      symbol: 'MATIC',
      name: 'Polygon',
      price: 0.5423,
      change: -1.23,
      amount: 2150.75,
      value: 1166.36,
      chart: [0.55, 0.545, 0.54, 0.535, 0.54, 0.541, 0.542, 0.5423],
    },
  ],
  kraken: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 84305.75,
      change: -1.95,
      amount: 0.02345678,
      value: 1976.58,
      chart: [84350, 84300, 84250, 84200, 84250, 84275, 84300, 84305.75],
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 1595.1,
      change: -4.6,
      amount: 1.75,
      value: 2791.43,
      chart: [1605, 1600, 1595, 1590, 1592, 1594, 1595, 1595.1],
    },
    {
      symbol: 'DOT',
      name: 'Polkadot',
      price: 5.87,
      change: -3.21,
      amount: 215.45,
      value: 1264.69,
      chart: [6.0, 5.95, 5.9, 5.85, 5.86, 5.87, 5.87, 5.87],
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      price: 0.3845,
      change: -1.75,
      amount: 3250.75,
      value: 1249.91,
      chart: [0.39, 0.388, 0.386, 0.384, 0.385, 0.3845, 0.3845, 0.3845],
    },
    {
      symbol: 'XRP',
      name: 'XRP',
      price: 0.4825,
      change: -0.95,
      amount: 2500.5,
      value: 1206.49,
      chart: [0.485, 0.484, 0.483, 0.482, 0.4825, 0.4825, 0.4825, 0.4825],
    },
  ],
};

// Function to get assets for a specific exchange
export const getExchangeAssets = (exchangeId: string): Asset[] => {
  const normalizedExchangeId = exchangeId.toLowerCase();
  return exchangeAssets[normalizedExchangeId] || exchangeAssets.binance;
};

// Function to get assets that match the trading pair
export const getAssetsForTradingPair = (
  exchangeId: string,
  baseAsset: string,
  quoteAsset: string,
): Asset[] => {
  const assets = getExchangeAssets(exchangeId);

  // Sort assets to prioritize the base and quote assets
  return [...assets].sort((a, b) => {
    if (a.symbol === baseAsset && b.symbol !== baseAsset) return -1;
    if (a.symbol !== baseAsset && b.symbol === baseAsset) return 1;
    if (a.symbol === quoteAsset && b.symbol !== quoteAsset) return -1;
    if (a.symbol !== quoteAsset && b.symbol === quoteAsset) return 1;
    return 0;
  });
};
