import React, { useState, useEffect } from 'react';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { TradingPair, OrderBook, Portfolio } from '@/types/exchange';
import { getConnectionMode, setConnectionMode } from '@/config/exchangeConfig';

/**
 * Example component demonstrating how to use the exchange adapters.
 * This is for demonstration purposes only and should not be used in production.
 */
export default function ExchangeAdapterExample() {
  const [exchangeId, setExchangeId] = useState<string>('binance');
  const [connectionMode, setConnectionModeState] =
    useState<string>(getConnectionMode());
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create refs at the top level of the component
  const previousExchangeIdRef = React.useRef(exchangeId);
  const previousPairRef = React.useRef(selectedPair);

  // Load trading pairs when exchange changes
  useEffect(() => {
    let isMounted = true;

    // Skip if the exchange hasn't changed
    if (
      previousExchangeIdRef.current === exchangeId &&
      tradingPairs.length > 0
    ) {
      return;
    }

    previousExchangeIdRef.current = exchangeId;

    async function loadTradingPairs() {
      if (!isMounted) return;

      setLoading(true);
      setError(null);
      try {
        console.log(`Loading trading pairs for ${exchangeId}...`);
        const adapter = ExchangeFactory.getAdapter(exchangeId);
        const pairs = await adapter.getTradingPairs();

        if (!isMounted) return;

        setTradingPairs(pairs);
        if (pairs.length > 0) {
          setSelectedPair(pairs[0].symbol);
        }
        console.log(`Loaded ${pairs.length} trading pairs for ${exchangeId}`);
      } catch (err) {
        if (!isMounted) return;

        console.error('Error loading trading pairs:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load trading pairs',
        );
        // Set some default pairs to prevent blank screen
        const defaultPairs = [
          {
            symbol: 'BTC/USDT',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
            exchangeId,
            priceDecimals: 2,
            quantityDecimals: 6,
            minQuantity: 0.001,
            maxQuantity: 100000,
            minPrice: 0.00000001,
            maxPrice: 1000000,
            minNotional: 10,
          },
          {
            symbol: 'ETH/USDT',
            baseAsset: 'ETH',
            quoteAsset: 'USDT',
            exchangeId,
            priceDecimals: 2,
            quantityDecimals: 6,
            minQuantity: 0.001,
            maxQuantity: 100000,
            minPrice: 0.00000001,
            maxPrice: 1000000,
            minNotional: 10,
          },
        ];
        setTradingPairs(defaultPairs);
        setSelectedPair('BTC/USDT');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTradingPairs();

    return () => {
      isMounted = false;
    };
  }, [exchangeId, tradingPairs.length]);

  // Load order book when pair changes
  useEffect(() => {
    if (!selectedPair) return;

    let isMounted = true;

    // Skip if nothing has changed
    if (
      previousPairRef.current === selectedPair &&
      previousExchangeIdRef.current === exchangeId &&
      orderBook?.symbol === selectedPair
    ) {
      return;
    }

    previousPairRef.current = selectedPair;
    previousExchangeIdRef.current = exchangeId;

    async function loadOrderBook() {
      if (!isMounted) return;

      setLoading(true);
      setError(null);
      try {
        console.log(`Loading order book for ${selectedPair}...`);
        const adapter = ExchangeFactory.getAdapter(exchangeId);
        const book = await adapter.getOrderBook(selectedPair);

        if (!isMounted) return;

        setOrderBook(book);
        console.log(`Loaded order book for ${selectedPair}`);
      } catch (err) {
        if (!isMounted) return;

        console.error('Error loading order book:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load order book',
        );

        // Create a default order book to prevent blank screen
        const defaultOrderBook = {
          symbol: selectedPair,
          exchangeId,
          bids: Array(10)
            .fill(0)
            .map((_, i) => ({
              price: 20000 - i * 100,
              quantity: 0.5 + Math.random() * 2,
            })),
          asks: Array(10)
            .fill(0)
            .map((_, i) => ({
              price: 20100 + i * 100,
              quantity: 0.5 + Math.random() * 2,
            })),
          timestamp: Date.now(),
        };
        setOrderBook(defaultOrderBook);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrderBook();

    return () => {
      isMounted = false;
    };
  }, [exchangeId, selectedPair, orderBook]);

  // Handle exchange change
  const handleExchangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newExchangeId = e.target.value;
    console.log(`Changing exchange from ${exchangeId} to ${newExchangeId}`);
    setExchangeId(newExchangeId);
  };

  // Handle pair change
  const handlePairChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPair = e.target.value;
    console.log(`Changing trading pair from ${selectedPair} to ${newPair}`);
    setSelectedPair(newPair);
  };

  // Handle connection mode change
  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as 'mock' | 'sandbox' | 'live';
    console.log(`Changing connection mode to ${mode}`);
    setConnectionMode(mode);
    setConnectionModeState(mode);
    // We don't need to trigger a reload here, the effect will handle it
  };

  // Load mock portfolio
  const handleLoadPortfolio = async () => {
    console.log('Loading portfolio...');
    setLoading(true);
    setError(null);
    try {
      const adapter = ExchangeFactory.getAdapter(exchangeId);
      // Using a dummy API key ID for demonstration
      const portfolio = await adapter.getPortfolio('dummy-api-key-id');
      console.log('Portfolio loaded successfully');
      setPortfolio(portfolio);
    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');

      // Create a default portfolio to prevent blank screen
      console.log('Using default portfolio data');
      const defaultPortfolio = {
        totalUsdValue: 25000,
        assets: [
          {
            asset: 'BTC',
            free: 0.5,
            locked: 0.1,
            total: 0.6,
            usdValue: 12000,
            exchangeId,
          },
          {
            asset: 'ETH',
            free: 3.2,
            locked: 0,
            total: 3.2,
            usdValue: 6400,
            exchangeId,
          },
          {
            asset: 'USDT',
            free: 5000,
            locked: 0,
            total: 5000,
            usdValue: 5000,
            exchangeId,
          },
          {
            asset: 'SOL',
            free: 25,
            locked: 5,
            total: 30,
            usdValue: 1600,
            exchangeId,
          },
        ],
        lastUpdated: new Date(),
      };
      setPortfolio(defaultPortfolio);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Exchange Adapter Example</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Connection Mode
        </label>
        <select
          value={connectionMode}
          onChange={handleModeChange}
          className="w-full p-2 bg-gray-700 rounded border border-gray-600"
        >
          <option value="mock">Mock</option>
          <option value="sandbox">Sandbox</option>
          <option value="live">Live</option>
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Note: Only mock mode is fully implemented in this example.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Exchange</label>
        <select
          value={exchangeId}
          onChange={handleExchangeChange}
          className="w-full p-2 bg-gray-700 rounded border border-gray-600"
        >
          <option value="binance">Binance</option>
          <option value="coinbase">Coinbase</option>
        </select>
      </div>

      {tradingPairs.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Trading Pair</label>
          <select
            value={selectedPair}
            onChange={handlePairChange}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600"
          >
            {tradingPairs.map((pair) => (
              <option key={pair.symbol} value={pair.symbol}>
                {pair.symbol}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleLoadPortfolio}
        className="mb-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
      >
        Load Mock Portfolio
      </button>

      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {orderBook && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            Order Book: {orderBook.symbol}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-green-500 font-medium mb-1">Bids (Buy)</h4>
              <div className="bg-gray-900 p-2 rounded max-h-40 overflow-y-auto">
                {orderBook.bids.map((bid, index) => (
                  <div key={index} className="text-sm grid grid-cols-2">
                    <span className="text-green-400">
                      {bid.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400">
                      {bid.quantity.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-red-500 font-medium mb-1">Asks (Sell)</h4>
              <div className="bg-gray-900 p-2 rounded max-h-40 overflow-y-auto">
                {orderBook.asks.map((ask, index) => (
                  <div key={index} className="text-sm grid grid-cols-2">
                    <span className="text-red-400">{ask.price.toFixed(2)}</span>
                    <span className="text-gray-400">
                      {ask.quantity.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {portfolio && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
          <p className="text-gray-300 mb-2">
            Total Value: ${portfolio.totalUsdValue.toFixed(2)}
          </p>
          <div className="bg-gray-900 p-2 rounded max-h-60 overflow-y-auto">
            {portfolio.assets.map((asset, index) => (
              <div key={index} className="text-sm grid grid-cols-4 mb-1">
                <span className="font-medium">{asset.asset}</span>
                <span className="text-gray-400">{asset.total.toFixed(6)}</span>
                <span className="text-gray-400">
                  ${asset.usdValue.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  {asset.locked > 0
                    ? `(${asset.locked.toFixed(6)} locked)`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
