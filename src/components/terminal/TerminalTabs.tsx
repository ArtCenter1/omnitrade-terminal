import React, { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { TerminalTabsList, TerminalTabsTrigger } from './TerminalTabsList';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AssetRow } from '@/components/AssetRow';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { TradingPair } from './TradingPairSelector';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { OrdersTable } from './OrdersTable';

interface TerminalTabsProps {
  selectedPair?: TradingPair;
  refreshTrigger?: number;
}

// Define sorting types
type SortField = 'asset' | 'amount' | 'value' | 'price' | 'change';
type SortDirection = 'asc' | 'desc';

export function TerminalTabs({
  selectedPair,
  refreshTrigger = 0,
}: TerminalTabsProps = {}) {
  const [activeTab, setActiveTab] = useState('Balances');
  const [showCurrentExchangeOnly, setShowCurrentExchangeOnly] = useState(true);
  const [showCurrentPairOnly, setShowCurrentPairOnly] = useState(false);
  const { selectedAccount } = useSelectedAccount();

  // Add sorting state
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get portfolio data for the selected account
  const portfolioData = selectedAccount
    ? getMockPortfolioData(selectedAccount.apiKeyId).data
    : null;

  // Filter and sort assets based on checkboxes and sort state
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
    const formattedAssets = assets.map((asset) => {
      // Calculate price from value and total
      const price = asset.total > 0 ? asset.usdValue / asset.total : 0;

      return {
        icon: `/crypto-icons/${asset.asset.toLowerCase()}.svg`,
        name: getAssetName(asset.asset),
        symbol: asset.asset,
        amount: asset.total.toFixed(8),
        value: `$${asset.usdValue.toFixed(2)}`,
        price: `$${price.toFixed(2)}`,
        change: getRandomChange(asset.asset),
        chart: generateChartData(asset.asset),
        // Store raw values for sorting
        _rawAmount: asset.total,
        _rawValue: asset.usdValue,
        _rawPrice: price,
        _rawChange: parseFloat(getRandomChange(asset.asset).replace('%', '')),
      };
    });

    // Sort the assets based on the current sort field and direction
    const sortedAssets = [...formattedAssets].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'asset':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'amount':
          comparison = a._rawAmount - b._rawAmount;
          break;
        case 'value':
          comparison = a._rawValue - b._rawValue;
          break;
        case 'price':
          comparison = a._rawPrice - b._rawPrice;
          break;
        case 'change':
          comparison = a._rawChange - b._rawChange;
          break;
        default:
          comparison = a._rawValue - b._rawValue;
      }

      // Reverse the comparison if sorting in descending order
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sortedAssets;
  }, [
    portfolioData,
    selectedPair,
    showCurrentExchangeOnly,
    showCurrentPairOnly,
    sortField,
    sortDirection,
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

  // Handle sorting when a column header is clicked
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, sort by the new field in descending order by default
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Render sort indicator for column headers
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;

    return sortDirection === 'asc' ? (
      <ChevronUp className="inline ml-1" size={14} />
    ) : (
      <ChevronDown className="inline ml-1" size={14} />
    );
  };

  return (
    <div className="h-full">
      <div className="h-full">
        <div className="px-4 py-2 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="flex items-center justify-between w-full">
                  <TerminalTabsList className="flex">
                    <TerminalTabsTrigger value="Balances">
                      Balances
                    </TerminalTabsTrigger>
                    <TerminalTabsTrigger value="OpenOrders">
                      Open Orders
                    </TerminalTabsTrigger>
                    <TerminalTabsTrigger value="OrderHistory">
                      Order History
                    </TerminalTabsTrigger>
                    <TerminalTabsTrigger value="Positions">
                      Positions
                    </TerminalTabsTrigger>
                    <TerminalTabsTrigger value="Transfers">
                      Transfers
                    </TerminalTabsTrigger>
                    <TerminalTabsTrigger value="Trades">
                      Recent Trades
                    </TerminalTabsTrigger>
                  </TerminalTabsList>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="currentExchange"
                        checked={showCurrentExchangeOnly}
                        onCheckedChange={(checked) =>
                          setShowCurrentExchangeOnly(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="currentExchange"
                        className="text-gray-400 text-sm"
                      >
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
                      <Label
                        htmlFor="currentPair"
                        className="text-gray-400 text-sm"
                      >
                        {selectedPair?.symbol || 'BTC/USDT'} Only
                      </Label>
                    </div>
                  </div>
                </div>
              </Tabs>
            </div>
          </div>
        </div>

        <div
          className="p-4 overflow-auto"
          style={{ height: 'calc(100% - 45px)' }}
        >
          {activeTab === 'Balances' && (
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th
                      className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                      onClick={() => handleSort('asset')}
                    >
                      Asset {renderSortIndicator('asset')}
                    </th>
                    <th
                      className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                      onClick={() => handleSort('amount')}
                    >
                      Available Amount {renderSortIndicator('amount')}
                    </th>
                    <th
                      className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                      onClick={() => handleSort('value')}
                    >
                      Value (USD) {renderSortIndicator('value')}
                    </th>
                    <th
                      className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                      onClick={() => handleSort('price')}
                    >
                      Last Price {renderSortIndicator('price')}
                    </th>
                    <th
                      className="text-left py-2 px-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                      onClick={() => handleSort('change')}
                    >
                      24h Change {renderSortIndicator('change')}
                    </th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                      7d Chart
                    </th>
                    <th className="text-center py-2 px-2 text-sm font-medium text-gray-400">
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

          {(activeTab === 'OpenOrders' || activeTab === 'OrderHistory') && (
            <OrdersTable
              selectedSymbol={selectedPair?.symbol}
              refreshTrigger={refreshTrigger}
              initialTab={activeTab === 'OpenOrders' ? 'open' : 'history'}
              showTabs={false}
            />
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
