/**
 * Binance Testnet Order Tracking Service
 *
 * This service is responsible for tracking orders placed on Binance Testnet.
 * It maintains a local cache of orders and provides real-time updates via WebSockets.
 */

import { Order, OrderStatus } from '@/types/exchange';
import { BinanceTestnetService } from './binanceTestnetService';
import { BinanceTestnetUserDataService } from './binanceTestnetUserDataService';
import { EventEmitter } from '@/utils/eventEmitter';
import { balanceTrackingService } from '@/services/balanceTracking/balanceTrackingService';
import { positionTrackingService } from '@/services/positionTracking';
import logger from '@/utils/logger';

// Define event types for order tracking
export type OrderEventType =
  | 'created'
  | 'updated'
  | 'filled'
  | 'partially_filled'
  | 'canceled'
  | 'rejected'
  | 'expired';

// Define order events
export interface OrderEvent {
  type: OrderEventType;
  order: Order;
  previousStatus?: OrderStatus;
}

/**
 * Binance Testnet Order Tracking Service
 */
export class BinanceTestnetOrderTrackingService {
  private static instance: BinanceTestnetOrderTrackingService;
  private binanceService: BinanceTestnetService;
  private userDataService: BinanceTestnetUserDataService;
  private eventEmitter: EventEmitter<OrderEvent>;
  private isInitialized = false;
  private exchangeId = 'binance_testnet';

  // Cache for orders
  private orderCache: Map<string, Order> = new Map();
  // Map of client order IDs to exchange order IDs
  private clientOrderIdMap: Map<string, string> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.binanceService = BinanceTestnetService.getInstance();
    this.userDataService = BinanceTestnetUserDataService.getInstance();
    this.eventEmitter = new EventEmitter<OrderEvent>();
  }

  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): BinanceTestnetOrderTrackingService {
    if (!BinanceTestnetOrderTrackingService.instance) {
      BinanceTestnetOrderTrackingService.instance =
        new BinanceTestnetOrderTrackingService();
    }

    return BinanceTestnetOrderTrackingService.instance;
  }

  /**
   * Initialize the order tracking service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if Binance Testnet is enabled
      const isEnabled = await this.binanceService.isEnabled();
      if (!isEnabled) {
        logger.info(
          'Binance Testnet Order Tracking service not initialized: Testnet is disabled',
        );
        return;
      }

      // Initialize user data service
      await this.userDataService.initialize();

      // Subscribe to user data events
      this.userDataService.subscribe(this.handleUserDataEvent.bind(this));

      // Initialize position tracking service
      await positionTrackingService.initialize();

      this.isInitialized = true;
      logger.info('Binance Testnet Order Tracking service initialized');
    } catch (error) {
      logger.error(
        'Failed to initialize Binance Testnet Order Tracking service:',
        error,
      );
    }
  }

  /**
   * Track a new order
   * @param order The order to track
   */
  public trackOrder(order: Order): void {
    // Initialize if not already
    if (!this.isInitialized) {
      this.initialize();
    }

    // Add to cache
    this.orderCache.set(order.id, order);

    // Map client order ID to exchange order ID if available
    if (order.clientOrderId) {
      this.clientOrderIdMap.set(order.clientOrderId, order.id);
    }

    // Emit event
    this.eventEmitter.emit({
      type: 'created',
      order,
    });

    console.log(`Tracking order ${order.id} (${order.symbol})`);
  }

  /**
   * Update an existing order
   * @param orderId The order ID
   * @param updates Partial order updates
   */
  public updateOrder(orderId: string, updates: Partial<Order>): void {
    // Get the order from cache
    const order = this.orderCache.get(orderId);
    if (!order) {
      console.warn(`Cannot update order ${orderId}: not found in cache`);
      return;
    }

    // Store previous status for event
    const previousStatus = order.status;

    // Update the order
    const updatedOrder = { ...order, ...updates };
    this.orderCache.set(orderId, updatedOrder);

    // Determine event type based on status change
    let eventType: OrderEventType = 'updated';
    if (updates.status && updates.status !== previousStatus) {
      switch (updates.status) {
        case 'filled':
          eventType = 'filled';
          break;
        case 'partially_filled':
          eventType = 'partially_filled';
          break;
        case 'canceled':
          eventType = 'canceled';
          break;
        case 'rejected':
          eventType = 'rejected';
          break;
        case 'expired':
          eventType = 'expired';
          break;
      }
    }

    // Emit event
    this.eventEmitter.emit({
      type: eventType,
      order: updatedOrder,
      previousStatus,
    });

    console.log(
      `Updated order ${orderId} (${order.symbol}): ${previousStatus} -> ${updatedOrder.status}`,
    );
  }

  /**
   * Get an order from the cache
   * @param orderId The order ID
   * @returns The order or undefined if not found
   */
  public getOrder(orderId: string): Order | undefined {
    return this.orderCache.get(orderId);
  }

  /**
   * Get all orders from the cache
   * @param symbol Optional symbol filter
   * @param status Optional status filter
   * @returns Array of orders
   */
  public getOrders(symbol?: string, status?: OrderStatus): Order[] {
    const orders = Array.from(this.orderCache.values());

    return orders.filter((order) => {
      let match = true;

      if (symbol && order.symbol !== symbol) {
        match = false;
      }

      if (status && order.status !== status) {
        match = false;
      }

      return match;
    });
  }

  /**
   * Get open orders from the cache
   * @param symbol Optional symbol filter
   * @returns Array of open orders
   */
  public getOpenOrders(symbol?: string): Order[] {
    return this.getOrders(symbol).filter(
      (order) => order.status === 'new' || order.status === 'partially_filled',
    );
  }

  /**
   * Subscribe to order events
   * @param callback The callback function
   * @returns A function to unsubscribe
   */
  public subscribe(callback: (event: OrderEvent) => void): () => void {
    return this.eventEmitter.subscribe(callback);
  }

  /**
   * Handle user data events from WebSocket
   * @param event The user data event
   */
  private handleUserDataEvent(event: any): void {
    // Process different event types
    if (event.e === 'executionReport') {
      this.handleOrderUpdate(event);
    } else if (event.e === 'outboundAccountPosition') {
      this.handleAccountUpdate(event);
    } else if (event.e === 'balanceUpdate') {
      this.handleBalanceUpdate(event);
    }
  }

  /**
   * Handle order update events
   * @param event The order update event
   */
  private handleOrderUpdate(event: any): void {
    // Get order ID (either from client order ID or order ID)
    let orderId = event.i.toString(); // Exchange order ID

    // Check if we have this order in our cache
    let existingOrder: Order | undefined;
    if (this.orderCache.has(orderId)) {
      existingOrder = this.orderCache.get(orderId);
    } else {
      // Try to find by client order ID
      const clientOrderId = event.c;
      if (clientOrderId && this.clientOrderIdMap.has(clientOrderId)) {
        orderId = this.clientOrderIdMap.get(clientOrderId)!;
        existingOrder = this.orderCache.get(orderId);
      }
    }

    // Get the new order status
    const newStatus = this.mapOrderStatus(event.X);

    // If this is a new order we're not tracking yet, create it
    if (!existingOrder) {
      const newOrder: Order = {
        id: orderId,
        clientOrderId: event.c,
        exchangeId: this.exchangeId,
        symbol: this.formatSymbol(event.s),
        side: event.S.toLowerCase() as 'buy' | 'sell',
        type: this.mapOrderType(event.o),
        status: newStatus,
        price: parseFloat(event.p),
        stopPrice: parseFloat(event.P) || undefined,
        quantity: parseFloat(event.q),
        executed: parseFloat(event.z),
        remaining: parseFloat(event.q) - parseFloat(event.z),
        cost: parseFloat(event.Z) || 0,
        timestamp: event.O,
        lastUpdated: event.E,
      };

      this.trackOrder(newOrder);
      return;
    }

    // Handle balance reservation based on status change
    if (existingOrder.status !== newStatus) {
      // If the order is now filled, canceled, rejected, or expired, release any remaining reserved balance
      if (
        newStatus === 'filled' ||
        newStatus === 'canceled' ||
        newStatus === 'rejected' ||
        newStatus === 'expired'
      ) {
        this.releaseReservedBalance(
          existingOrder,
          newStatus,
          parseFloat(event.z),
        );
      }
    }

    // Update the order
    this.updateOrder(orderId, {
      status: newStatus,
      executed: parseFloat(event.z),
      remaining: parseFloat(event.q) - parseFloat(event.z),
      cost: parseFloat(event.Z) || 0,
      lastUpdated: event.E,
    });
  }

  /**
   * Release reserved balance for an order based on its status
   * @param order The order
   * @param newStatus The new order status
   * @param executedQty The executed quantity
   */
  private releaseReservedBalance(
    order: Order,
    newStatus: OrderStatus,
    executedQty: number,
  ): void {
    try {
      // Parse the symbol to get base and quote assets
      const [baseAsset, quoteAsset] = order.symbol.split('/');

      if (!baseAsset || !quoteAsset) {
        logger.error(
          `[BinanceTestnetOrderTrackingService] Invalid symbol format: ${order.symbol}. Expected format: 'BTC/USDT'`,
        );
        return;
      }

      // For filled orders, we don't need to release anything as the balance has been used
      // For partially filled orders, we need to release the remaining reserved balance
      if (newStatus === 'filled') {
        logger.info(
          `[BinanceTestnetOrderTrackingService] Order ${order.id} filled. No need to release reserved balance.`,
        );
        return;
      }

      // For canceled, rejected, or expired orders, release the remaining reserved balance
      if (
        newStatus === 'canceled' ||
        newStatus === 'rejected' ||
        newStatus === 'expired'
      ) {
        // Calculate the remaining quantity that needs to be released
        const remainingQty = order.quantity - executedQty;

        if (remainingQty <= 0) {
          logger.info(
            `[BinanceTestnetOrderTrackingService] Order ${order.id} has no remaining quantity to release.`,
          );
          return;
        }

        // Release the reserved balance
        const released = balanceTrackingService.releaseReservedBalance(
          this.exchangeId,
          'default', // Use 'default' as the API key ID for now
          order.symbol,
          order.side,
          order.type,
          remainingQty,
          order.price,
        );

        if (released) {
          logger.info(
            `[BinanceTestnetOrderTrackingService] Released reserved balance for ${order.id}: ${remainingQty} ${order.side === 'buy' ? quoteAsset : baseAsset}`,
          );
        } else {
          logger.warn(
            `[BinanceTestnetOrderTrackingService] Failed to release reserved balance for ${order.id}`,
          );
        }
      }
    } catch (error) {
      logger.error(
        `[BinanceTestnetOrderTrackingService] Error releasing reserved balance for order ${order.id}:`,
        error,
      );
    }
  }

  /**
   * Handle account update events
   * @param event The account update event
   */
  private handleAccountUpdate(event: any): void {
    // Process account updates if needed
    console.log('Account update received:', event);
  }

  /**
   * Handle balance update events
   * @param event The balance update event
   */
  private handleBalanceUpdate(event: any): void {
    // Process balance updates if needed
    console.log('Balance update received:', event);
  }

  /**
   * Map Binance order status to our order status
   * @param status The Binance order status
   * @returns Our order status
   */
  private mapOrderStatus(status: string): OrderStatus {
    switch (status) {
      case 'NEW':
        return 'new';
      case 'PARTIALLY_FILLED':
        return 'partially_filled';
      case 'FILLED':
        return 'filled';
      case 'CANCELED':
        return 'canceled';
      case 'REJECTED':
        return 'rejected';
      case 'EXPIRED':
        return 'expired';
      default:
        return 'new';
    }
  }

  /**
   * Map Binance order type to our order type
   * @param type The Binance order type
   * @returns Our order type
   */
  private mapOrderType(
    type: string,
  ): 'limit' | 'market' | 'stop_limit' | 'stop_market' {
    switch (type) {
      case 'LIMIT':
        return 'limit';
      case 'MARKET':
        return 'market';
      case 'STOP_LOSS':
        return 'stop_market';
      case 'STOP_LOSS_LIMIT':
        return 'stop_limit';
      case 'TAKE_PROFIT':
        return 'stop_market';
      case 'TAKE_PROFIT_LIMIT':
        return 'stop_limit';
      default:
        return 'limit';
    }
  }

  /**
   * Format Binance symbol to our format
   * @param symbol The Binance symbol (e.g., 'BTCUSDT')
   * @returns Our symbol format (e.g., 'BTC/USDT')
   */
  private formatSymbol(symbol: string): string {
    // Find common quote assets
    const quoteAssets = ['USDT', 'BTC', 'ETH', 'BNB', 'BUSD', 'USDC'];

    for (const quote of quoteAssets) {
      if (symbol.endsWith(quote)) {
        const base = symbol.substring(0, symbol.length - quote.length);
        return `${base}/${quote}`;
      }
    }

    // Default fallback: insert a slash before the last 4 characters
    return `${symbol.slice(0, -4)}/${symbol.slice(-4)}`;
  }

  /**
   * Reconcile local cache with REST API data
   * @param apiKeyId The API key ID
   * @param symbol Optional symbol filter
   */
  public async reconcileWithRestApi(
    apiKeyId: string,
    symbol?: string,
  ): Promise<void> {
    try {
      // Get open orders from REST API
      const openOrders = await this.binanceService.getOpenOrders(
        apiKeyId,
        symbol,
      );

      // Get order history from REST API
      const orderHistory = await this.binanceService.getOrderHistory(
        apiKeyId,
        symbol,
      );

      // Combine all orders
      const allOrders = [...openOrders, ...orderHistory];

      // Update local cache
      for (const order of allOrders) {
        if (this.orderCache.has(order.id)) {
          // Update existing order
          this.updateOrder(order.id, order);
        } else {
          // Add new order
          this.trackOrder(order);
        }
      }

      console.log(`Reconciled ${allOrders.length} orders with REST API`);
    } catch (error) {
      console.error('Error reconciling orders with REST API:', error);
    }
  }

  /**
   * Clear the order cache
   */
  public clearCache(): void {
    this.orderCache.clear();
    this.clientOrderIdMap.clear();
    console.log('Order cache cleared');
  }
}
