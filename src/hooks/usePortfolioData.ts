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
        // Handle special case for 'all' exchange ID (Portfolio Total)
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

          // For individual exchanges, only show assets from that specific exchange
          if (exchangeId && exchangeId !== 'all') {
            console.log(
              `Getting portfolio data for specific exchange: ${exchangeId} with API key: ${apiKeyId}`,
            );
            const portfolioData = getMockPortfolioData(apiKeyId).data;

            // Make sure we're only returning assets from this specific exchange
            if (portfolioData) {
              // Filter assets to only include those from the selected exchange
              portfolioData.assets = portfolioData.assets.filter(
                (asset) => asset.exchangeId === exchangeId,
              );

              // Recalculate the total USD value based on the filtered assets
              portfolioData.totalUsdValue = portfolioData.assets.reduce(
                (sum, asset) => sum + asset.usdValue,
                0,
              );

              console.log(
                `Filtered portfolio for ${exchangeId}: ${portfolioData.assets.length} assets, $${portfolioData.totalUsdValue.toFixed(2)}`,
              );
              return portfolioData;
            }
          }

          return getMockPortfolioData(apiKeyId).data;
        }

        // Special handling for Portfolio Total (all exchanges)
        if (exchangeId === 'all') {
          console.log('Generating combined portfolio data for all exchanges');
          // In a real app, we would fetch data for all exchanges and combine it
          // For now, we'll just return mock data for all default accounts
          const mockData = [
            getMockPortfolioData('mock-key-1').data,
            getMockPortfolioData('mock-key-2').data,
            getMockPortfolioData('mock-key-3').data,
          ].filter(Boolean) as Portfolio[];

          // For Portfolio Total, combine assets by symbol across exchanges
          const combinedPortfolio: Portfolio = {
            totalUsdValue: mockData.reduce(
              (sum, p) => sum + p.totalUsdValue,
              0,
            ),
            assets: [],
            lastUpdated: new Date(),
          };

          // Group assets by symbol
          const assetsBySymbol: Record<string, PortfolioAsset[]> = {};

          // First collect all assets grouped by symbol
          mockData.forEach((portfolio) => {
            portfolio.assets.forEach((asset) => {
              if (!assetsBySymbol[asset.asset]) {
                assetsBySymbol[asset.asset] = [];
              }
              assetsBySymbol[asset.asset].push(asset);
            });
          });

          // Then combine assets of the same symbol
          Object.entries(assetsBySymbol).forEach(([symbol, assets]) => {
            if (assets.length === 1) {
              // If there's only one asset with this symbol, use it directly
              combinedPortfolio.assets.push({
                ...assets[0],
                exchangeSources: [
                  { exchangeId: assets[0].exchangeId, amount: assets[0].total },
                ],
              });
            } else {
              // Combine multiple assets with the same symbol
              const totalFree = assets.reduce(
                (sum, asset) => sum + asset.free,
                0,
              );
              const totalLocked = assets.reduce(
                (sum, asset) => sum + asset.locked,
                0,
              );
              const totalAmount = assets.reduce(
                (sum, asset) => sum + asset.total,
                0,
              );
              const totalValue = assets.reduce(
                (sum, asset) => sum + asset.usdValue,
                0,
              );

              // Use the first asset as a template
              const combinedAsset: PortfolioAsset = {
                ...assets[0],
                free: totalFree,
                locked: totalLocked,
                total: totalAmount,
                usdValue: totalValue,
                // Store sources for the trade function
                exchangeSources: assets.map((asset) => ({
                  exchangeId: asset.exchangeId,
                  amount: asset.total,
                })),
              };

              combinedPortfolio.assets.push(combinedAsset);
            }
          });
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
