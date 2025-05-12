import React, { useMemo, useEffect, useState } from 'react';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { PortfolioAsset } from '@/types/exchange';
import { TradingPair } from './TradingPairSelector';
import { useBalances } from '@/hooks/useBalances';
import * as optimizedCoinGeckoService from '@/services/optimizedCoinGeckoService';
import { mockDataService } from '@/services/mockData';

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

  // Calculate USD value directly based on the asset type and amount
  let calculatedUsdValue = usdValue;

  // If USD value is 0, calculate it based on the asset type
  if (usdValue === 0) {
    if (
      assetSymbol === 'USDT' ||
      assetSymbol === 'USDC' ||
      assetSymbol === 'BUSD' ||
      assetSymbol === 'DAI'
    ) {
      calculatedUsdValue = amountValue; // Stablecoins are 1:1 with USD
    } else if (assetSymbol === 'BTC') {
      calculatedUsdValue = amountValue * 30000; // Approximate BTC price
    } else {
      calculatedUsdValue = amountValue * 1000; // Default price for other assets
    }
  }

  // Format USD value with 2 decimal places
  const formattedUsdValue = calculatedUsdValue.toFixed(2);

  // Log the values for debugging
  console.log(
    `[BalanceItem] Rendering ${name} with amount=${amountValue}, original usdValue=${usdValue}, calculated=${calculatedUsdValue}, formatted=${formattedUsdValue}`,
  );

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
        <div className="text-xs text-blue-400">= ${formattedUsdValue} USD</div>
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
  const {
    balancesArray,
    isRefreshing,
    refreshBalances,
    lastUpdate,
    error,
    clearError,
  } = useBalances(assetFilter);

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
    // Removed balancesArray from dependencies to prevent infinite loop
  ]);

  // State to store USD prices for assets
  const [assetPrices, setAssetPrices] = useState<Record<string, number>>({});

  // Fetch prices for the assets
  useEffect(() => {
    const fetchPrices = async () => {
      console.log('[AvailableBalances] Starting to fetch prices for assets');
      console.log('[AvailableBalances] Current balances:', balancesArray);

      const prices: Record<string, number> = {};

      // Only fetch prices if we have balances
      if (balancesArray.length > 0) {
        console.log(
          `[AvailableBalances] Fetching prices for ${balancesArray.length} assets`,
        );

        // Set immediate default prices for stablecoins and BTC
        balancesArray.forEach((balance) => {
          if (['USDT', 'USDC', 'BUSD', 'DAI'].includes(balance.asset)) {
            prices[balance.asset] = 1;
            console.log(
              `[AvailableBalances] Set default price for stablecoin ${balance.asset}: $1`,
            );
          } else if (balance.asset === 'BTC') {
            prices[balance.asset] = 30000;
            console.log(
              `[AvailableBalances] Set default price for BTC: $30000`,
            );
          }
        });

        // Apply these default prices immediately
        setAssetPrices({ ...prices });
        console.log('[AvailableBalances] Set initial default prices:', prices);

        // Then try to get more accurate prices
        for (const balance of balancesArray) {
          try {
            console.log(
              `[AvailableBalances] Fetching price for ${balance.asset}...`,
            );

            // Skip CoinGecko for stablecoins
            if (['USDT', 'USDC', 'BUSD', 'DAI'].includes(balance.asset)) {
              prices[balance.asset] = 1;
              console.log(
                `[AvailableBalances] Using fixed price for stablecoin ${balance.asset}: $1`,
              );
              continue;
            }

            // For BTC, try to get price but use fallback
            if (balance.asset === 'BTC') {
              try {
                // Try to get price from CoinGecko
                const price = await optimizedCoinGeckoService.getCurrentPrice(
                  balance.asset,
                  'usd',
                );

                if (price > 0) {
                  prices[balance.asset] = price;
                  console.log(
                    `[AvailableBalances] Got CoinGecko price for BTC: $${price}`,
                  );
                } else {
                  // Use a realistic fallback price for BTC
                  prices[balance.asset] = 30000;
                  console.log(
                    `[AvailableBalances] Using fallback price for BTC: $30000`,
                  );
                }
              } catch (error) {
                console.error(
                  `[AvailableBalances] Error fetching BTC price:`,
                  error,
                );
                prices[balance.asset] = 30000;
                console.log(
                  `[AvailableBalances] Using fallback price for BTC after error: $30000`,
                );
              }
              continue;
            }

            // For other assets, try CoinGecko first
            try {
              // Try to get price from CoinGecko
              const price = await optimizedCoinGeckoService.getCurrentPrice(
                balance.asset,
                'usd',
              );

              // If CoinGecko fails, use mock data service as fallback
              if (price === 0) {
                console.log(
                  `[AvailableBalances] CoinGecko returned 0 price for ${balance.asset}, using mockDataService`,
                );
                // Use mock data service to get a realistic price
                try {
                  const mockPrice = mockDataService.getCurrentPrice(
                    selectedAccount?.exchangeId || 'binance_testnet',
                    `${balance.asset}/USDT`,
                  );
                  prices[balance.asset] = mockPrice;
                  console.log(
                    `[AvailableBalances] Got mock price for ${balance.asset}: $${mockPrice}`,
                  );
                } catch (mockError) {
                  console.error(
                    `[AvailableBalances] Error getting mock price for ${balance.asset}:`,
                    mockError,
                  );
                  // Use a default price
                  prices[balance.asset] = 1000;
                  console.log(
                    `[AvailableBalances] Using default price for ${balance.asset}: $1000`,
                  );
                }
              } else {
                prices[balance.asset] = price;
                console.log(
                  `[AvailableBalances] Got CoinGecko price for ${balance.asset}: $${price}`,
                );
              }
            } catch (error) {
              console.error(
                `[AvailableBalances] Error fetching price for ${balance.asset}:`,
                error,
              );
              // Use fallback price
              prices[balance.asset] = 1000;
              console.log(
                `[AvailableBalances] Using fallback price after error for ${balance.asset}: $1000`,
              );
            }
          } catch (outerError) {
            console.error(
              `[AvailableBalances] Outer error for ${balance.asset}:`,
              outerError,
            );
            prices[balance.asset] = balance.asset === 'USDT' ? 1 : 1000;
          }

          // Update prices after each asset to show progress
          setAssetPrices({ ...prices });
        }

        console.log('[AvailableBalances] Final prices:', prices);
        setAssetPrices(prices);
      } else {
        console.log('[AvailableBalances] No balances to fetch prices for');
      }
    };

    fetchPrices();
  }, [balancesArray, selectedAccount]);

  // Convert balance data to portfolio assets format
  const assets = useMemo(() => {
    console.log(
      '[AvailableBalances] Creating assets from balances with prices:',
      assetPrices,
    );

    const result = balancesArray.map((balance) => {
      // Calculate USD value based on price and total balance
      const price = assetPrices[balance.asset] || 0;
      const usdValue = balance.total * price;

      console.log(
        `[AvailableBalances] Asset ${balance.asset}: balance=${balance.total}, price=$${price}, usdValue=$${usdValue}`,
      );

      return {
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked,
        total: balance.total,
        available: balance.available,
        usdValue: usdValue,
        exchangeId: selectedAccount?.exchangeId || 'unknown',
        exchangeSources: [
          {
            exchangeId: selectedAccount?.exchangeId || 'unknown',
            amount: balance.total,
          },
        ],
      };
    });

    console.log('[AvailableBalances] Final assets with USD values:', result);
    return result;
  }, [balancesArray, selectedAccount, assetPrices]);

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

    // Get prices for default assets if they don't exist
    const baseAssetPrice =
      assetPrices[baseAsset] ||
      (baseAsset === 'USDT' ? 1 : baseAsset === 'BTC' ? 30000 : 1000);
    const quoteAssetPrice =
      assetPrices[quoteAsset] ||
      (quoteAsset === 'USDT' ? 1 : quoteAsset === 'BTC' ? 30000 : 1000);

    console.log(
      `[AvailableBalances] Base asset ${baseAsset} price: $${baseAssetPrice}`,
    );
    console.log(
      `[AvailableBalances] Quote asset ${quoteAsset} price: $${quoteAssetPrice}`,
    );

    // Calculate default USD values
    const baseDefaultValue = getDefaultValue(baseAsset);
    const quoteDefaultValue = getDefaultValue(quoteAsset);
    const baseUsdValue = baseDefaultValue * baseAssetPrice;
    const quoteUsdValue = quoteDefaultValue * quoteAssetPrice;

    console.log(
      `[AvailableBalances] Base asset ${baseAsset} default value: ${baseDefaultValue}, USD value: $${baseUsdValue}`,
    );
    console.log(
      `[AvailableBalances] Quote asset ${quoteAsset} default value: ${quoteDefaultValue}, USD value: $${quoteUsdValue}`,
    );

    // Always add base asset (first)
    result.push(
      existingBaseAsset || {
        asset: baseAsset,
        free: baseDefaultValue,
        locked: 0,
        total: baseDefaultValue,
        usdValue: baseUsdValue,
        exchangeId: selectedAccount?.exchangeId || 'unknown',
      },
    );

    // Always add quote asset (second)
    result.push(
      existingQuoteAsset || {
        asset: quoteAsset,
        free: quoteDefaultValue,
        locked: 0,
        total: quoteDefaultValue,
        usdValue: quoteUsdValue,
        exchangeId: selectedAccount?.exchangeId || 'unknown',
      },
    );

    console.log('[AvailableBalances] Filtered assets result:', result);
    return result;
  }, [assets, selectedPair, selectedAccount, assetPrices]);

  // Display error message if there is one
  if (error) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs">Available Balances</div>
          <button
            onClick={() => {
              clearError();
              refreshBalances();
            }}
            className="text-xs text-gray-500 hover:text-white flex items-center"
            title="Retry"
          >
            <RefreshCw size={12} className="mr-1" />
            Retry
          </button>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded p-2 mb-2">
          <div className="flex items-start">
            <AlertTriangle className="text-red-500 w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-300">{error}</div>
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

  // Log the final filtered assets before rendering
  console.log(
    '[AvailableBalances] Rendering with filtered assets:',
    filteredAssets,
  );

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
            onClick={() => {
              console.log('[AvailableBalances] Manual refresh clicked');
              refreshBalances();
            }}
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
        {filteredAssets.map((asset) => {
          console.log(
            `[AvailableBalances] Rendering asset ${asset.asset} with USD value: $${asset.usdValue}`,
          );
          return (
            <BalanceItem
              key={asset.asset}
              icon={getIconUrl(asset.asset)}
              name={asset.asset}
              amount={`${asset.total.toFixed(2)} ${asset.asset}`}
              usdValue={asset.usdValue}
            />
          );
        })}
      </div>
    </div>
  );
}
