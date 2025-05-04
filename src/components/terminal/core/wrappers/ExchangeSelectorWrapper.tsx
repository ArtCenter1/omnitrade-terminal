/**
 * Exchange Selector Wrapper
 * 
 * A wrapper for the ExchangeSelector component that doesn't use react-router-dom
 * to avoid the "useNavigate() may be used only in the context of a <Router> component" error.
 */

import React from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus } from 'lucide-react';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { DEFAULT_MOCK_ACCOUNTS } from '@/mocks/mockExchangeAccounts';

// Import the supported exchanges from a constant file
const SUPPORTED_EXCHANGES = [
  {
    id: 'binance',
    name: 'Binance',
    logo: '/exchange-logos/binance.svg',
  },
  {
    id: 'binance_testnet',
    name: 'Binance Testnet',
    logo: '/exchange-logos/binance.svg',
  },
  {
    id: 'sandbox',
    name: 'Demo Exchange',
    logo: '/exchange-logos/sandbox.svg',
  },
];

export function ExchangeSelectorWrapper() {
  const { selectedAccount, setSelectedAccount } = useSelectedAccount();
  const [localAccounts] = React.useState(DEFAULT_MOCK_ACCOUNTS);

  // Handle adding a new exchange
  const handleAddExchange = () => {
    // Instead of navigating, just show a message
    console.log('Add Exchange clicked - navigation disabled in workspace mode');
    alert('To add a new exchange, please go to the Profile > Accounts page');
  };

  // Render exchange selector
  const renderExchangeSelector = () => {
    if (!selectedAccount) {
      return (
        <div className="mb-6">
          <div className="text-xs text-gray-400 mb-2">Exchange</div>
          <Button
            variant="outline"
            className="w-full bg-gray-900 border-gray-800 hover:bg-gray-800 justify-between"
            onClick={handleAddExchange}
          >
            <div className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-gray-400" />
              <div className="flex flex-col items-start">
                <span className="text-white text-sm">Add Exchange</span>
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
        <div className="text-xs text-gray-400 mb-2">Exchange</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-gray-900 border-gray-800 hover:bg-gray-800 justify-between"
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
                <span className="text-white">{currentExchange.name}</span>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              className="w-[250px] bg-[#1a1a1c]"
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
                          console.error('Binance Testnet Account not found');
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
                        // If no accounts, show message instead of navigating
                        handleAddExchange();
                      }
                    }}
                    className="py-2 cursor-pointer hover:bg-gray-800"
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
                        <span className="text-white text-sm">
                          {exchange.name}
                        </span>
                      </div>
                      {!hasAccounts && (
                        <span className="text-xs text-gray-400">
                          Not connected
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem
                className="cursor-pointer hover:bg-gray-800"
                onClick={handleAddExchange}
              >
                <div className="flex items-center w-full justify-center py-1">
                  <Plus size={16} className="mr-2" />
                  <span>Add Exchange</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
    );
  };

  return renderExchangeSelector();
}
