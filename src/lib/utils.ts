import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD', decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function generateChartData(isPositive: boolean) {
  const trend = isPositive ? 1 : -1;
  const volatility = 1.2; // Increased volatility
  const startValue = 10;
  const numPoints = 50; // More data points for jagged appearance

  // Use random walk algorithm with higher volatility for jagged appearance
  let currentValue = startValue;
  const data = [];

  for (let i = 0; i < numPoints; i++) {
    // Random walk with increased volatility
    const volatilityFactor = volatility * (Math.random() * 0.5 + 0.75); // Variable volatility
    const randomWalk = (Math.random() - 0.5) * volatilityFactor * 2;

    // Add trend bias
    const trendBias = (trend / numPoints) * 5;

    // Update current value with random walk and trend
    currentValue += randomWalk + trendBias;

    // Add occasional larger moves (spikes and dips)
    if (Math.random() < 0.15) {
      const spikeDirection = Math.random() > 0.5 ? 1 : -1;
      const spikeMagnitude = volatilityFactor * 3 * Math.random();
      currentValue += spikeDirection * spikeMagnitude;
    }

    // Ensure we don't go too low
    currentValue = Math.max(currentValue, startValue * 0.5);

    data.push({
      value: currentValue,
    });
  }

  return data;
}

export function generatePriceChartData(isPositive: boolean) {
  const length = 24;
  const baseDate = new Date();
  const startValue = 50000;
  const endValue = isPositive ? startValue * 1.2 : startValue * 0.8;

  return Array.from({ length }, (_, i) => {
    const date = new Date(baseDate);
    date.setHours(date.getHours() - (length - i));

    const progress = i / (length - 1);
    const direction = isPositive ? 1 : -1;
    const randomFactor = Math.random() * 1000 * direction;
    const value =
      startValue + (endValue - startValue) * progress + randomFactor;

    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      value,
    };
  });
}

export function generateAllocationData() {
  return [
    { name: 'BTC', value: 35, color: '#F7931A' },
    { name: 'ETH', value: 25, color: '#627EEA' },
    { name: 'BNB', value: 15, color: '#F3BA2F' },
    { name: 'SOL', value: 10, color: '#00FFA3' },
    { name: 'USDT', value: 8, color: '#26A17B' },
    { name: 'Others', value: 7, color: '#9B87F5' },
  ];
}

export interface Asset {
  name: string;
  symbol: string;
  price: number;
  change: number;
  amount: number;
  value: number;
  chart: number[];
}

// Legacy mock assets - kept for backward compatibility
export const mockAssets = [
  {
    icon: '/placeholder.svg',
    name: 'Bitcoin',
    symbol: 'BTC',
    amount: '0.01797199',
    value: '$1,529.96',
    price: '$85,138.00',
    change: '-1.97%',
  },
  {
    icon: '/placeholder.svg',
    name: 'Ethereum',
    symbol: 'ETH',
    amount: '0.95',
    value: '$2,769.45',
    price: '$2,915.21',
    change: '-4.65%',
  },
  {
    icon: '/placeholder.svg',
    name: 'BNB',
    symbol: 'BNB',
    amount: '2.04651185',
    value: '$1,240.70',
    price: '$606.25',
    change: '-3.28%',
  },
  {
    icon: '/placeholder.svg',
    name: 'Solana',
    symbol: 'SOL',
    amount: '15.12',
    value: '$1,823.98',
    price: '$120.63',
    change: '-4.77%',
  },
  {
    icon: '/placeholder.svg',
    name: 'Chainlink',
    symbol: 'LINK',
    amount: '82.22',
    value: '$1,173.28',
    price: '$14.27',
    change: '-8.43%',
  },
  {
    icon: '/placeholder.svg',
    name: 'NEO',
    symbol: 'NEO',
    amount: '11.00869',
    value: '$82.53',
    price: '$7.50',
    change: '-1.18%',
  },
];

/**
 * Generate a random price change percentage string (e.g., "+1.23%" or "-2.45%")
 */
export function getRandomChange(): string {
  const isPositive = Math.random() > 0.5;
  const changeValue = (Math.random() * 5).toFixed(2); // Random change between 0% and 5%
  return `${isPositive ? '+' : '-'}${changeValue}%`;
}

export const mockBots = [
  {
    title: 'Accumulator',
    description:
      'Buy the asset little by little to ensure as stable DCA with the accumulator, that fits perfectly with asset price volatility, avoiding huge price swings.',
    icon: '/placeholder.svg',
    iconBg: 'bg-green-500 bg-opacity-10',
    popularity: 3,
    returns: 4,
  },
  {
    title: 'Grid Trader',
    description:
      'Create a structured trading grid around a defined range for the strategy to buy low and sell high automatically, with a tailored grid setup for optimizing profit.',
    icon: '/placeholder.svg',
    iconBg: 'bg-yellow-500 bg-opacity-10',
    tags: ['POPULAR'],
    popularity: 5,
    returns: 4,
  },
  {
    title: 'Portfolio Rebalancer',
    description:
      'Automatically maintain your desired weight for each asset in your portfolio, with the flexibility to set your own portfolio percentages based on your strategy.',
    icon: '/placeholder.svg',
    iconBg: 'bg-blue-500 bg-opacity-10',
    popularity: 4,
    returns: 3,
  },
  {
    title: 'Copy Trader',
    description:
      "Copy top-performing traders' strategies directly into your account. This bot will help you automatically copy the trades of top-performing traders without requiring input.",
    icon: '/placeholder.svg',
    iconBg: 'bg-purple-500 bg-opacity-10',
    tags: ['NEW'],
    popularity: 4,
    returns: 5,
  },
];
