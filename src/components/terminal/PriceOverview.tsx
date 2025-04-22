import React, { useState, useEffect } from 'react';
import { TradingPair } from '@/types/trading'; // Corrected import path
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import {
  CoinGeckoTicker,
  getCoinTickers,
} from '@/services/enhancedCoinGeckoService';
import { formatCurrency, formatNumber } from '../../utils/formatUtils'; // Assuming you have formatting utils

interface PriceOverviewProps {
  selectedPair?: TradingPair;
}

export function PriceOverview({
  selectedPair,
  showPriceOnly,
}: PriceOverviewProps & { showPriceOnly?: boolean } = {}) {
  const { selectedAccount } = useSelectedAccount();
  const [marketData, setMarketData] = useState<CoinGeckoTicker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Function to fetch ticker data
    const fetchTickerData = async () => {
      // Ensure we have the necessary data before fetching
      if (
        !selectedPair?.baseAsset ||
        !selectedPair?.quoteAsset ||
        !selectedAccount?.exchangeId
      ) {
        setMarketData(null); // Clear data if essential info is missing
        setIsLoading(false); // Not loading if we can't fetch
        setError(null); // Clear any previous error
        console.log(
          'PriceOverview: Missing selectedPair or selectedAccount info, skipping fetch.',
        );
        return;
      }

      // Avoid fetching if exchangeId is 'all_exchanges' or similar placeholder
      if (
        selectedAccount.exchangeId.toLowerCase() === 'all' ||
        selectedAccount.exchangeId.toLowerCase() === 'all_exchanges'
      ) {
        setMarketData(null);
        setIsLoading(false);
        setError('Select a specific exchange account.');
        console.log('PriceOverview: "All Exchanges" selected, skipping fetch.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use baseAsset as coinId (service handles symbol->id mapping)
        // Use selectedAccount.exchangeId
        const coinId = selectedPair.baseAsset; // e.g., 'BTC'
        const exchangeId = selectedAccount.exchangeId; // e.g., 'kraken'
        const quoteAssetLower = selectedPair.quoteAsset.toLowerCase(); // e.g., 'usdt'

        console.log(
          `PriceOverview: Fetching ticker for ${coinId}/${quoteAssetLower} on ${exchangeId}`,
        );

        // Fetch tickers for the base coin on the specific exchange
        const response = await getCoinTickers(coinId, [exchangeId]);

        // Find the specific ticker matching the quote asset and ensure market identifier matches
        const specificTicker = response.tickers.find(
          (ticker) =>
            ticker.base.toLowerCase() === coinId.toLowerCase() &&
            ticker.target.toLowerCase() === quoteAssetLower &&
            ticker.market.identifier.toLowerCase() === exchangeId.toLowerCase(),
        );

        if (specificTicker) {
          console.log('PriceOverview: Found specific ticker:', specificTicker);
          setMarketData(specificTicker);
        } else {
          console.warn(
            `PriceOverview: Ticker not found for ${coinId}/${quoteAssetLower} on ${exchangeId}. Response tickers:`,
            response.tickers,
          );
          // Log the tickers received for easier debugging
          console.log(
            'Tickers received from API:',
            JSON.stringify(response.tickers, null, 2),
          );
          setMarketData(null); // Set to null if not found
          // Optionally set an error message
          setError(
            `Market data not found for ${selectedPair.symbol} on ${selectedAccount.name} via CoinGecko.`, // More specific error
          );
        }
      } catch (err: any) {
        console.error(
          'PriceOverview: Error fetching price overview data:',
          err,
        );
        setError(
          `Failed to load market data: ${err.message || 'Unknown error'}`,
        );
        setMarketData(null); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickerData(); // Fetch immediately

    // Set up interval for periodic fetching (every 10 seconds)
    const intervalId = setInterval(fetchTickerData, 10000); // 10 seconds

    // Cleanup function to clear interval
    return () => clearInterval(intervalId);
  }, [selectedPair, selectedAccount]); // Re-run effect when pair or account changes

  // Default values if no pair is selected (less relevant now with fetching)
  const defaultPair: TradingPair = {
    symbol: 'N/A',
    baseAsset: '',
    quoteAsset: '',
    price: '0.00',
    change24h: 'N/A',
    volume24h: 'N/A',
    exchangeId: '', // Added default
    priceDecimals: 2, // Added default
    quantityDecimals: 8, // Added default
  };

  // Use selected pair primarily for symbol/assets, fallback to default
  const displayPair = selectedPair || defaultPair;

  // Determine price and change styling based on fetched data if available, else fallback
  const currentPrice = marketData?.last ?? 0; // Use fetched price or 0
  // Keep using change from prop for now, as it's not in the ticker response
  const change24h = displayPair.change24h;
  const isPositiveChange = change24h !== 'N/A' && !change24h.includes('-');
  // Use converted_volume.usd if available, otherwise fallback to prop volume
  const volume24h = marketData?.converted_volume?.usd
    ? formatCurrency(marketData.converted_volume.usd, 'usd') // Format as currency
    : displayPair.volume24h; // Fallback to prop
  const quoteAssetDisplay = displayPair.quoteAsset;

  // --- Loading and Error States ---
  // Show loading indicator more persistently while loading state is true
  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400 animate-pulse">
        Loading...
      </div>
    );
  }

  // Show error if fetching failed
  if (error && !marketData) {
    // Show error only if we don't have any data to display
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  // Handle case where no pair/account is selected or data couldn't be found
  if (
    !selectedPair ||
    !selectedAccount ||
    (!marketData && !isLoading && !error)
  ) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a pair and account to view market data.
      </div>
    );
  }
  // --- End Loading and Error States ---

  // If showPriceOnly is true, only render the price
  if (showPriceOnly && marketData) {
    return (
      <div className="ml-2">
        <div
          className={`text-xl font-bold ${isPositiveChange ? 'text-crypto-green' : 'text-crypto-red'}`}
        >
          {/* Display formatted fetched price */}
          {formatNumber(currentPrice)}
        </div>
      </div>
    );
  } else if (showPriceOnly) {
    // Handle case where showPriceOnly is true but no marketData yet
    return <div className="ml-2 text-xl font-bold text-gray-500">--.--</div>;
  }

  // Otherwise render the stats grid (only if marketData is available)
  return (
    <div className="p-4">
      <div className="grid grid-cols-4 gap-8 text-xs">
        <div>
          <div className="text-gray-400">24h Change</div>
          <div
            className={
              isPositiveChange ? 'text-crypto-green' : 'text-crypto-red'
            }
          >
            {/* Keep using prop change for now */}
            {change24h}
          </div>
        </div>
        <div>
          <div className="text-gray-400">High</div>
          <div className="text-white">
            {/* TODO: Fetch/Display real High */}
            {/* Placeholder using prop price for now */}
            {formatNumber(Number(displayPair.price.replace(/,/g, '')) * 1.02)}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Low</div>
          <div className="text-white">
            {/* TODO: Fetch/Display real Low */}
            {/* Placeholder using prop price for now */}
            {formatNumber(Number(displayPair.price.replace(/,/g, '')) * 0.98)}
          </div>
        </div>
        <div>
          {/* Display fetched volume */}
          <div className="text-gray-400">24h Volume ({quoteAssetDisplay})</div>
          {/* Ensure volume24h is displayed correctly */}
          <div className="text-white">
            {volume24h !== 'N/A' ? volume24h : '--'}
          </div>
        </div>
      </div>
    </div>
  );
}
