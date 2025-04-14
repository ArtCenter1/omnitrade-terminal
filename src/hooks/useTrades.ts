import { useEffect, useMemo } from "react";
import { useTrades as useTradesQuery } from "../services/marketDataApi";
import { useMarketDataStore } from "../store/marketDataStore";
import marketDataSocket from "../services/marketDataSocket";

/**
 * Custom hook to get trades for a symbol, combining API and real-time WebSocket updates.
 * @param {string} symbol - Trading symbol to fetch trades for.
 * @param {number} [limit=50] - Number of historical trades to fetch.
 * @param {object} [options] - Optional React Query options.
 * @returns {{
 *   trades: any[],
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: any,
 *   refetch: () => void
 * }} Object containing the trades array and query state.
 */
export function useTrades(symbol: string, limit: number = 50, options = {}) {
  // Fetch initial/historical trades
  const {
    data: initialData,
    isLoading,
    isError,
    error,
    refetch,
  } = useTradesQuery(symbol, limit, options);

  // Subscribe/unsubscribe to real-time updates
  useEffect(() => {
    if (!symbol) return;
    marketDataSocket.subscribe(symbol, "trade");
    return () => {
      marketDataSocket.unsubscribe(symbol, "trade");
    };
  }, [symbol]);

  // Select real-time trades from Zustand
  const realtimeData = useMarketDataStore(
    (state) => state.trades[symbol] || []
  );

  // Merge: real-time trades first, then initial trades (avoid duplicates)
  const trades = useMemo(() => {
    if (!initialData) return realtimeData;
    // Remove duplicates by trade id or timestamp if available
    const initialIds = new Set(
      initialData.map((t: any) => t.id || t.timestamp)
    );
    const merged = [
      ...realtimeData,
      ...initialData.filter((t: any) => !initialIds.has(t.id || t.timestamp)),
    ];
    return merged;
  }, [realtimeData, initialData]);

  return {
    trades,
    isLoading,
    isError,
    error,
    refetch,
  };
}
