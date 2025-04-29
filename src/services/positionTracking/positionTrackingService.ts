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
      
      // Subscribe to order events from BinanceTestnetOrderTrackingService
      const orderTrackingService = BinanceTestnetOrderTrackingService.getInstance();
      await orderTrackingService.initialize();
      
      // Subscribe to order events
      orderTrackingService.subscribe(this.handleOrderEvent.bind(this));
      
      this.isInitialized = true;
      logger.info('[PositionTrackingService] Initialized successfully');
      return true;
    } catch (error) {
      logger.error('[PositionTrackingService] Failed to initialize:', error);
      return false;
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
      const { exchangeId, symbol, side, executed, price, lastExecutedPrice, lastExecutedQuantity } = order;
      
      // Use the last executed price if available, otherwise use the order price
      const fillPrice = lastExecutedPrice || price || 0;
      // Use the last executed quantity if available, otherwise use the executed quantity
      const fillQuantity = lastExecutedQuantity || executed || 0;
      
      if (fillQuantity <= 0) {
        logger.warn(`[PositionTrackingService] Order ${order.id} has no executed quantity`);
        return;
      }
      
      // Determine position side based on order side
      const positionSide: PositionSide = side === 'buy' ? 'long' : 'short';
      
      // Check if there's an existing open position for this symbol
      const existingPositionId = this.findOpenPositionId(exchangeId, 'default', symbol, positionSide);
      
      if (existingPositionId) {
        // Update existing position
        this.updatePosition(existingPositionId, order, fillPrice, fillQuantity);
      } else {
        // Create new position
        this.createPosition(order, fillPrice, fillQuantity);
      }
    } catch (error) {
      logger.error(`[PositionTrackingService] Error processing order fill:`, error);
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
    side: PositionSide
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
  private createPosition(order: Order, fillPrice: number, fillQuantity: number): void {
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
    
    // Emit event
    this.eventEmitter.emit({
      type: 'created',
      position,
    });
    
    logger.info(`[PositionTrackingService] Created new ${positionSide} position for ${symbol}: ${positionId}`);
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
    fillQuantity: number
  ): void {
    // Get the position from cache
    const position = this.positionCache.get(positionId);
    if (!position) {
      logger.warn(`[PositionTrackingService] Position ${positionId} not found in cache`);
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
      const newEntryPrice = (position.entryPrice * position.quantity + fillPrice * fillQuantity) / newQuantity;
      
      // Update position
      position.entryPrice = newEntryPrice;
      position.quantity = newQuantity;
      position.remainingQuantity = newQuantity;
      position.orders.push(id);
      
      // Update cache
      this.positionCache.set(positionId, position);
      
      logger.info(`[PositionTrackingService] Increased ${position.side} position for ${position.symbol}: ${positionId}`);
    } else {
      // This is a position-reducing order
      const newRemainingQuantity = Math.max(0, position.remainingQuantity - fillQuantity);
      
      // Calculate realized P&L for this fill
      const pnlPerUnit = position.side === 'long'
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
        
        logger.info(`[PositionTrackingService] Closed ${position.side} position for ${position.symbol}: ${positionId}`);
        
        // Emit closed event
        this.eventEmitter.emit({
          type: 'closed',
          position,
        });
      } else {
        logger.info(`[PositionTrackingService] Reduced ${position.side} position for ${position.symbol}: ${positionId}`);
      }
      
      // Update cache
      this.positionCache.set(positionId, position);
    }
    
    // Calculate unrealized P&L
    this.calculateUnrealizedPnl(positionId);
    
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
    if (!position || position.status === 'closed' || position.remainingQuantity === 0) {
      return;
    }
    
    try {
      // Get the current price for the symbol
      const currentPrice = await this.getCurrentPrice(position.exchangeId, position.symbol);
      
      if (!currentPrice) {
        logger.warn(`[PositionTrackingService] Could not get current price for ${position.symbol}`);
        return;
      }
      
      // Calculate unrealized P&L
      const pnlPerUnit = position.side === 'long'
        ? currentPrice - position.entryPrice
        : position.entryPrice - currentPrice;
      
      const unrealizedPnl = pnlPerUnit * position.remainingQuantity;
      
      // Update position
      position.unrealizedPnl = unrealizedPnl;
      
      // Update cache
      this.positionCache.set(positionId, position);
    } catch (error) {
      logger.error(`[PositionTrackingService] Error calculating unrealized P&L:`, error);
    }
  }
  
  /**
   * Get the current price for a symbol
   * @param exchangeId The exchange ID
   * @param symbol The trading pair symbol
   * @returns The current price
   */
  private async getCurrentPrice(exchangeId: string, symbol: string): Promise<number | undefined> {
    try {
      // Get the adapter for the exchange
      const adapter = ExchangeFactory.getAdapter(exchangeId);
      
      // Get the ticker for the symbol
      const ticker = await adapter.getTicker(symbol);
      
      return ticker?.lastPrice;
    } catch (error) {
      logger.error(`[PositionTrackingService] Error getting current price:`, error);
      return undefined;
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
    status?: PositionStatus
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
    symbol?: string
  ): Position[] {
    return this.getPositions(exchangeId, apiKeyId, symbol, 'open');
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
  public subscribe(
    callback: (event: PositionUpdate) => void
  ): () => void {
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
   * Clear the position cache
   */
  public clearCache(): void {
    this.positionCache.clear();
    this.symbolToPositionMap.clear();
    logger.info('[PositionTrackingService] Position cache cleared');
  }
}

// Export singleton instance
export const positionTrackingService = PositionTrackingService.getInstance();
