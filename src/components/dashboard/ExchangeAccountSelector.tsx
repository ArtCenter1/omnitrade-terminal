import { useEffect, useState, useRef } from 'react';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
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

export function ExchangeAccountSelector() {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const [localAccounts, setLocalAccounts] = useState<ExchangeAccount[]>(
    DEFAULT_MOCK_ACCOUNTS,
  );

  // Use the shared selected account state
  const { selectedAccount, setSelectedAccount } = useSelectedAccount();

  // Fetch the user's exchange API keys
  const { data: apiKeys, isLoading } = useQuery({
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
    },
    onError: (error) => {
      console.error('Error loading API keys:', error);
      // Fall back to default accounts
      setLocalAccounts(DEFAULT_MOCK_ACCOUNTS);
    },
  });

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
  }, [initialized, localAccounts]); // Remove selectedAccount from dependencies

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
                  <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                    <img
                      src={selectedAccount.logo}
                      alt={selectedAccount.exchange}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white text-sm">
                      {selectedAccount.name}
                    </span>
                    <span className="text-xs">
                      <span className="text-gray-400">
                        {selectedAccount.value}
                      </span>
                      <span
                        className={`ml-1 ${!selectedAccount.change.includes('-') ? 'text-crypto-green' : 'text-crypto-red'}`}
                      >
                        {selectedAccount.change}
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
                {localAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => {
                      console.log('Selecting account:', account.name);
                      setSelectedAccount(account);
                    }}
                    className="py-3 cursor-pointer hover:bg-gray-800"
                  >
                    <div className="flex items-center w-full">
                      <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                        <img
                          src={account.logo}
                          alt={account.exchange}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-white text-sm">
                          {account.name}
                        </span>
                        <span className="text-xs">
                          <span className="text-gray-400">{account.value}</span>
                          <span
                            className={`ml-1 ${!account.change.includes('-') ? 'text-crypto-green' : 'text-crypto-red'}`}
                          >
                            {account.change}
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

  // Main render logic
  if (isLoading) return renderLoading();
  return renderAccountSelector();
}
