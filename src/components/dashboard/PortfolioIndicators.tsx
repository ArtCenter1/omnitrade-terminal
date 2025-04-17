import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';
import { useEffect, useState, useRef } from 'react';

interface PortfolioIndicatorProps {
  title: string;
  value: string;
  change: string;
  isPercentage?: boolean;
  isPositive?: boolean;
}

const PortfolioIndicator = ({
  title,
  value,
  change,
  isPercentage = false,
  isPositive = false,
}: PortfolioIndicatorProps) => {
  return (
    <div className="flex flex-col">
      <div className="text-xs text-gray-400 uppercase mb-1">{title}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div
        className={cn(
          'flex items-center text-sm mt-1',
          isPositive ? 'text-crypto-green' : 'text-crypto-red',
        )}
      >
        {isPositive ? (
          <ArrowUpRight size={14} className="mr-1" />
        ) : (
          <ArrowDownRight size={14} className="mr-1" />
        )}
        <span>
          {change}
          {isPercentage && '%'}
        </span>
      </div>
    </div>
  );
};

export function PortfolioIndicators() {
  // Get the selected account
  const { selectedAccount } = useSelectedAccount();
  const previousApiKeyIdRef = useRef<string | null>(null);

  const [portfolioData, setPortfolioData] = useState<{
    value: string;
    change: string;
    changePercent: string;
    isPositive: boolean;
  }>({
    value: '$0.00',
    change: '$0.00',
    changePercent: '0.00',
    isPositive: false,
  });

  // Load portfolio data when the selected account changes
  useEffect(() => {
    // Skip if no account is selected
    if (!selectedAccount) return;

    // Skip if the apiKeyId hasn't changed
    if (previousApiKeyIdRef.current === selectedAccount.apiKeyId) return;

    // Update the ref to the current apiKeyId
    previousApiKeyIdRef.current = selectedAccount.apiKeyId;

    console.log('Loading portfolio data for account:', selectedAccount.name);

    try {
      // Get mock portfolio data for the selected account
      const { data } = getMockPortfolioData(selectedAccount.apiKeyId);

      if (data) {
        // Format the portfolio value
        const value = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(data.totalUsdValue);

        // Extract the change percentage from the account
        const changePercentStr = selectedAccount.change
          .replace('%', '')
          .replace('+', '');
        const changePercent = parseFloat(changePercentStr);

        // Calculate the change amount based on the percentage
        const changeAmount = data.totalUsdValue * (changePercent / 100);
        const change = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Math.abs(changeAmount));

        // Determine if the change is positive
        const isPositive = !selectedAccount.change.includes('-');

        // Create the new portfolio data
        const newData = {
          value,
          change: isPositive ? `+${change}` : `-${change}`,
          changePercent: Math.abs(changePercent).toFixed(2),
          isPositive,
        };

        // Update state with the new data
        setPortfolioData(newData);
        console.log('Portfolio data updated:', newData);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    }
  }, [selectedAccount]); // Depend on the entire selectedAccount object, but use ref to prevent unnecessary updates

  // Show loading state if no account is selected
  if (!selectedAccount) {
    return (
      <div className="flex justify-center items-center mb-6 px-1 py-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex justify-between items-center mb-6 px-1">
        <PortfolioIndicator
          title="Portfolio Value (USD)"
          value={portfolioData.value}
          change={
            portfolioData.isPositive
              ? `+${portfolioData.change}`
              : `-${portfolioData.change}`
          }
          isPositive={portfolioData.isPositive}
        />

        <PortfolioIndicator
          title="24h Change (USD)"
          value={
            portfolioData.isPositive
              ? `+${portfolioData.change}`
              : `-${portfolioData.change}`
          }
          change={
            portfolioData.isPositive
              ? `+${portfolioData.change}`
              : `-${portfolioData.change}`
          }
          isPositive={portfolioData.isPositive}
        />

        <PortfolioIndicator
          title="24h Change (%)"
          value={`${portfolioData.isPositive ? '+' : '-'}${portfolioData.changePercent}%`}
          change={portfolioData.changePercent}
          isPercentage={true}
          isPositive={portfolioData.isPositive}
        />
      </div>
    </ErrorBoundary>
  );
}
