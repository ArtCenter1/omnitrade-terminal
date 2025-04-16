import { useMarkets } from "../services/marketDataApi";
import { MarketCoin } from "../types/marketData"; // Import MarketCoin type

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
  // Use useMarkets - assuming default params are sufficient for fetching symbols
  const {
    data: marketData,
    isLoading,
    isError,
    error,
    refetch,
  } = useMarkets(undefined, options);

  // No real-time updates for symbols
  return {
    // Extract symbol IDs from the market data
    symbols: marketData?.map((coin: MarketCoin) => coin.id),
    isLoading,
    isError,
    error,
    refetch,
  };
}
