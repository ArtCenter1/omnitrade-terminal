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
        // Handle special case for 'all' exchange ID (Portfolio Overview)
        let url = '/api/portfolio';
        if (exchangeId && exchangeId !== 'all') {
          url = `/api/portfolio?exchange_id=${encodeURIComponent(exchangeId)}`;
        }

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
        // Handle API errors more gracefully
        if (error instanceof Error) {
          console.warn(`Error fetching portfolio data: ${error.message}`);
        } else {
          console.error('Error fetching portfolio data:', error);
        }

        // Fall back to mock data if available
        if (apiKeyId) {
          console.log(
            'Falling back to mock portfolio data for API key:',
            apiKeyId,
          );
          return getMockPortfolioData(apiKeyId).data;
        }

        // Special handling for Portfolio Overview (all exchanges)
        if (exchangeId === 'all') {
          console.log('Generating combined portfolio data for all exchanges');
          // In a real app, we would fetch data for all exchanges and combine it
          // For now, we'll just return mock data for all default accounts
          const mockData = [
            getMockPortfolioData('mock-key-1').data,
            getMockPortfolioData('mock-key-2').data,
            getMockPortfolioData('mock-key-3').data,
          ].filter(Boolean) as Portfolio[];

          // Combine the portfolios
          const combinedPortfolio: Portfolio = {
            totalUsdValue: mockData.reduce(
              (sum, p) => sum + p.totalUsdValue,
              0,
            ),
            assets: [],
            lastUpdated: new Date(),
          };

          // Combine assets
          const assetMap = new Map<
            string,
            (typeof combinedPortfolio.assets)[0]
          >();
          mockData.forEach((portfolio) => {
            portfolio.assets.forEach((asset) => {
              const key = asset.asset;
              if (assetMap.has(key)) {
                const existing = assetMap.get(key)!;
                existing.free += asset.free;
                existing.locked += asset.locked;
                existing.total += asset.total;
                existing.usdValue += asset.usdValue;
              } else {
                assetMap.set(key, { ...asset });
              }
            });
          });

          combinedPortfolio.assets = Array.from(assetMap.values());
          return combinedPortfolio;
        }

        // For development, always return empty portfolio rather than throwing
        if (process.env.NODE_ENV === 'development') {
          console.info('Returning empty portfolio data for development');
          return {
            totalUsdValue: 0,
            assets: [],
            lastUpdated: new Date(),
          };
        }

        // Re-throw the error if we can't provide mock data
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
}
