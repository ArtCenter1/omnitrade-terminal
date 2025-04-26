import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { TradingPair } from '@/types/exchange';

/**
 * Component for testing the Binance Testnet integration
 */
export function BinanceTestnetTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  
  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPairs([]);
    
    try {
      // Get the Binance Testnet adapter
      const adapter = ExchangeFactory.getAdapter('binance_testnet');
      
      // Test getting exchange info
      const exchangeInfo = await adapter.getExchangeInfo();
      console.log('Exchange info:', exchangeInfo);
      
      // Test getting trading pairs
      const tradingPairs = await adapter.getTradingPairs();
      console.log('Trading pairs:', tradingPairs);
      setPairs(tradingPairs.slice(0, 5)); // Show first 5 pairs
      
      setSuccess('Successfully connected to Binance Testnet API');
    } catch (err) {
      console.error('Error testing Binance Testnet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Binance Testnet API');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Test Binance Testnet Connection</CardTitle>
        <CardDescription>
          Verify that the Binance Testnet API is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
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
        <Button onClick={handleTest} disabled={loading}>
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
      </CardFooter>
    </Card>
  );
}
