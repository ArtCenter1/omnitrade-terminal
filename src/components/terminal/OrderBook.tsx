import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { TradingPair } from '@/types/trading';
import { Orderbook } from '@/types/marketData';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { usePrice } from '@/contexts/PriceContext';
import { useFeatureFlags } from '@/config/featureFlags';
import { useState, useEffect, useCallback } from 'react';
import * as enhancedCoinGeckoService from '@/services/enhancedCoinGeckoService';
import { mockExchangeService } from '@/services/mockExchangeService';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';

interface OrderBookProps {
  selectedPair?: TradingPair;
  className?: string;
}

export function OrderBook({ selectedPair, className }: OrderBookProps = {}) {
  // Get selected account for exchange-specific data
  const { selectedAccount } = useSelectedAccount();
  const { setSelectedPrice, setCurrentMarketPrice, setCurrentPairSymbol } =
    usePrice();
  const exchangeName = selectedAccount?.exchange || 'Binance';
  const { useMockData, useRealMarketData, useBinanceTestnet } =
    useFeatureFlags();

  // Use the selected pair or default to BTC/USDT
  const symbol = selectedPair?.symbol || 'BTC/USDT';
  const baseAsset = selectedPair?.baseAsset || 'BTC';
  const quoteAsset = selectedPair?.quoteAsset || 'USDT';

  // Update the current pair symbol in the PriceContext
  useEffect(() => {
    if (symbol) {
      console.log(`OrderBook: Updating currentPairSymbol to ${symbol}`);
      setCurrentPairSymbol(symbol);
    }
  }, [symbol, setCurrentPairSymbol]);

  // State for orderbook data
  const [orderbook, setOrderbook] = useState<Orderbook>({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<number>(10000); // 10 seconds
  const [usingFallbackData, setUsingFallbackData] = useState<boolean>(false);

  // Function to fetch orderbook data with debouncing
  const fetchOrderbook = useCallback(async () => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn(
        'Orderbook fetch timeout - forcing fallback to mockExchangeService',
      );
      const exchangeId =
        selectedAccount?.exchangeId || exchangeName.toLowerCase();
      const mockOrderbook = mockExchangeService.getOrderbook(
        exchangeId,
        symbol,
      );
      setOrderbook(mockOrderbook);
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 5000); // 5 second timeout

    try {
      setIsLoading(true);
      setIsError(false);
      console.log(`Fetching orderbook for ${symbol} on ${exchangeName}`);

      // Use the ExchangeFactory to get the appropriate adapter
      try {
        console.log(
          `OrderBook: Getting adapter for ${selectedAccount?.exchangeId || 'sandbox'}`,
        );

        // Get the appropriate adapter based on the selected account
        const exchangeId = selectedAccount?.isSandbox
          ? 'sandbox' // This will use BinanceTestnetAdapter when useBinanceTestnet is true
          : selectedAccount?.exchangeId || 'sandbox';

        console.log(`OrderBook: Using exchange ID: ${exchangeId}`);
        const adapter = ExchangeFactory.getAdapter(exchangeId);
        console.log(`OrderBook: Got adapter: ${adapter.constructor.name}`);

        // Get order book from the adapter
        console.log(
          `OrderBook: Fetching order book for ${symbol} using ${adapter.constructor.name}`,
        );

        try {
          const orderBookData = await adapter.getOrderBook(symbol, 10);
          console.log(`OrderBook: Received order book data:`, orderBookData);

          // Check if we got valid data
          if (!orderBookData || !orderBookData.bids || !orderBookData.asks) {
            console.error(
              'OrderBook: Invalid order book data received:',
              orderBookData,
            );
            throw new Error('Invalid order book data received');
          }

          if (
            orderBookData.bids.length === 0 &&
            orderBookData.asks.length === 0
          ) {
            console.error('OrderBook: Empty order book data received');
            throw new Error('Empty order book data received');
          }

          // Convert to the format expected by the component
          const formattedOrderbook: Orderbook = {
            bids: orderBookData.bids.map((entry) => [
              entry.price.toString(),
              entry.quantity.toString(),
            ]),
            asks: orderBookData.asks.map((entry) => [
              entry.price.toString(),
              entry.quantity.toString(),
            ]),
          };

          console.log(`OrderBook: Formatted order book:`, formattedOrderbook);

          // Set the orderbook state
          setOrderbook(formattedOrderbook);

          // Set usingFallbackData based on whether we're using Binance Testnet
          const usingTestnet = useBinanceTestnet && selectedAccount?.isSandbox;
          setUsingFallbackData(!usingTestnet);

          console.log(
            `Successfully loaded order book data for ${symbol} using ${adapter.constructor.name}`,
          );
        } catch (adapterError) {
          console.error('OrderBook: Error from adapter:', adapterError);
          throw adapterError; // Re-throw to be caught by the outer catch
        }
      } catch (error) {
        console.error('OrderBook: Error fetching order book data:', error);

        // Fallback to mock data
        console.log(
          'OrderBook: Falling back to mockExchangeService due to error',
        );
        const exchangeId =
          selectedAccount?.exchangeId || exchangeName.toLowerCase();

        try {
          console.log(
            `OrderBook: Getting mock orderbook for ${exchangeId}, ${symbol}`,
          );
          const mockOrderbook = mockExchangeService.getOrderbook(
            exchangeId,
            symbol,
          );

          console.log(`OrderBook: Got mock orderbook:`, mockOrderbook);

          if (
            !mockOrderbook ||
            !mockOrderbook.bids ||
            !mockOrderbook.asks ||
            mockOrderbook.bids.length === 0 ||
            mockOrderbook.asks.length === 0
          ) {
            console.error('OrderBook: Invalid mock orderbook data');
            throw new Error('Invalid mock orderbook data');
          }

          setOrderbook(mockOrderbook);
          setUsingFallbackData(true);
          setErrorMessage(
            'Could not fetch real market data. Using fallback data.',
          );
        } catch (mockError) {
          console.error('OrderBook: Error getting mock orderbook:', mockError);
          setIsError(true);
          setErrorMessage(
            'Failed to load order book data. Please try again later.',
          );
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error in fetchOrderbook:', error);
      setIsError(true);
      setErrorMessage(
        'Error loading order book data. Using emergency fallback data.',
      );

      // Use our centralized mock exchange service for emergency fallback
      console.log('Using emergency fallback from mockExchangeService');
      const exchangeId =
        selectedAccount?.exchangeId || exchangeName.toLowerCase();
      const fallbackOrderbook = mockExchangeService.getOrderbook(
        exchangeId,
        symbol,
      );

      setOrderbook(fallbackOrderbook);
      setUsingFallbackData(true);
    } finally {
      clearTimeout(timeoutId); // Clear the timeout
      setIsLoading(false);
    }
  }, [
    symbol,
    useMockData,
    useRealMarketData,
    useBinanceTestnet,
    exchangeName,
    selectedAccount,
  ]);

  // Fetch orderbook data on mount and when dependencies change
  useEffect(() => {
    // Fetch immediately on mount
    fetchOrderbook();

    // Set up interval for refreshing data
    const intervalId = setInterval(() => {
      // Always try to fetch, even if we think we're loading
      // This prevents getting stuck in a loading state
      fetchOrderbook();
    }, refreshInterval);

    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchOrderbook, refreshInterval]);

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

  // Calculate rendering state variables - don't use early returns
  const showLoading =
    isLoading &&
    (!orderbook ||
      !orderbook.bids ||
      !orderbook.asks ||
      (!orderbook.bids.length && !orderbook.asks.length));
  const showError =
    (isError || !orderbook || !orderbook.bids || !orderbook.asks) &&
    (!orderbook ||
      !orderbook.bids ||
      !orderbook.asks ||
      (!orderbook.bids.length && !orderbook.asks.length));

  // Get the current price (middle of the book)
  const currentPrice =
    orderbook &&
    orderbook.bids &&
    orderbook.asks &&
    orderbook.bids.length > 0 &&
    orderbook.asks.length > 0 &&
    orderbook.bids[0] &&
    orderbook.asks[0]
      ? (parseFloat(orderbook.bids[0][0]) + parseFloat(orderbook.asks[0][0])) /
        2
      : selectedPair?.lastPrice || 0;

  // Update the current market price in the PriceContext whenever it changes
  useEffect(() => {
    if (currentPrice > 0) {
      const formattedPrice = currentPrice.toFixed(2);
      console.log(
        `OrderBook: Updating currentMarketPrice to ${formattedPrice}`,
      );
      setCurrentMarketPrice(formattedPrice);
    }
  }, [currentPrice, setCurrentMarketPrice]);

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
    <div className={`${className || ''} w-full h-full`}>
      {/* Order Book Header */}
      <div className="p-3 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h3 className="text-white font-medium">
            Order Book{' '}
            <span className="text-xs text-gray-400">({exchangeName})</span>
          </h3>
          {/* Data source indicator removed to save space */}
        </div>
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

      {/* Loading State */}
      {showLoading && (
        <div className="flex flex-col justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
          <div className="text-gray-400 text-sm">Loading order book...</div>
        </div>
      )}

      {/* Error State */}
      {showError && (
        <div className="flex flex-col justify-center items-center py-12">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
          <div className="text-red-500 mb-2">
            {errorMessage || 'Error loading order book'}
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-2 mt-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}

      {/* Main Order Book Content - Only show when not loading or error */}
      {!showLoading && !showError && (
        <div className="flex flex-col h-full">
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
                {orderbook && orderbook.asks && Array.isArray(orderbook.asks)
                  ? orderbook.asks
                      .slice(0, 10)
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
                              style={{
                                width: `${volumePercentage}%`,
                                maxWidth: '95%',
                              }}
                            />
                            {/* Content - positioned on top of the volume bar */}
                            <div className="text-white relative z-10">
                              {formatQuantity(ask[1])}
                            </div>
                            <div
                              className="text-crypto-red text-center relative z-10 cursor-pointer hover:text-crypto-red/80"
                              onClick={() =>
                                setSelectedPrice(formatPrice(ask[0]))
                              }
                              title="Click to set price"
                            >
                              {formatPrice(ask[0])}
                            </div>
                            <div className="text-white text-right relative z-10">
                              {calculateTotal(ask[0], ask[1])}
                            </div>
                          </div>
                        );
                      })
                  : null}
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
                {orderbook && orderbook.bids && Array.isArray(orderbook.bids)
                  ? orderbook.bids.slice(0, 10).map((bid, i) => {
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
                            style={{
                              width: `${volumePercentage}%`,
                              maxWidth: '95%',
                            }}
                          />
                          {/* Content - positioned on top of the volume bar */}
                          <div className="text-white relative z-10">
                            {formatQuantity(bid[1])}
                          </div>
                          <div
                            className="text-crypto-green text-center relative z-10 cursor-pointer hover:text-crypto-green/80"
                            onClick={() =>
                              setSelectedPrice(formatPrice(bid[0]))
                            }
                            title="Click to set price"
                          >
                            {formatPrice(bid[0])}
                          </div>
                          <div className="text-white text-right relative z-10">
                            {calculateTotal(bid[0], bid[1])}
                          </div>
                        </div>
                      );
                    })
                  : null}
              </div>
            </div>
          </div>

          {/* Recent Trades Section */}
          <div className="p-2 border-t border-gray-800 h-[35%] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-white font-medium">Recent Trades</h3>
                {/* Data source indicator removed to save space */}
              </div>
              <div className="text-xs text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-x-0 text-xs text-gray-400 mb-2">
              <div>Amount ({baseAsset})</div>
              <div className="text-center">Price ({quoteAsset})</div>
              <div className="text-right">Time</div>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 scrollbar-thin">
              {orderbook &&
                orderbook.bids &&
                orderbook.bids[0] &&
                [...Array(10)].map((_, i) => {
                  // Generate trade data based on the current orderbook
                  const price = parseFloat(orderbook.bids[0]?.[0] || '0');

                  // Use slightly different logic for real vs mock data
                  let quantity: string = '0';
                  let priceWithVariation: string = '0';
                  let timeString: string = '';
                  let isBuy: boolean = false;

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
                      orderbook.bids[
                        Math.min(i, orderbook.bids.length - 1)
                      ]?.[0] || '0',
                    );
                    const askPrice = parseFloat(
                      orderbook.asks[
                        Math.min(i, orderbook.asks.length - 1)
                      ]?.[0] || '0',
                    );

                    // Alternate between buys and sells
                    isBuy = i % 2 === 0;
                    priceWithVariation = (isBuy ? bidPrice : askPrice).toFixed(
                      2,
                    );

                    // Generate a realistic quantity based on the orderbook
                    const bidQty = parseFloat(
                      orderbook.bids[
                        Math.min(i, orderbook.bids.length - 1)
                      ]?.[1] || '0.001',
                    );
                    const askQty = parseFloat(
                      orderbook.asks[
                        Math.min(i, orderbook.asks.length - 1)
                      ]?.[1] || '0.001',
                    );
                    const calculatedQty =
                      (isBuy ? bidQty : askQty) * (0.1 + Math.random() * 0.5);
                    quantity = calculatedQty.toFixed(8);

                    // Generate a realistic timestamp
                    const now = new Date();
                    now.setSeconds(
                      now.getSeconds() -
                        i * 15 -
                        Math.floor(Math.random() * 30),
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
                      <div className="text-gray-400 text-right">
                        {timeString}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
