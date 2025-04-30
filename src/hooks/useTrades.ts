import { useEffect, useMemo, useState } from 'react';
import { useTrades as useTradesQuery } from '../services/marketDataApi';
import { useMarketDataStore } from '../store/marketDataStore';
import marketDataSocket from '../services/marketDataSocket';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { Trade } from '@/types/exchange';

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
  // State for fallback mock data
  const [mockTrades, setMockTrades] = useState<Trade[]>([]);
  const [isFetchingMock, setIsFetchingMock] = useState(false);
  const [mockError, setMockError] = useState<Error | null>(null);

  // Fetch initial/historical trades
  const {
    data: initialData,
    isLoading,
    isError,
    error,
    refetch,
  } = useTradesQuery(symbol, limit, {
    ...options,
    // Add retry options to handle transient errors
    retry: 2,
    retryDelay: 1000,
  });

  // Function to fetch mock trades as fallback
  const fetchMockTrades = async () => {
    if (!symbol) return;

    try {
      setIsFetchingMock(true);
      setMockError(null);

      // Get mock adapter
      const mockAdapter = ExchangeFactory.getAdapter('mock');

      // Fetch mock trades
      const mockTradesData = await mockAdapter.getRecentTrades(symbol, limit);
      console.log('Fetched mock trades as fallback:', mockTradesData);
      setMockTrades(mockTradesData);
    } catch (err) {
      console.error('Error fetching mock trades:', err);
      setMockError(
        err instanceof Error ? err : new Error('Failed to fetch mock trades'),
      );
    } finally {
      setIsFetchingMock(false);
    }
  };

  // Subscribe/unsubscribe to real-time updates
  useEffect(() => {
    if (!symbol) return;
    marketDataSocket.subscribe(symbol, 'trade');
    return () => {
      marketDataSocket.unsubscribe(symbol, 'trade');
    };
  }, [symbol]);

  // Fetch mock data when API fails
  useEffect(() => {
    if (isError && symbol) {
      console.log('API error in useTrades, fetching mock trades as fallback');
      fetchMockTrades();
    }
  }, [isError, symbol]);

  // Select real-time trades from Zustand
  const realtimeData = useMarketDataStore(
    (state) => state.trades[symbol] || [],
  );

  // Merge: real-time trades first, then initial trades (avoid duplicates)
  // If API fails, use mock data as fallback
  const trades = useMemo(() => {
    // If we have API data, use it with realtime data
    if (initialData && initialData.length > 0) {
      // Remove duplicates by trade id or timestamp if available
      const initialIds = new Set(
        initialData.map((t: any) => t.id || t.timestamp),
      );
      const merged = [
        ...realtimeData,
        ...initialData.filter((t: any) => !initialIds.has(t.id || t.timestamp)),
      ];
      return merged;
    }

    // If API failed but we have mock data, use it
    if (isError && mockTrades.length > 0) {
      return mockTrades;
    }

    // Otherwise return realtime data or empty array
    return realtimeData;
  }, [realtimeData, initialData, isError, mockTrades]);

  return {
    trades,
    isLoading: isLoading || isFetchingMock,
    isError: isError && (!mockTrades.length || !!mockError),
    error: mockError || error,
    refetch,
    isMockData: isError && mockTrades.length > 0,
  };
}
