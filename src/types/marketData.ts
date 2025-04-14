// Market Data Types for Omnitrade Frontend Integration

// --- REST API Types ---

// Removed unused Symbol and Ticker types

// Interface representing data from CoinGecko /coins/markets
// This should match the structure returned by the backend's /markets endpoint
export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
  sparkline_in_7d?: {
    // Optional sparkline data
    price: number[];
  };
}

/**
 * Orderbook response from /orderbook endpoint
 * Each bid/ask is [price, quantity] as strings
 */
export interface Orderbook {
  bids: [string, string][];
  asks: [string, string][];
}

/**
 * Trade object from /trades endpoint
 */
export interface Trade {
  price: string;
  quantity: string;
  timestamp: number;
}

/**
 * Kline (candlestick) from /klines endpoint
 * [openTime, open, high, low, close, volume, closeTime, ...]
 * openTime, closeTime: number (ms)
 * open, high, low, close, volume: string
 */
export type Kline = [
  number, // openTime
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // closeTime
  ...any[], // (optional) additional fields
];

// --- WebSocket Message Types ---

/**
 * WebSocket subscription/unsubscription message
 */
export interface WSSubscriptionMessage {
  event: "subscribe" | "unsubscribe";
  data: {
    type: "ticker" | "orderbook" | "trade";
    symbol: string;
  };
}

/**
 * WebSocket ticker update event
 */
export interface WSTickerMessage {
  event: "ticker";
  data: {
    symbol: string;
    price: string;
    timestamp: number;
  };
}

/**
 * WebSocket orderbook update event
 */
export interface WSOrderbookUpdateMessage {
  event: "orderbookUpdate";
  data: {
    bids: [string, string][];
    asks: [string, string][];
    timestamp: number;
  };
}

/**
 * WebSocket trade update event
 */
export interface WSTradeMessage {
  event: "trade";
  data: {
    price: string;
    quantity: string;
    timestamp: number;
  };
}

/**
 * Union type for all possible incoming WebSocket messages
 */
export type WebSocketMessage =
  | WSTickerMessage
  | WSOrderbookUpdateMessage
  | WSTradeMessage;

// --- Utility Types ---

/**
 * Generic WebSocket message envelope (for type guards)
 */
export interface WSMessageEnvelope<T = any> {
  event: string;
  data: T;
}
