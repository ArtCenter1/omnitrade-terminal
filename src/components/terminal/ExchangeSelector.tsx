import { useState, useEffect } from 'react';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listExchangeApiKeys } from '@/services/exchangeApiKeyService';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  ExchangeAccount,
  generateMockExchangeAccounts,
  DEFAULT_MOCK_ACCOUNTS,
} from '@/mocks/mockExchangeAccounts';

export function ExchangeSelector() {
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const [localAccounts, setLocalAccounts] = useState<ExchangeAccount[]>(
    DEFAULT_MOCK_ACCOUNTS,
  );

  // Use the shared selected account state
  const { selectedAccount, setSelectedAccount } = useSelectedAccount();

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

      // Log each account name for debugging
      accounts.forEach((account) => {
        console.log(
          `Account: ${account.name}, Exchange: ${account.exchange}, ID: ${account.id}`,
        );
      });

      setLocalAccounts(accounts);
    },
    onError: (error) => {
      console.error('Error loading API keys:', error);
      // Fall back to default accounts
      setLocalAccounts(DEFAULT_MOCK_ACCOUNTS);
    },
  });

  // Listen for localStorage changes and API key updates to refresh data
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log(
        `[ExchangeSelector] Storage changed (${e.key}), refreshing exchange selector data`,
      );
      // Only refresh if the exchange_api_keys were updated
      if (e.key === 'exchange_api_keys' || e.key === null) {
        console.log(
          '[ExchangeSelector] Refetching API keys due to storage change',
        );
        refetch();
      }
    };

    // Handle API key updates
    const handleApiKeyUpdated = (e: CustomEvent) => {
      const { apiKeyId, nickname } = e.detail || {};
      console.log(
        `[ExchangeSelector] API key updated event received for ${apiKeyId} with nickname "${nickname}", refreshing data`,
      );

      // If this is the currently selected account, update it immediately
      if (selectedAccount && selectedAccount.apiKeyId === apiKeyId) {
        console.log(
          `[ExchangeSelector] Currently selected account (${selectedAccount.name}) matches updated API key, updating immediately`,
        );
        // Create a new account object with the updated nickname
        const updatedAccount = {
          ...selectedAccount,
          name: nickname,
        };
        // Update the selected account
        setSelectedAccount(updatedAccount);
      }

      // Also refetch to ensure all data is in sync
      console.log('[ExchangeSelector] Refetching API keys');
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
  }, [refetch, selectedAccount, setSelectedAccount]);

  // Initialize the selected account only once
  useEffect(() => {
    // Only run this effect when localAccounts changes and we haven't initialized yet
    if (!initialized && localAccounts.length > 0) {
      // Only set the selected account if it's not already set
      if (!selectedAccount) {
        console.log(
          'Initializing selected account with:',
          localAccounts[0].name,
        );
        setSelectedAccount(localAccounts[0]);
      }
      // Mark as initialized regardless of whether we set an account
      setInitialized(true);
    }
  }, [initialized, localAccounts, selectedAccount, setSelectedAccount]);

  // We already have a storage event listener above

  // Handle Portfolio Total case
  useEffect(() => {
    // Check if the selected account is the Portfolio Total (exchangeId: 'all')
    if (selectedAccount && selectedAccount.exchangeId === 'all') {
      console.log(
        'Portfolio Total detected in terminal, switching to default exchange',
      );

      // Find the first available account that's not Portfolio Total
      const defaultAccount = localAccounts.find(
        (account) => account.exchangeId !== 'all',
      );

      if (defaultAccount) {
        console.log(
          'Switching to default exchange account:',
          defaultAccount.name,
        );
        setSelectedAccount(defaultAccount);
      }
    }
  }, [selectedAccount, localAccounts, setSelectedAccount]);

  // Render loading state
  const renderLoading = () => (
    <div className="mb-6">
      <div className="text-xs text-[var(--text-secondary)] mb-2">Exchange</div>
      <Button
        variant="outline"
        className="w-full bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)] justify-between"
        disabled
      >
        <div className="flex items-center">
          <Loader2 className="w-5 h-5 mr-2 animate-spin text-[var(--text-secondary)]" />
          <div className="flex flex-col items-start">
            <span className="text-[var(--text-primary)] text-sm">Loading exchanges...</span>
          </div>
        </div>
      </Button>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="mb-6">
      <div className="text-xs text-[var(--text-secondary)] mb-2">Exchange</div>
      <Button
        variant="outline"
        className="w-full bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)] justify-between"
        onClick={() => navigate('/profile/accounts')}
      >
        <div className="flex items-center">
          <Plus className="w-5 h-5 mr-2 text-[var(--text-secondary)]" />
          <div className="flex flex-col items-start">
            <span className="text-[var(--text-primary)] text-sm">Add Exchange</span>
            <span className="text-xs text-[var(--text-secondary)]">
              Connect to start trading
            </span>
          </div>
        </div>
        <ChevronDown size={16} className="ml-2 text-[var(--text-secondary)]" />
      </Button>
    </div>
  );

  // List of all supported exchanges
  const SUPPORTED_EXCHANGES = [
    { id: 'binance', name: 'Binance', logo: '/exchanges/binance.svg' },
    {
      id: 'binance_testnet',
      name: 'Binance Testnet',
      logo: '/exchanges/binance.svg',
    },
    { id: 'coinbase', name: 'Coinbase', logo: '/exchanges/coinbase.svg' },
    { id: 'kraken', name: 'Kraken', logo: '/exchanges/kraken.svg' },
    { id: 'kucoin', name: 'KuCoin', logo: '/exchanges/kucoin.svg' },
    { id: 'bybit', name: 'Bybit', logo: '/exchanges/bybit.svg' },
    { id: 'okx', name: 'OKX', logo: '/exchanges/okx.svg' },
    { id: 'sandbox', name: 'Demo', logo: '/exchanges/demo.svg' },
  ];

  // Render exchange selector
  const renderExchangeSelector = () => {
    if (!selectedAccount) return renderEmptyState();

    // Get the current exchange from the selected account
    const currentExchangeId = selectedAccount?.exchangeId?.toLowerCase() || '';
    const currentExchange = SUPPORTED_EXCHANGES.find(
      (ex) => ex.id === currentExchangeId,
    ) || {
      id: currentExchangeId,
      name: selectedAccount.exchange,
      logo: selectedAccount.logo,
    };

    return (
      <div className="mb-6">
        <div className="text-xs text-[var(--text-secondary)] mb-2">Exchange</div>
        <ErrorBoundary>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)] justify-between"
              >
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                    <img
                      src={currentExchange.logo}
                      alt={currentExchange.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <span className="text-[var(--text-primary)]">{currentExchange.name}</span>
                </div>
                <ChevronDown size={16} className="text-[var(--text-secondary)]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent
                className="w-[250px] bg-[var(--bg-dropdown)]"
                sideOffset={5}
              >
                {/* Show all supported exchanges */}
                {SUPPORTED_EXCHANGES.map((exchange) => {
                  // Check if we have any accounts for this exchange
                  // Always return true for Demo Exchange and Binance Testnet since they're always available
                  const hasAccounts =
                    exchange.id === 'sandbox' ||
                    exchange.id === 'binance_testnet'
                      ? true
                      : localAccounts.some(
                          (a) =>
                            a.exchangeId?.toLowerCase() ===
                            exchange.id.toLowerCase(),
                        );

                  return (
                    <DropdownMenuItem
                      key={exchange.id}
                      onClick={() => {
                        // Special handling for Demo Exchange
                        if (exchange.id === 'sandbox') {
                          // Find the Demo Account
                          const demoAccount = localAccounts.find(
                            (a) => a.isSandbox === true,
                          );

                          if (demoAccount) {
                            console.log(
                              'Selecting Demo Exchange with Demo Account:',
                              demoAccount.name,
                            );
                            setSelectedAccount(demoAccount);
                          } else {
                            console.error('Demo Account not found');
                          }
                        }
                        // Special handling for Binance Testnet
                        else if (exchange.id === 'binance_testnet') {
                          // Find the Binance Testnet Account
                          const testnetAccount = localAccounts.find(
                            (a) => a.exchangeId === 'binance_testnet',
                          );

                          if (testnetAccount) {
                            console.log(
                              'Selecting Binance Testnet with account:',
                              testnetAccount.name,
                            );
                            setSelectedAccount(testnetAccount);
                          } else {
                            // If no Binance Testnet account exists, create a temporary one
                            console.log(
                              'No Binance Testnet account found, creating temporary one',
                            );
                            const tempTestnetAccount: ExchangeAccount = {
                              id: 'binance-testnet-account',
                              name: 'Binance Testnet',
                              exchange: 'Binance Testnet',
                              exchangeId: 'binance_testnet',
                              value: '$10,000.00',
                              change: '+0.00%',
                              logo: '/exchanges/binance.svg',
                              apiKeyId: 'binance-testnet-key',
                            };
                            setSelectedAccount(tempTestnetAccount);
                          }
                        } else if (hasAccounts) {
                          // Find the first account for this exchange
                          const account = localAccounts.find(
                            (a) =>
                              a.exchangeId?.toLowerCase() ===
                              exchange.id.toLowerCase(),
                          );
                          if (account) {
                            console.log(
                              'Selecting exchange:',
                              exchange.name,
                              'with account:',
                              account.name,
                            );
                            setSelectedAccount(account);
                          }
                        } else {
                          // If no accounts, navigate to add account page
                          navigate('/profile/accounts');
                        }
                      }}
                      className="py-2 cursor-pointer hover:bg-[var(--bg-hover)]"
                    >
                      <div className="flex items-center w-full justify-between">
                        <div className="flex items-center">
                          <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                            <img
                              src={exchange.logo}
                              alt={exchange.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <span className="text-[var(--text-primary)] text-sm">
                            {exchange.name}
                          </span>
                        </div>
                        {!hasAccounts && (
                          <span className="text-xs text-[var(--text-secondary)]">
                            Not connected
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="bg-[var(--border-primary)]" />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-[var(--bg-hover)]"
                  onClick={() => {
                    navigate('/profile/accounts');
                  }}
                >
                  <div className="flex items-center w-full justify-center py-1">
                    <Plus size={16} className="mr-2" />
                    <span>Add Exchange</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </ErrorBoundary>
      </div>
    );
  };

  // Main render logic
  if (isLoading) return renderLoading();
  return renderExchangeSelector();
}
