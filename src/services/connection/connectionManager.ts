// src/services/connection/connectionManager.ts

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Connection type enum
 */
export enum ConnectionType {
  MOCK = 'mock',
  TESTNET = 'testnet',
  LIVE = 'live',
}

/**
 * Connection status info interface
 */
export interface ConnectionStatusInfo {
  status: ConnectionStatus;
  type: ConnectionType;
  exchangeId: string;
  lastChecked: Date;
  error?: Error;
  latency?: number;
  message?: string;
  rateLimit?: {
    usedWeight: number;
    weightLimit: number;
    orderCount: number;
    orderLimit: number;
    resetTime: Date;
    isRateLimited: boolean;
    retryAfter?: number;
  };
}

/**
 * Connection status change callback
 */
export type ConnectionStatusCallback = (status: ConnectionStatusInfo) => void;

/**
 * Connection manager service
 * Manages connection status for exchanges
 */
export class ConnectionManager {
  private static instance: ConnectionManager;
  private connectionStatus: Map<string, ConnectionStatusInfo> = new Map();
  private subscribers: Map<string, Set<ConnectionStatusCallback>> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();

  /**
   * Get the singleton instance of ConnectionManager
   */
  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Initialize with default status for known exchanges
    this.setStatus('binance_testnet', {
      status: ConnectionStatus.DISCONNECTED,
      type: ConnectionType.TESTNET,
      exchangeId: 'binance_testnet',
      lastChecked: new Date(),
    });
  }

  /**
   * Set the connection status for an exchange
   * @param exchangeId The exchange ID
   * @param status The connection status info
   */
  public setStatus(
    exchangeId: string,
    status: Partial<ConnectionStatusInfo>,
  ): void {
    const currentStatus = this.getStatus(exchangeId);
    const newStatus: ConnectionStatusInfo = {
      ...currentStatus,
      ...status,
      lastChecked: new Date(),
    };

    this.connectionStatus.set(exchangeId, newStatus);
    this.notifySubscribers(exchangeId, newStatus);
  }

  /**
   * Get the connection status for an exchange
   * @param exchangeId The exchange ID
   * @returns The connection status info
   */
  public getStatus(exchangeId: string): ConnectionStatusInfo {
    return (
      this.connectionStatus.get(exchangeId) || {
        status: ConnectionStatus.DISCONNECTED,
        type: ConnectionType.MOCK,
        exchangeId,
        lastChecked: new Date(),
      }
    );
  }

  /**
   * Subscribe to connection status changes for an exchange
   * @param exchangeId The exchange ID
   * @param callback The callback to call when the status changes
   * @returns A function to unsubscribe
   */
  public subscribe(
    exchangeId: string,
    callback: ConnectionStatusCallback,
  ): () => void {
    if (!this.subscribers.has(exchangeId)) {
      this.subscribers.set(exchangeId, new Set());
    }

    this.subscribers.get(exchangeId)!.add(callback);

    // Immediately call the callback with the current status
    callback(this.getStatus(exchangeId));

    // Return an unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(exchangeId);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  /**
   * Notify subscribers of a status change
   * @param exchangeId The exchange ID
   * @param status The new status
   */
  private notifySubscribers(
    exchangeId: string,
    status: ConnectionStatusInfo,
  ): void {
    const subscribers = this.subscribers.get(exchangeId);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in connection status subscriber:', error);
        }
      });
    }
  }

  /**
   * Start checking the connection status for an exchange
   * @param exchangeId The exchange ID
   * @param checkFn The function to check the connection
   * @param interval The interval in milliseconds
   */
  public startChecking(
    exchangeId: string,
    checkFn: () => Promise<ConnectionStatusInfo>,
    interval: number = 60000, // Default to 1 minute
  ): void {
    // Clear any existing interval
    this.stopChecking(exchangeId);

    // Reset reconnect attempts
    this.reconnectAttempts.set(exchangeId, 0);

    // Set status to connecting
    this.setStatus(exchangeId, {
      status: ConnectionStatus.CONNECTING,
    });

    // Perform an immediate check
    this.performCheck(exchangeId, checkFn);

    // Set up the interval
    const intervalId = setInterval(() => {
      this.performCheck(exchangeId, checkFn);
    }, interval);

    this.checkIntervals.set(exchangeId, intervalId);
  }

  /**
   * Stop checking the connection status for an exchange
   * @param exchangeId The exchange ID
   */
  public stopChecking(exchangeId: string): void {
    const intervalId = this.checkIntervals.get(exchangeId);
    if (intervalId) {
      clearInterval(intervalId);
      this.checkIntervals.delete(exchangeId);
    }
  }

  /**
   * Perform a connection check
   * @param exchangeId The exchange ID
   * @param checkFn The function to check the connection
   */
  private async performCheck(
    exchangeId: string,
    checkFn: () => Promise<ConnectionStatusInfo>,
  ): Promise<void> {
    try {
      const startTime = Date.now();
      const status = await checkFn();
      const endTime = Date.now();

      // Calculate latency
      const latency = endTime - startTime;

      // Update status with latency
      this.setStatus(exchangeId, {
        ...status,
        latency,
      });

      // Reset reconnect attempts on successful connection
      if (status.status === ConnectionStatus.CONNECTED) {
        this.reconnectAttempts.set(exchangeId, 0);
      }
    } catch (error) {
      console.error(`Error checking connection for ${exchangeId}:`, error);

      // Increment reconnect attempts
      const attempts = (this.reconnectAttempts.get(exchangeId) || 0) + 1;
      this.reconnectAttempts.set(exchangeId, attempts);

      // Set error status
      this.setStatus(exchangeId, {
        status: ConnectionStatus.ERROR,
        error: error instanceof Error ? error : new Error(String(error)),
        message: `Connection check failed (attempt ${attempts})`,
      });
    }
  }

  /**
   * Get all connection statuses
   * @returns A map of exchange IDs to connection status info
   */
  public getAllStatuses(): Map<string, ConnectionStatusInfo> {
    return new Map(this.connectionStatus);
  }
}
