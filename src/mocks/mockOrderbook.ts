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
  basePrice: number = 83000,
): Orderbook {
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
