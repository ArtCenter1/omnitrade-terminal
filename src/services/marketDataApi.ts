import { useQuery } from "@tanstack/react-query";
import {
  MarketCoin, // Import the new type
  Orderbook,
  Trade,
  Kline,
} from "../types/marketData"; // Removed unused Symbol, Ticker

// Base URL for the market data API
const BASE_URL = "/api/v1/market-data";

// Optionally inject API key from environment variable or config
const API_KEY = import.meta.env.VITE_MARKET_DATA_API_KEY || undefined;

/**
 * Constructs headers for API requests, including API key if available.
 * @returns {Record<string, string>} Headers object for fetch requests.
 */
function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["X-API-KEY"] = API_KEY;
  }
  return headers;
}

/**
 * Generic fetcher for API requests.
 * Throws an error if the response is not OK or if parsing fails.
 * @template T
 * @param {string} url - The API endpoint URL.
 * @returns {Promise<T>} Parsed JSON response.
 * @throws {Error} If the network request fails or response is not OK.
 */
async function fetcher<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `API error (${res.status}): ${res.statusText} - ${errorText}`
      );
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(
      `Network or parsing error: ${err?.message || String(err)}`
    );
  }
}

// --- React Query Hooks ---

// --- New Hook ---

// 1. Fetch Market Data (replaces useSymbols and useTicker)
interface UseMarketsParams {
  vs_currency?: string;
  page?: number;
  per_page?: number;
  order?: string;
  sparkline?: boolean;
}

/**
 * React Query hook to fetch market data for multiple coins.
 * @param {UseMarketsParams} params - Parameters for fetching market data.
 * @param {object} [options] - Optional React Query options.
 * @returns {UseQueryResult<MarketCoin[], Error>} Query result containing the list of market coins.
 */
export function useMarkets(
  params: UseMarketsParams = { vs_currency: 'usd', page: 1, per_page: 100 },
  options = {}
) {
  const queryParams = new URLSearchParams({
    vs_currency: params.vs_currency || 'usd',
    page: (params.page || 1).toString(),
    per_page: (params.per_page || 100).toString(),
    order: params.order || 'market_cap_desc',
    sparkline: params.sparkline ? 'true' : 'false',
  }).toString();

  return useQuery<MarketCoin[], Error>({
    // Include params in queryKey for proper caching
    queryKey: ["markets", params.vs_currency, params.page, params.per_page, params.order, params.sparkline],
    queryFn: () => fetcher<MarketCoin[]>(`${BASE_URL}/markets?${queryParams}`),
    staleTime: 60 * 1000, // 1 minute (adjust as needed)
    ...options,
  });
}


// --- Existing Hooks (Keep if Orderbook, Trades, Klines are still needed) ---

// 2. Fetch orderbook for a symbol (adjust if symbol needs to be CoinGecko ID)

// 3. Fetch orderbook for a symbol
/**
 * React Query hook to fetch the orderbook for a given symbol.
 * @param {string} symbol - Trading symbol.
 * @param {object} [options] - Optional React Query options.
 * @returns {UseQueryResult<Orderbook, Error>} Query result containing the orderbook data.
 */
export function useOrderbook(coinId: string, options = {}) { // Changed param name for clarity
  return useQuery<Orderbook, Error>({
    queryKey: ["orderbook", coinId],
    queryFn: () => fetcher<Orderbook>(`${BASE_URL}/orderbook?symbol=${encodeURIComponent(coinId)}`), // Use coinId
    enabled: !!coinId,
    staleTime: 2 * 1000, // 2 seconds
    ...options,
  });
}

// 3. Fetch recent trades for a symbol (adjust if symbol needs to be CoinGecko ID)
/**
 * React Query hook to fetch recent trades for a given symbol.
 * @param {string} symbol - Trading symbol.
 * @param {number} [limit=50] - Number of trades to fetch.
 * @param {object} [options] - Optional React Query options.
 * @returns {UseQueryResult<Trade[], Error>} Query result containing the list of trades.
 */
export function useTrades(coinId: string, limit: number = 50, options = {}) { // Changed param name
  return useQuery<Trade[], Error>({
    queryKey: ["trades", coinId, limit],
    queryFn: () =>
      fetcher<Trade[]>(
        `${BASE_URL}/trades?symbol=${encodeURIComponent(coinId)}&limit=${limit}` // Use coinId
      ),
    enabled: !!coinId,
    staleTime: 2 * 1000, // 2 seconds
    ...options,
  });
}

// 4. Fetch klines (candlesticks) for a symbol (adjust if symbol needs to be CoinGecko ID)
/**
 * React Query hook to fetch candlestick (kline) data for a given symbol.
 * @param {string} symbol - Trading symbol.
 * @param {string} [interval="1m"] - Kline interval (e.g., "1m", "5m", "1h").
 * @param {number} [limit=100] - Number of klines to fetch.
 * @param {object} [options] - Optional React Query options.
 * @returns {UseQueryResult<Kline[], Error>} Query result containing the list of klines.
 */
export function useKlines(
  coinId: string, // Changed param name
  interval: string = "1m",
  limit: number = 100,
  options = {}
) {
  return useQuery<Kline[], Error>({
    queryKey: ["klines", coinId, interval, limit], // Use coinId in key
    queryFn: () =>
      fetcher<Kline[]>(
        `${BASE_URL}/klines?symbol=${encodeURIComponent(coinId)}&interval=${interval}&limit=${limit}` // Use coinId in URL
      ),
    enabled: !!coinId,
    staleTime: 10 * 1000, // 10 seconds
    ...options,
  });
}