// Exchange types for the backend

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
