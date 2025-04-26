import { BinanceTestnetToggle } from './BinanceTestnetToggle';
import { BinanceTestnetTest } from './BinanceTestnetTest';

/**
 * Combined component for Binance Testnet settings
 */
export function BinanceTestnetSettings() {
  return (
    <div className="space-y-4">
      <BinanceTestnetToggle />
      <BinanceTestnetTest />
    </div>
  );
}
