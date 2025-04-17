import React from 'react';
import { Wallet, TrendingDown, PieChart, Loader2 } from 'lucide-react';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';

const PortfolioOverview: React.FC = () => {
  // Fetch the user's exchange API keys
  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ['exchangeApiKeys'],
    queryFn: listExchangeApiKeys,
  });

  // Use the first API key to fetch portfolio data
  const firstApiKeyId =
    apiKeys && apiKeys.length > 0 ? apiKeys[0].api_key_id : undefined;
  const { data: portfolio, isLoading: isLoadingPortfolio } =
    usePortfolio(firstApiKeyId);

  // Calculate portfolio metrics
  const portfolioValue = portfolio?.totalUsdValue || 0;

  // For demo purposes, we'll simulate a 24h change
  // In a real app, this would come from historical data
  const change24h = portfolioValue * -0.042; // Simulating a 4.2% drop
  const changePercent = -4.2; // Hardcoded for demo
  // Format numbers with commas and 2 decimal places
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Determine if change is positive or negative
  const isNegative = change24h < 0;

  // Show loading state
  if (isLoadingKeys || isLoadingPortfolio) {
    return (
      <div className="dashboard-card">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="text-theme-link" size={20} />
              <h2 className="text-lg font-semibold text-theme-primary">
                Portfolio Overview
              </h2>
            </div>
          </div>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-theme-link" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="text-theme-link" size={20} />
            <h2 className="text-lg font-semibold text-theme-primary">
              Portfolio Overview
            </h2>
          </div>
          <button className="icon-button">
            <PieChart size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="portfolio-stats">
            <div>
              <p className="text-sm text-theme-secondary mb-1">
                Portfolio Value (USD)
              </p>
              <p className="portfolio-value">
                {formatCurrency(portfolioValue)}
              </p>
            </div>
          </div>

          <div className="portfolio-stats">
            <div>
              <p className="text-sm text-theme-secondary mb-1">
                24h Change (USD)
              </p>
              <p className="portfolio-change text-theme-error">
                {isNegative ? '' : '+'}
                {formatCurrency(change24h)}
              </p>
            </div>
          </div>

          <div className="portfolio-stats">
            <div>
              <p className="text-sm text-theme-secondary mb-1">
                24h Change (%)
              </p>
              <div className="flex items-center">
                <div
                  className={`portfolio-change-percent ${isNegative ? 'bg-red-900/10 text-theme-error' : 'bg-green-900/10 text-theme-success'}`}
                >
                  <span className="flex items-center">
                    <TrendingDown
                      className={`${isNegative ? '' : 'rotate-180'} mr-1`}
                      size={14}
                    />
                    {isNegative ? '' : '+'}
                    {formatPercent(changePercent)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;
