// src/services/mockExchangeService.ts
// Centralized service for mock exchange data that simulates real exchange API behavior

import { v4 as uuidv4 } from 'uuid';
import { TradingPair } from '@/types/trading';
import { Orderbook } from '@/types/marketData';
import { Order } from './enhancedOrdersService';

// Define the interface for the mock exchange service
interface MockExchangeService {
  // Get the current price for a trading pair
  getCurrentPrice(exchangeId: string, symbol: string): string;
  
  // Get the orderbook for a trading pair
  getOrderbook(exchangeId: string, symbol: string): Orderbook;
  
  // Get trading pairs for an exchange
  getTradingPairs(exchangeId: string): TradingPair[];
  
  // Place an order
  placeOrder(exchangeId: string, order: any): Order;
  
  // Get orders for a user
  getOrders(userId: string, exchangeId?: string, symbol?: string): Order[];
}

// Default base prices for common assets (in USD)
const DEFAULT_PRICES: Record<string, number> = {
  'BTC': 60000,
  'ETH': 3000,
  'DOT': 20,
  'BNB': 500,
  'SOL': 100,
  'ADA': 0.5,
  'XRP': 0.6,
  'DOGE': 0.1,
  'SHIB': 0.00001,
  'AVAX': 30,
  'MATIC': 1.2,
  'LINK': 15,
  'UNI': 10,
  'LTC': 80,
  'XLM': 0.15,
  'ATOM': 12,
  'ALGO': 0.3,
  'FIL': 5,
  'AAVE': 100,
  'COMP': 60,
};

// Cache for current prices
const priceCache: Record<string, string> = {};

// Cache for orderbooks
const orderbookCache: Record<string, Orderbook> = {};

// Cache for trading pairs
const tradingPairsCache: Record<string, TradingPair[]> = {};

// Cache for orders
const ordersCache: Record<string, Order[]> = {};

// Helper function to get a base price for an asset
const getBasePrice = (asset: string): number => {
  return DEFAULT_PRICES[asset] || 10; // Default to $10 if not found
};

// Helper function to generate a random price around a base price
const generateRandomPrice = (basePrice: number, variance: number = 0.01): string => {
  const change = basePrice * variance * (Math.random() * 2 - 1);
  return (basePrice + change).toFixed(2);
};

// Helper function to generate a random quantity
const generateRandomQuantity = (max: number = 2): string => {
  return (Math.random() * max).toFixed(8);
};

// Helper function to parse a symbol into base and quote assets
const parseSymbol = (symbol: string): { baseAsset: string, quoteAsset: string } => {
  // Handle both formats: BTC/USDT and BTCUSDT
  if (symbol.includes('/')) {
    const [baseAsset, quoteAsset] = symbol.split('/');
    return { baseAsset, quoteAsset };
  } else {
    // Try to infer the format from the symbol (e.g., BTCUSDT -> BTC/USDT)
    // This is a simple heuristic and might not work for all symbols
    const commonQuoteAssets = ['USDT', 'USD', 'BTC', 'ETH', 'BNB'];
    for (const quote of commonQuoteAssets) {
      if (symbol.endsWith(quote)) {
        const base = symbol.slice(0, -quote.length);
        return { baseAsset: base, quoteAsset: quote };
      }
    }
    // Default fallback
    return { baseAsset: symbol.substring(0, 3), quoteAsset: symbol.substring(3) };
  }
};

// Implementation of the mock exchange service
const mockExchangeServiceImpl: MockExchangeService = {
  // Get the current price for a trading pair
  getCurrentPrice(exchangeId: string, symbol: string): string {
    const cacheKey = `${exchangeId}:${symbol}`;
    
    // If we have a cached price, return it with a small random change
    if (priceCache[cacheKey]) {
      const currentPrice = parseFloat(priceCache[cacheKey]);
      const newPrice = generateRandomPrice(currentPrice, 0.005); // 0.5% variance
      priceCache[cacheKey] = newPrice;
      return newPrice;
    }
    
    // Otherwise, generate a new price based on the base asset
    const { baseAsset, quoteAsset } = parseSymbol(symbol);
    let basePrice = getBasePrice(baseAsset);
    
    // Adjust price for non-USD quote assets
    if (quoteAsset !== 'USD' && quoteAsset !== 'USDT') {
      const quotePrice = getBasePrice(quoteAsset);
      basePrice = basePrice / quotePrice;
    }
    
    const price = generateRandomPrice(basePrice);
    priceCache[cacheKey] = price;
    return price;
  },
  
  // Get the orderbook for a trading pair
  getOrderbook(exchangeId: string, symbol: string): Orderbook {
    const cacheKey = `${exchangeId}:${symbol}`;
    
    // If we have a cached orderbook, update it with small changes
    if (orderbookCache[cacheKey]) {
      const currentOrderbook = orderbookCache[cacheKey];
      
      // Update bids with small random changes
      const updatedBids = currentOrderbook.bids.map(bid => {
        const price = parseFloat(bid[0]);
        const quantity = parseFloat(bid[1]);
        const newPrice = price * (1 + (Math.random() * 0.01 - 0.005)); // ±0.5% change
        const newQuantity = quantity * (1 + (Math.random() * 0.1 - 0.05)); // ±5% change
        return [newPrice.toFixed(2), newQuantity.toFixed(8)];
      });
      
      // Update asks with small random changes
      const updatedAsks = currentOrderbook.asks.map(ask => {
        const price = parseFloat(ask[0]);
        const quantity = parseFloat(ask[1]);
        const newPrice = price * (1 + (Math.random() * 0.01 - 0.005)); // ±0.5% change
        const newQuantity = quantity * (1 + (Math.random() * 0.1 - 0.05)); // ±5% change
        return [newPrice.toFixed(2), newQuantity.toFixed(8)];
      });
      
      // Sort bids in descending order (highest price first)
      updatedBids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
      
      // Sort asks in ascending order (lowest price first)
      updatedAsks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
      
      const updatedOrderbook = {
        bids: updatedBids,
        asks: updatedAsks,
      };
      
      orderbookCache[cacheKey] = updatedOrderbook;
      return updatedOrderbook;
    }
    
    // Otherwise, generate a new orderbook
    const { baseAsset, quoteAsset } = parseSymbol(symbol);
    let basePrice = getBasePrice(baseAsset);
    
    // Adjust price for non-USD quote assets
    if (quoteAsset !== 'USD' && quoteAsset !== 'USDT') {
      const quotePrice = getBasePrice(quoteAsset);
      basePrice = basePrice / quotePrice;
    }
    
    const bids: [string, string][] = [];
    const asks: [string, string][] = [];
    
    // Generate 20 bid prices (slightly below base price)
    for (let i = 0; i < 20; i++) {
      const percentDecrease = (i + 1) * 0.001; // 0.1% decrease per level
      const price = (basePrice * (1 - percentDecrease)).toFixed(2);
      const quantity = generateRandomQuantity();
      bids.push([price, quantity]);
    }
    
    // Generate 20 ask prices (slightly above base price)
    for (let i = 0; i < 20; i++) {
      const percentIncrease = (i + 1) * 0.001; // 0.1% increase per level
      const price = (basePrice * (1 + percentIncrease)).toFixed(2);
      const quantity = generateRandomQuantity();
      asks.push([price, quantity]);
    }
    
    // Sort bids in descending order (highest price first)
    bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
    
    // Sort asks in ascending order (lowest price first)
    asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
    
    const orderbook = { bids, asks };
    orderbookCache[cacheKey] = orderbook;
    return orderbook;
  },
  
  // Get trading pairs for an exchange
  getTradingPairs(exchangeId: string): TradingPair[] {
    // If we have cached trading pairs, return them
    if (tradingPairsCache[exchangeId]) {
      return tradingPairsCache[exchangeId];
    }
    
    // Otherwise, generate new trading pairs
    const commonBaseAssets = ['BTC', 'ETH', 'DOT', 'BNB', 'SOL', 'ADA', 'XRP', 'DOGE'];
    const commonQuoteAssets = ['USDT', 'USD', 'BTC', 'ETH'];
    
    const tradingPairs: TradingPair[] = [];
    
    // Generate trading pairs for common base assets
    for (const baseAsset of commonBaseAssets) {
      for (const quoteAsset of commonQuoteAssets) {
        // Skip pairs like BTC/BTC
        if (baseAsset === quoteAsset) continue;
        
        const symbol = `${baseAsset}/${quoteAsset}`;
        const price = this.getCurrentPrice(exchangeId, symbol);
        
        // Generate a random 24h change (-5% to +5%)
        const change24h = (Math.random() * 10 - 5).toFixed(2);
        const changePrefix = parseFloat(change24h) >= 0 ? '+' : '';
        
        // Generate a random 24h volume (1m to 1b)
        const volume24h = (Math.random() * 1000 + 1).toFixed(2);
        const volumeSuffix = Math.random() > 0.5 ? 'm' : 'b';
        
        tradingPairs.push({
          symbol,
          baseAsset,
          quoteAsset,
          exchangeId,
          exchange: exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1), // Capitalize first letter
          price,
          change24h: `${changePrefix}${change24h}%`,
          volume24h: `${volume24h}${volumeSuffix}`,
          isFavorite: Math.random() > 0.7, // 30% chance of being a favorite
          priceDecimals: 2,
          quantityDecimals: 8,
        });
      }
    }
    
    tradingPairsCache[exchangeId] = tradingPairs;
    return tradingPairs;
  },
  
  // Place an order
  placeOrder(exchangeId: string, orderData: any): Order {
    const userId = orderData.userId || 'mock-user';
    
    // Ensure we have an orders array for this user
    if (!ordersCache[userId]) {
      ordersCache[userId] = [];
    }
    
    // Create a new order
    const order: Order = {
      id: uuidv4(),
      userId,
      exchangeId,
      symbol: orderData.symbol,
      side: orderData.side,
      type: orderData.type,
      status: 'new',
      price: orderData.price,
      stopPrice: orderData.stopPrice,
      quantity: orderData.quantity,
      filledQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add the order to the cache
    ordersCache[userId].push(order);
    
    // For market orders, simulate immediate fill
    if (order.type === 'market') {
      setTimeout(() => {
        const index = ordersCache[userId].findIndex(o => o.id === order.id);
        if (index !== -1) {
          ordersCache[userId][index] = {
            ...ordersCache[userId][index],
            status: 'filled',
            filledQuantity: order.quantity,
            updatedAt: new Date(),
          };
        }
      }, 1000);
    }
    
    return order;
  },
  
  // Get orders for a user
  getOrders(userId: string, exchangeId?: string, symbol?: string): Order[] {
    // If we don't have any orders for this user, return an empty array
    if (!ordersCache[userId]) {
      return [];
    }
    
    // Filter orders based on exchangeId and symbol
    return ordersCache[userId].filter(order => {
      if (exchangeId && order.exchangeId !== exchangeId) return false;
      if (symbol && order.symbol !== symbol) return false;
      return true;
    });
  },
};

// Export the mock exchange service
export const mockExchangeService = mockExchangeServiceImpl;

// Export a function to get the mock exchange service
export const getMockExchangeService = (): MockExchangeService => {
  return mockExchangeServiceImpl;
};
