import { io, Socket } from "socket.io-client";
import {
  WSSubscriptionMessage,
  WebSocketMessage,
  WSTickerMessage,
  WSOrderbookUpdateMessage,
  WSTradeMessage,
} from "../types/marketData";

type MarketDataChannel = "ticker" | "orderbook" | "trade";
type Symbol = string;

type MessageHandler = (msg: WebSocketMessage) => void;

/**
 * Singleton service for managing market data WebSocket connections.
 * Handles connection lifecycle, subscriptions, and message dispatching for real-time market data.
 * Use `MarketDataSocket.getInstance()` to access the singleton instance.
 */
class MarketDataSocket {
  private static instance: MarketDataSocket;
  private socket: Socket | null = null;
  private readonly endpoint = import.meta.env.VITE_MARKET_DATA_WS_URL;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // ms
  private handlers: Set<MessageHandler> = new Set();

  /**
   * Private constructor for singleton pattern.
   */
  private constructor() {}

  /**
   * Returns the singleton instance of MarketDataSocket.
   * @returns {MarketDataSocket} The singleton instance.
   */
  public static getInstance(): MarketDataSocket {
    if (!import.meta.env.VITE_MARKET_DATA_WS_URL) {
      throw new Error("VITE_MARKET_DATA_WS_URL environment variable is not set. WebSocket connection cannot be established.");
    }
    if (!MarketDataSocket.instance) {
      MarketDataSocket.instance = new MarketDataSocket();
    }
    return MarketDataSocket.instance;
  }

  /**
   * Establishes a WebSocket connection if not already connected.
   * Handles reconnection logic and message routing.
   */
  public connect(): void {
    if (this.socket && this.isConnected) return;

    this.socket = io(this.endpoint, {
      transports: ["websocket"],
      reconnection: false, // We'll handle reconnection manually
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      // Optionally notify connection state
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      this.tryReconnect();
    });

    this.socket.on("connect_error", () => {
      this.isConnected = false;
      this.tryReconnect();
    });

    this.socket.on("message", (msg: any) => {
      this.handleMessage(msg);
    });
  }

  /**
   * Disconnects the WebSocket and cleans up state.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Subscribes to a market data channel for a given symbol.
   * @param {Symbol} symbol - Trading symbol to subscribe to.
   * @param {MarketDataChannel} channel - Channel type ("ticker", "orderbook", "trade").
   */
  public subscribe(symbol: Symbol, channel: MarketDataChannel): void {
    if (!this.socket) this.connect();
    const msg: WSSubscriptionMessage = {
      event: "subscribe",
      data: { type: channel, symbol },
    };
    this.socket?.emit("message", msg);
  }

  /**
   * Unsubscribes from a market data channel for a given symbol.
   * @param {Symbol} symbol - Trading symbol to unsubscribe from.
   * @param {MarketDataChannel} channel - Channel type.
   */
  public unsubscribe(symbol: Symbol, channel: MarketDataChannel): void {
    if (!this.socket) return;
    const msg: WSSubscriptionMessage = {
      event: "unsubscribe",
      data: { type: channel, symbol },
    };
    this.socket.emit("message", msg);
  }

  /**
   * Registers a message handler to receive incoming WebSocket messages.
   * @param {MessageHandler} handler - Function to handle messages.
   */
  public addMessageHandler(handler: MessageHandler): void {
    this.handlers.add(handler);
  }

  /**
   * Removes a previously registered message handler.
   * @param {MessageHandler} handler - Handler to remove.
   */
  public removeMessageHandler(handler: MessageHandler): void {
    this.handlers.delete(handler);
  }

  /**
   * Handles incoming WebSocket messages and dispatches to registered handlers.
   * @param {any} msg - Incoming message object.
   * @private
   */
  private handleMessage(msg: any): void {
    // Type guard for WebSocketMessage
    if (typeof msg !== "object" || !msg.event) return;

    // Only handle known event types
    if (
      msg.event === "ticker" ||
      msg.event === "orderbookUpdate" ||
      msg.event === "trade"
    ) {
      this.handlers.forEach((handler) => handler(msg as WebSocketMessage));
    }
  }

  /**
   * Attempts to reconnect with exponential backoff up to a maximum number of attempts.
   * @private
   */
  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    setTimeout(() => {
      this.reconnectAttempts += 1;
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Indicates whether the socket is currently connected.
   * @returns {boolean}
   */
  public get connected(): boolean {
    return this.isConnected;
  }
}

/**
 * Default export: Singleton instance of MarketDataSocket for use throughout the app.
 */
export default MarketDataSocket.getInstance();