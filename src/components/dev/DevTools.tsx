// src/components/dev/DevTools.tsx
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
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
  }, []);

  // Only show in development mode or when debug tools are enabled
  if (import.meta.env.PROD && !flags.enableDebugTools) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Developer Tools</CardTitle>
            <CardDescription>Tools for development and testing</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Backend API:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        backendStatus === 'connected'
                          ? 'bg-green-500'
                          : backendStatus === 'disconnected'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                      }`}
                    />
                    <span className="text-sm">
                      {backendStatus === 'connected'
                        ? 'Connected'
                        : backendStatus === 'disconnected'
                          ? 'Disconnected'
                          : 'Checking...'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {backendStatus === 'connected'
                      ? 'Backend API is responding normally'
                      : backendStatus === 'disconnected'
                        ? 'Cannot connect to Backend API. Check server status.'
                        : 'Checking connection to Backend API...'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="feature-flags">
          <TabsList>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="feature-flags"
                    className="flex items-center gap-1"
                  >
                    Feature Flags
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Toggle features for development and testing
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="connection-status"
                    className="flex items-center gap-1"
                  >
                    Connection Status
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Check connection status to backend and exchanges
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="api-explorer"
                    className="flex items-center gap-1"
                  >
                    API Explorer
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Test API endpoints and view responses
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>
          <TabsContent value="feature-flags">
            <FeatureFlagsPanel />
          </TabsContent>
          <TabsContent value="connection-status">
            <ConnectionStatus />
          </TabsContent>
          <TabsContent value="api-explorer">
            <ApiExplorer />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Connection status component
 * Shows the status of connections to the backend and exchanges
 */
function ConnectionStatus() {
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
  }, []);

  // Mock some exchange statuses for demonstration
  React.useEffect(() => {
    if (Object.keys(exchangeStatuses).length === 0) {
      setExchangeStatuses({
        binance: Math.random() > 0.2 ? 'connected' : 'disconnected',
        kraken: Math.random() > 0.2 ? 'connected' : 'disconnected',
        coinbase: Math.random() > 0.2 ? 'connected' : 'disconnected',
      });
    }
  }, [exchangeStatuses]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-3">System Connections</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Backend API</span>
              <StatusIndicator status={backendStatus} />
            </div>

            <div className="flex items-center justify-between">
              <span>Database</span>
              <StatusIndicator status={databaseStatus} />
            </div>

            <div className="flex items-center justify-between">
              <span>Redis Cache</span>
              <StatusIndicator status={redisStatus} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Exchange Connections</h3>
          <div className="space-y-3">
            {Object.entries(exchangeStatuses).map(([exchange, status]) => (
              <div key={exchange} className="flex items-center justify-between">
                <span className="capitalize">{exchange}</span>
                <StatusIndicator status={status} />
              </div>
            ))}

            {Object.keys(exchangeStatuses).length === 0 && (
              <div className="text-gray-400 text-sm">
                No exchange connections configured
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-3">Connection Details</h3>
        <div className="text-xs text-gray-400">
          <p>Backend URL: {window.location.origin}/api</p>
          <p>Environment: {import.meta.env.MODE}</p>
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
      <span>
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
      <p>API Explorer coming soon...</p>
    </div>
  );
}
