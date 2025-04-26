import { useState, useEffect } from 'react';
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
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TradingPair } from '@/types/exchange';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';
import { ConnectionStatusIndicator } from '@/components/connection/ConnectionStatusIndicator';

/**
 * Component for testing the Binance Testnet integration
 */
export function BinanceTestnetTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [authTestResult, setAuthTestResult] = useState<string | null>(null);

  // Get API keys
  const { hasKeys, loading: loadingKeys } = useApiKeys('binance_testnet');

  // Get connection status
  const { getStatus, checkConnection } = useConnectionStatus();

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPairs([]);
    setAuthTestResult(null);

    try {
      // Get the Binance Testnet adapter
      const adapter = ExchangeFactory.getAdapter('binance_testnet');

      // Test getting exchange info (unauthenticated)
      const exchangeInfo = await adapter.getExchangeInfo();
      console.log('Exchange info:', exchangeInfo);

      // Test getting trading pairs (unauthenticated)
      const tradingPairs = await adapter.getTradingPairs();
      console.log('Trading pairs:', tradingPairs);
      setPairs(tradingPairs.slice(0, 5)); // Show first 5 pairs

      // Check if we're using mock data
      const usingMock =
        exchangeInfo.name === 'Mock Exchange' ||
        exchangeInfo.name.includes('Mock');

      setUsingMockData(usingMock);

      if (usingMock) {
        setSuccess(
          'Connected using mock data. To use real Binance Testnet data, please add API keys.',
        );
      } else {
        setSuccess('Successfully connected to Binance Testnet API');
      }

      // Test authenticated endpoint if we have API keys
      if (hasKeys) {
        try {
          // Test getting portfolio (authenticated)
          const portfolio = await adapter.getPortfolio('default');
          console.log('Portfolio:', portfolio);

          // Check if we're using mock data for authenticated requests
          const usingMockAuth =
            portfolio.balances.length === 0 ||
            portfolio.balances.some((b) => b.asset.includes('MOCK'));

          if (usingMockAuth) {
            setAuthTestResult(
              'Authenticated test: Using mock data for authenticated requests. Please check your API keys.',
            );
          } else {
            setAuthTestResult(
              `Authenticated test: Success! Found ${portfolio.balances.length} assets in your portfolio.`,
            );
          }
        } catch (authErr) {
          console.error('Error testing authenticated endpoint:', authErr);
          setAuthTestResult(
            `Authenticated test failed: ${authErr instanceof Error ? authErr.message : 'Unknown error'}`,
          );
        }
      }

      // Update connection status by checking the connection
      await checkConnection('binance_testnet');
    } catch (err) {
      console.error('Error testing Binance Testnet:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to Binance Testnet API',
      );

      // Update connection status by checking the connection
      await checkConnection('binance_testnet');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Test Binance Testnet Connection</CardTitle>
            <CardDescription>
              Verify that the Binance Testnet API is working correctly
            </CardDescription>
          </div>
          <ConnectionStatusIndicator exchangeId="binance_testnet" size="md" />
        </div>
      </CardHeader>
      <CardContent>
        {!hasKeys && !loadingKeys && (
          <Alert className="mb-4 border-yellow-500">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>No API Keys Found</AlertTitle>
            <AlertDescription>
              You don't have any Binance Testnet API keys configured. The
              connection test will use mock data.
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById('api-keys-tab')?.click()
                  }
                >
                  Configure API Keys
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
              usingMockData
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50'
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 ${
                usingMockData
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            />
            <AlertTitle>
              {usingMockData ? 'Using Mock Data' : 'Success'}
            </AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground mb-4">
          Last checked: {formatDate(getStatus('binance_testnet').lastChecked)}
        </div>

        {authTestResult && (
          <Alert
            variant="default"
            className={`mb-4 ${
              authTestResult.includes('Success')
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50'
            }`}
          >
            <AlertTitle>Authenticated API Test</AlertTitle>
            <AlertDescription>{authTestResult}</AlertDescription>
          </Alert>
        )}

        {pairs.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Sample Trading Pairs:</h3>
            <ul className="space-y-1">
              {pairs.map((pair) => (
                <li key={pair.symbol} className="text-sm">
                  {pair.symbol} ({pair.baseAsset}/{pair.quoteAsset})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleTest} disabled={loading} className="w-full">
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
      </CardFooter>
    </Card>
  );
}
