// Utility functions for mock data generation

// Utility to generate a random number within a range
export const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Utility to generate a random integer within a range
export const randomIntInRange = (min: number, max: number): number => {
  return Math.floor(randomInRange(min, max));
};

// Utility to round to a specific number of decimal places
export const roundToDecimals = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// Common cryptocurrency symbols
export const COMMON_BASE_ASSETS = [
  'BTC',
  'ETH',
  'SOL',
  'ADA',
  'DOT',
  'AVAX',
  'MATIC',
  'LINK',
  'UNI',
  'DOGE',
  'SHIB',
  'XRP',
];
export const COMMON_QUOTE_ASSETS = [
  'USDT',
  'USDC',
  'USD',
  'BUSD',
  'BTC',
  'ETH',
];

// Price ranges for common assets (approximate as of 2023)
export const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  BTC: { min: 25000, max: 35000 },
  ETH: { min: 1500, max: 2200 },
  SOL: { min: 20, max: 40 },
  ADA: { min: 0.25, max: 0.45 },
  DOT: { min: 4, max: 7 },
  AVAX: { min: 10, max: 20 },
  MATIC: { min: 0.5, max: 1 },
  LINK: { min: 5, max: 10 },
  UNI: { min: 3, max: 6 },
  DOGE: { min: 0.05, max: 0.1 },
  SHIB: { min: 0.000005, max: 0.00001 },
  XRP: { min: 0.4, max: 0.6 },
  USDT: { min: 0.99, max: 1.01 },
  USDC: { min: 0.99, max: 1.01 },
  USD: { min: 1, max: 1 },
  BUSD: { min: 0.99, max: 1.01 },
};

// Default price for assets not in the PRICE_RANGES
export const DEFAULT_PRICE_RANGE = { min: 1, max: 100 };

// Exchange logos
export const EXCHANGE_LOGOS: Record<string, string> = {
  binance: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
  coinbase: 'https://cryptologos.cc/logos/coinbase-coin-logo.png',
  kraken: 'https://cryptologos.cc/logos/kraken-logo.png',
  kucoin: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png',
  ftx: 'https://cryptologos.cc/logos/ftx-token-ftt-logo.png',
  huobi: 'https://cryptologos.cc/logos/huobi-token-ht-logo.png',
  okex: 'https://cryptologos.cc/logos/okb-okb-logo.png',
  bybit: 'https://cryptologos.cc/logos/bybit-logo.png',
  gate: 'https://cryptologos.cc/logos/gate-io-logo.png',
  bitfinex: 'https://cryptologos.cc/logos/bitfinex-logo.png',
};

// Default logo for exchanges not in the EXCHANGE_LOGOS
export const DEFAULT_EXCHANGE_LOGO =
  'https://cryptologos.cc/logos/generic-exchange-logo.png';

// Supported exchanges
export const SUPPORTED_EXCHANGES = [
  {
    id: 'binance',
    name: 'Binance',
    logo: EXCHANGE_LOGOS['binance'],
    website: 'https://www.binance.com',
    description:
      "The world's largest cryptocurrency exchange by trading volume.",
    isActive: true,
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    logo: EXCHANGE_LOGOS['coinbase'],
    website: 'https://www.coinbase.com',
    description:
      'A secure platform that makes it easy to buy, sell, and store cryptocurrency.',
    isActive: true,
  },
  {
    id: 'kraken',
    name: 'Kraken',
    logo: EXCHANGE_LOGOS['kraken'],
    website: 'https://www.kraken.com',
    description: 'A US-based cryptocurrency exchange and bank.',
    isActive: true,
  },
  {
    id: 'kucoin',
    name: 'KuCoin',
    logo: EXCHANGE_LOGOS['kucoin'],
    website: 'https://www.kucoin.com',
    description:
      'A global cryptocurrency exchange for numerous digital assets and cryptocurrencies.',
    isActive: true,
  },
];
