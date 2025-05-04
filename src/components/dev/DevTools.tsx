// src/components/dev/DevTools.tsx
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, RefreshCw } from 'lucide-react';
import { FeatureFlagsPanel } from './FeatureFlagsPanel';
import { useFeatureFlagsContext, setFeatureFlag } from '@/config/featureFlags.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import * as optimizedCoinGeckoService from '@/services/optimizedCoinGeckoService';
import { BinanceTestnetSettings } from '@/components/settings/BinanceTestnetSettings';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';

/**
 * Developer tools component
 * Only shown in development mode or when debug tools are enabled
 */
export function DevTools() {
  const flags = useFeatureFlagsContext();
  const [backendStatus, setBackendStatus] = React.useState<
    'connected' | 'disconnected' | 'checking'
  >('checking');

  // We'll use the ConnectionStatus component to handle all health checks
  // This eliminates duplicate health check polling
  React.useEffect(() => {
    // Just set an initial status based on mock data flag
    if (flags.useMockData) {
      setBackendStatus('connected'); // Assume connected when using mock data
    } else {
      setBackendStatus('checking');
    }

    // No interval here - we'll rely on the ConnectionStatus component
  }, [flags.useMockData]);

  // Only show in development mode or when debug tools are enabled
  if (import.meta.env.PROD && !flags.enableDebugTools) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Feature Flags Column */}
        <Card className="w-full p-0">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1">
              <CardTitle className="text-lg">Feature Flags</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Toggle features for development and testing
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Toggle features for development and testing
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <FeatureFlagsPanel />
          </CardContent>
        </Card>

        {/* Connection Status Column */}
        <Card className="w-full p-0">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1">
              <CardTitle className="text-lg">Connection Status</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Check connection status to backend and exchanges
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>System and exchange connections</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ConnectionStatus />
          </CardContent>
        </Card>

        {/* API Explorer Column */}
        <Card className="w-full p-0">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1">
              <CardTitle className="text-lg">API Explorer</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Test API endpoints and view responses
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>Test API endpoints</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ApiExplorer />
          </CardContent>
        </Card>
      </div>

      {/* Exchange Settings */}
      <div className="mt-4">
        <Card className="w-full p-0">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1">
              <CardTitle className="text-lg">Exchange Settings</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Configure exchange-specific settings and test connections
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Exchange configuration and testing
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ExchangeSettings />
          </CardContent>
        </Card>
      </div>

      {/* CoinGecko API Status */}
      <div className="mt-4">
        <Card className="w-full p-0">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1">
              <CardTitle className="text-lg">CoinGecko API Status</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Monitor CoinGecko API usage and cache statistics
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>API usage and cache statistics</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <CoinGeckoStatus />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Connection status component
 * Shows the status of connections to the backend and exchanges
 */
function ConnectionStatus() {
  const flags = useFeatureFlagsContext();
  const { statuses, checkConnection } = useConnectionStatus();
  const [lastChecked, setLastChecked] = React.useState(new Date());
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // If we should show the connection status section
  const shouldShowConnectionStatus = React.useMemo(() => {
    // If we're using mock data and in development mode, don't show connection status
    if (flags.useMockData && import.meta.env.DEV) {
      return false;
    }
    return true;
  }, [flags.useMockData]);

  // If we shouldn't show connection status, return null
  if (!shouldShowConnectionStatus) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-500/10 text-center">
        <p className="text-sm text-muted-foreground">
          Connection status indicators are disabled when using mock data.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          To see actual connection status, disable "Use Mock Data" in the
          Feature Flags panel.
        </p>
      </div>
    );
  }

  // Convert ConnectionStatus enum to our component status type
  const mapConnectionStatus = (
    status: string,
  ): 'connected' | 'disconnected' | 'checking' => {
    switch (status) {
      case 'connected':
        return 'connected';
      case 'disconnected':
      case 'error':
        return 'disconnected';
      case 'connecting':
        return 'checking';
      default:
        return 'disconnected';
    }
  };

  // Get active exchanges from the connection manager
  const activeExchanges = React.useMemo(() => {
    return Array.from(statuses.entries()).map(([id, status]) => ({
      id,
      name: id.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      status: mapConnectionStatus(status.status),
      type: status.type,
      message: status.message,
    }));
  }, [statuses]);

  // Refresh all connections
  const refreshConnections = React.useCallback(async () => {
    setIsRefreshing(true);
    setLastChecked(new Date());

    // Check exchange connections
    const exchangeIds = Array.from(statuses.keys());
    for (const exchangeId of exchangeIds) {
      await checkConnection(exchangeId);
    }

    setIsRefreshing(false);
  }, [checkConnection, statuses]);

  // Initial check on mount
  React.useEffect(() => {
    refreshConnections();

    // Set up interval for periodic checks (every 60 seconds)
    const interval = setInterval(refreshConnections, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [refreshConnections]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Exchange Connections
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshConnections}
          disabled={isRefreshing}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw
            className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg p-2">
        <div className="space-y-2">
          {activeExchanges.map((exchange) => (
            <div
              key={exchange.id}
              className="flex items-center justify-between"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="capitalize text-muted-foreground cursor-help">
                      {exchange.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {exchange.message || `${exchange.name} connection status`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {exchange.type}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <StatusIndicator status={exchange.status} />
            </div>
          ))}

          {activeExchanges.length === 0 && (
            <div className="text-muted-foreground text-sm">
              No exchange connections configured
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Connection Details
        </h3>
        <div className="text-xs text-muted-foreground">
          <p>Backend URL: {window.location.origin}/api</p>
          <p className="flex items-center gap-1">
            Environment: {import.meta.env.MODE}
          </p>
          <p>Last checked: {lastChecked.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Status indicator component
 */
function StatusIndicator({
  status,
}: {
  status: 'connected' | 'disconnected' | 'checking';
}) {
  return (
    <div className="flex items-center">
      <div
        className={`w-3 h-3 rounded-full mr-2 ${
          status === 'connected'
            ? 'bg-green-500'
            : status === 'disconnected'
              ? 'bg-red-500'
              : 'bg-yellow-500'
        }`}
      />
      <span className="text-muted-foreground">
        {status === 'connected'
          ? 'Connected'
          : status === 'disconnected'
            ? 'Disconnected'
            : 'Checking...'}
      </span>
    </div>
  );
}

/**
 * API explorer component
 * Allows testing API endpoints
 */
function ApiExplorer() {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          API Endpoints
        </h3>
        <p className="text-sm text-muted-foreground">
          API Explorer coming soon...
        </p>
      </div>
    </div>
  );
}

/**
 * Exchange Settings component
 * Allows configuring exchange-specific settings
 */
function ExchangeSettings() {
  const flags = useFeatureFlagsContext();

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Binance Testnet
        </h3>
        <BinanceTestnetSettings />
      </div>
    </div>
  );
}

/**
 * CoinGecko API status component
 * Shows statistics about CoinGecko API usage and cache
 */
function CoinGeckoStatus() {
  const [cacheStats, setCacheStats] = React.useState<Record<string, number>>(
    {},
  );
  const [coinGeckoStatus, setCoinGeckoStatus] = React.useState<
    'connected' | 'disconnected' | 'checking'
  >('checking');
  const [apiKey, setApiKey] = React.useState<string>('');
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const flags = useFeatureFlagsContext();

  // Check if CoinGecko API key is set
  React.useEffect(() => {
    const key = import.meta.env.VITE_COINGECKO_API_KEY || '';
    setApiKey(key ? 'Configured' : 'Not configured');
  }, []);

  // Check CoinGecko API status and get cache statistics
  const checkCoinGeckoStatus = React.useCallback(async () => {
    try {
      setIsRefreshing(true);
      setCoinGeckoStatus('checking');

      // Test the API by fetching top coins
      await optimizedCoinGeckoService.getTopCoins(5);
      setCoinGeckoStatus('connected');

      // Get cache statistics
      const stats = optimizedCoinGeckoService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error checking CoinGecko API status:', error);
      setCoinGeckoStatus('disconnected');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Check status on mount
  React.useEffect(() => {
    checkCoinGeckoStatus();
  }, [checkCoinGeckoStatus]);

  // Reset cache handler
  const handleResetCache = () => {
    optimizedCoinGeckoService.resetCache();
    checkCoinGeckoStatus();
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            API Status
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={checkCoinGeckoStatus}
            disabled={isRefreshing}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">CoinGecko API</span>
            <StatusIndicator status={coinGeckoStatus} />
          </div>

          {/* Kill Switch for CoinGecko API */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Label htmlFor="disable-coingecko-api" className="text-red-500 font-semibold text-sm">
                    Emergency Kill Switch
                  </Label>
                  <HelpCircle className="h-3 w-3 text-red-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Disable all CoinGecko API calls. Use this when experiencing rate limiting or API issues.
                </p>
              </TooltipContent>
            </Tooltip>
            <Switch
              id="disable-coingecko-api"
              checked={flags.disableCoinGeckoApi}
              onCheckedChange={(checked) =>
                setFeatureFlag('disableCoinGeckoApi', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">API Key</span>
            <span className="text-muted-foreground text-sm">{apiKey}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Public API Requests
            </span>
            <span className="text-muted-foreground text-sm">
              {cacheStats.publicRequestCount || 0}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Pro API Requests
            </span>
            <span className="text-muted-foreground text-sm">
              {cacheStats.proRequestCount || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Cache Statistics
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetCache}
            className="h-7 px-2 text-xs"
          >
            Reset Cache
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Coins Cache</span>
            <span className="text-muted-foreground text-sm">
              {cacheStats.coins || 0} items
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Markets Cache</span>
            <span className="text-muted-foreground text-sm">
              {cacheStats.markets || 0} items
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Tickers Cache</span>
            <span className="text-muted-foreground text-sm">
              {cacheStats.tickers || 0} items
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Symbol to ID Cache
            </span>
            <span className="text-muted-foreground text-sm">
              {cacheStats.symbolToId || 0} items
            </span>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          API Information
        </h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            Public API: <code>https://api.coingecko.com/api/v3</code>
          </p>
          <p>
            Pro API: <code>https://pro-api.coingecko.com/api/v3</code>
          </p>
          <p>Rate Limits: 30 req/min (Public), 50 req/min (Free tier)</p>
          <p>Last checked: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}
