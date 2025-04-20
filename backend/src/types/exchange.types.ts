// Exchange types for the backend

// Exchange source for an asset
export interface ExchangeSource {
  exchangeId: string; // Exchange where this asset is held
  amount: number; // Amount of the asset on this exchange
}

// Asset in a portfolio
export interface PortfolioAsset {
  asset: string; // e.g., "BTC"
  free: number; // Available balance
  locked: number; // Balance in orders
  total: number; // Total balance (free + locked)
  usdValue: number; // USD equivalent value
  exchangeId: string; // Exchange where this asset is held
  exchangeSources?: ExchangeSource[]; // Sources of this asset across exchanges (for Portfolio Total view)
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
