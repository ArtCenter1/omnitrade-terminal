import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { Settings } from 'lucide-react';

export function SandboxNetworkSelector() {
  const { selectedAccount } = useSelectedAccount();
  const [selectedNetwork, setSelectedNetwork] = useState<string>('binance');

  // Load the selected network from localStorage on component mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('sandbox_test_network');
    if (savedNetwork && ['binance', 'coinbase'].includes(savedNetwork)) {
      setSelectedNetwork(savedNetwork);
    }
  }, []);

  // Only show this component for sandbox accounts
  if (!selectedAccount?.isSandbox) {
    return null;
  }

  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network);
    localStorage.setItem('sandbox_test_network', network);
    
    // Reload the page to apply the changes
    // This is a simple approach - in a more sophisticated implementation,
    // we could use an event system to notify components of the change
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Sandbox Network</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="text-xs font-semibold text-gray-400 px-2 py-1">
          Test Network
        </div>
        <DropdownMenuItem
          className={selectedNetwork === 'binance' ? 'bg-gray-800' : ''}
          onClick={() => handleNetworkChange('binance')}
        >
          Binance Test
        </DropdownMenuItem>
        <DropdownMenuItem
          className={selectedNetwork === 'coinbase' ? 'bg-gray-800' : ''}
          onClick={() => handleNetworkChange('coinbase')}
        >
          Coinbase Test
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
