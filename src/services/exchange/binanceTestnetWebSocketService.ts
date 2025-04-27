/**
 * Binance Testnet WebSocket Service
 * 
 * Provides WebSocket connections to Binance Testnet for real-time market data.
 */

import { WebSocketManager, SubscriptionType, SubscriptionParams } from '../connection/websocketManager';
import { BinanceTestnetService } from './binanceTestnetService';
import { ConnectionManager } from '../connection/connectionManager';

// Binance Testnet WebSocket base URL
const BINANCE_TESTNET_WS_BASE_URL = 'wss://testnet.binance.vision/ws';
const BINANCE_TESTNET_COMBINED_STREAM_URL = 'wss://testnet.binance.vision/stream';

/**
 * Binance Testnet WebSocket Service
 */
export class BinanceTestnetWebSocketService {
  private static instance: BinanceTestnetWebSocketService;
  private wsManager: WebSocketManager;
  private connectionManager: ConnectionManager;
  private binanceService: BinanceTestnetService;
  private subscriptions: Map<string, string> = new Map();
  private isInitialized = false;
  private exchangeId = 'binance_testnet';

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.wsManager = WebSocketManager.getInstance();
    this.connectionManager = ConnectionManager.getInstance();
    this.binanceService = BinanceTestnetService.getInstance();
  }

  /**
   * Get the BinanceTestnetWebSocketService instance
   * @returns The BinanceTestnetWebSocketService instance
   */
  public static getInstance(): BinanceTestnetWebSocketService {
    if (!BinanceTestnetWebSocketService.instance) {
      BinanceTestnetWebSocketService.instance = new BinanceTestnetWebSocketService();
    }
    return BinanceTestnetWebSocketService.instance;
  }

  /**
   * Initialize the WebSocket service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if Binance Testnet is enabled
      const isEnabled = await this.binanceService.isEnabled();
      if (!isEnabled) {
        console.log('Binance Testnet WebSocket service not initialized: Testnet is disabled');
        return;
      }

      // Create WebSocket connection
      this.wsManager.createConnection(this.exchangeId, BINANCE_TESTNET_COMBINED_STREAM_URL);
      
      this.isInitialized = true;
      console.log('Binance Testnet WebSocket service initialized');
    } catch (error) {
      console.error('Failed to initialize Binance Testnet WebSocket service:', error);
      this.connectionManager.updateConnectionStatus(this.exchangeId, 'error');
    }
  }

  /**
   * Subscribe to ticker updates
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param callback The callback function
   * @returns The subscription ID
   */
  public subscribeTicker(symbol: string, callback: (data: any) => void): string {
    return this.subscribe('ticker', { symbol }, callback);
  }

  /**
   * Subscribe to order book updates
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param limit The number of levels (default: 10)
   * @param callback The callback function
   * @returns The subscription ID
   */
  public subscribeOrderBook(
    symbol: string,
    limit: number = 10,
    callback: (data: any) => void,
  ): string {
    return this.subscribe('depth', { symbol, limit }, callback);
  }

  /**
   * Subscribe to trade updates
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param callback The callback function
   * @returns The subscription ID
   */
  public subscribeTrades(symbol: string, callback: (data: any) => void): string {
    return this.subscribe('trades', { symbol }, callback);
  }

  /**
   * Subscribe to candlestick updates
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param interval The candlestick interval (e.g., '1m', '5m', '1h')
   * @param callback The callback function
   * @returns The subscription ID
   */
  public subscribeKlines(
    symbol: string,
    interval: string,
    callback: (data: any) => void,
  ): string {
    return this.subscribe('klines', { symbol, interval }, callback);
  }

  /**
   * Subscribe to user data updates
   * @param listenKey The listen key
   * @param callback The callback function
   * @returns The subscription ID
   */
  public subscribeUserData(listenKey: string, callback: (data: any) => void): string {
    return this.subscribe('userdata', { listenKey }, callback);
  }

  /**
   * Subscribe to a WebSocket stream
   * @param type The subscription type
   * @param params The subscription parameters
   * @param callback The callback function
   * @returns The subscription ID
   */
  private subscribe(
    type: SubscriptionType,
    params: SubscriptionParams,
    callback: (data: any) => void,
  ): string {
    // Initialize if not already
    if (!this.isInitialized) {
      this.initialize();
    }

    // Create a unique key for this subscription
    const key = `${type}_${JSON.stringify(params)}`;
    
    // Check if already subscribed
    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key)!;
    }
    
    // Subscribe
    const subscriptionId = this.wsManager.subscribe(
      this.exchangeId,
      type,
      params,
      callback,
    );
    
    // Store subscription
    this.subscriptions.set(key, subscriptionId);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from a WebSocket stream
   * @param subscriptionId The subscription ID
   * @returns True if unsubscribed successfully
   */
  public unsubscribe(subscriptionId: string): boolean {
    // Find the key for this subscription ID
    let keyToRemove: string | undefined;
    for (const [key, id] of this.subscriptions.entries()) {
      if (id === subscriptionId) {
        keyToRemove = key;
        break;
      }
    }
    
    // Remove from subscriptions
    if (keyToRemove) {
      this.subscriptions.delete(keyToRemove);
    }
    
    // Unsubscribe
    return this.wsManager.unsubscribe(subscriptionId);
  }

  /**
   * Close the WebSocket connection
   */
  public close(): void {
    this.wsManager.closeConnection(this.exchangeId);
    this.isInitialized = false;
    this.subscriptions.clear();
  }

  /**
   * Get the connection status
   * @returns The connection status
   */
  public getConnectionStatus(): string {
    return this.wsManager.getConnectionStatus(this.exchangeId);
  }

  /**
   * Get cached ticker data
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @returns The cached ticker data or undefined
   */
  public getCachedTicker(symbol: string): any {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    return this.wsManager.getCachedMessage(`${this.exchangeId}_ticker_${formattedSymbol}`);
  }

  /**
   * Get cached order book data
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @returns The cached order book data or undefined
   */
  public getCachedOrderBook(symbol: string): any {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    return this.wsManager.getCachedMessage(`${this.exchangeId}_depth_${formattedSymbol}`);
  }

  /**
   * Get cached trades data
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @returns The cached trades data or undefined
   */
  public getCachedTrades(symbol: string): any {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    // Note: This returns the most recent trade only
    // For a full trade history, you would need to maintain a separate cache
    return this.wsManager.getCachedMessage(`${this.exchangeId}_trade_${formattedSymbol}`);
  }

  /**
   * Get cached klines data
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param interval The candlestick interval (e.g., '1m', '5m', '1h')
   * @returns The cached klines data or undefined
   */
  public getCachedKlines(symbol: string, interval: string): any {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    // Note: This returns the most recent kline only
    // For a full kline history, you would need to maintain a separate cache
    return this.wsManager.getCachedMessage(`${this.exchangeId}_kline_${formattedSymbol}_${interval}`);
  }
}
