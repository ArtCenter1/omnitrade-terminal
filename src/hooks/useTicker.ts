import { useEffect, useMemo } from "react";
import { useTicker as useTickerQuery } from "../services/marketDataApi";
import { useMarketDataStore } from "../store/marketDataStore";
import marketDataSocket from "../services/marketDataSocket";

/**
 * Custom hook to get ticker data for a symbol, combining API and real-time WebSocket updates.
 * @param {string} symbol - Trading symbol to fetch ticker data for.
 * @param {object} [options] - Optional React Query options.
 * @returns {{
 *   ticker: any,
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: any,
 *   refetch: () => void
 * }} Object containing the ticker data and query state.
 */
export function useTicker(symbol: string, options = {}) {
  // Fetch initial/historical data
  const {
    data: initialData,
    isLoading,
    isError,
    error,
    refetch,
  } = useTickerQuery(symbol, options);

  // Subscribe/unsubscribe to real-time updates
  useEffect(() => {
    if (!symbol) return;
    marketDataSocket.subscribe(symbol, "ticker");
    return () => {
      marketDataSocket.unsubscribe(symbol, "ticker");
    };
  }, [symbol]);

  // Select real-time ticker data from Zustand
  const realtimeData = useMarketDataStore((state) => state.tickers[symbol]);

  // Merge initial and real-time data (prefer real-time if available)
  const ticker = useMemo(
    () => realtimeData || initialData,
    [realtimeData, initialData]
  );

  return {
    ticker,
    isLoading,
    isError,
    error,
    refetch,
  };
}
