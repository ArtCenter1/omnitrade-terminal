/**
 * Asset information types
 */

/**
 * Asset network information
 */
export interface AssetNetwork {
  network: string;
  name?: string;
  isDefault?: boolean;
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  withdrawFee?: number;
  minWithdraw?: number;
  maxWithdraw?: number;
  addressRegex?: string;
  memoRegex?: string;
}

/**
 * Asset information
 */
export interface AssetInfo {
  symbol: string;
  name: string;
  fullName?: string;
  precision: number;
  withdrawPrecision?: number;
  exchangeId: string;
  iconUrl?: string;
  networks: AssetNetwork[];
  isActive: boolean;
  isFiat: boolean;
  isStablecoin?: boolean;
  description?: string;
  website?: string;
  explorer?: string;
  twitter?: string;
  reddit?: string;
  github?: string;
  coinGeckoId?: string;
  coinMarketCapId?: number;
  tags?: string[];
  lastUpdated: number;
}

/**
 * Asset price information
 */
export interface AssetPrice {
  symbol: string;
  price: number;
  priceUsd?: number;
  volume24h?: number;
  marketCap?: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  lastUpdated: number;
}

/**
 * Asset with price information
 */
export interface AssetWithPrice extends AssetInfo {
  price?: AssetPrice;
}

/**
 * Asset list response
 */
export interface AssetListResponse {
  assets: AssetInfo[];
  total: number;
  lastUpdated: number;
}
