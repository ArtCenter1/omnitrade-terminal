import { useQuery } from '@tanstack/react-query';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { Portfolio } from '@/types/exchange';

/**
 * Hook to fetch portfolio data for a specific exchange API key
 */
export function usePortfolio(apiKeyId: string | undefined) {
  return useQuery<Portfolio>({
    queryKey: ['portfolio', apiKeyId],
    queryFn: async () => {
      if (!apiKeyId) {
        throw new Error('API Key ID is required');
      }

      // Get the exchange ID from the API key ID (in a real app, you'd look this up)
      // For mock data, we'll just use 'binance' as the default
      const exchangeId = 'binance';

      // Get the adapter for the exchange
      const adapter = ExchangeFactory.getAdapter(exchangeId);

      // Fetch the portfolio data
      return adapter.getPortfolio(apiKeyId);
    },
    enabled: !!apiKeyId, // Only run the query if apiKeyId is provided
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
