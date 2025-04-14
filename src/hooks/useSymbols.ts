import { useSymbols as useSymbolsQuery } from "../services/marketDataApi";

/**
 * Custom hook to fetch the list of available trading symbols.
 * Only uses the REST API (no real-time updates).
 * @param {object} [options] - Optional React Query options.
 * @returns {{
 *   symbols: string[] | undefined,
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: any,
 *   refetch: () => void
 * }} Object containing the list of symbols and query state.
 */
export function useSymbols(options = {}) {
  // Use the API hook for initial/historical data
  const { data, isLoading, isError, error, refetch } = useSymbolsQuery(options);

  // No real-time updates for symbols
  return {
    symbols: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
