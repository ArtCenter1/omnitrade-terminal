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
  exchangeAccounts,
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
      // Filter accounts for the current exchange
      const accounts = exchangeAccounts.filter(
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
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-black"
                  >
                    <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                    <polygon points="12 15 17 21 7 21 12 15" />
                  </svg>
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
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-black"
                      >
                        <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                        <polygon points="12 15 17 21 7 21 12 15" />
                      </svg>
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
