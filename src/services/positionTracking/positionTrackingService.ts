/**
 * Position Tracking Service
 *
 * This service tracks and manages trading positions across exchanges.
 * It integrates with order tracking to update positions when orders are filled.
 */

import { EventEmitter } from '@/utils/eventEmitter';
import { Order } from '@/types/exchange';
import { BinanceTestnetOrderTrackingService } from '@/services/exchange/binanceTestnetOrderTrackingService';
import logger from '@/utils/logger';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { BinanceTestnetAdapter } from '@/services/exchange/binanceTestnetAdapter';

// Define position types
export type PositionSide = 'long' | 'short';
export type PositionStatus = 'open' | 'closed';

// Define position interface
export interface Position {
  id: string; // Unique position ID
  exchangeId: string; // Exchange ID
  apiKeyId: string; // API key ID
  symbol: string; // Trading pair symbol (e.g., 'BTC/USDT')
  side: PositionSide; // Position side (long or short)
  status: PositionStatus; // Position status (open or closed)
  entryPrice: number; // Average entry price
  exitPrice?: number; // Average exit price (if closed)
  quantity: number; // Position size
  remainingQuantity: number; // Remaining position size
  unrealizedPnl?: number; // Unrealized profit/loss
  realizedPnl?: number; // Realized profit/loss
  openTime: number; // Position open timestamp
  closeTime?: number; // Position close timestamp
  orders: string[]; // Array of order IDs associated with this position
  fees: number; // Total fees paid
  feeAsset: string; // Asset used to pay fees
  notes?: string; // Optional notes
}

// Define position update event
export interface PositionUpdate {
  position: Position;
  type: 'created' | 'updated' | 'closed';
}

/**
 * Position Tracking Service
 */
export class PositionTrackingService {
  private static instance: PositionTrackingService;
  private eventEmitter: EventEmitter<PositionUpdate>;
  private isInitialized = false;

  // Cache for positions
  private positionCache: Map<string, Position> = new Map();
  // Map of symbol to position IDs
  private symbolToPositionMap: Map<string, string[]> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.eventEmitter = new EventEmitter<PositionUpdate>();
  }

  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): PositionTrackingService {
    if (!PositionTrackingService.instance) {
      PositionTrackingService.instance = new PositionTrackingService();
    }

    return PositionTrackingService.instance;
  }

  /**
   * Initialize the position tracking service
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      logger.info('[PositionTrackingService] Initializing...');

      try {
        // Subscribe to order events from BinanceTestnetOrderTrackingService
        const orderTrackingService =
          BinanceTestnetOrderTrackingService.getInstance();

        // Try to initialize the order tracking service, but don't fail if it doesn't work
        try {
          await orderTrackingService.initialize();

          // Subscribe to order events
          orderTrackingService.subscribe(this.handleOrderEvent.bind(this));
          logger.info(
            '[PositionTrackingService] Successfully subscribed to order events',
          );
        } catch (orderTrackingError) {
          logger.warn(
            '[PositionTrackingService] Failed to initialize order tracking service, continuing anyway:',
            orderTrackingError,
          );
          // Continue initialization even if order tracking fails
        }
      } catch (subscriptionError) {
        logger.warn(
          '[PositionTrackingService] Failed to subscribe to order events, continuing anyway:',
          subscriptionError,
        );
        // Continue initialization even if subscription fails
      }

      // Load any existing positions from localStorage
      this.loadPositionsFromStorage();

      this.isInitialized = true;
      logger.info('[PositionTrackingService] Initialized successfully');
      return true;
    } catch (error) {
      logger.error('[PositionTrackingService] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Load positions from localStorage
   */
  private loadPositionsFromStorage(): void {
    try {
      const storedPositions = localStorage.getItem('omnitrade_positions');
      if (storedPositions) {
        const positions = JSON.parse(storedPositions);

        // Validate and add positions to cache
        if (Array.isArray(positions)) {
          positions.forEach((position) => {
            if (position && position.id && position.symbol) {
              this.positionCache.set(position.id, position);

              // Update symbol map
              const positionIds =
                this.symbolToPositionMap.get(position.symbol) || [];
              if (!positionIds.includes(position.id)) {
                positionIds.push(position.id);
                this.symbolToPositionMap.set(position.symbol, positionIds);
              }
            }
          });

          logger.info(
            `[PositionTrackingService] Loaded ${positions.length} positions from localStorage`,
          );
        }
      }
    } catch (error) {
      logger.error(
        '[PositionTrackingService] Error loading positions from localStorage:',
        error,
      );
    }
  }

  /**
   * Handle order events from the order tracking service
   * @param event The order event
   */
  private handleOrderEvent(event: any): void {
    const { type, order } = event;

    // Only process filled or partially filled orders
    if (type === 'filled' || type === 'partially_filled') {
      this.processOrderFill(order);
    }
  }

  /**
   * Process an order fill to update positions
   * @param order The filled or partially filled order
   */
  private processOrderFill(order: Order): void {
    try {
      const {
        exchangeId,
        symbol,
        side,
        executed,
        price,
        lastExecutedPrice,
        lastExecutedQuantity,
      } = order;

      // Use the last executed price if available, otherwise use the order price
      const fillPrice = lastExecutedPrice || price || 0;
      // Use the last executed quantity if available, otherwise use the executed quantity
      const fillQuantity = lastExecutedQuantity || executed || 0;

      if (fillQuantity <= 0) {
        logger.warn(
          `[PositionTrackingService] Order ${order.id} has no executed quantity`,
        );
        return;
      }

      // Determine position side based on order side
      const positionSide: PositionSide = side === 'buy' ? 'long' : 'short';

      // Check if there's an existing open position for this symbol
      const existingPositionId = this.findOpenPositionId(
        exchangeId,
        'default',
        symbol,
        positionSide,
      );

      if (existingPositionId) {
        // Update existing position
        this.updatePosition(existingPositionId, order, fillPrice, fillQuantity);
      } else {
        // Create new position
        this.createPosition(order, fillPrice, fillQuantity);
      }
    } catch (error) {
      logger.error(
        `[PositionTrackingService] Error processing order fill:`,
        error,
      );
    }
  }

  /**
   * Find an open position ID for a given symbol and side
   * @param exchangeId The exchange ID
   * @param apiKeyId The API key ID
   * @param symbol The trading pair symbol
   * @param side The position side
   * @returns The position ID if found, undefined otherwise
   */
  private findOpenPositionId(
    exchangeId: string,
    apiKeyId: string,
    symbol: string,
    side: PositionSide,
  ): string | undefined {
    // Get all position IDs for this symbol
    const positionIds = this.symbolToPositionMap.get(symbol) || [];

    // Find an open position with matching exchangeId, apiKeyId, and side
    for (const positionId of positionIds) {
      const position = this.positionCache.get(positionId);
      if (
        position &&
        position.exchangeId === exchangeId &&
        position.apiKeyId === apiKeyId &&
        position.side === side &&
        position.status === 'open'
      ) {
        return positionId;
      }
    }

    return undefined;
  }

  /**
   * Create a new position
   * @param order The order that created the position
   * @param fillPrice The fill price
   * @param fillQuantity The fill quantity
   */
  private createPosition(
    order: Order,
    fillPrice: number,
    fillQuantity: number,
  ): void {
    const { exchangeId, symbol, side, id, timestamp } = order;

    // Generate a unique position ID
    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Determine position side based on order side
    const positionSide: PositionSide = side === 'buy' ? 'long' : 'short';

    // Create the position
    const position: Position = {
      id: positionId,
      exchangeId,
      apiKeyId: 'default', // Use 'default' as the API key ID for now
      symbol,
      side: positionSide,
      status: 'open',
      entryPrice: fillPrice,
      quantity: fillQuantity,
      remainingQuantity: fillQuantity,
      openTime: timestamp,
      orders: [id],
      fees: 0, // Initialize fees to 0
      feeAsset: '', // Initialize fee asset to empty string
    };

    // Add to cache
    this.positionCache.set(positionId, position);

    // Add to symbol map
    const positionIds = this.symbolToPositionMap.get(symbol) || [];
    positionIds.push(positionId);
    this.symbolToPositionMap.set(symbol, positionIds);

    // Calculate unrealized P&L
    this.calculateUnrealizedPnl(positionId);

    // Save to localStorage
    this.savePositionsToStorage();

    // Emit event
    this.eventEmitter.emit({
      type: 'created',
      position,
    });

    logger.info(
      `[PositionTrackingService] Created new ${positionSide} position for ${symbol}: ${positionId}`,
    );
  }

  /**
   * Update an existing position
   * @param positionId The position ID
   * @param order The order that updated the position
   * @param fillPrice The fill price
   * @param fillQuantity The fill quantity
   */
  private updatePosition(
    positionId: string,
    order: Order,
    fillPrice: number,
    fillQuantity: number,
  ): void {
    // Get the position from cache
    const position = this.positionCache.get(positionId);
    if (!position) {
      logger.warn(
        `[PositionTrackingService] Position ${positionId} not found in cache`,
      );
      return;
    }

    const { id, side } = order;
    const orderSide: 'buy' | 'sell' = side;

    // Check if this is a position-increasing order or a position-reducing order
    const isPositionIncreasing =
      (position.side === 'long' && orderSide === 'buy') ||
      (position.side === 'short' && orderSide === 'sell');

    if (isPositionIncreasing) {
      // Update position with additional quantity
      const newQuantity = position.quantity + fillQuantity;
      const newEntryPrice =
        (position.entryPrice * position.quantity + fillPrice * fillQuantity) /
        newQuantity;

      // Update position
      position.entryPrice = newEntryPrice;
      position.quantity = newQuantity;
      position.remainingQuantity = newQuantity;
      position.orders.push(id);

      // Update cache
      this.positionCache.set(positionId, position);

      logger.info(
        `[PositionTrackingService] Increased ${position.side} position for ${position.symbol}: ${positionId}`,
      );
    } else {
      // This is a position-reducing order
      const newRemainingQuantity = Math.max(
        0,
        position.remainingQuantity - fillQuantity,
      );

      // Calculate realized P&L for this fill
      const pnlPerUnit =
        position.side === 'long'
          ? fillPrice - position.entryPrice
          : position.entryPrice - fillPrice;

      const realizedPnl = pnlPerUnit * fillQuantity;

      // Update position
      position.remainingQuantity = newRemainingQuantity;
      position.realizedPnl = (position.realizedPnl || 0) + realizedPnl;
      position.orders.push(id);

      // If position is fully closed
      if (newRemainingQuantity === 0) {
        position.status = 'closed';
        position.closeTime = Date.now();
        position.exitPrice = fillPrice;

        logger.info(
          `[PositionTrackingService] Closed ${position.side} position for ${position.symbol}: ${positionId}`,
        );

        // Emit closed event
        this.eventEmitter.emit({
          type: 'closed',
          position,
        });
      } else {
        logger.info(
          `[PositionTrackingService] Reduced ${position.side} position for ${position.symbol}: ${positionId}`,
        );
      }

      // Update cache
      this.positionCache.set(positionId, position);
    }

    // Calculate unrealized P&L
    this.calculateUnrealizedPnl(positionId);

    // Save to localStorage
    this.savePositionsToStorage();

    // Emit updated event
    this.eventEmitter.emit({
      type: 'updated',
      position,
    });
  }

  /**
   * Calculate unrealized P&L for a position
   * @param positionId The position ID
   */
  private async calculateUnrealizedPnl(positionId: string): Promise<void> {
    // Get the position from cache
    const position = this.positionCache.get(positionId);
    if (
      !position ||
      position.status === 'closed' ||
      position.remainingQuantity === 0
    ) {
      return;
    }

    try {
      // Get the current price for the symbol
      const currentPrice = await this.getCurrentPrice(
        position.exchangeId,
        position.symbol,
      );

      if (!currentPrice) {
        logger.warn(
          `[PositionTrackingService] Could not get current price for ${position.symbol}`,
        );
        return;
      }

      // Calculate unrealized P&L
      const pnlPerUnit =
        position.side === 'long'
          ? currentPrice - position.entryPrice
          : position.entryPrice - currentPrice;

      const unrealizedPnl = pnlPerUnit * position.remainingQuantity;

      // Update position
      position.unrealizedPnl = unrealizedPnl;

      // Update cache
      this.positionCache.set(positionId, position);

      // Save to localStorage
      this.savePositionsToStorage();
    } catch (error) {
      logger.error(
        `[PositionTrackingService] Error calculating unrealized P&L:`,
        error,
      );
    }
  }

  /**
   * Get the current price for a symbol
   * @param exchangeId The exchange ID
   * @param symbol The trading pair symbol
   * @returns The current price
   */
  private async getCurrentPrice(
    exchangeId: string,
    symbol: string,
  ): Promise<number | undefined> {
    try {
      logger.info(
        `[PositionTrackingService] Getting current price for ${symbol} on ${exchangeId}`,
      );

      // Get the adapter for the exchange
      const adapter = ExchangeFactory.getAdapter(exchangeId);

      if (!adapter) {
        logger.error(
          `[PositionTrackingService] No adapter found for ${exchangeId}`,
        );
        return this.getFallbackPrice(exchangeId, symbol);
      }

      // Try to use the getCurrentPrice method directly if it exists on the adapter
      if (typeof (adapter as any).getCurrentPrice === 'function') {
        try {
          const price = (adapter as any).getCurrentPrice(symbol);
          logger.info(
            `[PositionTrackingService] Got price directly from adapter: ${price}`,
          );
          return price;
        } catch (directError) {
          logger.warn(
            `[PositionTrackingService] Error getting price directly from adapter:`,
            directError,
          );
          // Continue to fallback methods
        }
      }

      // Fallback to ticker stats
      try {
        // Get the ticker stats for the symbol
        const tickerStats = await adapter.getTickerStats(symbol);

        if (!tickerStats) {
          logger.error(
            `[PositionTrackingService] No ticker stats returned for ${symbol}`,
          );
          return this.getFallbackPrice(exchangeId, symbol);
        }

        // Check if we got a single ticker or an array
        if (Array.isArray(tickerStats)) {
          // If we got an array, find the one for our symbol
          const ticker = tickerStats.find((t) => t.symbol === symbol);

          if (!ticker) {
            logger.error(
              `[PositionTrackingService] Symbol ${symbol} not found in ticker stats array`,
            );
            return this.getFallbackPrice(exchangeId, symbol);
          }

          logger.info(
            `[PositionTrackingService] Found price for ${symbol}: ${ticker.lastPrice}`,
          );
          return ticker.lastPrice;
        } else {
          // If we got a single ticker, use it directly
          if (tickerStats.lastPrice === undefined) {
            logger.error(
              `[PositionTrackingService] No lastPrice in ticker stats for ${symbol}`,
            );
            return this.getFallbackPrice(exchangeId, symbol);
          }

          logger.info(
            `[PositionTrackingService] Found price for ${symbol}: ${tickerStats.lastPrice}`,
          );
          return tickerStats.lastPrice;
        }
      } catch (tickerError) {
        logger.error(
          `[PositionTrackingService] Error getting ticker stats:`,
          tickerError,
        );
        return this.getFallbackPrice(exchangeId, symbol);
      }
    } catch (error) {
      logger.error(
        `[PositionTrackingService] Error getting current price:`,
        error,
      );
      return this.getFallbackPrice(exchangeId, symbol);
    }
  }

  /**
   * Get a fallback price for a symbol when the primary method fails
   * @param exchangeId The exchange ID
   * @param symbol The trading pair symbol
   * @returns The fallback price
   */
  private async getFallbackPrice(
    exchangeId: string,
    symbol: string,
  ): Promise<number | undefined> {
    try {
      // Try to use mockExchangeService as a fallback
      try {
        const { mockExchangeService } = await import(
          '@/services/mockExchangeService'
        );

        const mockPrice = parseFloat(
          mockExchangeService.getCurrentPrice(exchangeId, symbol),
        );

        logger.info(
          `[PositionTrackingService] Using mock price for ${symbol}: ${mockPrice}`,
        );

        return mockPrice;
      } catch (mockError) {
        logger.warn(
          `[PositionTrackingService] Error getting mock price:`,
          mockError,
        );
        // Continue to next fallback
      }

      // Last resort: return a hardcoded price based on the symbol
      const baseAsset = symbol.split('/')[0];
      let defaultPrice = 100; // Default fallback

      // Set some reasonable defaults for common assets
      switch (baseAsset) {
        case 'BTC':
          defaultPrice = 50000;
          break;
        case 'ETH':
          defaultPrice = 3000;
          break;
        case 'BNB':
          defaultPrice = 500;
          break;
        case 'SOL':
          defaultPrice = 100;
          break;
        case 'XRP':
          defaultPrice = 0.5;
          break;
        case 'ADA':
          defaultPrice = 0.4;
          break;
        case 'DOGE':
          defaultPrice = 0.1;
          break;
        case 'MATIC':
          defaultPrice = 0.8;
          break;
        case 'DOT':
          defaultPrice = 7;
          break;
        case 'LTC':
          defaultPrice = 80;
          break;
      }

      logger.info(
        `[PositionTrackingService] Using hardcoded price for ${symbol}: ${defaultPrice}`,
      );

      return defaultPrice;
    } catch (error) {
      logger.error(
        `[PositionTrackingService] All fallback methods failed:`,
        error,
      );
      return 100; // Absolute last resort
    }
  }

  /**
   * Get all positions
   * @param exchangeId Optional exchange ID filter
   * @param apiKeyId Optional API key ID filter
   * @param symbol Optional symbol filter
   * @param status Optional status filter
   * @returns Array of positions
   */
  public getPositions(
    exchangeId?: string,
    apiKeyId?: string,
    symbol?: string,
    status?: PositionStatus,
  ): Position[] {
    const positions = Array.from(this.positionCache.values());

    return positions.filter((position) => {
      let match = true;

      if (exchangeId && position.exchangeId !== exchangeId) {
        match = false;
      }

      if (apiKeyId && position.apiKeyId !== apiKeyId) {
        match = false;
      }

      if (symbol && position.symbol !== symbol) {
        match = false;
      }

      if (status && position.status !== status) {
        match = false;
      }

      return match;
    });
  }

  /**
   * Get open positions
   * @param exchangeId Optional exchange ID filter
   * @param apiKeyId Optional API key ID filter
   * @param symbol Optional symbol filter
   * @returns Array of open positions
   */
  public getOpenPositions(
    exchangeId?: string,
    apiKeyId?: string,
    symbol?: string,
  ): Position[] {
    try {
      // First try to get positions from the adapter if it supports the getOpenPositions method
      if (exchangeId) {
        try {
          const adapter = ExchangeFactory.getAdapter(exchangeId);

          if (
            adapter &&
            typeof (adapter as any).getOpenPositions === 'function'
          ) {
            logger.info(
              `[PositionTrackingService] Using adapter's getOpenPositions method for ${exchangeId}`,
            );

            const adapterPositions = (adapter as any).getOpenPositions(
              exchangeId,
              apiKeyId,
              symbol,
            );

            if (
              adapterPositions &&
              Array.isArray(adapterPositions) &&
              adapterPositions.length > 0
            ) {
              logger.info(
                `[PositionTrackingService] Got ${adapterPositions.length} positions from adapter`,
              );

              // Add these positions to our cache
              adapterPositions.forEach((position) => {
                if (position && position.id && position.symbol) {
                  this.positionCache.set(position.id, position);

                  // Update symbol map
                  const positionIds =
                    this.symbolToPositionMap.get(position.symbol) || [];
                  if (!positionIds.includes(position.id)) {
                    positionIds.push(position.id);
                    this.symbolToPositionMap.set(position.symbol, positionIds);
                  }
                }
              });

              // Save to localStorage
              this.savePositionsToStorage();

              return adapterPositions;
            }
          }
        } catch (adapterError) {
          logger.warn(
            `[PositionTrackingService] Error getting positions from adapter:`,
            adapterError,
          );
          // Fall back to local cache
        }
      }

      // Fall back to positions from our cache
      return this.getPositions(exchangeId, apiKeyId, symbol, 'open');
    } catch (error) {
      logger.error(
        `[PositionTrackingService] Error in getOpenPositions:`,
        error,
      );
      return [];
    }
  }

  /**
   * Get a position by ID
   * @param positionId The position ID
   * @returns The position if found, undefined otherwise
   */
  public getPosition(positionId: string): Position | undefined {
    return this.positionCache.get(positionId);
  }

  /**
   * Subscribe to position updates
   * @param callback The callback function
   * @returns A function to unsubscribe
   */
  public subscribe(callback: (event: PositionUpdate) => void): () => void {
    return this.eventEmitter.subscribe(callback);
  }

  /**
   * Refresh unrealized P&L for all open positions
   */
  public async refreshUnrealizedPnl(): Promise<void> {
    const openPositions = this.getOpenPositions();

    for (const position of openPositions) {
      await this.calculateUnrealizedPnl(position.id);
    }
  }

  /**
   * Save positions to localStorage
   */
  private savePositionsToStorage(): void {
    try {
      const positions = Array.from(this.positionCache.values());
      localStorage.setItem('omnitrade_positions', JSON.stringify(positions));
      logger.debug(
        `[PositionTrackingService] Saved ${positions.length} positions to localStorage`,
      );
    } catch (error) {
      logger.error(
        '[PositionTrackingService] Error saving positions to localStorage:',
        error,
      );
    }
  }

  /**
   * Clear the position cache
   */
  public clearCache(): void {
    this.positionCache.clear();
    this.symbolToPositionMap.clear();

    // Clear localStorage as well
    try {
      localStorage.removeItem('omnitrade_positions');
    } catch (error) {
      logger.error(
        '[PositionTrackingService] Error clearing positions from localStorage:',
        error,
      );
    }

    logger.info('[PositionTrackingService] Position cache cleared');
  }

  /**
   * Create mock positions for testing
   * @param exchangeId The exchange ID
   * @param count Number of mock positions to create
   */
  public createMockPositions(exchangeId: string, count: number = 3): void {
    logger.info(
      `[PositionTrackingService] Creating ${count} mock positions for ${exchangeId}`,
    );

    const symbols = [
      'BTC/USDT',
      'ETH/USDT',
      'SOL/USDT',
      'BNB/USDT',
      'XRP/USDT',
    ];
    const sides: PositionSide[] = ['long', 'short'];

    for (let i = 0; i < count; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = sides[Math.floor(Math.random() * sides.length)];
      const entryPrice =
        side === 'long'
          ? 30000 + Math.random() * 5000
          : 30000 - Math.random() * 5000;
      const quantity = 0.1 + Math.random() * 0.9;
      const timestamp = Date.now() - Math.floor(Math.random() * 86400000); // Random time in the last 24 hours

      const positionId = `mock-${exchangeId}-${symbol.replace('/', '')}-${side}-${timestamp}`;

      const position: Position = {
        id: positionId,
        exchangeId,
        apiKeyId: 'default',
        symbol,
        side,
        status: 'open',
        entryPrice,
        quantity,
        remainingQuantity: quantity,
        openTime: timestamp,
        orders: [`mock-order-${timestamp}`],
        unrealizedPnl:
          side === 'long' ? Math.random() * 500 : -Math.random() * 500,
      };

      // Add to cache
      this.positionCache.set(positionId, position);

      // Add to symbol map
      const positionIds = this.symbolToPositionMap.get(symbol) || [];
      positionIds.push(positionId);
      this.symbolToPositionMap.set(symbol, positionIds);
    }

    // Save to localStorage
    this.savePositionsToStorage();

    logger.info(
      `[PositionTrackingService] Created ${count} mock positions for ${exchangeId}`,
    );
  }
}

// Export singleton instance
export const positionTrackingService = PositionTrackingService.getInstance();
