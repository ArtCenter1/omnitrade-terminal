// src/components/dev/FeatureFlagsPanel.tsx
import React from 'react';
import {
  getFeatureFlags,
  setFeatureFlag,
  resetFeatureFlags,
  FeatureFlags,
} from '@/config/featureFlags.tsx';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConnectionMode } from '@/config/exchangeConfig';

/**
 * Panel for toggling feature flags
 * Only shown in development mode
 */
export function FeatureFlagsPanel() {
  const [flags, setFlags] = React.useState<FeatureFlags>(getFeatureFlags());

  // Update local state when flags change
  React.useEffect(() => {
    const handleFlagsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        flags: FeatureFlags;
      }>;
      setFlags(customEvent.detail.flags);
    };

    window.addEventListener('feature-flags-changed', handleFlagsChanged);

    return () => {
      window.removeEventListener('feature-flags-changed', handleFlagsChanged);
    };
  }, []);

  // Handle toggle changes
  const handleToggle = (flag: keyof FeatureFlags, value: boolean) => {
    setFeatureFlag(flag, value);
  };

  // Handle connection mode change
  const handleConnectionModeChange = (value: string) => {
    setFeatureFlag('connectionMode', value as ConnectionMode);
  };

  // Handle reset
  const handleReset = () => {
    resetFeatureFlags();
  };

  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Toggle features for development and testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="use-mock-data">Use Mock Data</Label>
          <Switch
            id="use-mock-data"
            checked={flags.useMockData}
            onCheckedChange={(checked) => handleToggle('useMockData', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="use-real-market-data">Use Real Market Data</Label>
          <Switch
            id="use-real-market-data"
            checked={flags.useRealMarketData}
            onCheckedChange={(checked) =>
              handleToggle('useRealMarketData', checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="connection-mode">Connection Mode</Label>
          <Select
            value={flags.connectionMode}
            onValueChange={handleConnectionModeChange}
          >
            <SelectTrigger id="connection-mode" className="w-32">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mock">Mock</SelectItem>
              <SelectItem value="sandbox">Sandbox</SelectItem>
              <SelectItem value="live">Live</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="enable-sandbox-account">Enable Sandbox Account</Label>
          <Switch
            id="enable-sandbox-account"
            checked={flags.enableSandboxAccount}
            onCheckedChange={(checked) =>
              handleToggle('enableSandboxAccount', checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="enable-debug-tools">Enable Debug Tools</Label>
          <Switch
            id="enable-debug-tools"
            checked={flags.enableDebugTools}
            onCheckedChange={(checked) =>
              handleToggle('enableDebugTools', checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-performance-metrics">
            Show Performance Metrics
          </Label>
          <Switch
            id="show-performance-metrics"
            checked={flags.showPerformanceMetrics}
            onCheckedChange={(checked) =>
              handleToggle('showPerformanceMetrics', checked)
            }
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={handleReset} className="w-full">
          Reset to Defaults
        </Button>
      </CardFooter>
    </Card>
  );
}
