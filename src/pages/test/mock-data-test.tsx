// src/pages/test/mock-data-test.tsx
import React from 'react';
import { MockDataWarning, ApiAuthWarning } from '@/components/settings/MockDataWarning';
import { ApiKeyManager } from '@/components/settings/ApiKeyManager';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureFlagsContext, setFeatureFlag } from '@/config/featureFlags';

/**
 * Test page for mock data warnings and API key management
 */
export default function MockDataTest() {
  const flags = useFeatureFlagsContext();
  
  // Toggle mock data mode
  const toggleMockData = () => {
    setFeatureFlag('useMockData', !flags.useMockData);
  };
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Mock Data Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Settings</h2>
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <p>Mock Data Mode: <strong>{flags.useMockData ? 'Enabled' : 'Disabled'}</strong></p>
          <p>Connection Mode: <strong>{flags.connectionMode}</strong></p>
          <p>Binance Testnet: <strong>{flags.useBinanceTestnet ? 'Enabled' : 'Disabled'}</strong></p>
        </div>
        
        <Button onClick={toggleMockData} className="mb-6">
          {flags.useMockData ? 'Disable Mock Data' : 'Enable Mock Data'}
        </Button>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Warning Components</h2>
        
        <div className="space-y-4">
          <MockDataWarning />
          
          <ApiAuthWarning />
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>This is a default alert.</AlertDescription>
          </Alert>
          
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning Alert</AlertTitle>
            <AlertDescription>This is a warning alert.</AlertDescription>
          </Alert>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Destructive Alert</AlertTitle>
            <AlertDescription>This is a destructive alert.</AlertDescription>
          </Alert>
          
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Success Alert</AlertTitle>
            <AlertDescription>This is a success alert.</AlertDescription>
          </Alert>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">API Key Manager</h2>
        <ApiKeyManager exchangeId="binance_testnet" />
      </div>
    </div>
  );
}
