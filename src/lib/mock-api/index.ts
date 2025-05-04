/**
 * Mock API Service for GitHub Pages
 * 
 * This module provides static data for the GitHub Pages deployment
 * where backend services are not available.
 */

// Mock market data
export const mockMarkets = [
  { symbol: 'BTC/USDT', price: 65432.10, change24h: 2.5, volume24h: 1234567890 },
  { symbol: 'ETH/USDT', price: 3456.78, change24h: -1.2, volume24h: 987654321 },
  { symbol: 'SOL/USDT', price: 123.45, change24h: 5.6, volume24h: 456789012 },
  { symbol: 'BNB/USDT', price: 567.89, change24h: 0.8, volume24h: 345678901 },
  { symbol: 'XRP/USDT', price: 0.5678, change24h: -2.3, volume24h: 234567890 },
];

// Mock order book data
export const mockOrderBook = {
  'BTC/USDT': {
    bids: [
      [65430.5, 1.2],
      [65429.8, 0.5],
      [65428.2, 2.3],
      [65427.1, 1.8],
      [65426.0, 3.2],
    ],
    asks: [
      [65433.2, 0.8],
      [65434.5, 1.5],
      [65435.7, 2.1],
      [65436.9, 0.7],
      [65438.2, 1.9],
    ],
  },
};

// Mock recent trades
export const mockRecentTrades = {
  'BTC/USDT': [
    { price: 65432.10, amount: 0.12, side: 'buy', timestamp: Date.now() - 30000 },
    { price: 65431.50, amount: 0.08, side: 'sell', timestamp: Date.now() - 45000 },
    { price: 65433.20, amount: 0.25, side: 'buy', timestamp: Date.now() - 60000 },
    { price: 65430.80, amount: 0.15, side: 'sell', timestamp: Date.now() - 90000 },
    { price: 65434.10, amount: 0.32, side: 'buy', timestamp: Date.now() - 120000 },
  ],
};

// Mock chart data (OHLCV)
export const mockChartData = {
  'BTC/USDT': {
    '1h': Array.from({ length: 24 }, (_, i) => {
      const basePrice = 65000;
      const time = Date.now() - (23 - i) * 3600000;
      const open = basePrice + Math.random() * 1000 - 500;
      const high = open + Math.random() * 200;
      const low = open - Math.random() * 200;
      const close = (open + high + low) / 3 + (Math.random() * 100 - 50);
      const volume = Math.random() * 100 + 50;
      return [time, open, high, low, close, volume];
    }),
  },
};

// Mock user data (for demo purposes)
export const mockUser = {
  id: 'demo-user',
  username: 'demo',
  email: 'demo@example.com',
  balances: {
    'USDT': 10000,
    'BTC': 0.5,
    'ETH': 5,
    'SOL': 50,
  },
};

// Mock API client
export const mockApiClient = {
  // Market data
  getMarkets: () => Promise.resolve(mockMarkets),
  getMarketPrice: (symbol: string) => {
    const market = mockMarkets.find(m => m.symbol === symbol);
    return Promise.resolve(market?.price || 0);
  },
  
  // Order book
  getOrderBook: (symbol: string) => {
    return Promise.resolve(mockOrderBook[symbol as keyof typeof mockOrderBook] || { bids: [], asks: [] });
  },
  
  // Recent trades
  getRecentTrades: (symbol: string) => {
    return Promise.resolve(mockRecentTrades[symbol as keyof typeof mockRecentTrades] || []);
  },
  
  // Chart data
  getChartData: (symbol: string, timeframe: string) => {
    const symbolData = mockChartData[symbol as keyof typeof mockChartData];
    if (!symbolData) return Promise.resolve([]);
    return Promise.resolve(symbolData[timeframe as keyof typeof symbolData] || []);
  },
  
  // User data
  getUserData: () => Promise.resolve(mockUser),
  
  // Mock trading functions (these just return success responses)
  placeOrder: () => Promise.resolve({ success: true, orderId: 'mock-order-' + Date.now() }),
  cancelOrder: () => Promise.resolve({ success: true }),
  
  // Authentication (always succeeds in demo mode)
  login: () => Promise.resolve({ success: true, user: mockUser }),
  register: () => Promise.resolve({ success: true, user: mockUser }),
  logout: () => Promise.resolve({ success: true }),
};

export default mockApiClient;
