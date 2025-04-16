import { useEffect } from 'react';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { listExchangeApiKeys } from '@/services/exchangeApiKeyService';
import {
  generateMockExchangeAccounts,
  DEFAULT_MOCK_ACCOUNTS,
} from '@/mocks/mockExchangeAccounts';
import { useNavigate } from 'react-router-dom';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';

export function ExchangeAccountSelector() {
  const navigate = useNavigate();

  // Fetch the user's exchange API keys
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['exchangeApiKeys'],
    queryFn: listExchangeApiKeys,
  });

  // Generate mock accounts based on API keys
  const accounts =
    apiKeys && apiKeys.length > 0
      ? generateMockExchangeAccounts(apiKeys)
      : DEFAULT_MOCK_ACCOUNTS;

  // Use the shared selected account state
  const { selectedAccount, setSelectedAccount } = useSelectedAccount();

  // Set the first account as selected when accounts are loaded
  // Only run this effect once when accounts are first loaded
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount

  // Show loading state
  if (isLoading) {
    return (
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
  }

  // Show empty state if no accounts
  if (!selectedAccount) {
    return (
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
  }

  return (
    <div className="mb-6">
      <div className="text-xs text-gray-400 mb-2">Select Account</div>
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
                <span className="text-xs text-gray-400">
                  {selectedAccount.value} | {selectedAccount.change}
                </span>
              </div>
            </div>
            <ChevronDown size={16} className="ml-2 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px] bg-gray-900 border-gray-800">
          {accounts.map((account) => (
            <DropdownMenuItem
              key={account.id}
              onClick={() => setSelectedAccount(account)}
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
                  <span className="text-white text-sm">{account.name}</span>
                  <span className="text-xs text-gray-400">
                    {account.value} | {account.change}
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
      </DropdownMenu>
    </div>
  );
}
