// src/components/settings/BinanceTestnetMarketDataTest.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { TradingPair, Trade, TickerStats } from '@/types/exchange';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';
import { ConnectionStatusIndicator } from '@/components/connection/ConnectionStatusIndicator';
import { useFeatureFlags, setFeatureFlag } from '@/config/featureFlags';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Component for testing the Binance Testnet Market Data Integration
 */
export function BinanceTestnetMarketDataTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Market data states
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [tickerStats, setTickerStats] = useState<TickerStats | null>(null);

  // Selected symbol for testing
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');

  // Feature flags
  const featureFlags = useFeatureFlags();

  // Get connection status
  const { getStatus, checkConnection } = useConnectionStatus();

  // This function is no longer needed as we're using the master toggle
  // Keeping it commented for reference
  /*
  const handleToggleMockData = (checked: boolean) => {
    setFeatureFlag('useMockData', checked);
    // Clear previous results
    setTradingPairs([]);
    setRecentTrades([]);
    setTickerStats(null);
    setSuccess(null);
    setError(null);
  };
  */

  // Test market data endpoints
  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the appropriate adapter based on the Binance Testnet flag
      const adapter = featureFlags.useBinanceTestnet
        ? ExchangeFactory.getAdapter('binance_testnet')
        : ExchangeFactory.getAdapter('mock');

      console.log(
        `Using adapter: ${adapter.constructor.name} for market data test`,
      );

      // Test getting trading pairs
      const pairs = await adapter.getTradingPairs();
      setTradingPairs(pairs.slice(0, 10)); // Show first 10 pairs

      // Test getting recent trades for the selected symbol
      const trades = await adapter.getRecentTrades(selectedSymbol, 10);
      setRecentTrades(trades);

      // Test getting ticker stats for the selected symbol
      const stats = (await adapter.getTickerStats(
        selectedSymbol,
      )) as TickerStats;
      setTickerStats(stats);

      // Set success message
      setSuccess(
        `Successfully fetched market data from ${featureFlags.useBinanceTestnet ? 'Binance Testnet API' : 'Mock Data Service'}`,
      );

      // Update connection status
      await checkConnection('binance_testnet');
    } catch (err) {
      console.error('Error testing market data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch market data',
      );

      // Update connection status
      await checkConnection('binance_testnet');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format price with color based on change
  const formatPriceWithColor = (price: number, change: number) => {
    const color = change >= 0 ? 'text-green-500' : 'text-red-500';
    return <span className={color}>{price.toFixed(2)}</span>;
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Test Market Data Integration</CardTitle>
            <CardDescription>
              Compare market data between Mock Data and Binance Testnet API
            </CardDescription>
          </div>
          <ConnectionStatusIndicator exchangeId="binance_testnet" size="md" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className={`flex items-center px-3 py-1 rounded-full ${
                featureFlags.useBinanceTestnet
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
              }`}
            >
              <span
                className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  featureFlags.useBinanceTestnet
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }`}
              ></span>
              <span className="font-medium text-sm">
                {featureFlags.useBinanceTestnet
                  ? 'Using Binance Testnet API'
                  : 'Using Mock Data (Enable Testnet in settings above)'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="symbol-select">Symbol:</Label>
            <select
              id="symbol-select"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="border rounded p-1"
            >
              <option value="BTC/USDT">BTC/USDT</option>
              <option value="ETH/USDT">ETH/USDT</option>
              <option value="BNB/USDT">BNB/USDT</option>
              <option value="SOL/USDT">SOL/USDT</option>
              <option value="XRP/USDT">XRP/USDT</option>
            </select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert
            variant="default"
            className={`mb-4 ${
              featureFlags.useBinanceTestnet
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50'
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 ${
                featureFlags.useBinanceTestnet
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}
            />
            <AlertTitle>
              {featureFlags.useBinanceTestnet
                ? 'Test Result: Using Binance Testnet API'
                : 'Test Result: Using Mock Data'}
            </AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground mb-4">
          Last checked: {formatDate(getStatus('binance_testnet').lastChecked)}
        </div>

        {/* Results Tabs */}
        {(tradingPairs.length > 0 ||
          recentTrades.length > 0 ||
          tickerStats) && (
          <Tabs defaultValue="ticker" className="mt-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="ticker">Ticker Stats</TabsTrigger>
              <TabsTrigger value="trades">Recent Trades</TabsTrigger>
              <TabsTrigger value="pairs">Trading Pairs</TabsTrigger>
            </TabsList>

            {/* Ticker Stats Tab */}
            <TabsContent value="ticker" className="mt-2">
              {tickerStats && (
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">
                    24hr Ticker Statistics for {tickerStats.symbol}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Last Price:
                      </p>
                      <p className="text-lg font-medium">
                        {formatPriceWithColor(
                          tickerStats.lastPrice,
                          tickerStats.priceChange,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        24h Change:
                      </p>
                      <p
                        className={`text-lg font-medium ${tickerStats.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {tickerStats.priceChangePercent.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">24h High:</p>
                      <p className="text-lg font-medium">
                        {tickerStats.highPrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">24h Low:</p>
                      <p className="text-lg font-medium">
                        {tickerStats.lowPrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        24h Volume:
                      </p>
                      <p className="text-lg font-medium">
                        {tickerStats.volume.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Weighted Avg Price:
                      </p>
                      <p className="text-lg font-medium">
                        {tickerStats.weightedAvgPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Data Source:
                    </p>
                    <p className="text-sm font-medium">
                      {featureFlags.useBinanceTestnet
                        ? 'Binance Testnet API (real market data)'
                        : 'Mock Data (randomly generated)'}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Recent Trades Tab */}
            <TabsContent value="trades" className="mt-2">
              {recentTrades.length > 0 && (
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">
                    Recent Trades for {selectedSymbol}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Time</th>
                          <th className="text-left p-2">Price</th>
                          <th className="text-left p-2">Quantity</th>
                          <th className="text-left p-2">Side</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTrades.map((trade) => (
                          <tr key={trade.id} className="border-b">
                            <td className="p-2">
                              {formatDate(trade.timestamp)}
                            </td>
                            <td className="p-2">{trade.price.toFixed(2)}</td>
                            <td className="p-2">{trade.quantity.toFixed(6)}</td>
                            <td className="p-2">
                              <span
                                className={
                                  trade.isBuyerMaker
                                    ? 'text-red-500'
                                    : 'text-green-500'
                                }
                              >
                                {trade.isBuyerMaker ? 'Sell' : 'Buy'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Data Source:
                    </p>
                    <p className="text-sm font-medium">
                      {featureFlags.useBinanceTestnet
                        ? 'Binance Testnet API (real market data)'
                        : 'Mock Data (randomly generated)'}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Trading Pairs Tab */}
            <TabsContent value="pairs" className="mt-2">
              {tradingPairs.length > 0 && (
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">
                    Trading Pairs (First 10)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Symbol</th>
                          <th className="text-left p-2">Base Asset</th>
                          <th className="text-left p-2">Quote Asset</th>
                          <th className="text-left p-2">Price Decimals</th>
                          <th className="text-left p-2">Quantity Decimals</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradingPairs.map((pair) => (
                          <tr key={pair.symbol} className="border-b">
                            <td className="p-2">{pair.symbol}</td>
                            <td className="p-2">{pair.baseAsset}</td>
                            <td className="p-2">{pair.quoteAsset}</td>
                            <td className="p-2">{pair.priceDecimals}</td>
                            <td className="p-2">{pair.quantityDecimals}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Data Source:
                    </p>
                    <p className="text-sm font-medium">
                      {featureFlags.useBinanceTestnet
                        ? 'Binance Testnet API (real market data)'
                        : 'Mock Data (randomly generated)'}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleTest} disabled={loading} className="w-full">
          {loading ? 'Fetching Data...' : 'Test Market Data Integration'}
        </Button>
      </CardFooter>
    </Card>
  );
}
