import { useState, useEffect } from 'react';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
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
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import {
  ExchangeAccount,
  getExchangeAccounts,
} from '@/mocks/mockExchangeAccounts';

export function AccountSelector() {
  const navigate = useNavigate();
  const { selectedAccount, setSelectedAccount } = useSelectedAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [accountsForExchange, setAccountsForExchange] = useState<
    ExchangeAccount[]
  >([]);

  // Get accounts for the current exchange
  useEffect(() => {
    if (selectedAccount) {
      // Skip Portfolio Total (exchangeId: 'all')
      if (
        selectedAccount.exchangeId === 'all' ||
        selectedAccount.isPortfolioOverview
      ) {
        console.log(
          'Portfolio Total detected in AccountSelector, skipping account filtering',
        );
        return;
      }

      // Get the latest accounts using the function to ensure we have the latest data
      const allAccounts = getExchangeAccounts();

      // Filter accounts for the current exchange
      const accounts = allAccounts.filter(
        (account) =>
          account.exchangeId?.toLowerCase() ===
          selectedAccount.exchangeId?.toLowerCase(),
      );

      console.log(
        'Accounts for exchange:',
        selectedAccount.exchangeId,
        accounts,
      );
      setAccountsForExchange(accounts);
    }
  }, [selectedAccount]);

  // Listen for API key updates to refresh the account list
  useEffect(() => {
    const handleApiKeyUpdated = (e: CustomEvent) => {
      const { apiKeyId, nickname } = e.detail || {};
      console.log(
        `[AccountSelector] API key updated event received for ${apiKeyId} with nickname "${nickname}", refreshing data`,
      );

      if (selectedAccount) {
        console.log(
          `[AccountSelector] Current selected account: ${selectedAccount.name} (${selectedAccount.apiKeyId})`,
        );

        // If this is the currently selected account, update it immediately
        if (selectedAccount.apiKeyId === apiKeyId) {
          console.log(
            `[AccountSelector] Currently selected account matches updated API key, updating immediately`,
          );
          // Create a new account object with the updated nickname
          const updatedAccount = {
            ...selectedAccount,
            name: nickname,
          };
          // Update the selected account
          setSelectedAccount(updatedAccount);
        }

        // Get the latest accounts
        console.log(
          `[AccountSelector] Getting latest accounts for exchange: ${selectedAccount.exchangeId}`,
        );
        const allAccounts = getExchangeAccounts();

        // Filter accounts for the current exchange
        const accounts = allAccounts.filter(
          (account) =>
            account.exchangeId?.toLowerCase() ===
            selectedAccount.exchangeId?.toLowerCase(),
        );

        console.log(
          `[AccountSelector] Found ${accounts.length} accounts for exchange ${selectedAccount.exchangeId}:`,
          accounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            apiKeyId: acc.apiKeyId,
          })),
        );
        setAccountsForExchange(accounts);
      }
    };

    // Also listen for storage events to refresh the account list
    const handleStorageChange = (e: StorageEvent) => {
      console.log(
        `[AccountSelector] Storage changed (${e.key}), checking if we need to refresh`,
      );
      // Only refresh if the exchange_api_keys were updated
      if (e.key === 'exchange_api_keys' || e.key === null) {
        console.log(
          '[AccountSelector] exchange_api_keys changed, refreshing account list',
        );
        if (selectedAccount) {
          // Get the latest accounts
          const allAccounts = getExchangeAccounts();

          // Filter accounts for the current exchange
          const accounts = allAccounts.filter(
            (account) =>
              account.exchangeId?.toLowerCase() ===
              selectedAccount.exchangeId?.toLowerCase(),
          );

          setAccountsForExchange(accounts);
        }
      }
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
  }, [selectedAccount, setSelectedAccount]);

  // If no account is selected, show empty state
  if (!selectedAccount) {
    return (
      <div className="mb-6">
        <div className="text-gray-400 mb-2 text-xs">Account</div>
        <Button
          variant="outline"
          className="w-full bg-gray-900 border-gray-800 hover:bg-gray-800 justify-between"
          onClick={() => navigate('/profile/accounts')}
        >
          <div className="flex items-center">
            <Plus className="w-5 h-5 mr-2 text-gray-400" />
            <div className="flex flex-col items-start">
              <span className="text-white text-sm">Add Account</span>
              <span className="text-xs text-gray-400">
                Connect to start trading
              </span>
            </div>
          </div>
          <ChevronDown size={16} className="ml-2 text-gray-400" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="text-gray-400 mb-2 text-xs">Account</div>
      <ErrorBoundary>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-gray-900 border-gray-800 hover:bg-gray-800 justify-between"
            >
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                  <img
                    src={selectedAccount.logo}
                    alt={selectedAccount.exchange}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.src = '/placeholder.svg';
                      e.currentTarget.onerror = null; // Prevent infinite loop
                    }}
                  />
                </div>
                <span className="text-white">{selectedAccount.name}</span>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              className="w-[250px] bg-[#1a1a1c]"
              sideOffset={5}
            >
              {/* Show accounts for the current exchange */}
              {accountsForExchange.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => {
                    setSelectedAccount(account);
                    setIsOpen(false);
                  }}
                  className="py-2 cursor-pointer hover:bg-gray-800"
                >
                  <div className="flex items-center w-full">
                    <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                      <img
                        src={account.logo}
                        alt={account.exchange}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = '/placeholder.svg';
                          e.currentTarget.onerror = null; // Prevent infinite loop
                        }}
                      />
                    </div>
                    <span className="text-white text-sm">{account.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem
                className="cursor-pointer hover:bg-gray-800"
                onClick={() => {
                  navigate('/profile/accounts');
                  setIsOpen(false);
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
}
