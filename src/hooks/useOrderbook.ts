import { useEffect, useMemo } from "react";
import { useOrderbook as useOrderbookQuery } from "../services/marketDataApi";
import { useMarketDataStore } from "../store/marketDataStore";
import marketDataSocket from "../services/marketDataSocket";

/**
 * Custom hook to get orderbook data for a symbol, combining API and real-time WebSocket updates.
 * @param {string} symbol - Trading symbol to fetch orderbook data for.
 * @param {object} [options] - Optional React Query options.
 * @returns {{
 *   orderbook: any,
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: any,
 *   refetch: () => void
 * }} Object containing the orderbook data and query state.
 */
export function useOrderbook(symbol: string, options = {}) {
  // Fetch initial/historical data
  const {
    data: initialData,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrderbookQuery(symbol, options);

  // Subscribe/unsubscribe to real-time updates
  useEffect(() => {
    if (!symbol) return;
    marketDataSocket.subscribe(symbol, "orderbook");
    return () => {
      marketDataSocket.unsubscribe(symbol, "orderbook");
    };
  }, [symbol]);

  // Select real-time orderbook data from Zustand
  const realtimeData = useMarketDataStore((state) => state.orderbooks[symbol]);

  // Merge initial and real-time data (prefer real-time if available)
  const orderbook = useMemo(
    () => realtimeData || initialData,
    [realtimeData, initialData]
  );

  return {
    orderbook,
    isLoading,
    isError,
    error,
    refetch,
  };
}
