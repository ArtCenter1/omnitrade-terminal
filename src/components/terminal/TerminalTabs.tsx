import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AssetRow } from '@/components/AssetRow';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { TradingPair } from './TradingPairSelector';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';

interface TerminalTabsProps {
  selectedPair?: TradingPair;
}

export function TerminalTabs({ selectedPair }: TerminalTabsProps = {}) {
  const [activeTab, setActiveTab] = useState('Balances');
  const [showCurrentExchangeOnly, setShowCurrentExchangeOnly] = useState(true);
  const [showCurrentPairOnly, setShowCurrentPairOnly] = useState(false);
  const { selectedAccount } = useSelectedAccount();

  // Get portfolio data for the selected account
  const portfolioData = selectedAccount
    ? getMockPortfolioData(selectedAccount.apiKeyId).data
    : null;

  // Filter assets based on checkboxes
  const filteredAssets = React.useMemo(() => {
    if (!portfolioData || !portfolioData.assets) return [];

    let assets = [...portfolioData.assets];

    // Filter by current pair if checkbox is checked
    if (showCurrentPairOnly && selectedPair) {
      assets = assets.filter(
        (asset) =>
          asset.asset === selectedPair.baseAsset ||
          asset.asset === selectedPair.quoteAsset,
      );
    }

    // Convert to format expected by AssetRow
    return assets.map((asset) => ({
      icon: `/crypto-icons/${asset.asset.toLowerCase()}.svg`,
      name: getAssetName(asset.asset),
      symbol: asset.asset,
      amount: asset.free.toFixed(8),
      value: `$${asset.usdValue.toFixed(2)}`,
      price: `$${(asset.usdValue / asset.total).toFixed(2)}`,
      change: getRandomChange(asset.asset),
      chart: generateChartData(asset.asset),
    }));
  }, [
    portfolioData,
    selectedPair,
    showCurrentExchangeOnly,
    showCurrentPairOnly,
  ]);

  // Helper function to get asset name
  function getAssetName(symbol: string): string {
    const names: Record<string, string> = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      XRP: 'Ripple',
      BNB: 'Binance Coin',
      USDT: 'Tether',
      USDC: 'USD Coin',
      ADA: 'Cardano',
      DOGE: 'Dogecoin',
      DOT: 'Polkadot',
    };
    return names[symbol] || symbol;
  }

  // Helper function to generate random change percentage
  function getRandomChange(symbol: string): string {
    // Use the symbol to generate a consistent random value
    const hash = symbol
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = Math.sin(hash) * 10;
    const change = random.toFixed(2);
    return parseFloat(change) >= 0 ? `+${change}%` : `${change}%`;
  }

  // Helper function to generate chart data
  function generateChartData(symbol: string) {
    // Use the symbol to generate a consistent random value
    const hash = symbol
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isPositive = Math.sin(hash) > 0;

    // Generate 7 data points
    return Array.from({ length: 7 }, (_, i) => {
      const random = Math.sin(hash + i) * 5;
      return { value: 10 + random };
    });
  }

  return (
    <div className="h-full overflow-auto">
      <div className="h-full">
        <div className="flex justify-between items-center px-4 py-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="bg-gray-900 grid grid-cols-6">
              <TabsTrigger value="Balances">Balances</TabsTrigger>
              <TabsTrigger value="OpenOrders">Open Orders</TabsTrigger>
              <TabsTrigger value="OrderHistory">Order History</TabsTrigger>
              <TabsTrigger value="Positions">Positions</TabsTrigger>
              <TabsTrigger value="Transfers">Transfers</TabsTrigger>
              <TabsTrigger value="Trades">Recent Trades</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-6 px-4 py-2 border-t border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Checkbox
              id="currentExchange"
              checked={showCurrentExchangeOnly}
              onCheckedChange={(checked) =>
                setShowCurrentExchangeOnly(checked as boolean)
              }
            />
            <Label htmlFor="currentExchange" className="text-gray-400 text-sm">
              {selectedAccount?.exchange || 'Binance'} Only
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="currentPair"
              checked={showCurrentPairOnly}
              onCheckedChange={(checked) =>
                setShowCurrentPairOnly(checked as boolean)
              }
            />
            <Label htmlFor="currentPair" className="text-gray-400 text-sm">
              {selectedPair?.symbol || 'BTC/USDT'} Only
            </Label>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'Balances' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                      Asset
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                      Available
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                      Value (USD)
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                      Last Price
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                      24h Change
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                      7d Chart
                    </th>
                    <th className="text-center py-2 px-4 text-sm font-medium text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, index) => (
                    <AssetRow key={index} asset={asset} />
                  ))}
                  {filteredAssets.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-gray-400"
                      >
                        No assets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'OpenOrders' && (
            <div className="text-center py-8 text-gray-400">No open orders</div>
          )}

          {activeTab === 'OrderHistory' && (
            <div className="text-center py-8 text-gray-400">
              No order history
            </div>
          )}

          {activeTab === 'Positions' && (
            <div className="text-center py-8 text-gray-400">
              No open positions
            </div>
          )}

          {activeTab === 'Transfers' && (
            <div className="text-center py-8 text-gray-400">
              No recent transfers
            </div>
          )}

          {activeTab === 'Trades' && (
            <div className="text-center py-8 text-gray-400">
              No recent trades
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
