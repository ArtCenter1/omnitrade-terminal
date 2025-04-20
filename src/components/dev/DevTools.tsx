// src/components/dev/DevTools.tsx
import React from 'react';
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

  // Only show in development mode or when debug tools are enabled
  if (import.meta.env.PROD && !flags.enableDebugTools) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Developer Tools</CardTitle>
        <CardDescription>Tools for development and testing</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="feature-flags">
          <TabsList>
            <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
            <TabsTrigger value="connection-status">
              Connection Status
            </TabsTrigger>
            <TabsTrigger value="api-explorer">API Explorer</TabsTrigger>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span>Backend API</span>
        <StatusIndicator status={backendStatus} />
      </div>

      {/* Add more connection status indicators here */}
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
