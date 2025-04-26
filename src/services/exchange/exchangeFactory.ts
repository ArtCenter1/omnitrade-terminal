// Exchange Factory

import { ExchangeAdapter } from '@/types/exchange';
import { BinanceAdapter } from './binanceAdapter';
import { CoinbaseAdapter } from './coinbaseAdapter';
import { SandboxAdapter } from './sandboxAdapter';
import { BinanceTestnetAdapter } from './binanceTestnetAdapter';
import { SUPPORTED_EXCHANGES } from '../mockData/mockDataUtils';
import { getFeatureFlags } from '@/config/featureFlags';

/**
 * Factory class for creating exchange adapters.
 * This provides a single point of access for all exchange adapters.
 */
export class ExchangeFactory {
  private static adapters: Map<string, ExchangeAdapter> = new Map();

  /**
   * Get an exchange adapter for the specified exchange.
   * @param exchangeId The ID of the exchange (e.g., 'binance', 'coinbase')
   * @returns An exchange adapter for the specified exchange
   * @throws Error if the exchange is not supported
   */
  public static getAdapter(exchangeId: string): ExchangeAdapter {
    // Check if we already have an instance of this adapter
    if (this.adapters.has(exchangeId)) {
      return this.adapters.get(exchangeId)!;
    }

    // Create a new adapter based on the exchange ID
    let adapter: ExchangeAdapter;

    // Get feature flags to check if Binance Testnet is enabled
    const featureFlags = getFeatureFlags();

    switch (exchangeId.toLowerCase()) {
      case 'binance':
        adapter = new BinanceAdapter();
        break;
      case 'coinbase':
        adapter = new CoinbaseAdapter();
        break;
      case 'sandbox':
        // If Binance Testnet is enabled, use it for the sandbox
        if (featureFlags.useBinanceTestnet) {
          adapter = new BinanceTestnetAdapter();
        } else {
          adapter = new SandboxAdapter();
        }
        break;
      case 'binance_testnet':
        adapter = new BinanceTestnetAdapter();
        break;
      default:
        // Check if the exchange is supported
        const isSupported = SUPPORTED_EXCHANGES.some(
          (e) => e.id === exchangeId,
        );
        if (!isSupported) {
          throw new Error(`Exchange ${exchangeId} is not supported`);
        }

        // Default to Binance adapter for now
        // In a real implementation, you would have adapters for all supported exchanges
        adapter = new BinanceAdapter();
    }

    // Cache the adapter for future use
    this.adapters.set(exchangeId, adapter);

    return adapter;
  }

  /**
   * Get a list of all supported exchanges.
   * @returns An array of exchange IDs
   */
  public static getSupportedExchanges(): string[] {
    const baseExchanges = SUPPORTED_EXCHANGES.map((exchange) => exchange.id);

    // Add Binance Testnet if it's not already included
    if (!baseExchanges.includes('binance_testnet')) {
      baseExchanges.push('binance_testnet');
    }

    return baseExchanges;
  }
}
