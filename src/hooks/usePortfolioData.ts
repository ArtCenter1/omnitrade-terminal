import { useQuery } from '@tanstack/react-query';
import { Portfolio } from '@/types/exchange';
import { useAuth } from '@/contexts/AuthContext';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';

/**
 * Hook to fetch aggregated portfolio data from all connected exchanges
 * @param exchangeId Optional exchange ID to filter by
 * @returns Query result with portfolio data
 */
export function usePortfolioData(exchangeId?: string, apiKeyId?: string) {
  const { getAuthToken } = useAuth();

  return useQuery<Portfolio>({
    queryKey: ['portfolio', exchangeId],
    queryFn: async () => {
      try {
        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          console.warn('Authentication required for portfolio data');
          // Fall back to mock data if no token
          if (apiKeyId) {
            console.log('Using mock portfolio data for API key:', apiKeyId);
            return getMockPortfolioData(apiKeyId).data;
          }
          throw new Error('Authentication required');
        }

        // Build URL with optional exchange filter
        const url = exchangeId
          ? `/api/portfolio?exchange_id=${encodeURIComponent(exchangeId)}`
          : '/api/portfolio';

        // Fetch portfolio data
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to fetch portfolio data: ${response.status}`,
          );
        }

        return response.json();
      } catch (error) {
        console.error('Error fetching portfolio data:', error);

        // Fall back to mock data if available
        if (apiKeyId) {
          console.log(
            'Falling back to mock portfolio data for API key:',
            apiKeyId,
          );
          return getMockPortfolioData(apiKeyId).data;
        }

        // Re-throw the error if we can't provide mock data
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
}
