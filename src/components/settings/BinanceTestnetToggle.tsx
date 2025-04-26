import { useFeatureFlags, setFeatureFlag } from '@/config/featureFlags';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Info } from 'lucide-react';
import { ConnectionStatusIndicator } from '@/components/connection/ConnectionStatusIndicator';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';

/**
 * Component for toggling the Binance Testnet feature flag
 */
export function BinanceTestnetToggle() {
  const featureFlags = useFeatureFlags();
  const { getStatus, checkConnection } = useConnectionStatus();

  const handleToggle = (checked: boolean) => {
    setFeatureFlag('useBinanceTestnet', checked);

    // Check connection status after toggling
    if (checked) {
      setTimeout(() => {
        checkConnection('binance_testnet');
      }, 500);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Binance Testnet Integration
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          {featureFlags.useBinanceTestnet && (
            <ConnectionStatusIndicator exchangeId="binance_testnet" size="md" />
          )}
        </div>
        <CardDescription>
          Use Binance Testnet API for sandbox trading with real market data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch
            id="binance-testnet"
            checked={featureFlags.useBinanceTestnet}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="binance-testnet">
            {featureFlags.useBinanceTestnet ? 'Enabled' : 'Disabled'}
          </Label>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            When enabled, the Sandbox account will use Binance Testnet API for:
          </p>
          <ul className="list-disc pl-5 mt-2">
            <li>Real-time market data</li>
            <li>Order book and price information</li>
            <li>Trading pair information</li>
            <li>Order execution with a real matching engine</li>
          </ul>
          <p className="mt-2">
            <strong>Note:</strong> You'll need to create a Binance Testnet
            account and API keys to use this feature.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
