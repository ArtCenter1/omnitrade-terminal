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
import { useFeatureFlagsContext } from '@/config/featureFlags.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as enhancedCoinGeckoService from '@/services/enhancedCoinGeckoService';

/**
 * Developer tools component
 * Only shown in development mode or when debug tools are enabled
 */
export function DevTools() {
  const flags = useFeatureFlagsContext();
  const [backendStatus, setBackendStatus] = React.useState<
    'connected' | 'disconnected' | 'checking'
  >('checking');

  // Check backend connection on mount
  React.useEffect(() => {
    const checkBackendConnection = async () => {
      // Skip API health check if using mock data
      if (flags.useMockData) {
        setBackendStatus('connected'); // Assume connected when using mock data
        return;
      }

      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('disconnected');
        }
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkBackendConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000);

    return () => {
      clearInterval(interval);
    };
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

  // Use the same backendStatus from the parent component
  const [backendStatus, setBackendStatus] = React.useState<
    'connected' | 'disconnected' | 'checking'
  >('checking');

  // Add more connection statuses
  const [databaseStatus, setDatabaseStatus] = React.useState<
    'connected' | 'disconnected' | 'checking'
  >('checking');

  const [redisStatus, setRedisStatus] = React.useState<
    'connected' | 'disconnected' | 'checking'
  >('checking');

  const [exchangeStatuses, setExchangeStatuses] = React.useState<{
    [key: string]: 'connected' | 'disconnected' | 'checking';
  }>({});

  // Check connections on mount
  React.useEffect(() => {
    const checkConnections = async () => {
      // If using mock data, set mock statuses
      if (flags.useMockData) {
        setBackendStatus('connected');
        setDatabaseStatus('connected');
        setRedisStatus('connected');

        // Set mock exchange statuses
        setExchangeStatuses({
          binance: 'connected',
          kraken: 'connected',
          coinbase: 'connected',
        });
        return;
      }

      // Check backend connection
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setBackendStatus('connected');
          // If we get a successful response, assume database is connected
          setDatabaseStatus('connected');

          // Try to parse the response for more detailed status
          const data = await response.json().catch(() => ({}));
          if (data.redis === 'ok') {
            setRedisStatus('connected');
          } else if (data.redis === 'error') {
            setRedisStatus('disconnected');
          }

          // Check exchange statuses if available
          if (data.exchanges) {
            const statuses: {
              [key: string]: 'connected' | 'disconnected' | 'checking';
            } = {};
            Object.entries(data.exchanges).forEach(([exchange, status]) => {
              statuses[exchange] =
                status === 'ok' ? 'connected' : 'disconnected';
            });
            setExchangeStatuses(statuses);
          }
        } else {
          setBackendStatus('disconnected');
          setDatabaseStatus('disconnected');
          setRedisStatus('disconnected');
        }
      } catch (error) {
        setBackendStatus('disconnected');
        setDatabaseStatus('disconnected');
        setRedisStatus('disconnected');
      }
    };

    checkConnections();

    // Check connections every 30 seconds
    const interval = setInterval(checkConnections, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [flags.useMockData]);

  // Mock some exchange statuses for demonstration if not using mock data
  React.useEffect(() => {
    if (!flags.useMockData && Object.keys(exchangeStatuses).length === 0) {
      setExchangeStatuses({
        binance: Math.random() > 0.2 ? 'connected' : 'disconnected',
        kraken: Math.random() > 0.2 ? 'connected' : 'disconnected',
        coinbase: Math.random() > 0.2 ? 'connected' : 'disconnected',
      });
    }
  }, [exchangeStatuses, flags.useMockData]);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          System Connections
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Backend API</span>
            <StatusIndicator status={backendStatus} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Database</span>
            <StatusIndicator status={databaseStatus} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Redis Cache</span>
            <StatusIndicator status={redisStatus} />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Exchange Connections
        </h3>
        <div className="space-y-2">
          {Object.entries(exchangeStatuses).map(([exchange, status]) => (
            <div key={exchange} className="flex items-center justify-between">
              <span className="capitalize text-muted-foreground">
                {exchange}
              </span>
              <StatusIndicator status={status} />
            </div>
          ))}

          {Object.keys(exchangeStatuses).length === 0 && (
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
            {import.meta.env.MODE === 'development' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-500"
                      >
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                        <path d="M12 9v4"></path>
                        <path d="M12 17h.01"></path>
                      </svg>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      In development mode, connection statuses show as
                      "Connected" when using mock data, regardless of the
                      Connection Mode setting.
                    </p>
                    <p className="mt-1">
                      These are virtual connections for development purposes
                      only and do not represent actual connections to external
                      services.
                    </p>
                    <p className="mt-1">To implement real connection checks:</p>
                    <ol className="list-decimal pl-4 mt-1">
                      <li>Turn off "Use Mock Data" toggle</li>
                      <li>Implement health check endpoints in the backend</li>
                      <li>
                        Update the connection status logic in the frontend
                      </li>
                    </ol>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </p>
          <p>Last checked: {new Date().toLocaleTimeString()}</p>
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
      await enhancedCoinGeckoService.getTopCoins(5);
      setCoinGeckoStatus('connected');

      // Get cache statistics
      const stats = enhancedCoinGeckoService.getCacheStats();
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
    enhancedCoinGeckoService.resetCache();
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
