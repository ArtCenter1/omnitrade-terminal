import React, { useMemo, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { PortfolioAsset } from '@/types/exchange';
import { TradingPair } from './TradingPairSelector';
import { useBalances } from '@/hooks/useBalances';

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
    <div className="flex justify-between items-center py-0.5">
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-full overflow-hidden mr-1">
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
        <span className="text-white text-sm">{assetSymbol}</span>
      </div>
      <div className="flex flex-col items-end">
        <div className="text-white text-sm">{amountValue.toFixed(2)}</div>
        <div className="text-xs text-blue-400">
          = ${usdValue.toFixed(2)} USD
        </div>
      </div>
    </div>
  );
}

interface AvailableBalancesProps {
  selectedPair?: TradingPair;
  refreshTrigger?: number;
}

export function AvailableBalances({
  selectedPair,
  refreshTrigger = 0,
}: AvailableBalancesProps = {}) {
  const { selectedAccount } = useSelectedAccount();
  const [forceRefresh, setForceRefresh] = useState(0);

  // Get crypto icons from CoinGecko or use placeholders
  const getIconUrl = (symbol: string) => {
    return `/crypto-icons/${symbol.toLowerCase()}.svg`;
  };

  // Get the asset symbols from the selected pair
  const assetFilter = useMemo(() => {
    if (!selectedPair) return [];
    return [selectedPair.baseAsset, selectedPair.quoteAsset];
  }, [selectedPair]);

  // Use our new hook to get real-time balance data
  const { balancesArray, isRefreshing, refreshBalances, lastUpdate } =
    useBalances(assetFilter);

  // Force a refresh when the component mounts or when the selected pair changes
  useEffect(() => {
    console.log(
      '[AvailableBalances] Selected pair changed, refreshing balances',
    );
    console.log('[AvailableBalances] Selected pair:', selectedPair);
    console.log('[AvailableBalances] Selected account:', selectedAccount);

    // Log the current state of balances before refresh
    console.log(
      '[AvailableBalances] Current balances before refresh:',
      balancesArray,
    );

    // Refresh balances
    refreshBalances();

    // Also refresh when refreshTrigger changes
  }, [
    selectedPair,
    refreshTrigger,
    refreshBalances,
    selectedAccount,
    balancesArray,
  ]);

  // Convert balance data to portfolio assets format
  const assets = useMemo(() => {
    return balancesArray.map((balance) => ({
      asset: balance.asset,
      free: balance.free,
      locked: balance.locked,
      total: balance.total,
      available: balance.available,
      usdValue: 0, // We don't have USD values yet, will need to add price data integration
      exchangeId: selectedAccount?.exchangeId || 'unknown',
      exchangeSources: [
        {
          exchangeId: selectedAccount?.exchangeId || 'unknown',
          amount: balance.total,
        },
      ],
    }));
  }, [balancesArray, selectedAccount]);

  // Create or filter assets to show both base and quote assets from the selected pair
  const filteredAssets = useMemo(() => {
    if (!selectedPair) return [];

    const baseAsset = selectedPair.baseAsset;
    const quoteAsset = selectedPair.quoteAsset;

    console.log('[AvailableBalances] Filtering assets for pair:', selectedPair);
    console.log('[AvailableBalances] Available assets:', assets);

    // Find existing assets in the user's portfolio
    const existingBaseAsset = assets.find((asset) => asset.asset === baseAsset);
    const existingQuoteAsset = assets.find(
      (asset) => asset.asset === quoteAsset,
    );

    console.log('[AvailableBalances] Found base asset:', existingBaseAsset);
    console.log('[AvailableBalances] Found quote asset:', existingQuoteAsset);

    // Create array with both assets, using default values if not found
    const result = [];

    // Default values based on asset type
    const getDefaultValue = (asset: string) => {
      if (
        asset === 'USDT' ||
        asset === 'USDC' ||
        asset === 'BUSD' ||
        asset === 'DAI'
      ) {
        return 50000.0; // Default stablecoin amount
      } else if (asset === 'BTC') {
        return 0.1; // Default BTC amount
      } else if (asset === 'ETH') {
        return 1.0; // Default ETH amount
      } else {
        return 10.0; // Default for other assets
      }
    };

    // Always add base asset (first)
    result.push(
      existingBaseAsset || {
        asset: baseAsset,
        free: getDefaultValue(baseAsset),
        locked: 0,
        total: getDefaultValue(baseAsset),
        usdValue: 0,
        exchangeId: selectedAccount?.exchangeId || 'unknown',
      },
    );

    // Always add quote asset (second)
    result.push(
      existingQuoteAsset || {
        asset: quoteAsset,
        free: getDefaultValue(quoteAsset),
        locked: 0,
        total: getDefaultValue(quoteAsset),
        usdValue: 0,
        exchangeId: selectedAccount?.exchangeId || 'unknown',
      },
    );

    console.log('[AvailableBalances] Filtered assets result:', result);
    return result;
  }, [assets, selectedPair, selectedAccount]);

  if (isRefreshing) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs">Available Balances</div>
          <div className="text-xs text-gray-500">Refreshing...</div>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs">Available Balances</div>
          <button
            onClick={refreshBalances}
            className="text-xs text-gray-500 hover:text-white flex items-center"
            title="Refresh balances"
          >
            <RefreshCw size={12} className="mr-1" />
            Refresh
          </button>
        </div>
        <div className="text-gray-400 text-sm text-center py-2">
          No account selected
        </div>
      </div>
    );
  }

  // If we have a selected account but no assets, show a loading state
  if (assets.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs">Available Balances</div>
          <button
            onClick={refreshBalances}
            className="text-xs text-gray-500 hover:text-white flex items-center"
            title="Refresh balances"
            disabled={isRefreshing}
          >
            <RefreshCw
              size={12}
              className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="text-gray-400 text-sm text-center py-2 flex items-center justify-center">
          {isRefreshing ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Loading balances...
            </>
          ) : (
            <>
              No balances available.
              <button
                onClick={refreshBalances}
                className="ml-2 text-blue-400 hover:text-blue-300 underline"
              >
                Refresh
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!selectedPair) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs">Available Balances</div>
          <button
            onClick={refreshBalances}
            className="text-xs text-gray-500 hover:text-white flex items-center"
            title="Refresh balances"
          >
            <RefreshCw size={12} className="mr-1" />
            Refresh
          </button>
        </div>
        <div className="text-gray-400 text-sm text-center py-2">
          No trading pair selected
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-2">
        <div className="text-gray-400 text-xs">Available Balances</div>
        <div className="flex items-center">
          {lastUpdate && (
            <div
              className="text-xs text-gray-500 mr-2"
              title={lastUpdate.toLocaleString()}
            >
              Updated {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={refreshBalances}
            className="text-xs text-gray-500 hover:text-white flex items-center"
            title="Refresh balances"
            disabled={isRefreshing}
          >
            <RefreshCw
              size={12}
              className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>
      <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
        {filteredAssets.map((asset) => (
          <BalanceItem
            key={asset.asset}
            icon={getIconUrl(asset.asset)}
            name={asset.asset}
            amount={`${asset.total.toFixed(2)} ${asset.asset}`}
            usdValue={asset.usdValue}
          />
        ))}
      </div>
    </div>
  );
}
