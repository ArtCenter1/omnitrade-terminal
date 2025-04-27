/**
 * WebSocket Connection Manager
 * 
 * Manages WebSocket connections to exchanges, handles reconnection,
 * message parsing, and subscription management.
 */

import { ConnectionManager } from './connectionManager';

// Define WebSocket message types
export type WebSocketMessage = {
  type: string;
  data: any;
};

// Define subscription types
export type SubscriptionType = 'ticker' | 'depth' | 'trades' | 'klines' | 'userdata';

// Define subscription parameters
export type SubscriptionParams = {
  symbol?: string;
  interval?: string;
  limit?: number;
  listenKey?: string;
};

// Define subscription object
export type Subscription = {
  id: string;
  type: SubscriptionType;
  params: SubscriptionParams;
  callback: (data: any) => void;
};

/**
 * WebSocket Manager class
 */
export class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Subscription[]> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private connectionManager: ConnectionManager;
  private messageCache: Map<string, any> = new Map();
  private isReconnecting: Map<string, boolean> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectAttempts: Map<string, number> = new Map();
  private baseReconnectDelay = 1000; // 1 second

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Get the connection manager instance
    this.connectionManager = ConnectionManager.getInstance();
  }

  /**
   * Get the WebSocketManager instance
   * @returns The WebSocketManager instance
   */
  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Create a WebSocket connection
   * @param exchangeId The exchange ID
   * @param url The WebSocket URL
   * @returns The WebSocket connection
   */
  public createConnection(exchangeId: string, url: string): WebSocket {
    // Check if connection already exists
    if (this.connections.has(exchangeId)) {
      return this.connections.get(exchangeId)!;
    }

    // Create new WebSocket connection
    const ws = new WebSocket(url);

    // Set up event handlers
    ws.onopen = () => this.handleOpen(exchangeId, ws);
    ws.onmessage = (event) => this.handleMessage(exchangeId, event);
    ws.onclose = (event) => this.handleClose(exchangeId, event, url);
    ws.onerror = (error) => this.handleError(exchangeId, error);

    // Store connection
    this.connections.set(exchangeId, ws);
    this.reconnectAttempts.set(exchangeId, 0);
    this.isReconnecting.set(exchangeId, false);

    // Initialize subscriptions array for this exchange
    if (!this.subscriptions.has(exchangeId)) {
      this.subscriptions.set(exchangeId, []);
    }

    // Update connection status
    this.connectionManager.updateConnectionStatus(exchangeId, 'connecting');

    return ws;
  }

  /**
   * Handle WebSocket open event
   * @param exchangeId The exchange ID
   * @param ws The WebSocket connection
   */
  private handleOpen(exchangeId: string, ws: WebSocket): void {
    console.log(`WebSocket connection opened for ${exchangeId}`);
    
    // Reset reconnect attempts
    this.reconnectAttempts.set(exchangeId, 0);
    this.isReconnecting.set(exchangeId, false);
    
    // Update connection status
    this.connectionManager.updateConnectionStatus(exchangeId, 'connected');

    // Resubscribe to all subscriptions for this exchange
    const subs = this.subscriptions.get(exchangeId) || [];
    subs.forEach((subscription) => {
      this.sendSubscriptionMessage(exchangeId, subscription);
    });
  }

  /**
   * Handle WebSocket message event
   * @param exchangeId The exchange ID
   * @param event The message event
   */
  private handleMessage(exchangeId: string, event: MessageEvent): void {
    try {
      // Parse message
      const message = JSON.parse(event.data);
      
      // Process message based on exchange
      if (exchangeId === 'binance_testnet') {
        this.processBinanceMessage(exchangeId, message);
      } else {
        console.warn(`Unsupported exchange: ${exchangeId}`);
      }
    } catch (error) {
      console.error(`Error handling WebSocket message for ${exchangeId}:`, error);
    }
  }

  /**
   * Handle WebSocket close event
   * @param exchangeId The exchange ID
   * @param event The close event
   * @param url The WebSocket URL to reconnect to
   */
  private handleClose(exchangeId: string, event: CloseEvent, url: string): void {
    console.log(`WebSocket connection closed for ${exchangeId}:`, event.code, event.reason);
    
    // Update connection status
    this.connectionManager.updateConnectionStatus(exchangeId, 'disconnected');
    
    // Remove from connections map
    this.connections.delete(exchangeId);
    
    // Attempt to reconnect if not closing cleanly
    if (event.code !== 1000 && event.code !== 1001) {
      this.scheduleReconnect(exchangeId, url);
    }
  }

  /**
   * Handle WebSocket error event
   * @param exchangeId The exchange ID
   * @param error The error event
   */
  private handleError(exchangeId: string, error: Event): void {
    console.error(`WebSocket error for ${exchangeId}:`, error);
    
    // Update connection status
    this.connectionManager.updateConnectionStatus(exchangeId, 'error');
  }

  /**
   * Schedule a reconnection attempt
   * @param exchangeId The exchange ID
   * @param url The WebSocket URL to reconnect to
   */
  private scheduleReconnect(exchangeId: string, url: string): void {
    // Check if already reconnecting
    if (this.isReconnecting.get(exchangeId)) {
      return;
    }
    
    // Set reconnecting flag
    this.isReconnecting.set(exchangeId, true);
    
    // Get current reconnect attempts
    const attempts = this.reconnectAttempts.get(exchangeId) || 0;
    
    // Check if max attempts reached
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${exchangeId}`);
      this.connectionManager.updateConnectionStatus(exchangeId, 'failed');
      return;
    }
    
    // Increment reconnect attempts
    this.reconnectAttempts.set(exchangeId, attempts + 1);
    
    // Calculate backoff delay with exponential backoff
    const delay = this.baseReconnectDelay * Math.pow(2, attempts);
    
    console.log(`Scheduling reconnect for ${exchangeId} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
    
    // Clear any existing timeout
    if (this.reconnectTimeouts.has(exchangeId)) {
      clearTimeout(this.reconnectTimeouts.get(exchangeId)!);
    }
    
    // Schedule reconnect
    const timeout = setTimeout(() => {
      console.log(`Attempting to reconnect to ${exchangeId}`);
      this.createConnection(exchangeId, url);
    }, delay);
    
    // Store timeout
    this.reconnectTimeouts.set(exchangeId, timeout);
  }

  /**
   * Process Binance WebSocket message
   * @param exchangeId The exchange ID
   * @param message The message data
   */
  private processBinanceMessage(exchangeId: string, message: any): void {
    // Determine message type and call appropriate handler
    if (message.e === '24hrTicker') {
      this.handleTickerMessage(exchangeId, message);
    } else if (message.e === 'depthUpdate') {
      this.handleDepthMessage(exchangeId, message);
    } else if (message.e === 'trade') {
      this.handleTradeMessage(exchangeId, message);
    } else if (message.e === 'kline') {
      this.handleKlineMessage(exchangeId, message);
    } else if (message.stream && message.data) {
      // Combined stream message
      this.processBinanceMessage(exchangeId, message.data);
    } else {
      // Cache the message for debugging
      const cacheKey = `${exchangeId}_unknown_${Date.now()}`;
      this.messageCache.set(cacheKey, message);
      console.log(`Unknown message type from ${exchangeId}:`, message);
    }
  }

  /**
   * Handle ticker message
   * @param exchangeId The exchange ID
   * @param message The ticker message
   */
  private handleTickerMessage(exchangeId: string, message: any): void {
    // Format the ticker data
    const ticker = {
      symbol: this.formatBinanceSymbol(message.s),
      priceChange: parseFloat(message.p),
      priceChangePercent: parseFloat(message.P),
      weightedAvgPrice: parseFloat(message.w),
      prevClosePrice: parseFloat(message.x),
      lastPrice: parseFloat(message.c),
      lastQty: parseFloat(message.Q),
      bidPrice: parseFloat(message.b),
      bidQty: parseFloat(message.B),
      askPrice: parseFloat(message.a),
      askQty: parseFloat(message.A),
      openPrice: parseFloat(message.o),
      highPrice: parseFloat(message.h),
      lowPrice: parseFloat(message.l),
      volume: parseFloat(message.v),
      quoteVolume: parseFloat(message.q),
      openTime: message.O,
      closeTime: message.C,
      count: message.n,
    };

    // Cache the ticker data
    const cacheKey = `${exchangeId}_ticker_${message.s}`;
    this.messageCache.set(cacheKey, ticker);

    // Find subscriptions for this ticker
    const subs = this.subscriptions.get(exchangeId) || [];
    subs.forEach((subscription) => {
      if (
        subscription.type === 'ticker' &&
        (!subscription.params.symbol || this.formatBinanceSymbol(message.s) === subscription.params.symbol)
      ) {
        subscription.callback(ticker);
      }
    });
  }

  /**
   * Handle depth (order book) message
   * @param exchangeId The exchange ID
   * @param message The depth message
   */
  private handleDepthMessage(exchangeId: string, message: any): void {
    // Format the depth data
    const depth = {
      symbol: this.formatBinanceSymbol(message.s),
      firstUpdateId: message.U,
      finalUpdateId: message.u,
      bids: message.b.map((bid: string[]) => ({
        price: parseFloat(bid[0]),
        quantity: parseFloat(bid[1]),
      })),
      asks: message.a.map((ask: string[]) => ({
        price: parseFloat(ask[0]),
        quantity: parseFloat(ask[1]),
      })),
      timestamp: message.E,
    };

    // Cache the depth data
    const cacheKey = `${exchangeId}_depth_${message.s}`;
    this.messageCache.set(cacheKey, depth);

    // Find subscriptions for this depth
    const subs = this.subscriptions.get(exchangeId) || [];
    subs.forEach((subscription) => {
      if (
        subscription.type === 'depth' &&
        (!subscription.params.symbol || this.formatBinanceSymbol(message.s) === subscription.params.symbol)
      ) {
        subscription.callback(depth);
      }
    });
  }

  /**
   * Handle trade message
   * @param exchangeId The exchange ID
   * @param message The trade message
   */
  private handleTradeMessage(exchangeId: string, message: any): void {
    // Format the trade data
    const trade = {
      symbol: this.formatBinanceSymbol(message.s),
      id: message.t.toString(),
      price: parseFloat(message.p),
      quantity: parseFloat(message.q),
      timestamp: message.T,
      isBuyerMaker: message.m,
      isBestMatch: message.M,
    };

    // Cache the trade data
    const cacheKey = `${exchangeId}_trade_${message.s}_${message.t}`;
    this.messageCache.set(cacheKey, trade);

    // Find subscriptions for this trade
    const subs = this.subscriptions.get(exchangeId) || [];
    subs.forEach((subscription) => {
      if (
        subscription.type === 'trades' &&
        (!subscription.params.symbol || this.formatBinanceSymbol(message.s) === subscription.params.symbol)
      ) {
        subscription.callback(trade);
      }
    });
  }

  /**
   * Handle kline (candlestick) message
   * @param exchangeId The exchange ID
   * @param message The kline message
   */
  private handleKlineMessage(exchangeId: string, message: any): void {
    const kline = message.k;
    
    // Format the kline data
    const formattedKline = {
      symbol: this.formatBinanceSymbol(message.s),
      interval: kline.i,
      startTime: kline.t,
      endTime: kline.T,
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
      trades: kline.n,
      isFinal: kline.x,
    };

    // Cache the kline data
    const cacheKey = `${exchangeId}_kline_${message.s}_${kline.i}_${kline.t}`;
    this.messageCache.set(cacheKey, formattedKline);

    // Find subscriptions for this kline
    const subs = this.subscriptions.get(exchangeId) || [];
    subs.forEach((subscription) => {
      if (
        subscription.type === 'klines' &&
        (!subscription.params.symbol || this.formatBinanceSymbol(message.s) === subscription.params.symbol) &&
        (!subscription.params.interval || kline.i === subscription.params.interval)
      ) {
        subscription.callback(formattedKline);
      }
    });
  }

  /**
   * Format Binance symbol from BTCUSDT to BTC/USDT
   * @param binanceSymbol The Binance symbol
   * @returns The formatted symbol
   */
  private formatBinanceSymbol(binanceSymbol: string): string {
    // Common quote assets to check
    const quoteAssets = [
      'USDT',
      'BUSD',
      'BTC',
      'ETH',
      'BNB',
      'USD',
      'EUR',
      'GBP',
    ];

    // Try to find a matching quote asset
    for (const quote of quoteAssets) {
      if (binanceSymbol.endsWith(quote)) {
        const base = binanceSymbol.substring(
          0,
          binanceSymbol.length - quote.length,
        );
        return `${base}/${quote}`;
      }
    }

    // If no match found, make a best guess (assume last 4 characters are the quote asset)
    const base = binanceSymbol.substring(0, binanceSymbol.length - 4);
    const quote = binanceSymbol.substring(binanceSymbol.length - 4);
    return `${base}/${quote}`;
  }

  /**
   * Subscribe to a WebSocket stream
   * @param exchangeId The exchange ID
   * @param type The subscription type
   * @param params The subscription parameters
   * @param callback The callback function
   * @returns The subscription ID
   */
  public subscribe(
    exchangeId: string,
    type: SubscriptionType,
    params: SubscriptionParams,
    callback: (data: any) => void,
  ): string {
    // Generate subscription ID
    const id = `${exchangeId}_${type}_${JSON.stringify(params)}_${Date.now()}`;
    
    // Create subscription object
    const subscription: Subscription = {
      id,
      type,
      params,
      callback,
    };
    
    // Add to subscriptions
    const subs = this.subscriptions.get(exchangeId) || [];
    subs.push(subscription);
    this.subscriptions.set(exchangeId, subs);
    
    // Send subscription message if connected
    const connection = this.connections.get(exchangeId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      this.sendSubscriptionMessage(exchangeId, subscription);
    }
    
    return id;
  }

  /**
   * Unsubscribe from a WebSocket stream
   * @param subscriptionId The subscription ID
   * @returns True if unsubscribed successfully
   */
  public unsubscribe(subscriptionId: string): boolean {
    // Find the subscription
    for (const [exchangeId, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex((sub) => sub.id === subscriptionId);
      if (index !== -1) {
        // Get the subscription
        const subscription = subs[index];
        
        // Remove from subscriptions
        subs.splice(index, 1);
        this.subscriptions.set(exchangeId, subs);
        
        // Send unsubscription message if connected
        const connection = this.connections.get(exchangeId);
        if (connection && connection.readyState === WebSocket.OPEN) {
          this.sendUnsubscriptionMessage(exchangeId, subscription);
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Send subscription message to WebSocket
   * @param exchangeId The exchange ID
   * @param subscription The subscription
   */
  private sendSubscriptionMessage(exchangeId: string, subscription: Subscription): void {
    const connection = this.connections.get(exchangeId);
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      return;
    }

    if (exchangeId === 'binance_testnet') {
      this.sendBinanceSubscriptionMessage(connection, subscription);
    } else {
      console.warn(`Unsupported exchange for subscription: ${exchangeId}`);
    }
  }

  /**
   * Send unsubscription message to WebSocket
   * @param exchangeId The exchange ID
   * @param subscription The subscription
   */
  private sendUnsubscriptionMessage(exchangeId: string, subscription: Subscription): void {
    const connection = this.connections.get(exchangeId);
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      return;
    }

    if (exchangeId === 'binance_testnet') {
      this.sendBinanceUnsubscriptionMessage(connection, subscription);
    } else {
      console.warn(`Unsupported exchange for unsubscription: ${exchangeId}`);
    }
  }

  /**
   * Send Binance subscription message
   * @param connection The WebSocket connection
   * @param subscription The subscription
   */
  private sendBinanceSubscriptionMessage(connection: WebSocket, subscription: Subscription): void {
    const { type, params } = subscription;
    const symbol = params.symbol ? params.symbol.replace('/', '').toLowerCase() : '';
    
    let streams: string[] = [];
    
    switch (type) {
      case 'ticker':
        streams.push(`${symbol}@ticker`);
        break;
      case 'depth':
        const limit = params.limit || 10; // Default to 10 levels
        streams.push(`${symbol}@depth${limit}`);
        break;
      case 'trades':
        streams.push(`${symbol}@trade`);
        break;
      case 'klines':
        const interval = params.interval || '1m'; // Default to 1 minute
        streams.push(`${symbol}@kline_${interval}`);
        break;
      case 'userdata':
        if (params.listenKey) {
          streams.push(params.listenKey);
        } else {
          console.error('Listen key is required for userdata subscription');
        }
        break;
      default:
        console.warn(`Unsupported subscription type: ${type}`);
        return;
    }
    
    // Send subscription message
    if (streams.length > 0) {
      const message = {
        method: 'SUBSCRIBE',
        params: streams,
        id: Date.now(),
      };
      
      connection.send(JSON.stringify(message));
    }
  }

  /**
   * Send Binance unsubscription message
   * @param connection The WebSocket connection
   * @param subscription The subscription
   */
  private sendBinanceUnsubscriptionMessage(connection: WebSocket, subscription: Subscription): void {
    const { type, params } = subscription;
    const symbol = params.symbol ? params.symbol.replace('/', '').toLowerCase() : '';
    
    let streams: string[] = [];
    
    switch (type) {
      case 'ticker':
        streams.push(`${symbol}@ticker`);
        break;
      case 'depth':
        const limit = params.limit || 10; // Default to 10 levels
        streams.push(`${symbol}@depth${limit}`);
        break;
      case 'trades':
        streams.push(`${symbol}@trade`);
        break;
      case 'klines':
        const interval = params.interval || '1m'; // Default to 1 minute
        streams.push(`${symbol}@kline_${interval}`);
        break;
      case 'userdata':
        if (params.listenKey) {
          streams.push(params.listenKey);
        } else {
          console.error('Listen key is required for userdata subscription');
        }
        break;
      default:
        console.warn(`Unsupported subscription type: ${type}`);
        return;
    }
    
    // Send unsubscription message
    if (streams.length > 0) {
      const message = {
        method: 'UNSUBSCRIBE',
        params: streams,
        id: Date.now(),
      };
      
      connection.send(JSON.stringify(message));
    }
  }

  /**
   * Close a WebSocket connection
   * @param exchangeId The exchange ID
   */
  public closeConnection(exchangeId: string): void {
    const connection = this.connections.get(exchangeId);
    if (connection) {
      // Clear any reconnect timeout
      if (this.reconnectTimeouts.has(exchangeId)) {
        clearTimeout(this.reconnectTimeouts.get(exchangeId)!);
        this.reconnectTimeouts.delete(exchangeId);
      }
      
      // Close the connection
      connection.close(1000, 'Closed by user');
      
      // Remove from connections map
      this.connections.delete(exchangeId);
      
      // Clear subscriptions
      this.subscriptions.set(exchangeId, []);
      
      // Update connection status
      this.connectionManager.updateConnectionStatus(exchangeId, 'disconnected');
    }
  }

  /**
   * Close all WebSocket connections
   */
  public closeAllConnections(): void {
    for (const exchangeId of this.connections.keys()) {
      this.closeConnection(exchangeId);
    }
  }

  /**
   * Get cached message
   * @param cacheKey The cache key
   * @returns The cached message or undefined
   */
  public getCachedMessage(cacheKey: string): any {
    return this.messageCache.get(cacheKey);
  }

  /**
   * Clear message cache
   */
  public clearCache(): void {
    this.messageCache.clear();
  }

  /**
   * Get connection status
   * @param exchangeId The exchange ID
   * @returns The connection status
   */
  public getConnectionStatus(exchangeId: string): string {
    return this.connectionManager.getConnectionStatus(exchangeId);
  }
}
