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
  usdValue: number;
}

function BalanceItem({ icon, name, amount, usdValue }: BalanceItemProps) {
  // Parse the amount to check if it's zero
  const amountValue = parseFloat(amount.split(' ')[0]);
  const isZero = amountValue === 0;
  const assetSymbol = amount.split(' ')[1] || name;

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
        <span className="text-white">{assetSymbol}</span>
      </div>
      <div className="flex flex-col items-end">
        <div className="text-white">{amountValue.toFixed(2)}</div>
        <div className="text-xs text-blue-400">
          = ${usdValue.toFixed(2)} USD
        </div>
      </div>
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

  // Create or filter assets to show both base and quote assets from the selected pair
  const filteredAssets = useMemo(() => {
    if (!selectedPair) return [];

    const baseAsset = selectedPair.baseAsset;
    const quoteAsset = selectedPair.quoteAsset;

    // Find existing assets in the user's portfolio
    const existingBaseAsset = assets.find((asset) => asset.asset === baseAsset);
    const existingQuoteAsset = assets.find(
      (asset) => asset.asset === quoteAsset,
    );

    // Create array with both assets, using zero values if not found
    const result = [];

    // Always add base asset (first)
    result.push(
      existingBaseAsset || {
        asset: baseAsset,
        free: 0,
        locked: 0,
        total: 0,
        usdValue: 0,
        exchangeId: selectedAccount?.exchangeId || 'unknown',
      },
    );

    // Always add quote asset (second)
    result.push(
      existingQuoteAsset || {
        asset: quoteAsset,
        free: 0,
        locked: 0,
        total: 0,
        usdValue: 0,
        exchangeId: selectedAccount?.exchangeId || 'unknown',
      },
    );

    return result;
  }, [assets, selectedPair, selectedAccount]);

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

  if (!selectedPair) {
    return (
      <div className="mb-6">
        <div className="text-gray-400 mb-2 text-xs">Available Balances</div>
        <div className="text-gray-400 text-sm text-center py-2">
          No trading pair selected
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
            amount={`${asset.free.toFixed(2)} ${asset.asset}`}
            usdValue={asset.usdValue}
          />
        ))}
      </div>
    </div>
  );
}
