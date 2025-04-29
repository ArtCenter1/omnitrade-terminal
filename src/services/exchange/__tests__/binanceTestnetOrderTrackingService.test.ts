import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BinanceTestnetOrderTrackingService } from '../binanceTestnetOrderTrackingService';
import { BinanceTestnetUserDataService } from '../binanceTestnetUserDataService';
import { BinanceTestnetService } from '../binanceTestnetService';
import { Order } from '@/types/exchange';

// Mock dependencies
vi.mock('../binanceTestnetUserDataService', () => ({
  BinanceTestnetUserDataService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(() => {}),
    })),
  },
}));

vi.mock('../binanceTestnetService', () => ({
  BinanceTestnetService: {
    getInstance: vi.fn(() => ({
      isEnabled: vi.fn().mockResolvedValue(true),
    })),
  },
}));

describe('BinanceTestnetOrderTrackingService', () => {
  let orderTrackingService: BinanceTestnetOrderTrackingService;
  let mockOrder: Order;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get instance of the service
    orderTrackingService = BinanceTestnetOrderTrackingService.getInstance();
    
    // Create a mock order for testing
    mockOrder = {
      id: '12345',
      clientOrderId: 'client-12345',
      exchangeId: 'binance_testnet',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'limit',
      status: 'new',
      price: 50000,
      quantity: 0.1,
      executed: 0,
      remaining: 0.1,
      cost: 0,
      timestamp: Date.now(),
      lastUpdated: Date.now(),
    };
  });

  afterEach(() => {
    // Clean up
    vi.resetAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = BinanceTestnetOrderTrackingService.getInstance();
    const instance2 = BinanceTestnetOrderTrackingService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize successfully', async () => {
    await orderTrackingService.initialize();
    
    // Verify that the user data service was initialized
    expect(BinanceTestnetUserDataService.getInstance().initialize).toHaveBeenCalled();
    
    // Verify that we subscribed to user data events
    expect(BinanceTestnetUserDataService.getInstance().subscribe).toHaveBeenCalled();
  });

  it('should track an order', () => {
    // Track the order
    orderTrackingService.trackOrder(mockOrder);
    
    // Verify the order is in the cache
    const cachedOrder = orderTrackingService.getOrder(mockOrder.id);
    expect(cachedOrder).toEqual(mockOrder);
  });

  it('should update an order', () => {
    // First track the order
    orderTrackingService.trackOrder(mockOrder);
    
    // Then update it
    const updates = {
      status: 'partially_filled' as const,
      executed: 0.05,
      remaining: 0.05,
      lastUpdated: Date.now(),
    };
    
    orderTrackingService.updateOrder(mockOrder.id, updates);
    
    // Verify the order was updated
    const updatedOrder = orderTrackingService.getOrder(mockOrder.id);
    expect(updatedOrder).toEqual({
      ...mockOrder,
      ...updates,
    });
  });

  it('should get open orders', () => {
    // Track multiple orders with different statuses
    const openOrder1 = { ...mockOrder, id: '1', status: 'new' };
    const openOrder2 = { ...mockOrder, id: '2', status: 'partially_filled' };
    const filledOrder = { ...mockOrder, id: '3', status: 'filled' };
    const canceledOrder = { ...mockOrder, id: '4', status: 'canceled' };
    
    orderTrackingService.trackOrder(openOrder1);
    orderTrackingService.trackOrder(openOrder2);
    orderTrackingService.trackOrder(filledOrder);
    orderTrackingService.trackOrder(canceledOrder);
    
    // Get open orders
    const openOrders = orderTrackingService.getOpenOrders();
    
    // Verify only the open orders are returned
    expect(openOrders).toHaveLength(2);
    expect(openOrders).toContainEqual(openOrder1);
    expect(openOrders).toContainEqual(openOrder2);
    expect(openOrders).not.toContainEqual(filledOrder);
    expect(openOrders).not.toContainEqual(canceledOrder);
  });

  it('should filter orders by symbol', () => {
    // Track orders with different symbols
    const btcOrder = { ...mockOrder, id: '1', symbol: 'BTC/USDT' };
    const ethOrder = { ...mockOrder, id: '2', symbol: 'ETH/USDT' };
    
    orderTrackingService.trackOrder(btcOrder);
    orderTrackingService.trackOrder(ethOrder);
    
    // Get orders filtered by symbol
    const btcOrders = orderTrackingService.getOrders('BTC/USDT');
    
    // Verify only BTC orders are returned
    expect(btcOrders).toHaveLength(1);
    expect(btcOrders[0]).toEqual(btcOrder);
  });

  it('should filter orders by status', () => {
    // Track orders with different statuses
    const newOrder = { ...mockOrder, id: '1', status: 'new' };
    const filledOrder = { ...mockOrder, id: '2', status: 'filled' };
    
    orderTrackingService.trackOrder(newOrder);
    orderTrackingService.trackOrder(filledOrder);
    
    // Get orders filtered by status
    const filledOrders = orderTrackingService.getOrders(undefined, 'filled');
    
    // Verify only filled orders are returned
    expect(filledOrders).toHaveLength(1);
    expect(filledOrders[0]).toEqual(filledOrder);
  });

  it('should handle order status updates from WebSocket', () => {
    // Mock the handleUserDataEvent method
    const handleUserDataEvent = vi.spyOn(
      orderTrackingService as any, // Use 'as any' to access private method
      'handleUserDataEvent'
    );
    
    // Create a mock execution report event
    const executionReport = {
      e: 'executionReport',
      s: 'BTCUSDT',
      c: 'client-12345',
      S: 'BUY',
      o: 'LIMIT',
      i: '12345',
      X: 'PARTIALLY_FILLED',
      q: '0.1',
      z: '0.05',
      Z: '2500',
      O: Date.now() - 1000,
      E: Date.now(),
    };
    
    // Track the order first
    orderTrackingService.trackOrder(mockOrder);
    
    // Simulate receiving a WebSocket event
    handleUserDataEvent.mockImplementationOnce((event) => {
      // Call the real method
      return (orderTrackingService as any).handleOrderUpdate(event);
    });
    
    // Trigger the event
    handleUserDataEvent(executionReport);
    
    // Verify the order was updated
    const updatedOrder = orderTrackingService.getOrder('12345');
    expect(updatedOrder).toBeDefined();
    expect(updatedOrder?.status).toBe('partially_filled');
    expect(updatedOrder?.executed).toBe(0.05);
  });

  it('should clear the order cache', () => {
    // Track an order
    orderTrackingService.trackOrder(mockOrder);
    
    // Verify the order is in the cache
    expect(orderTrackingService.getOrder(mockOrder.id)).toBeDefined();
    
    // Clear the cache
    orderTrackingService.clearCache();
    
    // Verify the order is no longer in the cache
    expect(orderTrackingService.getOrder(mockOrder.id)).toBeUndefined();
  });
});
