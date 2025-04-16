// Exchange adapter interfaces

// Basic exchange information
export interface Exchange {
  id: string;
  name: string;
  logo: string;
  website: string;
  description?: string;
  isActive: boolean;
}

// Trading pair (market)
export interface TradingPair {
  symbol: string; // e.g., "BTC/USDT"
  baseAsset: string; // e.g., "BTC"
  quoteAsset: string; // e.g., "USDT"
  exchangeId: string; // e.g., "binance"
  priceDecimals: number; // e.g., 2 (for display)
  quantityDecimals: number; // e.g., 6 (for display)
  minQuantity?: number; // Minimum order size
  maxQuantity?: number; // Maximum order size
  minPrice?: number; // Minimum price
  maxPrice?: number; // Maximum price
  minNotional?: number; // Minimum order value
}

// Asset in a portfolio
export interface PortfolioAsset {
  asset: string; // e.g., "BTC"
  free: number; // Available balance
  locked: number; // Balance in orders
  total: number; // Total balance (free + locked)
  usdValue: number; // USD equivalent value
  exchangeId: string; // Exchange where this asset is held
}

// Full portfolio
export interface Portfolio {
  totalUsdValue: number;
  assets: PortfolioAsset[];
  lastUpdated: Date;
}

// Order book entry
export interface OrderBookEntry {
  price: number;
  quantity: number;
}

// Full order book
export interface OrderBook {
  symbol: string;
  exchangeId: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

// Candlestick/kline data
export interface Kline {
  timestamp: number;
  open: number;
  high: number;
  close: number;
  low: number;
  volume: number;
}

// Order types
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market' | 'stop_limit' | 'stop_market';
export type OrderStatus =
  | 'new'
  | 'partially_filled'
  | 'filled'
  | 'canceled'
  | 'rejected'
  | 'expired';

// Order information
export interface Order {
  id: string;
  exchangeId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price?: number; // Required for limit orders
  quantity: number;
  executed: number; // Quantity executed
  remaining: number; // Quantity remaining
  cost?: number; // Total cost (price * executed)
  timestamp: number; // Creation time
  lastUpdated?: number; // Last update time
}

// Performance metrics
export interface PerformanceMetrics {
  roi: number; // Return on investment (%)
  profitLoss: number; // Absolute profit/loss in USD
  winRate: number; // Percentage of winning trades
  drawdown: number; // Maximum drawdown (%)
  sharpeRatio?: number; // Risk-adjusted return
  trades: number; // Total number of trades
  period: {
    // Time period for these metrics
    start: Date;
    end: Date;
  };
}

// Main exchange adapter interface
export interface ExchangeAdapter {
  // Basic info
  getExchangeInfo(): Promise<Exchange>;

  // Market data
  getTradingPairs(): Promise<TradingPair[]>;
  getOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  getKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit?: number,
  ): Promise<Kline[]>;

  // Account data
  getPortfolio(apiKeyId: string): Promise<Portfolio>;

  // Trading
  placeOrder(apiKeyId: string, order: Partial<Order>): Promise<Order>;
  cancelOrder(
    apiKeyId: string,
    orderId: string,
    symbol: string,
  ): Promise<boolean>;
  getOpenOrders(apiKeyId: string, symbol?: string): Promise<Order[]>;
  getOrderHistory(
    apiKeyId: string,
    symbol?: string,
    limit?: number,
  ): Promise<Order[]>;

  // Performance
  getPerformanceMetrics(
    apiKeyId: string,
    period?: string,
  ): Promise<PerformanceMetrics>;

  // API key validation
  validateApiKey(apiKey: string, apiSecret: string): Promise<boolean>;
}
