import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Account {
  id: string;
  name: string;
  exchange: string;
  value: string;
  change: string;
  logo: string;
}

const MOCK_ACCOUNTS: Account[] = [
  {
    id: "1",
    name: "Binance Artcenter1",
    exchange: "Binance",
    value: "$23,579.83",
    change: "-3.06%",
    logo: "/placeholder.svg"
  },
  {
    id: "2",
    name: "OmniTrade",
    exchange: "Omni",
    value: "$8,784.14",
    change: "+1.94%",
    logo: "/placeholder.svg"
  },
  {
    id: "3",
    name: "Cryptofight Binance",
    exchange: "Binance",
    value: "$12,990.83",
    change: "-0.78%",
    logo: "/placeholder.svg"
  },
  {
    id: "4",
    name: "KuCoin Cryptofight",
    exchange: "KuCoin",
    value: "$2,499.68",
    change: "+1.65%",
    logo: "/placeholder.svg"
  }
];

export function ExchangeAccountSelector() {
  const [selectedAccount, setSelectedAccount] = useState<Account>(MOCK_ACCOUNTS[0]);

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
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-white text-sm">{selectedAccount.name}</span>
                <span className="text-xs text-gray-400">{selectedAccount.value} | {selectedAccount.change}</span>
              </div>
            </div>
            <ChevronDown size={16} className="ml-2 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px] bg-gray-900 border-gray-800">
          {MOCK_ACCOUNTS.map((account) => (
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
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-white text-sm">{account.name}</span>
                  <span className="text-xs text-gray-400">{account.value} | {account.change}</span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-gray-800" />
          <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
            <Button variant="outline" className="w-full border-dashed border-gray-700 bg-gray-800/50 hover:bg-gray-800">
              <Plus size={16} className="mr-2" />
              <span>Add Account</span>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
