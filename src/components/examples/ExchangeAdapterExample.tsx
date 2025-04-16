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

  // Load trading pairs when exchange changes
  useEffect(() => {
    async function loadTradingPairs() {
      setLoading(true);
      setError(null);
      try {
        const adapter = ExchangeFactory.getAdapter(exchangeId);
        const pairs = await adapter.getTradingPairs();
        setTradingPairs(pairs);
        if (pairs.length > 0) {
          setSelectedPair(pairs[0].symbol);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load trading pairs',
        );
      } finally {
        setLoading(false);
      }
    }

    loadTradingPairs();
  }, [exchangeId]);

  // Load order book when pair changes
  useEffect(() => {
    if (!selectedPair) return;

    async function loadOrderBook() {
      setLoading(true);
      setError(null);
      try {
        const adapter = ExchangeFactory.getAdapter(exchangeId);
        const book = await adapter.getOrderBook(selectedPair);
        setOrderBook(book);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load order book',
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrderBook();
  }, [exchangeId, selectedPair]);

  // Handle exchange change
  const handleExchangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExchangeId(e.target.value);
  };

  // Handle pair change
  const handlePairChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPair(e.target.value);
  };

  // Handle connection mode change
  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as 'mock' | 'sandbox' | 'live';
    setConnectionMode(mode);
    setConnectionModeState(mode);
    // Reload data
    setExchangeId(exchangeId); // Trigger a reload
  };

  // Load mock portfolio
  const handleLoadPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const adapter = ExchangeFactory.getAdapter(exchangeId);
      // Using a dummy API key ID for demonstration
      const portfolio = await adapter.getPortfolio('dummy-api-key-id');
      setPortfolio(portfolio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
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
