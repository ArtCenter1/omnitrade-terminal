/**
 * Binance Testnet Service
 *
 * Provides centralized access to Binance Testnet functionality.
 * Acts as a facade for the BinanceTestnetAdapter and manages feature flags.
 */

import { BinanceTestnetAdapter } from './binanceTestnetAdapter';
import { getFeatureFlags, setFeatureFlag } from '@/config/featureFlags';
import { ApiKeyManager } from '@/services/apiKeys/apiKeyManager';
import {
  ConnectionManager,
  ConnectionStatus,
} from '../connection/connectionManager';

/**
 * Binance Testnet Service
 */
export class BinanceTestnetService {
  private static instance: BinanceTestnetService;
  private adapter: BinanceTestnetAdapter;
  private apiKeyManager: ApiKeyManager;
  private connectionManager: ConnectionManager;
  private exchangeId = 'binance_testnet';
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.adapter = new BinanceTestnetAdapter();
    this.apiKeyManager = ApiKeyManager.getInstance();
    this.connectionManager = ConnectionManager.getInstance();
  }

  /**
   * Get the BinanceTestnetService instance
   * @returns The BinanceTestnetService instance
   */
  public static getInstance(): BinanceTestnetService {
    if (!BinanceTestnetService.instance) {
      BinanceTestnetService.instance = new BinanceTestnetService();
    }
    return BinanceTestnetService.instance;
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if Binance Testnet is enabled
      const isEnabled = await this.isEnabled();
      if (!isEnabled) {
        console.log(
          'Binance Testnet service not initialized: Testnet is disabled',
        );
        return;
      }

      // Start connection checking
      this.startConnectionChecking();

      this.isInitialized = true;
      console.log('Binance Testnet service initialized');
    } catch (error) {
      console.error('Failed to initialize Binance Testnet service:', error);
      this.connectionManager.updateConnectionStatus(this.exchangeId, 'error');
    }
  }

  /**
   * Check if Binance Testnet is enabled
   * @returns True if Binance Testnet is enabled
   */
  public async isEnabled(): Promise<boolean> {
    const featureFlags = getFeatureFlags();
    return featureFlags.useBinanceTestnet === true;
  }

  /**
   * Enable Binance Testnet
   */
  public async enable(): Promise<void> {
    await setFeatureFlag('useBinanceTestnet', true);

    // Initialize if not already
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Disable Binance Testnet
   */
  public async disable(): Promise<void> {
    await setFeatureFlag('useBinanceTestnet', false);

    // Stop connection checking
    this.stopConnectionChecking();

    this.isInitialized = false;
  }

  /**
   * Start checking the connection status
   */
  private startConnectionChecking(): void {
    // Stop any existing interval
    this.stopConnectionChecking();

    // Define the check function
    const checkConnection = async () => {
      try {
        // Try to get exchange info as a connection test
        await this.adapter.getExchangeInfo();

        // If successful, update connection status
        this.connectionManager.updateConnectionStatus(
          this.exchangeId,
          'connected',
        );

        return {
          status: ConnectionStatus.CONNECTED,
          message: 'Connected to Binance Testnet',
        };
      } catch (error) {
        // If failed, update connection status
        this.connectionManager.updateConnectionStatus(this.exchangeId, 'error');

        return {
          status: ConnectionStatus.ERROR,
          message: 'Failed to connect to Binance Testnet',
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    };

    // Start checking connection every minute
    this.connectionManager.startChecking(
      this.exchangeId,
      checkConnection,
      60000, // 1 minute
    );
  }

  /**
   * Stop checking the connection status
   */
  private stopConnectionChecking(): void {
    this.connectionManager.stopChecking(this.exchangeId);
  }

  /**
   * Get the connection status
   * @returns The connection status
   */
  public getConnectionStatus(): string {
    return this.connectionManager.getConnectionStatus(this.exchangeId);
  }

  /**
   * Get the adapter instance
   * @returns The BinanceTestnetAdapter instance
   */
  public getAdapter(): BinanceTestnetAdapter {
    return this.adapter;
  }

  /**
   * Validate API key credentials
   * @param apiKey The API key
   * @param apiSecret The API secret
   * @returns True if the credentials are valid
   */
  public async validateApiKey(
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean> {
    return this.adapter.validateApiKey(apiKey, apiSecret);
  }

  /**
   * Save API key credentials
   * @param apiKey The API key
   * @param apiSecret The API secret
   * @param label Optional label for the key
   * @returns The API key ID
   */
  public async saveApiKey(
    apiKey: string,
    apiSecret: string,
    label?: string,
  ): Promise<string> {
    // Validate the API key first
    const isValid = await this.validateApiKey(apiKey, apiSecret);
    if (!isValid) {
      throw new Error('Invalid API key or secret');
    }

    // Save the API key
    return this.apiKeyManager.saveApiKey(
      this.exchangeId,
      apiKey,
      apiSecret,
      label || 'Binance Testnet',
    );
  }

  /**
   * Get API key credentials
   * @param apiKeyId The API key ID
   * @returns The API key credentials
   */
  public async getApiKey(apiKeyId: string): Promise<{
    apiKey: string;
    apiSecret: string;
  }> {
    const apiKeyPair = await this.apiKeyManager.getApiKey(apiKeyId);
    if (!apiKeyPair) {
      throw new Error(`API key ${apiKeyId} not found`);
    }

    return {
      apiKey: apiKeyPair.apiKey,
      apiSecret: apiKeyPair.apiSecret,
    };
  }

  /**
   * Get all API keys for Binance Testnet
   * @returns An array of API key pairs
   */
  public async getAllApiKeys(): Promise<
    Array<{
      id: string;
      exchangeId: string;
      apiKey: string;
      label?: string;
      lastUsed?: Date;
    }>
  > {
    return this.apiKeyManager.getAllApiKeys(this.exchangeId);
  }

  /**
   * Delete an API key
   * @param apiKeyId The API key ID
   * @returns True if deleted successfully
   */
  public async deleteApiKey(apiKeyId: string): Promise<boolean> {
    return this.apiKeyManager.deleteApiKey(apiKeyId);
  }
}
