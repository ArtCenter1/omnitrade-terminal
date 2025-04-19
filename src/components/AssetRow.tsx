import { Button } from '@/components/ui/button';
import { AssetChart } from './AssetChart';
import { Asset } from '@/lib/utils';
import { generateChartData } from '@/lib/utils';
import { useState } from 'react';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { ExchangeSource } from '@/types/exchange';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_MOCK_ACCOUNTS } from '@/mocks/mockExchangeAccounts';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Map of common cryptocurrency symbols to their CoinGecko IDs
const COINGECKO_ICON_MAP: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/thumb/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/thumb/Avalanche_Circle_RedWhite_Trans.png',
  MATIC:
    'https://assets.coingecko.com/coins/images/4713/thumb/matic-token-icon.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/thumb/polkadot.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png',
};

// Function to get CoinGecko icon URL for a given symbol
const getCoinGeckoIconUrl = (symbol: string | undefined): string => {
  if (!symbol) return '/placeholder.svg';

  const upperSymbol = symbol.toUpperCase();
  return (
    COINGECKO_ICON_MAP[upperSymbol] ||
    `/crypto-icons/${symbol.toLowerCase()}.svg`
  );
};

// Define a type that can handle both the new Asset type and the legacy asset type
type AssetRowProps = {
  asset:
    | Asset
    | {
        icon?: string;
        name: string;
        symbol: string;
        amount: string;
        value: string;
        price: string;
        change: string;
        exchangeInfo?: string; // For Portfolio Overview
        chartData?: any[]; // For chart data
      };
};

export function AssetRow({ asset }: AssetRowProps) {
  const [imgError, setImgError] = useState(false);
  const [isTradePopoverOpen, setIsTradePopoverOpen] = useState(false);
  const { selectedAccount, setSelectedAccount } = useSelectedAccount();
  const isPortfolioTotal = selectedAccount?.isPortfolioOverview === true;
  const navigate = useNavigate();

  // Safety check - if asset is null or undefined, render an empty row
  if (!asset) {
    return (
      <tr className="border-b border-gray-800">
        <td colSpan={7} className="py-4 px-4 text-center text-gray-500">
          Asset data unavailable
        </td>
      </tr>
    );
  }

  // Check if the asset is the new type (with numeric values) or the legacy type (with string values)
  const isNewAssetType = typeof asset.amount === 'number';

  // Determine if the change is positive (with null safety)
  let isPositive = false;
  try {
    isPositive = isNewAssetType
      ? ((asset as Asset).change || 0) >= 0
      : !String(asset.change || '').includes('-');
  } catch (e) {
    console.error('Error determining if change is positive:', e);
  }

  // Get chart data - either from the asset or generate it (with null safety)
  let chartData = [];
  try {
    if (isNewAssetType) {
      // For new asset type, use chart or chartData property
      chartData = (asset as Asset).chart || (asset as any).chartData || [];
    } else {
      // For legacy asset type, use chart property or generate data
      chartData = (asset as any).chart || generateChartData(isPositive);
    }
  } catch (e) {
    console.error('Error generating chart data:', e);
  }

  // Get the icon URL (with null safety)
  let iconUrl = '/placeholder.svg';
  try {
    iconUrl = isNewAssetType
      ? getCoinGeckoIconUrl(asset.symbol)
      : (asset as any).icon || getCoinGeckoIconUrl(asset.symbol);
  } catch (e) {
    console.error('Error getting icon URL:', e);
  }

  // Handle image errors
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    try {
      // Try crypto-icons folder as fallback
      if (!imgError) {
        setImgError(true);
        e.currentTarget.src = `/crypto-icons/${asset.symbol?.toLowerCase() || 'placeholder'}.svg`;
      } else {
        // Final fallback
        e.currentTarget.src = '/placeholder.svg';
        e.currentTarget.onerror = null; // Prevent infinite loop
      }
    } catch (err) {
      console.error('Error in image error handler:', err);
      try {
        e.currentTarget.src = '/placeholder.svg';
        e.currentTarget.onerror = null;
      } catch (finalErr) {
        console.error('Final error handler failed:', finalErr);
      }
    }
  };

  return (
    <tr className="border-b border-gray-800">
      <td className="py-3 px-2 flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full overflow-hidden">
          <img
            src={iconUrl}
            alt={asset.name || 'Unknown'}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </div>
        <div>
          <div className="font-medium text-gray-300">
            {asset.name || 'Unknown'}
          </div>
          <div className="text-xs text-gray-400">{asset.symbol || '---'}</div>
        </div>
      </td>
      {!isPortfolioTotal && (asset as any).exchangeInfo && (
        <td className="py-3 px-2 text-gray-400 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full overflow-hidden mr-1">
              <img
                src={`/exchanges/${(asset as any).exchangeInfo}.svg`}
                alt={(asset as any).exchangeInfo}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                  e.currentTarget.onerror = null;
                }}
              />
            </div>
            <span className="capitalize">{(asset as any).exchangeInfo}</span>
          </div>
        </td>
      )}
      <td className="py-3 px-2 text-gray-300">
        <div className="font-medium text-gray-300">
          {isNewAssetType
            ? (asset as Asset).amount !== undefined
              ? (asset as Asset).amount.toFixed(2)
              : '0.00'
            : asset.amount || '0.00'}
        </div>
        <div className="text-xs text-gray-400">
          $
          {isNewAssetType &&
          (asset as Asset).amount !== undefined &&
          (asset as Asset).price !== undefined
            ? ((asset as Asset).amount * (asset as Asset).price).toFixed(2)
            : '0.00'}
        </div>
      </td>
      <td className="py-3 px-2 text-gray-300">
        {isNewAssetType && (asset as Asset).value !== undefined
          ? `$${(asset as Asset).value.toFixed(2)}`
          : asset.value || '$0.00'}
      </td>
      <td className="py-3 px-2 text-gray-300">
        {isNewAssetType && (asset as Asset).price !== undefined
          ? `$${(asset as Asset).price.toFixed(2)}`
          : asset.price || '$0.00'}
      </td>
      <td className="py-3 px-2">
        <span
          className={`text-sm ${isPositive ? 'text-crypto-green' : 'text-crypto-red'}`}
        >
          {isNewAssetType && (asset as Asset).change !== undefined
            ? `${isPositive ? '+' : ''}${
                typeof (asset as Asset).change === 'number'
                  ? (asset as Asset).change.toFixed(2)
                  : (asset as Asset).change
              }%`
            : asset.change || '0.00%'}
        </span>
      </td>
      <td className="py-3 px-2 min-w-[120px] h-[50px]">
        <AssetChart data={chartData} isPositive={isPositive} />
      </td>
      <td className="py-3 px-2">
        <Popover open={isTradePopoverOpen} onOpenChange={setIsTradePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="border-gray-600 hover:bg-gray-800 text-xs rounded"
            >
              TRADE
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto min-w-[200px] max-w-[300px] bg-gray-900 border border-gray-700 p-0 rounded-md shadow-lg z-50">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {isPortfolioTotal && (asset as any).exchangeSources ? (
                <div className="space-y-1">
                  {(asset as any).exchangeSources.map(
                    (source: ExchangeSource) => (
                      <div
                        key={source.exchangeId}
                        className="flex items-center justify-between p-2 hover:bg-gray-800 cursor-pointer transition-colors duration-150"
                        onClick={() => {
                          // Find the account for this exchange from the imported DEFAULT_MOCK_ACCOUNTS
                          const account = DEFAULT_MOCK_ACCOUNTS.find(
                            (acc) => acc.exchangeId === source.exchangeId,
                          );

                          if (account) {
                            console.log(
                              `Selected exchange ${source.exchangeId} for trading ${asset.symbol}`,
                            );

                            // Set the selected account to this exchange
                            setSelectedAccount(account);

                            // Navigate to the terminal with this exchange and asset selected
                            navigate(
                              `/terminal?symbol=${asset.symbol}/USDT&exchange=${source.exchangeId}`,
                            );

                            // Close the popover
                            setIsTradePopoverOpen(false);
                          } else {
                            console.error(
                              `Could not find account for exchange ${source.exchangeId}`,
                            );
                            alert(
                              `Could not find account for exchange ${source.exchangeId}. Please try another exchange.`,
                            );
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                            <img
                              src={`/exchanges/${source.exchangeId}.svg`}
                              alt={source.exchangeId}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                                e.currentTarget.onerror = null;
                              }}
                            />
                          </div>
                          <span className="capitalize text-gray-300">
                            {source.exchangeId}
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {source.amount.toFixed(2)} {asset.symbol}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div
                  className="p-2 hover:bg-gray-800 cursor-pointer transition-colors duration-150"
                  onClick={() => {
                    // Navigate to the terminal with this exchange and asset selected
                    navigate(
                      `/terminal?symbol=${asset.symbol}/USDT&exchange=${selectedAccount?.exchangeId}`,
                    );

                    // Close the popover
                    setIsTradePopoverOpen(false);
                  }}
                >
                  <div className="text-center text-gray-300 font-medium">
                    Trade {asset.symbol} on {selectedAccount?.name}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </td>
    </tr>
  );
}
