import { Loader2, RefreshCw } from 'lucide-react';
import { TradingPair } from '@/types/trading';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { usePrice } from '@/contexts/PriceContext';
import { useFeatureFlags } from '@/config/featureFlags';
import { useState, useEffect, useCallback } from 'react';
import { getMockOrderbookData } from '@/mocks/mockOrderbook';
import * as enhancedCoinGeckoService from '@/services/enhancedCoinGeckoService';

interface OrderBookProps {
  selectedPair?: TradingPair;
  className?: string;
}

export function OrderBook({ selectedPair, className }: OrderBookProps = {}) {
  // Get selected account for exchange-specific data
  const { selectedAccount } = useSelectedAccount();
  const { setSelectedPrice } = usePrice();
  const exchangeName = selectedAccount?.exchange || 'Binance';
  const { useMockData, useRealMarketData } = useFeatureFlags();

  // Use the selected pair or default to BTC/USDT
  const symbol = selectedPair?.symbol || 'BTC/USDT';
  const baseAsset = selectedPair?.baseAsset || 'BTC';
  const quoteAsset = selectedPair?.quoteAsset || 'USDT';

  // State for orderbook data
  const [orderbook, setOrderbook] =
    useState<enhancedCoinGeckoService.Orderbook>({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<number>(10000); // 10 seconds

  // Function to fetch orderbook data with debouncing
  const fetchOrderbook = useCallback(async () => {
    // Skip if we're already loading
    if (isLoading) return;

    try {
      setIsLoading(true);
      setIsError(false);

      // Use mock data if feature flag is enabled
      if (useMockData && !useRealMarketData) {
        const mockData = getMockOrderbookData(symbol);
        setOrderbook(mockData.orderbook);
      } else {
        // Use real data from CoinGecko with enhanced stability
        try {
          const realOrderbook = await enhancedCoinGeckoService.getOrderbook(
            symbol,
            exchangeName.toLowerCase(),
            10, // depth
          );

          // Only update if we have valid data
          if (
            realOrderbook &&
            realOrderbook.bids &&
            realOrderbook.asks &&
            realOrderbook.bids.length > 0 &&
            realOrderbook.asks.length > 0
          ) {
            setOrderbook(realOrderbook);
          } else {
            console.warn('Received empty or invalid orderbook data');
            // Don't update the orderbook if we received invalid data
          }
        } catch (apiError) {
          console.error('Error fetching from CoinGecko API:', apiError);
          // Don't set error state here, we'll try the fallback

          // If we already have valid orderbook data, keep using it
          if (!(orderbook.bids?.length > 0 && orderbook.asks?.length > 0)) {
            const mockData = getMockOrderbookData(symbol);
            setOrderbook(mockData.orderbook);
          }
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error in fetchOrderbook:', error);
      setIsError(true);

      // Fallback to mock data if real data fails and we don't have valid data
      if (
        (!useMockData || useRealMarketData) &&
        !(orderbook.bids?.length > 0 && orderbook.asks?.length > 0)
      ) {
        const mockData = getMockOrderbookData(symbol);
        setOrderbook(mockData.orderbook);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    symbol,
    exchangeName,
    useMockData,
    useRealMarketData,
    isLoading,
    orderbook,
  ]);

  // Fetch orderbook data on mount and when dependencies change
  useEffect(() => {
    // Use a timeout to prevent immediate re-fetching when dependencies change
    const timeoutId = setTimeout(() => {
      fetchOrderbook();
    }, 300); // 300ms debounce

    // Set up interval for refreshing data with dynamic interval
    const intervalId = setInterval(
      () => {
        // Only fetch if we're not already loading
        if (!isLoading) {
          fetchOrderbook();
        }
      },
      useMockData ? refreshInterval : Math.max(refreshInterval, 5000),
    ); // Minimum 5 seconds for real data

    // Clean up interval and timeout on unmount or when dependencies change
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [fetchOrderbook, refreshInterval, useMockData, isLoading]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchOrderbook();
  };

  // Format price with appropriate precision
  const formatPrice = (price: string | number) => {
    return typeof price === 'number'
      ? price.toFixed(2)
      : parseFloat(price).toFixed(2);
  };

  // Format quantity with appropriate precision
  const formatQuantity = (quantity: string | number) => {
    return typeof quantity === 'number'
      ? quantity.toFixed(8)
      : parseFloat(quantity).toFixed(8);
  };

  // Calculate total (price * quantity)
  const calculateTotal = (
    price: string | number,
    quantity: string | number,
  ) => {
    const priceNum = typeof price === 'number' ? price : parseFloat(price);
    const quantityNum =
      typeof quantity === 'number' ? quantity : parseFloat(quantity);
    return (priceNum * quantityNum).toFixed(5);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`${className || ''} w-full h-full`}>
        <div className="p-3 border-b border-gray-800">
          <h3 className="text-white font-medium">Order Book</h3>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError || !orderbook) {
    return (
      <div className={`${className || ''} w-full h-full`}>
        <div className="p-3 border-b border-gray-800">
          <h3 className="text-white font-medium">Order Book</h3>
        </div>
        <div className="flex justify-center items-center py-12 text-red-500">
          Error loading order book
        </div>
      </div>
    );
  }

  // Get the current price (middle of the book)
  const currentPrice =
    orderbook.bids &&
    orderbook.asks &&
    orderbook.bids.length > 0 &&
    orderbook.asks.length > 0
      ? (parseFloat(orderbook.bids[0][0]) + parseFloat(orderbook.asks[0][0])) /
        2
      : 0;

  // Determine price trend based on recent trades (simplified for demo)
  // In a real app, this would be based on actual price history
  const isPriceUp = selectedPair
    ? !selectedPair.change24h.includes('-')
    : Math.random() > 0.5;

  // Calculate maximum volume for scaling the volume bars
  const askVolumes =
    orderbook.asks?.slice(0, 10).map((ask) => parseFloat(ask[1])) || [];
  const bidVolumes =
    orderbook.bids?.slice(0, 10).map((bid) => parseFloat(bid[1])) || [];
  const maxAskVolume = Math.max(...askVolumes, 0.1); // Prevent division by zero
  const maxBidVolume = Math.max(...bidVolumes, 0.1); // Prevent division by zero

  return (
    <div className="h-screen flex flex-col">
      {/* Order Book Header */}
      <div className="p-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-white font-medium">
          Order Book{' '}
          <span className="text-xs text-gray-400">({exchangeName})</span>
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">
            {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="Refresh order book"
            disabled={isLoading}
          >
            <RefreshCw
              size={14}
              className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Order Book Column Headers */}
      <div className="px-2 py-2 grid grid-cols-3 gap-x-0 text-xs text-gray-400">
        <div>Amount ({baseAsset})</div>
        <div className="text-center">Price ({quoteAsset})</div>
        <div className="text-right">Total</div>
      </div>

      {/* Order Book Content - Scrollable */}
      <div className="px-2 py-2 flex-1 overflow-hidden flex flex-col">
        {/* Asks (Sell Orders) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="space-y-1">
            {orderbook.asks
              ?.slice(0, 10)
              .reverse()
              .map((ask, i) => {
                // Calculate volume percentage for the bar width
                const volume = parseFloat(ask[1]);
                const volumePercentage = (volume / maxAskVolume) * 100;

                return (
                  <div
                    key={`sell-${i}`}
                    className="grid grid-cols-3 gap-x-0 text-xs relative py-0.5"
                  >
                    {/* Volume bar - positioned absolutely behind the text */}
                    <div
                      className="absolute top-0 right-0 h-full bg-crypto-red opacity-30"
                      style={{ width: `${volumePercentage}%`, maxWidth: '95%' }}
                    />
                    {/* Content - positioned on top of the volume bar */}
                    <div className="text-white relative z-10">
                      {formatQuantity(ask[1])}
                    </div>
                    <div
                      className="text-crypto-red text-center relative z-10 cursor-pointer hover:text-crypto-red/80"
                      onClick={() => setSelectedPrice(formatPrice(ask[0]))}
                      title="Click to set price"
                    >
                      {formatPrice(ask[0])}
                    </div>
                    <div className="text-white text-right relative z-10">
                      {calculateTotal(ask[0], ask[1])}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Current Price */}
        <div className="py-2 border-y border-gray-800">
          <div className="grid grid-cols-2 gap-x-0 text-sm">
            <div
              className={`font-medium ${isPriceUp ? 'text-crypto-green' : 'text-crypto-red'}`}
            >
              {currentPrice.toFixed(2)}
            </div>
            <div
              className={`font-medium ${isPriceUp ? 'text-crypto-green' : 'text-crypto-red'} text-right`}
            >
              ${currentPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="space-y-1">
            {orderbook.bids?.slice(0, 10).map((bid, i) => {
              // Calculate volume percentage for the bar width
              const volume = parseFloat(bid[1]);
              const volumePercentage = (volume / maxBidVolume) * 100;

              return (
                <div
                  key={`buy-${i}`}
                  className="grid grid-cols-3 gap-x-0 text-xs relative py-0.5"
                >
                  {/* Volume bar - positioned absolutely behind the text */}
                  <div
                    className="absolute top-0 left-0 h-full bg-crypto-green opacity-30"
                    style={{ width: `${volumePercentage}%`, maxWidth: '95%' }}
                  />
                  {/* Content - positioned on top of the volume bar */}
                  <div className="text-white relative z-10">
                    {formatQuantity(bid[1])}
                  </div>
                  <div
                    className="text-crypto-green text-center relative z-10 cursor-pointer hover:text-crypto-green/80"
                    onClick={() => setSelectedPrice(formatPrice(bid[0]))}
                    title="Click to set price"
                  >
                    {formatPrice(bid[0])}
                  </div>
                  <div className="text-white text-right relative z-10">
                    {calculateTotal(bid[0], bid[1])}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Trades Section */}
      <div className="p-2 border-t border-gray-800 h-[35%] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-medium">Recent Trades</h3>
          <div className="text-xs text-gray-400">
            {useMockData && !useRealMarketData
              ? 'Using mock data'
              : 'Using real data'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-0 text-xs text-gray-400 mb-2">
          <div>Amount ({baseAsset})</div>
          <div className="text-center">Price ({quoteAsset})</div>
          <div className="text-right">Time</div>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 scrollbar-thin">
          {[...Array(10)].map((_, i) => {
            // Generate trade data based on the current orderbook
            const price = parseFloat(orderbook.bids[0]?.[0] || '0');

            // Use slightly different logic for real vs mock data
            let quantity, priceWithVariation, timeString, isBuy;

            if (useMockData && !useRealMarketData) {
              // Generate completely random data for mock mode
              quantity = (Math.random() * 0.01).toFixed(8);
              priceWithVariation = (
                price *
                (1 + (Math.random() * 0.002 - 0.001))
              ).toFixed(2);
              const now = new Date();
              const minutes = now.getMinutes() - i;
              const seconds = Math.floor(Math.random() * 60);
              timeString = `${now.getHours()}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
              isBuy = Math.random() > 0.5;
            } else {
              // Generate semi-random data based on real orderbook
              // This simulates trades that would happen at prices in the orderbook
              const bidPrice = parseFloat(
                orderbook.bids[Math.min(i, orderbook.bids.length - 1)]?.[0] ||
                  '0',
              );
              const askPrice = parseFloat(
                orderbook.asks[Math.min(i, orderbook.asks.length - 1)]?.[0] ||
                  '0',
              );

              // Alternate between buys and sells
              isBuy = i % 2 === 0;
              priceWithVariation = (isBuy ? bidPrice : askPrice).toFixed(2);

              // Generate a realistic quantity based on the orderbook
              const bidQty = parseFloat(
                orderbook.bids[Math.min(i, orderbook.bids.length - 1)]?.[1] ||
                  '0.001',
              );
              const askQty = parseFloat(
                orderbook.asks[Math.min(i, orderbook.asks.length - 1)]?.[1] ||
                  '0.001',
              );
              quantity =
                (isBuy ? bidQty : askQty) * (0.1 + Math.random() * 0.5);
              quantity = quantity.toFixed(8);

              // Generate a realistic timestamp
              const now = new Date();
              now.setSeconds(
                now.getSeconds() - i * 15 - Math.floor(Math.random() * 30),
              );
              timeString = now.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
            }

            return (
              <div
                key={`trade-${i}`}
                className="grid grid-cols-3 gap-x-0 text-xs"
              >
                <div className="text-white">{quantity}</div>
                <div
                  className={`${isBuy ? 'text-crypto-green' : 'text-crypto-red'} text-center`}
                >
                  {priceWithVariation}
                </div>
                <div className="text-gray-400 text-right">{timeString}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
