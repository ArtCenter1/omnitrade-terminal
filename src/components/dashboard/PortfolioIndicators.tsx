import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { usePortfolioData } from '@/hooks/usePortfolioData';
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
      <div className="text-xs text-gray-400 uppercase mb-0">{title}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div
        className={cn(
          'flex items-center text-sm mt-0',
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

  // Fetch portfolio data from the backend
  const {
    data: portfolioData,
    isLoading,
    error,
  } = usePortfolioData(selectedAccount?.exchangeId, selectedAccount?.apiKeyId);

  // Log any errors for debugging
  useEffect(() => {
    if (error) {
      console.error('Portfolio data fetch error:', error);
    }
  }, [error]);

  const [displayData, setDisplayData] = useState<{
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

  // Update display data when portfolio data changes
  useEffect(() => {
    // Skip if no account is selected
    if (!selectedAccount) {
      return;
    }

    console.log(
      'Updating portfolio indicators for account:',
      selectedAccount.name,
      'Portfolio data available:',
      !!portfolioData,
    );

    try {
      // If we have portfolio data, use it for the value
      // Otherwise, use the value from the selected account
      let formattedValue;
      if (portfolioData && typeof portfolioData.totalUsdValue === 'number') {
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(portfolioData.totalUsdValue);
      } else {
        // Fallback to the account value if portfolio data is not available
        formattedValue = selectedAccount.value || '$0.00';
      }

      // Extract the change percentage from the account
      // Add safety checks for null/undefined values
      const changePercentStr = selectedAccount.change
        ? selectedAccount.change.replace('%', '').replace('+', '')
        : '0';
      const changePercent = parseFloat(changePercentStr) || 0;

      // Calculate the change amount
      let changeAmount;
      if (portfolioData && typeof portfolioData.totalUsdValue === 'number') {
        changeAmount = portfolioData.totalUsdValue * (changePercent / 100);
      } else {
        // Fallback calculation if portfolio data is not available
        // Parse the account value to get a number
        const accountValue = parseFloat(
          selectedAccount.value?.replace(/[^0-9.-]+/g, '') || '0',
        );
        changeAmount = accountValue * (changePercent / 100);
      }

      const change = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Math.abs(changeAmount));

      // Determine if the change is positive
      const isPositive = selectedAccount.change
        ? !selectedAccount.change.includes('-')
        : true;

      // Create the new portfolio data
      const newData = {
        value: formattedValue,
        change: change, // Just use the formatted change without adding +/- prefix
        changePercent: Math.abs(changePercent).toFixed(2),
        isPositive,
      };

      // Update state with the new data
      setDisplayData(newData);
      console.log('Portfolio indicators updated:', newData);
    } catch (error) {
      console.error('Error updating portfolio indicators:', error);

      // Set fallback data from the account
      const isPositive = selectedAccount.change
        ? !selectedAccount.change.includes('-')
        : true;

      setDisplayData({
        value: selectedAccount.value || '$0.00',
        change: selectedAccount.change || '0.00%',
        changePercent:
          selectedAccount.change
            ?.replace('%', '')
            .replace('+', '')
            .replace('-', '') || '0.00',
        isPositive,
      });
    }
  }, [selectedAccount, portfolioData]); // Depend on both selectedAccount and portfolioData

  // Show loading state if no account is selected or portfolio data is loading (but not if there's an error)
  if (!selectedAccount || (isLoading && !error)) {
    return (
      <div className="flex justify-center items-center mb-6 px-1 py-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-400">
          {!selectedAccount
            ? 'No account selected'
            : 'Loading portfolio data...'}
        </span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex justify-between items-center mb-2 px-1">
        <PortfolioIndicator
          title="Portfolio Value (USD)"
          value={
            displayData.isPositive ? `+${displayData.value}` : displayData.value
          }
          change={displayData.change}
          isPositive={displayData.isPositive}
        />

        <PortfolioIndicator
          title="24h Change (USD)"
          value={
            displayData.isPositive
              ? `+$${displayData.change.replace('$', '')}`
              : `-$${displayData.change.replace('$', '')}`
          }
          change={displayData.change}
          isPositive={displayData.isPositive}
        />

        <PortfolioIndicator
          title="24h Change (%)"
          value={`${displayData.isPositive ? '+' : '-'}${displayData.changePercent}%`}
          change={displayData.changePercent}
          isPercentage={true}
          isPositive={displayData.isPositive}
        />
      </div>
    </ErrorBoundary>
  );
}
