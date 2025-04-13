import { useKlines as useKlinesQuery } from "../services/marketDataApi";

/**
 * Custom hook to fetch historical klines (candlesticks) for a symbol and interval.
 * Only uses the REST API (no real-time updates).
 * @param {string} symbol - The trading symbol.
 * @param {string} [interval="1m"] - The kline interval (e.g., "1m", "5m", "1h").
 * @param {number} [limit=100] - Number of klines to fetch.
 * @param {object} [options] - Optional React Query options.
 * @returns {{
 *   klines: any[] | undefined,
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: any,
 *   refetch: () => void
 * }} Object containing the klines array and query state.
 */
export function useKlines(symbol: string, interval: string = "1m", limit: number = 100, options = {}) {
  // Use the API hook for initial/historical data
  const { data, isLoading, isError, error, refetch } = useKlinesQuery(symbol, interval, limit, options);

  // No real-time updates for klines
  return {
    klines: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}