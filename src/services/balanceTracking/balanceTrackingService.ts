/**
 * Balance Tracking Service
 *
 * This service subscribes to balance updates from exchange adapters and maintains
 * a cache of current balances. It provides methods for UI components to access
 * real-time balance data.
 */

import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { BinanceTestnetAdapter } from '@/services/exchange/binanceTestnetAdapter';
import { SandboxAdapter } from '@/services/exchange/sandboxAdapter';
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

      // Subscribe to Sandbox (Demo Account) balance updates
      this.subscribeToSandboxAdapter();

      // Subscribe to API key changes to update subscriptions
      this.subscribeToApiKeyChanges();

      // Force a refresh of Demo Account balances after a short delay
      setTimeout(async () => {
        logger.info(
          `[BalanceTrackingService] Refreshing Demo Account balances after initialization`,
        );
        await this.refreshBalances('sandbox', 'sandbox-key');

        // Log the current state of the balance cache
        this.logBalanceCache();
      }, 1000);

      // Force a refresh of Binance Testnet balances after a short delay
      setTimeout(async () => {
        logger.info(
          `[BalanceTrackingService] Refreshing Binance Testnet balances after initialization`,
        );
        await this.refreshBalances('binance_testnet', 'binance-testnet-key');

        // Log the current state of the balance cache
        this.logBalanceCache();
      }, 1500);

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
   * Log the current state of the balance cache
   */
  private logBalanceCache(): void {
    logger.info(`[BalanceTrackingService] Current balance cache state:`);

    // Log each exchange
    Object.keys(this.balanceCache).forEach((exchangeId) => {
      logger.info(`[BalanceTrackingService] Exchange: ${exchangeId}`);

      // Log each API key
      Object.keys(this.balanceCache[exchangeId] || {}).forEach((apiKeyId) => {
        const balances = this.balanceCache[exchangeId][apiKeyId];
        const assetCount = Object.keys(balances).length;

        logger.info(
          `[BalanceTrackingService] API key ${apiKeyId} has ${assetCount} assets`,
        );

        // Log each asset
        if (assetCount > 0) {
          Object.entries(balances).forEach(([asset, balance]) => {
            logger.info(
              `[BalanceTrackingService] Asset: ${asset}, Free: ${balance.free}, Locked: ${balance.locked}, Total: ${balance.total}`,
            );
          });
        }
      });
    });
  }

  /**
   * Initialize the Binance Testnet balances
   * @param adapter The Binance Testnet adapter
   */
  private async initializeBinanceTestnetBalances(
    adapter: BinanceTestnetAdapter,
  ): Promise<void> {
    try {
      // Use a standard API key ID for Binance Testnet
      const apiKeyId = 'binance-testnet-key';

      logger.info(
        `[BalanceTrackingService] Initializing Binance Testnet balances for API key ${apiKeyId}`,
      );

      // Try to get the portfolio from the adapter
      try {
        const portfolio = await adapter.getPortfolio(apiKeyId);

        if (portfolio && portfolio.assets && portfolio.assets.length > 0) {
          logger.info(
            `[BalanceTrackingService] Got portfolio with ${portfolio.assets.length} assets for Binance Testnet`,
          );

          // Log all assets for debugging
          portfolio.assets.forEach((asset) => {
            logger.info(
              `[BalanceTrackingService] Binance Testnet asset: ${asset.asset}, Free=${asset.free}, Locked=${asset.locked}, Total=${asset.total}`,
            );
          });

          // Add each asset to the balance cache
          portfolio.assets.forEach((asset) => {
            const updateData: BalanceUpdate = {
              exchangeId: 'binance_testnet',
              apiKeyId: apiKeyId,
              asset: asset.asset,
              balance: {
                free: asset.free,
                locked: asset.locked,
                total: asset.total,
                available: asset.free,
              },
              timestamp: Date.now(),
            };

            // Update the cache
            this.handleBalanceUpdate(updateData);
          });

          // Emit the balancesRefreshed event
          this.eventEmitter.emit({
            type: 'balancesRefreshed',
            exchangeId: 'binance_testnet',
            apiKeyId: apiKeyId,
            timestamp: Date.now(),
          });

          logger.info(
            `[BalanceTrackingService] Initialized Binance Testnet balances with ${portfolio.assets.length} assets`,
          );
          return;
        }
      } catch (portfolioError) {
        logger.warn(
          `[BalanceTrackingService] Error getting portfolio from Binance Testnet adapter:`,
          portfolioError,
        );
      }

      // If we get here, either the portfolio was empty or there was an error
      // Add default balances
      logger.warn(
        `[BalanceTrackingService] Using default balances for Binance Testnet`,
      );

      // Create default assets
      const defaultAssets = [
        {
          asset: 'USDT',
          free: 10000.0,
          locked: 0,
          total: 10000.0,
          usdValue: 10000.0,
          exchangeId: 'binance_testnet',
        },
        {
          asset: 'BTC',
          free: 0.5,
          locked: 0,
          total: 0.5,
          usdValue: 41527.67,
          exchangeId: 'binance_testnet',
        },
        {
          asset: 'ETH',
          free: 5.0,
          locked: 0,
          total: 5.0,
          usdValue: 17673.2,
          exchangeId: 'binance_testnet',
        },
      ];

      // Add each default asset to the balance cache
      defaultAssets.forEach((asset) => {
        const updateData: BalanceUpdate = {
          exchangeId: 'binance_testnet',
          apiKeyId: apiKeyId,
          asset: asset.asset,
          balance: {
            free: asset.free,
            locked: asset.locked,
            total: asset.total,
            available: asset.free,
          },
          timestamp: Date.now(),
        };

        // Log the balance update
        logger.info(
          `[BalanceTrackingService] Adding default Binance Testnet balance for ${asset.asset}: Free=${asset.free}, Locked=${asset.locked}, Total=${asset.total}`,
        );

        // Update the cache
        this.handleBalanceUpdate(updateData);
      });

      // Emit the balancesRefreshed event
      this.eventEmitter.emit({
        type: 'balancesRefreshed',
        exchangeId: 'binance_testnet',
        apiKeyId: apiKeyId,
        timestamp: Date.now(),
      });

      logger.info(
        `[BalanceTrackingService] Initialized Binance Testnet with default balances`,
      );
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error initializing Binance Testnet balances:`,
        error,
      );
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
   * Subscribe to balance updates from the Sandbox adapter (Demo Account)
   */
  private subscribeToSandboxAdapter(): void {
    try {
      // Get the sandbox adapter
      const adapter = ExchangeFactory.getAdapter('sandbox');

      if (adapter instanceof SandboxAdapter) {
        // Use the standard Demo Account API key ID
        const apiKeyId = 'sandbox-key';

        // Create a unique subscription ID
        const subscriptionId = `sandbox_${apiKeyId}`;

        // Check if we're already subscribed
        if (this.subscriptions.has(subscriptionId)) {
          return;
        }

        // Get the event emitter from the adapter
        const adapterEmitter = adapter.getEventEmitter();

        // Subscribe to balance updates
        const onBalanceUpdate = (data: BalanceUpdate) => {
          this.handleBalanceUpdate(data);
        };

        // Add the listener
        adapterEmitter.on('balanceUpdate', onBalanceUpdate);

        // Store the unsubscribe function
        this.subscriptions.set(subscriptionId, () => {
          adapterEmitter.off('balanceUpdate', onBalanceUpdate);
        });

        // Initialize the Demo Account balances
        this.initializeDemoAccountBalances(adapter);

        logger.info(
          `[BalanceTrackingService] Subscribed to balance updates for Demo Account`,
        );
      } else {
        logger.warn(
          `[BalanceTrackingService] Sandbox adapter not found or not a SandboxAdapter instance`,
        );
      }
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error subscribing to Sandbox adapter:`,
        error,
      );
    }
  }

  /**
   * Initialize the Demo Account balances from the mock portfolio
   * @param adapter The Sandbox adapter
   */
  private async initializeDemoAccountBalances(
    adapter: SandboxAdapter,
  ): Promise<void> {
    try {
      // Get the demo portfolio
      const apiKeyId = 'sandbox-key';

      logger.info(
        `[BalanceTrackingService] Initializing Demo Account balances for API key ${apiKeyId}`,
      );

      const portfolio = await adapter.getPortfolio(apiKeyId);

      if (!portfolio || !portfolio.assets || portfolio.assets.length === 0) {
        logger.warn(
          `[BalanceTrackingService] Failed to get portfolio data for Demo Account, using default assets`,
        );

        // Create default assets
        const defaultAssets = [
          {
            asset: 'USDT',
            free: 50000.0,
            locked: 0,
            total: 50000.0,
            usdValue: 50000.0,
            exchangeId: 'sandbox',
          },
          {
            asset: 'BTC',
            free: 0.1,
            locked: 0,
            total: 0.1,
            usdValue: 8305.53,
            exchangeId: 'sandbox',
          },
        ];

        // Add each default asset to the balance cache
        defaultAssets.forEach((asset) => {
          const updateData: BalanceUpdate = {
            exchangeId: 'sandbox',
            apiKeyId: apiKeyId,
            asset: asset.asset,
            balance: {
              free: asset.free,
              locked: asset.locked,
              total: asset.total,
              available: asset.free,
            },
            timestamp: Date.now(),
          };

          // Log the balance update
          logger.info(
            `[BalanceTrackingService] Adding default Demo Account balance for ${asset.asset}: Free=${asset.free}, Locked=${asset.locked}, Total=${asset.total}`,
          );

          // Update the cache
          this.handleBalanceUpdate(updateData);
        });

        // Emit the balancesRefreshed event
        this.eventEmitter.emit({
          type: 'balancesRefreshed',
          exchangeId: 'sandbox',
          apiKeyId: apiKeyId,
          timestamp: Date.now(),
        });

        logger.info(
          `[BalanceTrackingService] Initialized Demo Account with default balances`,
        );

        return;
      }

      logger.info(
        `[BalanceTrackingService] Got portfolio with ${portfolio.assets.length} assets for Demo Account`,
      );

      // Log all assets for debugging
      portfolio.assets.forEach((asset) => {
        logger.info(
          `[BalanceTrackingService] Demo Account asset: ${asset.asset}, Free=${asset.free}, Locked=${asset.locked}, Total=${asset.total}`,
        );
      });

      // Add each asset to the balance cache
      portfolio.assets.forEach((asset) => {
        const updateData: BalanceUpdate = {
          exchangeId: 'sandbox',
          apiKeyId: apiKeyId,
          asset: asset.asset,
          balance: {
            free: asset.free,
            locked: asset.locked,
            total: asset.total,
            available: asset.free,
          },
          timestamp: Date.now(),
        };

        // Log the balance update
        logger.info(
          `[BalanceTrackingService] Adding Demo Account balance for ${asset.asset}: Free=${asset.free}, Locked=${asset.locked}, Total=${asset.total}`,
        );

        // Update the cache
        this.handleBalanceUpdate(updateData);
      });

      // Force a refresh of the balances after a short delay
      setTimeout(() => {
        this.eventEmitter.emit({
          type: 'balancesRefreshed',
          exchangeId: 'sandbox',
          apiKeyId: apiKeyId,
          timestamp: Date.now(),
        });

        logger.info(
          `[BalanceTrackingService] Emitted balancesRefreshed event for Demo Account`,
        );

        // Log the current state of the balance cache for debugging
        const balances = this.balanceCache['sandbox']?.[apiKeyId] || {};
        const assetCount = Object.keys(balances).length;
        logger.info(
          `[BalanceTrackingService] Demo Account balance cache now has ${assetCount} assets`,
        );

        if (assetCount > 0) {
          Object.entries(balances).forEach(([asset, balance]) => {
            logger.info(
              `[BalanceTrackingService] Cached balance for ${asset}: Free=${balance.free}, Locked=${balance.locked}, Total=${balance.total}`,
            );
          });
        }
      }, 500);

      logger.info(
        `[BalanceTrackingService] Initialized Demo Account balances with ${portfolio.assets.length} assets`,
      );
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error initializing Demo Account balances:`,
        error,
      );

      // Even if there's an error, add some default balances
      try {
        logger.warn(
          `[BalanceTrackingService] Adding default balances after error`,
        );

        // Create default assets
        const defaultAssets = [
          {
            asset: 'USDT',
            free: 50000.0,
            locked: 0,
            total: 50000.0,
            usdValue: 50000.0,
            exchangeId: 'sandbox',
          },
          {
            asset: 'BTC',
            free: 0.1,
            locked: 0,
            total: 0.1,
            usdValue: 8305.53,
            exchangeId: 'sandbox',
          },
        ];

        // Add each default asset to the balance cache
        defaultAssets.forEach((asset) => {
          const updateData: BalanceUpdate = {
            exchangeId: 'sandbox',
            apiKeyId: apiKeyId,
            asset: asset.asset,
            balance: {
              free: asset.free,
              locked: asset.locked,
              total: asset.total,
              available: asset.free,
            },
            timestamp: Date.now(),
          };

          // Update the cache
          this.handleBalanceUpdate(updateData);
        });

        // Emit the balancesRefreshed event
        this.eventEmitter.emit({
          type: 'balancesRefreshed',
          exchangeId: 'sandbox',
          apiKeyId: apiKeyId,
          timestamp: Date.now(),
        });
      } catch (fallbackError) {
        logger.error(
          `[BalanceTrackingService] Error adding default balances:`,
          fallbackError,
        );
      }
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
      logger.info(
        `[BalanceTrackingService] Created cache for exchange ${update.exchangeId}`,
      );
    }
    if (!this.balanceCache[update.exchangeId][update.apiKeyId]) {
      this.balanceCache[update.exchangeId][update.apiKeyId] = {};
      logger.info(
        `[BalanceTrackingService] Created cache for API key ${update.apiKeyId} on exchange ${update.exchangeId}`,
      );
    }

    // Update the cache
    this.balanceCache[update.exchangeId][update.apiKeyId][update.asset] = {
      ...update.balance,
      lastUpdated: update.timestamp,
    };

    // Emit the update event
    this.eventEmitter.emit(update);

    logger.info(
      `[BalanceTrackingService] Balance updated for ${update.exchangeId} API key ${update.apiKeyId} asset ${update.asset}: Free=${update.balance.free}, Locked=${update.balance.locked}, Total=${update.balance.total}`,
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
    const balances = this.balanceCache[exchangeId]?.[apiKeyId] || {};

    // Log the balances being returned
    const assetCount = Object.keys(balances).length;
    logger.info(
      `[BalanceTrackingService] Getting balances for ${exchangeId} API key ${apiKeyId}: Found ${assetCount} assets`,
    );

    if (assetCount > 0) {
      Object.entries(balances).forEach(([asset, balance]) => {
        logger.info(
          `[BalanceTrackingService] Balance for ${asset}: Free=${balance.free}, Locked=${balance.locked}, Total=${balance.total}`,
        );
      });
    } else {
      logger.warn(
        `[BalanceTrackingService] No balances found for ${exchangeId} API key ${apiKeyId}`,
      );
    }

    return balances;
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
      logger.info(
        `[BalanceTrackingService] Manually refreshing balances for ${exchangeId} API key ${apiKeyId}`,
      );

      // Log the current state of the balance cache before refresh
      const currentBalances = this.balanceCache[exchangeId]?.[apiKeyId] || {};
      const currentAssetCount = Object.keys(currentBalances).length;
      logger.info(
        `[BalanceTrackingService] Before refresh: ${exchangeId} API key ${apiKeyId} has ${currentAssetCount} assets in cache`,
      );

      // Get the adapter
      const adapter = ExchangeFactory.getAdapter(exchangeId);

      if (!adapter) {
        logger.error(
          `[BalanceTrackingService] Adapter not found for ${exchangeId}`,
        );
        return;
      }

      // Handle different adapter types
      if (adapter instanceof BinanceTestnetAdapter) {
        // Trigger a balance reconciliation for Binance Testnet
        try {
          // Check if the reconcileBalances method exists
          if (typeof adapter.reconcileBalances === 'function') {
            await adapter.reconcileBalances();
            logger.info(
              `[BalanceTrackingService] Manually refreshed balances for ${exchangeId} API key ${apiKeyId}`,
            );
          } else {
            // If the method doesn't exist, log a warning and use a fallback
            logger.warn(
              `[BalanceTrackingService] reconcileBalances method not found on adapter for ${exchangeId}`,
            );

            // Use a fallback method - get portfolio data
            const portfolio = await adapter.getPortfolio(apiKeyId);

            if (portfolio && portfolio.assets) {
              // Process the portfolio assets
              portfolio.assets.forEach((asset) => {
                const updateData: BalanceUpdate = {
                  exchangeId,
                  apiKeyId,
                  asset: asset.asset,
                  balance: {
                    free: asset.free,
                    locked: asset.locked,
                    total: asset.total,
                    available: asset.free,
                  },
                  timestamp: Date.now(),
                };

                // Update the cache
                this.handleBalanceUpdate(updateData);
              });

              logger.info(
                `[BalanceTrackingService] Refreshed balances using portfolio data for ${exchangeId} API key ${apiKeyId}`,
              );
            }
          }
        } catch (reconcileError) {
          logger.error(
            `[BalanceTrackingService] Error reconciling balances for ${exchangeId}:`,
            reconcileError,
          );

          // Try to get portfolio data as a fallback
          try {
            const portfolio = await adapter.getPortfolio(apiKeyId);

            if (portfolio && portfolio.assets) {
              // Process the portfolio assets
              portfolio.assets.forEach((asset) => {
                const updateData: BalanceUpdate = {
                  exchangeId,
                  apiKeyId,
                  asset: asset.asset,
                  balance: {
                    free: asset.free,
                    locked: asset.locked,
                    total: asset.total,
                    available: asset.free,
                  },
                  timestamp: Date.now(),
                };

                // Update the cache
                this.handleBalanceUpdate(updateData);
              });

              logger.info(
                `[BalanceTrackingService] Refreshed balances using fallback portfolio data for ${exchangeId} API key ${apiKeyId}`,
              );
            }
          } catch (portfolioError) {
            logger.error(
              `[BalanceTrackingService] Error getting fallback portfolio data for ${exchangeId}:`,
              portfolioError,
            );
          }
        }
      } else if (
        adapter instanceof SandboxAdapter &&
        exchangeId === 'sandbox'
      ) {
        // For Demo Account, re-initialize the balances
        await this.initializeDemoAccountBalances(adapter);
        logger.info(
          `[BalanceTrackingService] Manually refreshed Demo Account balances`,
        );
      } else {
        logger.warn(
          `[BalanceTrackingService] Unsupported adapter type for refreshing balances: ${exchangeId}`,
        );
      }

      // Log the updated state of the balance cache after refresh
      const updatedBalances = this.balanceCache[exchangeId]?.[apiKeyId] || {};
      const updatedAssetCount = Object.keys(updatedBalances).length;
      logger.info(
        `[BalanceTrackingService] After refresh: ${exchangeId} API key ${apiKeyId} has ${updatedAssetCount} assets in cache`,
      );

      if (updatedAssetCount > 0) {
        Object.entries(updatedBalances).forEach(([asset, balance]) => {
          logger.info(
            `[BalanceTrackingService] Updated balance for ${asset}: Free=${balance.free}, Locked=${balance.locked}, Total=${balance.total}`,
          );
        });
      }

      // Emit a balancesRefreshed event
      this.eventEmitter.emit({
        type: 'balancesRefreshed',
        exchangeId,
        apiKeyId,
        timestamp: Date.now(),
      });

      logger.info(
        `[BalanceTrackingService] Emitted balancesRefreshed event for ${exchangeId} API key ${apiKeyId}`,
      );
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error refreshing balances for ${exchangeId} API key ${apiKeyId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Reserve balance for an order
   * @param exchangeId The exchange ID
   * @param apiKeyId The API key ID
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param side The order side ('buy' or 'sell')
   * @param type The order type ('market', 'limit', etc.)
   * @param quantity The order quantity
   * @param price The order price (for limit orders)
   * @returns True if the balance was successfully reserved, false otherwise
   */
  public reserveBalanceForOrder(
    exchangeId: string,
    apiKeyId: string,
    symbol: string,
    side: 'buy' | 'sell',
    type: string,
    quantity: number,
    price?: number,
  ): boolean {
    try {
      // Parse the symbol to get base and quote assets
      const [baseAsset, quoteAsset] = symbol.split('/');

      if (!baseAsset || !quoteAsset) {
        logger.error(
          `[BalanceTrackingService] Invalid symbol format: ${symbol}. Expected format: 'BTC/USDT'`,
        );
        return false;
      }

      // Get current balances
      const baseBalance = this.getBalance(exchangeId, apiKeyId, baseAsset);
      const quoteBalance = this.getBalance(exchangeId, apiKeyId, quoteAsset);

      if (!baseBalance || !quoteBalance) {
        logger.error(
          `[BalanceTrackingService] Balance not found for ${exchangeId} API key ${apiKeyId}: ${baseAsset} or ${quoteAsset}`,
        );
        return false;
      }

      // Calculate amount to reserve
      let assetToReserve: string;
      let amountToReserve: number;

      if (side === 'buy') {
        // For buy orders, reserve quote asset (e.g., USDT)
        assetToReserve = quoteAsset;

        // For market orders without a price, we need to estimate the cost
        // This is a simplified approach - in production, you might want to add a buffer
        if (type === 'market' && !price) {
          // Try to get the current market price
          // This is a placeholder - you would need to implement a way to get the current price
          // For now, we'll just log an error and return false
          logger.error(
            `[BalanceTrackingService] Cannot reserve balance for market buy order without price estimate`,
          );
          return false;
        }

        // Calculate amount to reserve
        amountToReserve = quantity * (price || 0);
      } else {
        // For sell orders, reserve base asset (e.g., BTC)
        assetToReserve = baseAsset;
        amountToReserve = quantity;
      }

      // Get the balance for the asset to reserve
      const balance = side === 'buy' ? quoteBalance : baseBalance;

      // Check if there's enough free balance
      if (balance.free < amountToReserve) {
        logger.error(
          `[BalanceTrackingService] Insufficient free balance for ${exchangeId} API key ${apiKeyId}: ${assetToReserve}. ` +
            `Required: ${amountToReserve}, Available: ${balance.free}`,
        );
        return false;
      }

      // Update the balance in the cache
      this.updateBalanceForReservation(
        exchangeId,
        apiKeyId,
        assetToReserve,
        amountToReserve,
        true, // isReserve = true
      );

      logger.info(
        `[BalanceTrackingService] Reserved ${amountToReserve} ${assetToReserve} for ${side} ${type} order on ${symbol}`,
      );
      return true;
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error reserving balance for order:`,
        error,
      );
      return false;
    }
  }

  /**
   * Release reserved balance for an order
   * @param exchangeId The exchange ID
   * @param apiKeyId The API key ID
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param side The order side ('buy' or 'sell')
   * @param type The order type ('market', 'limit', etc.)
   * @param quantity The order quantity
   * @param price The order price (for limit orders)
   * @returns True if the balance was successfully released, false otherwise
   */
  public releaseReservedBalance(
    exchangeId: string,
    apiKeyId: string,
    symbol: string,
    side: 'buy' | 'sell',
    type: string,
    quantity: number,
    price?: number,
  ): boolean {
    try {
      // Parse the symbol to get base and quote assets
      const [baseAsset, quoteAsset] = symbol.split('/');

      if (!baseAsset || !quoteAsset) {
        logger.error(
          `[BalanceTrackingService] Invalid symbol format: ${symbol}. Expected format: 'BTC/USDT'`,
        );
        return false;
      }

      // Calculate amount to release
      let assetToRelease: string;
      let amountToRelease: number;

      if (side === 'buy') {
        // For buy orders, release quote asset (e.g., USDT)
        assetToRelease = quoteAsset;
        amountToRelease = quantity * (price || 0);
      } else {
        // For sell orders, release base asset (e.g., BTC)
        assetToRelease = baseAsset;
        amountToRelease = quantity;
      }

      // Update the balance in the cache
      this.updateBalanceForReservation(
        exchangeId,
        apiKeyId,
        assetToRelease,
        amountToRelease,
        false, // isReserve = false
      );

      logger.info(
        `[BalanceTrackingService] Released ${amountToRelease} ${assetToRelease} for ${side} ${type} order on ${symbol}`,
      );
      return true;
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error releasing reserved balance:`,
        error,
      );
      return false;
    }
  }

  /**
   * Update balance for reservation or release
   * @param exchangeId The exchange ID
   * @param apiKeyId The API key ID
   * @param asset The asset symbol
   * @param amount The amount to reserve or release
   * @param isReserve True to reserve, false to release
   */
  private updateBalanceForReservation(
    exchangeId: string,
    apiKeyId: string,
    asset: string,
    amount: number,
    isReserve: boolean,
  ): void {
    // Ensure the cache structure exists
    if (!this.balanceCache[exchangeId]) {
      this.balanceCache[exchangeId] = {};
    }
    if (!this.balanceCache[exchangeId][apiKeyId]) {
      this.balanceCache[exchangeId][apiKeyId] = {};
    }
    if (!this.balanceCache[exchangeId][apiKeyId][asset]) {
      // If the asset doesn't exist in the cache, we can't update it
      logger.error(
        `[BalanceTrackingService] Cannot update balance for ${exchangeId} API key ${apiKeyId}: ${asset} not found in cache`,
      );
      return;
    }

    // Get the current balance
    const currentBalance = this.balanceCache[exchangeId][apiKeyId][asset];

    // Calculate new free and locked amounts
    let newFree: number;
    let newLocked: number;

    if (isReserve) {
      // Reserve: decrease free, increase locked
      newFree = currentBalance.free - amount;
      newLocked = currentBalance.locked + amount;
    } else {
      // Release: increase free, decrease locked
      newFree = currentBalance.free + amount;
      newLocked = Math.max(0, currentBalance.locked - amount); // Ensure locked doesn't go negative
    }

    // Update the balance in the cache
    this.balanceCache[exchangeId][apiKeyId][asset] = {
      free: newFree,
      locked: newLocked,
      total: newFree + newLocked,
      available: newFree,
      lastUpdated: Date.now(),
    };

    // Emit a balance update event
    const updateData: BalanceUpdate = {
      exchangeId,
      apiKeyId,
      asset,
      balance: {
        free: newFree,
        locked: newLocked,
        total: newFree + newLocked,
        available: newFree,
      },
      timestamp: Date.now(),
    };

    this.eventEmitter.emit(updateData);

    logger.debug(
      `[BalanceTrackingService] ${isReserve ? 'Reserved' : 'Released'} ${amount} ${asset} for ${exchangeId} API key ${apiKeyId}. ` +
        `New balance: Free=${newFree}, Locked=${newLocked}`,
    );
  }

  /**
   * Check if there's sufficient balance for an order
   * @param exchangeId The exchange ID
   * @param apiKeyId The API key ID
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param side The order side ('buy' or 'sell')
   * @param quantity The order quantity
   * @param price The order price (for limit orders)
   * @returns True if there's sufficient balance, false otherwise
   */
  public hasSufficientBalance(
    exchangeId: string,
    apiKeyId: string,
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    price?: number,
  ): boolean {
    try {
      // Parse the symbol to get base and quote assets
      const [baseAsset, quoteAsset] = symbol.split('/');

      if (!baseAsset || !quoteAsset) {
        logger.error(
          `[BalanceTrackingService] Invalid symbol format: ${symbol}. Expected format: 'BTC/USDT'`,
        );
        return false;
      }

      // Get current balances
      const baseBalance = this.getBalance(exchangeId, apiKeyId, baseAsset);
      const quoteBalance = this.getBalance(exchangeId, apiKeyId, quoteAsset);

      if (!baseBalance || !quoteBalance) {
        logger.error(
          `[BalanceTrackingService] Balance not found for ${exchangeId} API key ${apiKeyId}: ${baseAsset} or ${quoteAsset}`,
        );
        return false;
      }

      // Check if there's enough free balance
      if (side === 'buy') {
        // For buy orders, check quote asset (e.g., USDT)
        if (!price) {
          logger.error(
            `[BalanceTrackingService] Cannot check balance for buy order without price`,
          );
          return false;
        }
        const requiredAmount = quantity * price;
        return quoteBalance.free >= requiredAmount;
      } else {
        // For sell orders, check base asset (e.g., BTC)
        return baseBalance.free >= quantity;
      }
    } catch (error) {
      logger.error(
        `[BalanceTrackingService] Error checking balance for order:`,
        error,
      );
      return false;
    }
  }
}

// Export a singleton instance
export const balanceTrackingService = BalanceTrackingService.getInstance();
