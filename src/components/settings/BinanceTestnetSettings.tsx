import { BinanceTestnetToggle } from './BinanceTestnetToggle';
import { BinanceTestnetTest } from './BinanceTestnetTest';
import { BinanceTestnetApiKeyManager } from './BinanceTestnetApiKeyManager';
import { BinanceTestnetMarketDataTest } from './BinanceTestnetMarketDataTest';
import { BinanceTestnetOrderTest } from './BinanceTestnetOrderTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Combined component for Binance Testnet settings
 */
export function BinanceTestnetSettings() {
  return (
    <div className="space-y-4">
      <BinanceTestnetToggle />

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys" id="api-keys-tab">
            API Keys
          </TabsTrigger>
          <TabsTrigger value="connection-test" id="connection-test-tab">
            Connection Test
          </TabsTrigger>
          <TabsTrigger value="market-data-test" id="market-data-test-tab">
            Market Data
          </TabsTrigger>
          <TabsTrigger value="order-test" id="order-test-tab">
            Order Placement
          </TabsTrigger>
        </TabsList>
        <TabsContent value="api-keys">
          <BinanceTestnetApiKeyManager />
        </TabsContent>
        <TabsContent value="connection-test">
          <BinanceTestnetTest />
        </TabsContent>
        <TabsContent value="market-data-test">
          <BinanceTestnetMarketDataTest />
        </TabsContent>
        <TabsContent value="order-test">
          <BinanceTestnetOrderTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}
