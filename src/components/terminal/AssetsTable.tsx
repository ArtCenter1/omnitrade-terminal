import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { AssetRow } from '@/components/AssetRow';
import { TradingPair } from './TradingPairSelector';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { getAssetsForTradingPair } from '@/services/exchangeAssetsService';

interface AssetsTableProps {
  selectedPair?: TradingPair;
}

export function AssetsTable({ selectedPair }: AssetsTableProps = {}) {
  const { selectedAccount } = useSelectedAccount();

  // Get exchange-specific assets and prioritize the base and quote assets from the selected pair
  const exchangeAssets = useMemo(() => {
    const exchangeId = selectedAccount?.exchangeId || 'binance';
    const baseAsset = selectedPair?.baseAsset || 'BTC';
    const quoteAsset = selectedPair?.quoteAsset || 'USDT';

    // Get assets specific to the selected exchange and trading pair
    return getAssetsForTradingPair(exchangeId, baseAsset, quoteAsset);
  }, [selectedPair, selectedAccount]);
  return (
    <div className="p-4 border-t border-theme-primary theme-transition">
      <h3 className="text-theme-primary font-medium mb-4">Assets</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-theme-primary">
              <th className="text-left py-2 px-4 text-sm font-medium text-theme-tertiary">
                Asset
              </th>
              <th className="text-left py-2 px-4 text-sm font-medium text-theme-tertiary">
                Available
              </th>
              <th className="text-left py-2 px-4 text-sm font-medium text-theme-tertiary">
                Amount
              </th>
              <th className="text-left py-2 px-4 text-sm font-medium text-theme-tertiary">
                <div className="flex items-center">
                  Value (USD)
                  <Info size={14} className="ml-1 text-theme-tertiary" />
                </div>
              </th>
              <th className="text-left py-2 px-4 text-sm font-medium text-theme-tertiary">
                <div className="flex items-center">
                  Last Price
                  <Info size={14} className="ml-1 text-theme-tertiary" />
                </div>
              </th>
              <th className="text-left py-2 px-4 text-sm font-medium text-theme-tertiary">
                24h Change
              </th>
              <th className="text-left py-2 px-4 text-sm font-medium text-theme-tertiary">
                7d Chart
              </th>
              <th className="text-center py-2 px-4 text-sm font-medium text-theme-tertiary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {exchangeAssets.map((asset, index) => (
              <AssetRow key={index} asset={asset} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
