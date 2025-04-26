// src/components/settings/BinanceTestnetApiKeyManager.tsx
import { ApiKeyManager } from './ApiKeyManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Component for managing Binance Testnet API keys
 */
export function BinanceTestnetApiKeyManager() {
  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Binance Testnet API Keys</CardTitle>
          <CardDescription>
            Manage your Binance Testnet API keys for sandbox trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Binance Testnet is our default matching engine. You need to set up API keys to test order placement and trading functionality.
              </p>
              <p>
                If you don't have a Binance Testnet account, you can create one at{' '}
                <a
                  href="https://testnet.binance.vision/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center"
                >
                  testnet.binance.vision
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            </AlertDescription>
          </Alert>

          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">How to get Binance Testnet API keys:</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>
                Go to{' '}
                <a
                  href="https://testnet.binance.vision/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center"
                >
                  testnet.binance.vision
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>Log in with your GitHub or Google account</li>
              <li>Click on "Generate HMAC_SHA256 Key"</li>
              <li>Copy the API Key and Secret Key</li>
              <li>Add them below</li>
            </ol>
          </div>

          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              onClick={() => window.open('https://testnet.binance.vision/', '_blank')}
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Binance Testnet
            </Button>
          </div>
        </CardContent>
      </Card>

      <ApiKeyManager
        exchangeId="binance_testnet"
        title="Your Binance Testnet API Keys"
        description="Add and manage your Binance Testnet API keys"
      />
    </div>
  );
}
