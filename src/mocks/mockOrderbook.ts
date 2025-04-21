// src/mocks/mockOrderbook.ts
import { Orderbook } from '@/types/marketData';

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
  try {
    // Extract base and quote assets from symbol
    const [baseAsset, quoteAsset] = symbol.split('/');

    // Set a default base price based on the trading pair
    if (basePrice === undefined) {
      switch (baseAsset) {
        case 'BTC':
          basePrice = 84000 + Math.random() * 1000;
          break;
        case 'ETH':
          basePrice = 3500 + Math.random() * 50;
          break;
        case 'SOL':
          basePrice = 175 + Math.random() * 5;
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
          basePrice = 0.48 + Math.random() * 0.05;
          break;
        case 'USDC':
          basePrice = 1;
          break;
        default:
          basePrice = 100 + Math.random() * 10;
          break;
      }
    }

    // Ensure basePrice is positive
    basePrice = Math.max(0.01, basePrice);

    const bids: [string, string][] = [];
    const asks: [string, string][] = [];

    // Generate 20 bid prices (slightly below base price)
    for (let i = 0; i < 20; i++) {
      // Calculate a percentage decrease instead of a fixed amount
      // This ensures prices stay positive for all assets
      const percentDecrease = (i + 1) * 0.01; // 1% decrease per level
      const price = Math.max(0.01, basePrice * (1 - percentDecrease)).toFixed(
        2,
      );
      const quantity = randomQuantity();
      bids.push([price, quantity]);
    }

    // Generate 20 ask prices (slightly above base price)
    for (let i = 0; i < 20; i++) {
      // Calculate a percentage increase instead of a fixed amount
      // This ensures consistent scaling for all assets
      const percentIncrease = (i + 1) * 0.01; // 1% increase per level
      const price = (basePrice * (1 + percentIncrease)).toFixed(2);
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
  } catch (error) {
    console.error('Error generating mock orderbook:', error);
    // Return a simple fallback orderbook
    return {
      bids: [
        ['40000.00', '0.50000000'],
        ['39900.00', '1.20000000'],
        ['39800.00', '0.75000000'],
      ],
      asks: [
        ['40100.00', '0.40000000'],
        ['40200.00', '0.90000000'],
        ['40300.00', '0.60000000'],
      ],
    };
  }
}

// Mock implementation of the useOrderbook hook result
export function getMockOrderbookData(symbol: string): {
  orderbook: Orderbook;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  try {
    return {
      orderbook: generateMockOrderbook(symbol),
      isLoading: false,
      isError: false,
      error: null,
      refetch: () => console.log('Refetching orderbook data...'),
    };
  } catch (error) {
    console.error('Error in getMockOrderbookData:', error);
    // Return a fallback response with a simple orderbook
    return {
      orderbook: {
        bids: [
          ['40000.00', '0.50000000'],
          ['39900.00', '1.20000000'],
          ['39800.00', '0.75000000'],
        ],
        asks: [
          ['40100.00', '0.40000000'],
          ['40200.00', '0.90000000'],
          ['40300.00', '0.60000000'],
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: () => console.log('Refetching orderbook data...'),
    };
  }
}
