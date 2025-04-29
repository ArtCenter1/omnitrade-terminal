/**
 * Balance Tracking Service
 *
 * This service subscribes to balance updates from exchange adapters and maintains
 * a cache of current balances. It provides methods for UI components to access
 * real-time balance data.
 */

import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { BinanceTestnetAdapter } from '@/services/exchange/binanceTestnetAdapter';
import { EventEmitter } from '@/utils/eventEmitter';
import { ApiKeyManager } from '@/services/apiKeys/apiKeyManager';
import logger from '@/utils/logger';

// Define the balance update event type
export interface BalanceUpdate {
  exchangeId: string;
  apiKeyId: string;
  asset: string;
  balance: {
    free: number;
    locked: number;
    total: number;
    available: number;
  };
  timestamp: number;
}

// Define the balance cache type
export interface BalanceCache {
  [exchangeId: string]: {
    [apiKeyId: string]: {
      [asset: string]: {
        free: number;
        locked: number;
        total: number;
        available: number;
        lastUpdated: number;
      };
    };
  };
}

/**
 * Singleton service for tracking balances across exchanges
 */
export class BalanceTrackingService {
  private static instance: BalanceTrackingService;
  private balanceCache: BalanceCache = {};
  private eventEmitter = new EventEmitter<BalanceUpdate>();
  private subscriptions: Map<string, () => void> = new Map();
  private isInitialized = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): BalanceTrackingService {
    if (!BalanceTrackingService.instance) {
      BalanceTrackingService.instance = new BalanceTrackingService();
    }
    return BalanceTrackingService.instance;
  }

  /**
   * Initialize the service by subscribing to balance updates from all adapters
   * @returns True if initialization was successful, false otherwise
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      logger.debug('[BalanceTrackingService] Already initialized, skipping');
      return true;
    }

    try {
      logger.info('[BalanceTrackingService] Initializing...');

      // Subscribe to Binance Testnet balance updates
      this.subscribeToExchangeAdapter('binance_testnet');

      // Subscribe to API key changes to update subscriptions
      this.subscribeToApiKeyChanges();

      this.isInitialized = true;
      logger.info('[BalanceTrackingService] Initialized successfully');
      return true;
    } catch (error) {
      logger.error('[BalanceTrackingService] Initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Subscribe to balance updates from an exchange adapter
   * @param exchangeId The exchange ID
   */
  private subscribeToExchangeAdapter(exchangeId: string): void {
    try {
      // Get the adapter
      const adapter = ExchangeFactory.getAdapter(exchangeId);

      // Only proceed if it's a BinanceTestnetAdapter
      if (adapter instanceof BinanceTestnetAdapter) {
        try {
          // Get all API keys for this exchange
          const apiKeyManager = ApiKeyManager.getInstance();

          // Check if the method exists
          if (typeof apiKeyManager.getApiKeys === 'function') {
            // Get all keys for the exchange
            apiKeyManager
              .getApiKeys(exchangeId)
              .then((apiKeys) => {
                if (Array.isArray(apiKeys) && apiKeys.length > 0) {
                  // Subscribe to balance updates for each API key
                  apiKeys.forEach((apiKey) => {
                    this.subscribeToAdapterForApiKey(adapter, apiKey.id);
                  });
                  logger.info(
                    `[BalanceTrackingService] Subscribed to ${apiKeys.length} API keys for ${exchangeId}`,
                  );
                } else {
                  logger.info(
                    `[BalanceTrackingService] No API keys found for ${exchangeId}`,
                  );
                }
              })
              .catch((error) => {
                logger.error(
                  `[BalanceTrackingService] Error getting API keys for ${exchangeId}:`,
                  error,
                );
              });
          } else {
            logger.warn(
              `[BalanceTrackingService] ApiKeyManager.getApiKeys method not found`,
            );
          }
        } catch (apiKeyError) {
          logger.error(
            `[BalanceTrackingService] Error with ApiKeyManager for ${exchangeId}:`,
            apiKeyError,
          );
        }
      } else {
        logger.debug(
          `[BalanceTrackingService] Adapter for ${exchangeId} is not a BinanceTestnetAdapter, skipping`,
        );
      }
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error subscribing to ${exchangeId}:`,
        error,
      );
    }
  }

  /**
   * Subscribe to balance updates for a specific API key
   * @param adapter The exchange adapter
   * @param apiKeyId The API key ID
   */
  private subscribeToAdapterForApiKey(
    adapter: BinanceTestnetAdapter,
    apiKeyId: string,
  ): void {
    // Create a unique subscription ID
    const subscriptionId = `${adapter.getExchangeId()}_${apiKeyId}`;

    // Check if we're already subscribed
    if (this.subscriptions.has(subscriptionId)) {
      return;
    }

    try {
      // Get the event emitter from the adapter
      const adapterEmitter = adapter.getEventEmitter();

      // Subscribe to balance updates
      const onBalanceUpdate = (data: BalanceUpdate) => {
        // Only process updates for this API key
        if (data.apiKeyId === apiKeyId) {
          this.handleBalanceUpdate(data);
        }
      };

      // Add the listener
      adapterEmitter.on('balanceUpdate', onBalanceUpdate);

      // Store the unsubscribe function
      this.subscriptions.set(subscriptionId, () => {
        adapterEmitter.off('balanceUpdate', onBalanceUpdate);
      });

      logger.info(
        `[BalanceTrackingService] Subscribed to balance updates for ${adapter.getExchangeId()} API key ${apiKeyId}`,
      );
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error subscribing to adapter for API key ${apiKeyId}:`,
        error,
      );
    }
  }

  /**
   * Subscribe to API key changes to update subscriptions
   */
  private subscribeToApiKeyChanges(): void {
    // Listen for API key added event
    window.addEventListener('apiKeyAdded', ((event: CustomEvent) => {
      const apiKey = event.detail;
      logger.info(
        `[BalanceTrackingService] API key added event received: ${apiKey.id} for ${apiKey.exchangeId}`,
      );

      // Only subscribe to Binance Testnet for now
      if (apiKey.exchangeId === 'binance_testnet') {
        const adapter = ExchangeFactory.getAdapter(apiKey.exchangeId);
        if (adapter instanceof BinanceTestnetAdapter) {
          this.subscribeToAdapterForApiKey(adapter, apiKey.id);
        }
      }
    }) as EventListener);

    // Listen for API key removed event
    window.addEventListener('apiKeyRemoved', ((event: CustomEvent) => {
      const apiKey = event.detail;
      logger.info(
        `[BalanceTrackingService] API key removed event received: ${apiKey.id} for ${apiKey.exchangeId}`,
      );

      // Remove subscription if it exists
      const subscriptionId = `${apiKey.exchangeId}_${apiKey.id}`;
      if (this.subscriptions.has(subscriptionId)) {
        const unsubscribe = this.subscriptions.get(subscriptionId);
        if (unsubscribe) {
          unsubscribe();
        }
        this.subscriptions.delete(subscriptionId);

        // Remove from cache
        if (this.balanceCache[apiKey.exchangeId]?.[apiKey.id]) {
          delete this.balanceCache[apiKey.exchangeId][apiKey.id];
        }

        logger.info(
          `[BalanceTrackingService] Unsubscribed from balance updates for ${apiKey.exchangeId} API key ${apiKey.id}`,
        );
      }
    }) as EventListener);

    logger.info('[BalanceTrackingService] Subscribed to API key change events');
  }

  /**
   * Handle a balance update event
   * @param update The balance update event
   */
  private handleBalanceUpdate(update: BalanceUpdate): void {
    // Ensure the cache structure exists
    if (!this.balanceCache[update.exchangeId]) {
      this.balanceCache[update.exchangeId] = {};
    }
    if (!this.balanceCache[update.exchangeId][update.apiKeyId]) {
      this.balanceCache[update.exchangeId][update.apiKeyId] = {};
    }

    // Update the cache
    this.balanceCache[update.exchangeId][update.apiKeyId][update.asset] = {
      ...update.balance,
      lastUpdated: update.timestamp,
    };

    // Emit the update event
    this.eventEmitter.emit(update);

    logger.debug(
      `[BalanceTrackingService] Balance updated for ${update.exchangeId} API key ${update.apiKeyId} asset ${update.asset}: ${JSON.stringify(update.balance)}`,
    );
  }

  /**
   * Get the current balance for a specific asset
   * @param exchangeId The exchange ID
   * @param apiKeyId The API key ID
   * @param asset The asset symbol
   * @returns The balance or undefined if not found
   */
  public getBalance(
    exchangeId: string,
    apiKeyId: string,
    asset: string,
  ):
    | {
        free: number;
        locked: number;
        total: number;
        available: number;
        lastUpdated: number;
      }
    | undefined {
    return this.balanceCache[exchangeId]?.[apiKeyId]?.[asset];
  }

  /**
   * Get all balances for a specific API key
   * @param exchangeId The exchange ID
   * @param apiKeyId The API key ID
   * @returns An object mapping asset symbols to balances
   */
  public getBalances(
    exchangeId: string,
    apiKeyId: string,
  ): {
    [asset: string]: {
      free: number;
      locked: number;
      total: number;
      available: number;
      lastUpdated: number;
    };
  } {
    return this.balanceCache[exchangeId]?.[apiKeyId] || {};
  }

  /**
   * Subscribe to balance updates
   * @param callback The callback function
   * @returns A function to unsubscribe
   */
  public subscribe(callback: (update: BalanceUpdate) => void): () => void {
    return this.eventEmitter.subscribe(callback);
  }

  /**
   * Force a refresh of balances for a specific API key
   * @param exchangeId The exchange ID
   * @param apiKeyId The API key ID
   */
  public async refreshBalances(
    exchangeId: string,
    apiKeyId: string,
  ): Promise<void> {
    try {
      // Get the adapter
      const adapter = ExchangeFactory.getAdapter(exchangeId);

      // Only proceed if it's a BinanceTestnetAdapter
      if (adapter instanceof BinanceTestnetAdapter) {
        // Trigger a balance reconciliation
        await adapter.reconcileBalances();
        logger.info(
          `[BalanceTrackingService] Manually refreshed balances for ${exchangeId} API key ${apiKeyId}`,
        );
      }
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error refreshing balances for ${exchangeId} API key ${apiKeyId}:`,
        error,
      );
      throw error;
    }
  }
}

// Export a singleton instance
export const balanceTrackingService = BalanceTrackingService.getInstance();
