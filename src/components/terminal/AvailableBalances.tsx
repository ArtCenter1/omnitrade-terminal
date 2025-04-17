import React, { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';
import { PortfolioAsset } from '@/types/exchange';
import { TradingPair } from './TradingPairSelector';

interface BalanceItemProps {
  icon: string;
  name: string;
  amount: string;
}

function BalanceItem({ icon, name, amount }: BalanceItemProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
          <img
            src={icon}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        <span className="text-white">{name}</span>
      </div>
      <div className="text-white">{amount}</div>
    </div>
  );
}

interface AvailableBalancesProps {
  selectedPair?: TradingPair;
}

export function AvailableBalances({
  selectedPair,
}: AvailableBalancesProps = {}) {
  const { selectedAccount } = useSelectedAccount();
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get crypto icons from CoinGecko or use placeholders
  const getIconUrl = (symbol: string) => {
    return `/crypto-icons/${symbol.toLowerCase()}.svg`;
  };

  // Filter assets to only show the base and quote assets from the selected pair
  const filteredAssets = useMemo(() => {
    if (!selectedPair || assets.length === 0) return [];

    const baseAsset = selectedPair.baseAsset;
    const quoteAsset = selectedPair.quoteAsset;

    return assets
      .filter(
        (asset) => asset.asset === baseAsset || asset.asset === quoteAsset,
      )
      .sort((a, b) => {
        if (a.asset === baseAsset && b.asset !== baseAsset) return -1;
        if (a.asset !== baseAsset && b.asset === baseAsset) return 1;
        return 0; // Base asset first, quote asset second
      });
  }, [assets, selectedPair]);

  useEffect(() => {
    if (selectedAccount) {
      setIsLoading(true);
      // Get portfolio data for the selected account
      const portfolioData = getMockPortfolioData(selectedAccount.apiKeyId);

      if (portfolioData.data && portfolioData.data.assets) {
        // Sort assets by USD value (descending)
        const sortedAssets = [...portfolioData.data.assets].sort(
          (a, b) => b.usdValue - a.usdValue,
        );
        setAssets(sortedAssets);
      } else {
        setAssets([]);
      }
      setIsLoading(false);
    }
  }, [selectedAccount]);

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="text-gray-400 mb-2 text-xs">Available Balances</div>
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!selectedAccount || assets.length === 0) {
    return (
      <div className="mb-6">
        <div className="text-gray-400 mb-2 text-xs">Available Balances</div>
        <div className="text-gray-400 text-sm text-center py-2">
          No balances available
        </div>
      </div>
    );
  }

  if (!selectedPair || filteredAssets.length === 0) {
    return (
      <div className="mb-6">
        <div className="text-gray-400 mb-2 text-xs">Available Balances</div>
        <div className="text-gray-400 text-sm text-center py-2">
          No balances for selected pair
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="text-gray-400 mb-2 text-xs">Available Balances</div>
      <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
        {filteredAssets.map((asset) => (
          <BalanceItem
            key={asset.asset}
            icon={getIconUrl(asset.asset)}
            name={asset.asset}
            amount={asset.free.toFixed(8)}
          />
        ))}
      </div>
    </div>
  );
}
