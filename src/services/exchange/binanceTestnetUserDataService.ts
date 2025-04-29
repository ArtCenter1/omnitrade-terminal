/**
 * Binance Testnet User Data Service
 *
 * This service is responsible for managing the user data stream from Binance Testnet.
 * It creates and maintains a listen key, establishes a WebSocket connection,
 * and provides real-time updates for account and order changes.
 */

import { BinanceTestnetService } from './binanceTestnetService';
import { BinanceTestnetWebSocketService } from './binanceTestnetWebSocketService';
import { EventEmitter } from '@/utils/eventEmitter';
import { ApiKeyManager } from '@/services/apiKeys/apiKeyManager';

// Define user data event types
export type UserDataEventType =
  | 'executionReport'
  | 'outboundAccountPosition'
  | 'balanceUpdate';

// Define user data events
export interface UserDataEvent {
  type: UserDataEventType;
  data: any;
}

/**
 * Binance Testnet User Data Service
 */
export class BinanceTestnetUserDataService {
  private static instance: BinanceTestnetUserDataService;
  private binanceService: BinanceTestnetService;
  private wsService: BinanceTestnetWebSocketService;
  private apiKeyManager: ApiKeyManager;
  private eventEmitter: EventEmitter<any>;
  private isInitialized = false;
  private exchangeId = 'binance_testnet';

  // Listen key management
  private listenKey: string | null = null;
  private listenKeyTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  // WebSocket subscription ID
  private subscriptionId: string | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.binanceService = BinanceTestnetService.getInstance();
    this.wsService = BinanceTestnetWebSocketService.getInstance();
    this.apiKeyManager = ApiKeyManager.getInstance();
    this.eventEmitter = new EventEmitter<any>();
  }

  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): BinanceTestnetUserDataService {
    if (!BinanceTestnetUserDataService.instance) {
      BinanceTestnetUserDataService.instance =
        new BinanceTestnetUserDataService();
    }

    return BinanceTestnetUserDataService.instance;
  }

  /**
   * Initialize the user data service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if Binance Testnet is enabled
      const isEnabled = await this.binanceService.isEnabled();
      if (!isEnabled) {
        console.log(
          'Binance Testnet User Data service not initialized: Testnet is disabled',
        );
        return;
      }

      // Initialize WebSocket service
      await this.wsService.initialize();

      // Start the user data stream
      await this.startUserDataStream();

      this.isInitialized = true;
      console.log('Binance Testnet User Data service initialized');
    } catch (error) {
      console.error(
        'Failed to initialize Binance Testnet User Data service:',
        error,
      );
    }
  }

  /**
   * Start the user data stream
   */
  private async startUserDataStream(): Promise<void> {
    try {
      // Get API key ID
      const apiKeyId = await this.apiKeyManager.getDefaultApiKeyId(
        this.exchangeId,
      );
      if (!apiKeyId) {
        console.error('No API key found for Binance Testnet');
        return;
      }

      // Create a listen key
      this.listenKey = await this.createListenKey(apiKeyId);
      if (!this.listenKey) {
        console.error('Failed to create listen key');
        return;
      }

      console.log(`Listen key created: ${this.listenKey.substring(0, 8)}...`);

      // Subscribe to the user data stream
      this.subscribeToUserDataStream();

      // Set up listen key keep-alive
      this.setupListenKeyKeepAlive(apiKeyId);
    } catch (error) {
      console.error('Error starting user data stream:', error);
    }
  }

  /**
   * Create a listen key for the user data stream
   * @param apiKeyId The API key ID
   * @returns The listen key
   */
  private async createListenKey(apiKeyId: string): Promise<string | null> {
    try {
      // Get API credentials
      const credentials = await this.apiKeyManager.getApiKey(apiKeyId);
      if (!credentials) {
        console.error('API credentials not found');
        return null;
      }

      // Create listen key
      const response = await fetch(
        'https://testnet.binance.vision/api/v3/userDataStream',
        {
          method: 'POST',
          headers: {
            'X-MBX-APIKEY': credentials.apiKey,
          },
        },
      );

      if (!response.ok) {
        console.error('Failed to create listen key:', await response.text());
        return null;
      }

      const data = await response.json();
      return data.listenKey;
    } catch (error) {
      console.error('Error creating listen key:', error);
      return null;
    }
  }

  /**
   * Keep the listen key alive by sending periodic ping requests
   * @param apiKeyId The API key ID
   */
  private setupListenKeyKeepAlive(apiKeyId: string): void {
    // Clear any existing timer
    if (this.listenKeyTimer) {
      clearInterval(this.listenKeyTimer);
    }

    // Set up a new timer to ping every 30 minutes
    // Binance requires a ping every 60 minutes, we do it every 30 to be safe
    this.listenKeyTimer = setInterval(
      async () => {
        try {
          await this.pingListenKey(apiKeyId);
        } catch (error) {
          console.error('Error pinging listen key:', error);
        }
      },
      30 * 60 * 1000,
    ); // 30 minutes
  }

  /**
   * Ping the listen key to keep it alive
   * @param apiKeyId The API key ID
   */
  private async pingListenKey(apiKeyId: string): Promise<void> {
    if (!this.listenKey) {
      console.error('No listen key to ping');
      return;
    }

    try {
      // Get API credentials
      const credentials = await this.apiKeyManager.getApiKey(apiKeyId);
      if (!credentials) {
        console.error('API credentials not found');
        return;
      }

      // Ping listen key
      const response = await fetch(
        `https://testnet.binance.vision/api/v3/userDataStream?listenKey=${this.listenKey}`,
        {
          method: 'PUT',
          headers: {
            'X-MBX-APIKEY': credentials.apiKey,
          },
        },
      );

      if (!response.ok) {
        console.error('Failed to ping listen key:', await response.text());

        // If ping fails, try to create a new listen key
        this.listenKey = await this.createListenKey(apiKeyId);
        if (this.listenKey) {
          console.log(
            `New listen key created: ${this.listenKey.substring(0, 8)}...`,
          );

          // Resubscribe with the new listen key
          this.unsubscribeFromUserDataStream();
          this.subscribeToUserDataStream();
        }

        return;
      }

      console.log('Listen key ping successful');
    } catch (error) {
      console.error('Error pinging listen key:', error);
    }
  }

  /**
   * Subscribe to the user data stream
   */
  private subscribeToUserDataStream(): void {
    if (!this.listenKey) {
      console.error('No listen key to subscribe with');
      return;
    }

    // Subscribe to the user data stream
    this.subscriptionId = this.wsService.subscribeUserData(
      this.listenKey,
      this.handleUserDataMessage.bind(this),
    );

    console.log('Subscribed to user data stream');
  }

  /**
   * Unsubscribe from the user data stream
   */
  private unsubscribeFromUserDataStream(): void {
    if (this.subscriptionId) {
      this.wsService.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
      console.log('Unsubscribed from user data stream');
    }
  }

  /**
   * Handle user data messages from WebSocket
   * @param message The user data message
   */
  private handleUserDataMessage(message: any): void {
    try {
      // Process different event types
      if (message.e === 'executionReport') {
        // Order update
        this.eventEmitter.emit(message);
        console.log(
          `Order update received: ${message.s} ${message.S} ${message.X}`,
        );
      } else if (message.e === 'outboundAccountPosition') {
        // Account update
        this.eventEmitter.emit(message);
        console.log('Account update received');
      } else if (message.e === 'balanceUpdate') {
        // Balance update
        this.eventEmitter.emit(message);
        console.log(`Balance update received: ${message.a} ${message.d}`);
      } else {
        console.log('Unknown user data message type:', message.e);
      }
    } catch (error) {
      console.error('Error handling user data message:', error);
    }
  }

  /**
   * Subscribe to user data events
   * @param callback The callback function
   * @returns A function to unsubscribe
   */
  public subscribe(callback: (event: any) => void): () => void {
    return this.eventEmitter.subscribe(callback);
  }

  /**
   * Close the user data stream
   */
  public async close(): Promise<void> {
    // Clear timers
    if (this.listenKeyTimer) {
      clearInterval(this.listenKeyTimer);
      this.listenKeyTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Unsubscribe from WebSocket
    this.unsubscribeFromUserDataStream();

    // Delete listen key
    if (this.listenKey) {
      try {
        // Get API key ID
        const apiKeyId = await this.apiKeyManager.getDefaultApiKeyId(
          this.exchangeId,
        );
        if (apiKeyId) {
          // Get API credentials
          const credentials = await this.apiKeyManager.getApiKey(apiKeyId);
          if (credentials) {
            // Delete listen key
            await fetch(
              `https://testnet.binance.vision/api/v3/userDataStream?listenKey=${this.listenKey}`,
              {
                method: 'DELETE',
                headers: {
                  'X-MBX-APIKEY': credentials.apiKey,
                },
              },
            );

            console.log('Listen key deleted');
          }
        }
      } catch (error) {
        console.error('Error deleting listen key:', error);
      }

      this.listenKey = null;
    }

    this.isInitialized = false;
    console.log('Binance Testnet User Data service closed');
  }

  /**
   * Get the connection status
   * @returns The connection status
   */
  public getConnectionStatus(): string {
    if (!this.isInitialized) {
      return 'disconnected';
    }

    if (!this.listenKey) {
      return 'error';
    }

    return this.wsService.getConnectionStatus();
  }
}
