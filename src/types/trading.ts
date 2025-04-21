// Define the TradingPair interface
export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  exchangeId: string;
  exchange?: string; // Human-readable exchange name
  priceDecimals: number;
  quantityDecimals: number;
  minQuantity?: number;
  maxQuantity?: number;
  minPrice?: number;
  maxPrice?: number;
  minNotional?: number;
  price?: string;
  change24h?: string;
  volume24h?: string;
  isFavorite?: boolean;
}
