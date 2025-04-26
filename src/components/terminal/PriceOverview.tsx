import React, { useState, useEffect } from 'react';
import { TradingPair } from '@/types/trading'; // Corrected import path
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import {
  CoinGeckoTicker,
  getCoinTickers,
} from '@/services/enhancedCoinGeckoService';
import { formatCurrency, formatNumber } from '../../utils/formatUtils'; // Assuming you have formatting utils
import { useFeatureFlags } from '@/config/featureFlags';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';

interface PriceOverviewProps {
  selectedPair?: TradingPair;
}

export function PriceOverview({
  selectedPair,
  showPriceOnly,
}: PriceOverviewProps & { showPriceOnly?: boolean } = {}) {
  const { selectedAccount } = useSelectedAccount();
  const { useMockData, useRealMarketData, useBinanceTestnet } =
    useFeatureFlags();
  const [marketData, setMarketData] = useState<CoinGeckoTicker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

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

      // Use the ExchangeFactory to get the appropriate adapter
      try {
        // Get the appropriate adapter based on the selected account
        const exchangeId = selectedAccount?.isSandbox
          ? 'sandbox' // This will use BinanceTestnetAdapter when useBinanceTestnet is true
          : selectedAccount?.exchangeId || 'sandbox';

        console.log(`PriceOverview: Getting adapter for ${exchangeId}`);
        const adapter = ExchangeFactory.getAdapter(exchangeId);

        // Get ticker stats for the selected pair
        console.log(
          `PriceOverview: Fetching ticker stats for ${selectedPair.symbol} using ${adapter.constructor.name}`,
        );
        const tickerStats = await adapter.getTickerStats(selectedPair.symbol);

        // Convert to CoinGeckoTicker format
        const adapterData: CoinGeckoTicker = {
          base: selectedPair.baseAsset.toUpperCase(),
          target: selectedPair.quoteAsset.toUpperCase(),
          market: {
            name: selectedAccount?.name || 'Exchange',
            identifier: exchangeId,
          },
          last: tickerStats.lastPrice,
          volume: tickerStats.volume,
          converted_last: {
            btc: 0, // Not available from exchange adapter
            eth: 0, // Not available from exchange adapter
            usd: tickerStats.lastPrice, // Assuming USDT = USD for simplicity
          },
          converted_volume: {
            btc: 0, // Not available from exchange adapter
            eth: 0, // Not available from exchange adapter
            usd: tickerStats.quoteVolume,
          },
          bid_ask_spread_percentage:
            ((tickerStats.askPrice - tickerStats.bidPrice) /
              tickerStats.askPrice) *
            100,
          timestamp: new Date(tickerStats.closeTime).toISOString(),
          last_traded_at: new Date(tickerStats.closeTime).toISOString(),
          last_fetch_at: new Date().toISOString(),
          is_anomaly: false,
          is_stale: false,
          trade_url: '',
          token_info_url: '',
          coin_id: selectedPair.baseAsset.toLowerCase(),
          target_coin_id: selectedPair.quoteAsset.toLowerCase(),
        };

        setMarketData(adapterData);

        // Set usingFallbackData based on whether we're using Binance Testnet
        const usingTestnet = useBinanceTestnet && selectedAccount?.isSandbox;
        setUsingFallbackData(!usingTestnet);

        return;
      } catch (error) {
        console.error('Error fetching data from exchange adapter:', error);
        // Fall through to other data sources
      }

      // Check feature flags to determine data source
      if (useMockData || !useRealMarketData) {
        console.log('PriceOverview: Using mock data due to feature flags');
        // Create mock market data with reasonable values
        const mockData: CoinGeckoTicker = {
          base: selectedPair.baseAsset.toUpperCase(),
          target: selectedPair.quoteAsset.toUpperCase(),
          market: {
            name: selectedAccount.name,
            identifier: selectedAccount.exchangeId,
          },
          last: parseFloat(selectedPair.price.replace(/,/g, '')) || 40000,
          volume: Math.random() * 1000 + 500,
          converted_last: {
            btc: Math.random() * 0.01,
            eth: Math.random() * 0.1,
            usd: parseFloat(selectedPair.price.replace(/,/g, '')) || 40000,
          },
          converted_volume: {
            btc: Math.random() * 50,
            eth: Math.random() * 500,
            usd: Math.random() * 50000000 + 10000000,
          },
          bid_ask_spread_percentage: Math.random() * 0.5,
          timestamp: new Date().toISOString(),
          last_traded_at: new Date().toISOString(),
          last_fetch_at: new Date().toISOString(),
          is_anomaly: false,
          is_stale: false,
          trade_url: '',
          token_info_url: '',
          coin_id: selectedPair.baseAsset.toLowerCase(),
          target_coin_id: selectedPair.quoteAsset.toLowerCase(),
        };

        setMarketData(mockData);
        setUsingFallbackData(true);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use baseAsset as coinId (service handles symbol->id mapping)
        // Use selectedAccount.exchangeId
        let coinId = selectedPair.baseAsset; // e.g., 'BTC'
        const exchangeId = selectedAccount.exchangeId; // e.g., 'kraken'
        const quoteAssetLower = selectedPair.quoteAsset.toLowerCase(); // e.g., 'usdt'

        // Handle special cases for exchanges that use different symbols
        // Kraken uses XBT instead of BTC
        if (
          exchangeId.toLowerCase() === 'kraken' &&
          coinId.toLowerCase() === 'btc'
        ) {
          coinId = 'XBT';
          console.log('PriceOverview: Using XBT instead of BTC for Kraken');
        }

        console.log(
          `PriceOverview: Fetching ticker for ${coinId}/${quoteAssetLower} on ${exchangeId}`,
        );

        // Fetch tickers for the base coin on the specific exchange
        const response = await getCoinTickers(coinId, [exchangeId]);

        // Find the specific ticker matching the quote asset and ensure market identifier matches
        // For Kraken, we need to handle both BTC and XBT
        const specificTicker = response.tickers.find((ticker) => {
          const baseMatches =
            ticker.base.toLowerCase() === coinId.toLowerCase() ||
            (exchangeId.toLowerCase() === 'kraken' &&
              coinId.toLowerCase() === 'xbt' &&
              ticker.base.toLowerCase() === 'xbt');

          const targetMatches = ticker.target.toLowerCase() === quoteAssetLower;
          const exchangeMatches =
            ticker.market.identifier.toLowerCase() === exchangeId.toLowerCase();

          return baseMatches && targetMatches && exchangeMatches;
        });

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
          console.log('Using fallback data for price overview');
          setUsingFallbackData(true);

          // Create fallback market data with reasonable values
          const fallbackData: CoinGeckoTicker = {
            base: selectedPair.baseAsset.toUpperCase(),
            target: selectedPair.quoteAsset.toUpperCase(),
            market: {
              name: selectedAccount.name,
              identifier: selectedAccount.exchangeId,
            },
            last: parseFloat(selectedPair.price.replace(/,/g, '')) || 40000, // Use pair price or default
            volume: Math.random() * 1000 + 500, // Random volume between 500-1500
            converted_last: {
              btc: Math.random() * 0.01,
              eth: Math.random() * 0.1,
              usd: parseFloat(selectedPair.price.replace(/,/g, '')) || 40000,
            },
            converted_volume: {
              btc: Math.random() * 50,
              eth: Math.random() * 500,
              usd: Math.random() * 50000000 + 10000000, // Random USD volume
            },
            bid_ask_spread_percentage: Math.random() * 0.5,
            timestamp: new Date().toISOString(),
            last_traded_at: new Date().toISOString(),
            last_fetch_at: new Date().toISOString(),
            is_anomaly: false,
            is_stale: false,
            trade_url: '',
            token_info_url: '',
            coin_id: selectedPair.baseAsset.toLowerCase(),
            target_coin_id: selectedPair.quoteAsset.toLowerCase(),
          };

          setMarketData(fallbackData);
        }
      } catch (err: any) {
        console.error(
          'PriceOverview: Error fetching price overview data:',
          err,
        );
        console.log('Using fallback data due to error:', err.message);
        setUsingFallbackData(true);

        // Create fallback market data with reasonable values
        const fallbackData: CoinGeckoTicker = {
          base: selectedPair.baseAsset.toUpperCase(),
          target: selectedPair.quoteAsset.toUpperCase(),
          market: {
            name: selectedAccount.name,
            identifier: selectedAccount.exchangeId,
          },
          last: parseFloat(selectedPair.price.replace(/,/g, '')) || 40000, // Use pair price or default
          volume: Math.random() * 1000 + 500, // Random volume between 500-1500
          converted_last: {
            btc: Math.random() * 0.01,
            eth: Math.random() * 0.1,
            usd: parseFloat(selectedPair.price.replace(/,/g, '')) || 40000,
          },
          converted_volume: {
            btc: Math.random() * 50,
            eth: Math.random() * 500,
            usd: Math.random() * 50000000 + 10000000, // Random USD volume
          },
          bid_ask_spread_percentage: Math.random() * 0.5,
          timestamp: new Date().toISOString(),
          last_traded_at: new Date().toISOString(),
          last_fetch_at: new Date().toISOString(),
          is_anomaly: false,
          is_stale: false,
          trade_url: '',
          token_info_url: '',
          coin_id: selectedPair.baseAsset.toLowerCase(),
          target_coin_id: selectedPair.quoteAsset.toLowerCase(),
        };

        setMarketData(fallbackData);
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
  if (isLoading && !marketData) {
    return (
      <div className="p-4 text-center text-gray-400 animate-pulse">
        Loading market data...
      </div>
    );
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
      <div className="ml-2 relative group">
        <div
          className={`text-xl font-bold ${isPositiveChange ? 'text-crypto-green' : 'text-crypto-red'}`}
        >
          {/* Display formatted fetched price */}
          {formatNumber(currentPrice)}
        </div>

        {/* Small indicator dot showing data source */}
        <div
          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
            useBinanceTestnet &&
            selectedAccount?.isSandbox &&
            !usingFallbackData
              ? 'bg-crypto-green'
              : 'bg-yellow-500'
          }`}
          title={
            useBinanceTestnet &&
            selectedAccount?.isSandbox &&
            !usingFallbackData
              ? 'Using Binance Testnet data'
              : `Using ${useMockData ? 'mock' : 'fallback'} data`
          }
        />
      </div>
    );
  } else if (showPriceOnly) {
    // Handle case where showPriceOnly is true but no marketData yet
    return <div className="ml-2 text-xl font-bold text-gray-500">--.--</div>;
  }

  // Otherwise render the stats grid (only if marketData is available)
  return (
    <div className="p-4">
      {/* Data source indicator */}
      <div className="flex items-center mb-2 justify-end">
        <div className="flex items-center gap-1 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
          {useBinanceTestnet &&
          selectedAccount?.isSandbox &&
          !usingFallbackData ? (
            <>
              <div className="w-2 h-2 rounded-full bg-crypto-green" />
              <span className="text-crypto-green">
                Using Binance Testnet data
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-yellow-500">
                Using {useMockData ? 'mock' : 'fallback'} data
              </span>
            </>
          )}
        </div>
      </div>
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
