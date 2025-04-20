// src/components/dev/FeatureFlagsPanel.tsx
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
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
    <TooltipProvider>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Toggle features for development and testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Label htmlFor="use-mock-data">Use Mock Data</Label>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Use mock data instead of real API calls
                </p>
              </TooltipContent>
            </Tooltip>
            <Switch
              id="use-mock-data"
              checked={flags.useMockData}
              onCheckedChange={(checked) =>
                handleToggle('useMockData', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Label htmlFor="use-real-market-data">
                    Use Real Market Data
                  </Label>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Use real market data for charts and prices
                </p>
              </TooltipContent>
            </Tooltip>
            <Switch
              id="use-real-market-data"
              checked={flags.useRealMarketData}
              onCheckedChange={(checked) =>
                handleToggle('useRealMarketData', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Label htmlFor="connection-mode">Connection Mode</Label>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Switch between Mock, Sandbox, and Live modes
                </p>
              </TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Label htmlFor="enable-sandbox-account">
                    Enable Sandbox Account
                  </Label>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Enable sandbox account for practice trading
                </p>
              </TooltipContent>
            </Tooltip>
            <Switch
              id="enable-sandbox-account"
              checked={flags.enableSandboxAccount}
              onCheckedChange={(checked) =>
                handleToggle('enableSandboxAccount', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Label htmlFor="enable-debug-tools">Enable Debug Tools</Label>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Enable debug tools in production mode
                </p>
              </TooltipContent>
            </Tooltip>
            <Switch
              id="enable-debug-tools"
              checked={flags.enableDebugTools}
              onCheckedChange={(checked) =>
                handleToggle('enableDebugTools', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Label htmlFor="show-performance-metrics">
                    Show Performance Metrics
                  </Label>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Display performance metrics in the UI
                </p>
              </TooltipContent>
            </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1"
              >
                Reset to Defaults
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Reset all feature flags to their default values
              </p>
            </TooltipContent>
          </Tooltip>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
