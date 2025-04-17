// src/mocks/mockOrderbook.ts
import { Orderbook } from '../types/marketData';

// Generate a random price around a base price
const randomPrice = (basePrice: number, variance: number = 0.01): string => {
  const change = basePrice * variance * (Math.random() * 2 - 1);
  return (basePrice + change).toFixed(2);
};

// Generate a random quantity
const randomQuantity = (max: number = 2): string => {
  return (Math.random() * max).toFixed(8);
};

// Generate mock orderbook data
export function generateMockOrderbook(
  symbol: string,
  basePrice?: number,
): Orderbook {
  // Extract base and quote assets from symbol
  const [baseAsset, quoteAsset] = symbol.split('/');

  // Set a default base price based on the trading pair
  if (!basePrice) {
    switch (baseAsset) {
      case 'BTC':
        basePrice = 84000 + Math.random() * 1000;
        break;
      case 'ETH':
        basePrice = 1590 + Math.random() * 20;
        break;
      case 'SOL':
        basePrice = 130 + Math.random() * 5;
        break;
      case 'AVAX':
        basePrice = 25 + Math.random() * 2;
        break;
      case 'MATIC':
        basePrice = 0.54 + Math.random() * 0.02;
        break;
      case 'DOT':
        basePrice = 5.8 + Math.random() * 0.2;
        break;
      case 'ADA':
        basePrice = 0.38 + Math.random() * 0.02;
        break;
      case 'LINK':
        basePrice = 15 + Math.random() * 0.5;
        break;
      case 'XRP':
        basePrice = 2.05 + Math.random() * 0.1;
        break;
      case 'USDC':
        basePrice = 1;
        break;
      default:
        basePrice = 100 + Math.random() * 10;
        break;
    }
  }
  const bids: [string, string][] = [];
  const asks: [string, string][] = [];

  // Generate 20 bid prices (slightly below base price)
  for (let i = 0; i < 20; i++) {
    const price = (basePrice - i * 5 - Math.random() * 5).toFixed(2);
    const quantity = randomQuantity();
    bids.push([price, quantity]);
  }

  // Generate 20 ask prices (slightly above base price)
  for (let i = 0; i < 20; i++) {
    const price = (basePrice + i * 5 + Math.random() * 5).toFixed(2);
    const quantity = randomQuantity();
    asks.push([price, quantity]);
  }

  // Sort bids in descending order (highest price first)
  bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));

  // Sort asks in ascending order (lowest price first)
  asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

  return {
    bids,
    asks,
  };
}

// Mock implementation of the useOrderbook hook result
export function getMockOrderbookData(symbol: string): {
  orderbook: Orderbook;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return {
    orderbook: generateMockOrderbook(symbol),
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => console.log('Refetching orderbook data...'),
  };
}
