import { useEffect, useState, useRef } from 'react';
import { ChevronDown, Plus, Loader2, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { listExchangeApiKeys } from '@/services/exchangeApiKeyService';
import {
  ExchangeAccount,
  generateMockExchangeAccounts,
  DEFAULT_MOCK_ACCOUNTS,
} from '@/mocks/mockExchangeAccounts';
import { useNavigate } from 'react-router-dom';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import {
  combinePortfolioData,
  formatUsdValue,
  calculatePercentageChange,
} from '@/utils/portfolioUtils';

export function ExchangeAccountSelector() {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const [localAccounts, setLocalAccounts] = useState<ExchangeAccount[]>(
    DEFAULT_MOCK_ACCOUNTS,
  );

  // Use the shared selected account state
  const { selectedAccount, setSelectedAccount } = useSelectedAccount();

  // State for the portfolio overview option
  const [portfolioOverview, setPortfolioOverview] = useState<ExchangeAccount>({
    id: 'portfolio-overview',
    name: 'Portfolio Overview',
    exchange: 'all',
    exchangeId: 'all',
    apiKeyId: 'portfolio-overview',
    logo: '/placeholder.svg',
    value: '$56,019.96', // Default value
    change: '+1.96%', // Default change
    isPortfolioOverview: true,
  });

  // Fetch the user's exchange API keys
  const {
    data: apiKeys,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['exchangeApiKeys'],
    queryFn: listExchangeApiKeys,
    onSuccess: (data) => {
      console.log('API keys loaded:', JSON.stringify(data));
      // Generate mock accounts based on API keys
      const accounts =
        data && data.length > 0
          ? generateMockExchangeAccounts(data)
          : DEFAULT_MOCK_ACCOUNTS;

      console.log('Generated accounts:', JSON.stringify(accounts));
      console.log('From API keys:', JSON.stringify(data));

      // Log each account name for debugging
      accounts.forEach((account) => {
        console.log(
          `Account: ${account.name}, Exchange: ${account.exchange}, ID: ${account.id}`,
        );
      });

      setLocalAccounts(accounts);

      // Create the portfolio overview option
      // Always create a Portfolio Overview option, even if there are no accounts
      const combinedPortfolio =
        accounts.length > 0
          ? combinePortfolioData(accounts)
          : { totalUsdValue: 0, assets: [] };

      const totalValue = combinedPortfolio.totalUsdValue;

      // Calculate a change percentage (mock data for now)
      const previousValue = totalValue * 0.95; // Assume 5% growth for demo
      const changePercent =
        accounts.length > 0
          ? calculatePercentageChange(totalValue, previousValue)
          : '+0.00%';

      setPortfolioOverview({
        id: 'portfolio-overview',
        name: 'Portfolio Overview',
        exchange: 'all',
        exchangeId: 'all',
        apiKeyId: 'portfolio-overview',
        logo: '/placeholder.svg',
        value: formatUsdValue(totalValue),
        change: changePercent,
        isPortfolioOverview: true, // Special flag to identify this option
      });
    },
    onError: (error) => {
      console.error('Error loading API keys:', error);
      // Fall back to default accounts
      setLocalAccounts(DEFAULT_MOCK_ACCOUNTS);

      // Create a Portfolio Overview option with the default accounts
      const combinedPortfolio = combinePortfolioData(DEFAULT_MOCK_ACCOUNTS);
      const totalValue = combinedPortfolio.totalUsdValue;

      // Calculate a change percentage (mock data for now)
      const previousValue = totalValue * 0.95; // Assume 5% growth for demo
      const changePercent = calculatePercentageChange(
        totalValue,
        previousValue,
      );

      setPortfolioOverview({
        id: 'portfolio-overview',
        name: 'Portfolio Overview',
        exchange: 'all',
        exchangeId: 'all',
        apiKeyId: 'portfolio-overview',
        logo: '/placeholder.svg',
        value: formatUsdValue(totalValue),
        change: changePercent,
        isPortfolioOverview: true, // Special flag to identify this option
      });
    },
  });

  // Listen for localStorage changes and API key updates to refresh data
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log(
        `Storage changed (${e.key}), refreshing exchange account selector data`,
      );
      // Only refresh if the exchange_api_keys were updated
      if (e.key === 'exchange_api_keys' || e.key === null) {
        refetch();
      }
    };

    // Handle API key updates
    const handleApiKeyUpdated = (e: CustomEvent) => {
      console.log(
        'API key updated event received, refreshing exchange account selector data',
      );
      refetch();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(
      'apiKeyUpdated',
      handleApiKeyUpdated as EventListener,
    );

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'apiKeyUpdated',
        handleApiKeyUpdated as EventListener,
      );
    };
  }, [refetch]);

  // Initialize the selected account only once
  useEffect(() => {
    // Only initialize if not already initialized
    if (!initialized) {
      // Only set the selected account if it's not already set
      if (!selectedAccount) {
        // Always prefer Portfolio Overview
        console.log('Initializing with Portfolio Overview');
        setSelectedAccount(portfolioOverview);
      }
      // Mark as initialized
      setInitialized(true);
    }
  }, [initialized, portfolioOverview, selectedAccount]);

  // Render loading state
  const renderLoading = () => (
    <div className="mb-6">
      <div className="text-xs text-gray-400 mb-2">Select Account</div>
      <Button
        variant="outline"
        className="w-full bg-gray-900 border-gray-800 hover:bg-gray-800 justify-between"
        disabled
      >
        <div className="flex items-center">
          <Loader2 className="w-6 h-6 mr-2 animate-spin text-gray-400" />
          <div className="flex flex-col items-start">
            <span className="text-white text-sm">Loading accounts...</span>
          </div>
        </div>
      </Button>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="mb-6">
      <div className="text-xs text-gray-400 mb-2">Select Account</div>
      <Button
        variant="outline"
        className="w-full bg-gray-900 border-gray-800 hover:bg-gray-800 justify-between"
        onClick={() => navigate('/profile/accounts')}
      >
        <div className="flex items-center">
          <Plus className="w-6 h-6 mr-2 text-gray-400" />
          <div className="flex flex-col items-start">
            <span className="text-white text-sm">Add Exchange Account</span>
            <span className="text-xs text-gray-400">
              Connect to start trading
            </span>
          </div>
        </div>
        <ChevronDown size={16} className="ml-2 text-gray-400" />
      </Button>
    </div>
  );

  // Render account selector
  const renderAccountSelector = () => {
    if (!selectedAccount) return renderEmptyState();

    return (
      <div className="mb-6">
        <div className="text-xs text-gray-400 mb-2">Select Account</div>
        <ErrorBoundary>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full bg-gray-900 border-gray-800 hover:bg-gray-800 justify-between"
              >
                <div className="flex items-center">
                  {selectedAccount?.isPortfolioOverview ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex items-center justify-center bg-purple-700">
                      <PieChart size={16} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                      <img
                        src={selectedAccount?.logo || '/placeholder.svg'}
                        alt={selectedAccount?.exchange || 'Exchange'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = '/placeholder.svg';
                          e.currentTarget.onerror = null; // Prevent infinite loop
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="text-white text-sm">
                      {selectedAccount?.name || 'Unknown Account'}
                    </span>
                    <span className="text-xs">
                      <span className="text-gray-400">
                        {selectedAccount?.value || '$0.00'}
                      </span>
                      <span
                        className={`ml-1 ${selectedAccount?.change && !selectedAccount.change.includes('-') ? 'text-crypto-green' : 'text-crypto-red'}`}
                      >
                        {selectedAccount?.change || '0.00%'}
                      </span>
                    </span>
                  </div>
                </div>
                <ChevronDown size={16} className="ml-2 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent
                className="w-[300px] bg-[#1a1a1c]"
                sideOffset={5}
              >
                {/* Portfolio Overview Option */}
                {portfolioOverview && (
                  <DropdownMenuItem
                    key="portfolio-overview"
                    onClick={() => {
                      console.log('Selecting Portfolio Overview');
                      // Force a refresh by setting to null first, then to the new account
                      setSelectedAccount(null);
                      setTimeout(
                        () => setSelectedAccount(portfolioOverview),
                        10,
                      );
                    }}
                    className="py-3 cursor-pointer hover:bg-gray-800 bg-gray-800/50"
                  >
                    <div className="flex items-center w-full">
                      <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex items-center justify-center bg-purple-700">
                        <PieChart size={16} className="text-white" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-white text-sm">
                          Portfolio Overview
                        </span>
                        <span className="text-xs">
                          <span className="text-gray-400">
                            {portfolioOverview.value}
                          </span>
                          <span
                            className={`ml-1 ${!portfolioOverview.change.includes('-') ? 'text-crypto-green' : 'text-crypto-red'}`}
                          >
                            {portfolioOverview.change}
                          </span>
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                )}

                {portfolioOverview && (
                  <DropdownMenuSeparator className="bg-gray-800" />
                )}

                {/* Individual Accounts */}
                {localAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => {
                      console.log(
                        'Selecting account:',
                        account.name,
                        'with API key ID:',
                        account.apiKeyId,
                      );
                      // Force a refresh by setting to null first, then to the new account
                      setSelectedAccount(null);
                      setTimeout(() => setSelectedAccount(account), 10);
                    }}
                    className="py-3 cursor-pointer hover:bg-gray-800"
                  >
                    <div className="flex items-center w-full">
                      <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                        <img
                          src={account?.logo || '/placeholder.svg'}
                          alt={account?.exchange || 'Exchange'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.src = '/placeholder.svg';
                            e.currentTarget.onerror = null; // Prevent infinite loop
                          }}
                        />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-white text-sm">
                          {account?.name || 'Unknown Account'}
                        </span>
                        <span className="text-xs">
                          <span className="text-gray-400">
                            {account?.value || '$0.00'}
                          </span>
                          <span
                            className={`ml-1 ${account?.change && !account.change.includes('-') ? 'text-crypto-green' : 'text-crypto-red'}`}
                          >
                            {account?.change || '0.00%'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-800"
                  onClick={() => {
                    navigate('/profile/accounts');
                  }}
                >
                  <div className="flex items-center w-full justify-center py-1">
                    <Plus size={16} className="mr-2" />
                    <span>Add Account</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </ErrorBoundary>
      </div>
    );
  };

  // Debug log for portfolioOverview
  useEffect(() => {
    console.log('Portfolio Overview state:', portfolioOverview);
  }, [portfolioOverview]);

  // Main render logic
  if (isLoading) return renderLoading();
  return renderAccountSelector();
}
