import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BinanceTestnetUserDataService } from '../binanceTestnetUserDataService';
import { BinanceTestnetService } from '../binanceTestnetService';
import { BinanceTestnetWebSocketService } from '../binanceTestnetWebSocketService';
import { ApiKeyManager } from '../../security/apiKeyManager';

// Mock dependencies
vi.mock('../binanceTestnetService', () => ({
  BinanceTestnetService: {
    getInstance: vi.fn(() => ({
      isEnabled: vi.fn().mockResolvedValue(true),
    })),
  },
}));

vi.mock('../binanceTestnetWebSocketService', () => ({
  BinanceTestnetWebSocketService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      subscribeUserData: vi.fn().mockReturnValue('subscription-id'),
      unsubscribe: vi.fn().mockReturnValue(true),
      getConnectionStatus: vi.fn().mockReturnValue('connected'),
    })),
  },
}));

vi.mock('../../security/apiKeyManager', () => ({
  ApiKeyManager: {
    getInstance: vi.fn(() => ({
      getDefaultApiKeyId: vi.fn().mockResolvedValue('default-api-key-id'),
      getApiKey: vi.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
      }),
    })),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('BinanceTestnetUserDataService', () => {
  let userDataService: BinanceTestnetUserDataService;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock fetch response for listen key
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ listenKey: 'test-listen-key' }),
      text: () => Promise.resolve(''),
    });
    
    // Get instance of the service
    userDataService = BinanceTestnetUserDataService.getInstance();
  });
  
  afterEach(() => {
    // Clean up
    vi.resetAllMocks();
    
    // Clear any timers
    vi.restoreAllMocks();
  });
  
  it('should be a singleton', () => {
    const instance1 = BinanceTestnetUserDataService.getInstance();
    const instance2 = BinanceTestnetUserDataService.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  it('should initialize successfully', async () => {
    await userDataService.initialize();
    
    // Verify that the WebSocket service was initialized
    expect(BinanceTestnetWebSocketService.getInstance().initialize).toHaveBeenCalled();
    
    // Verify that we created a listen key
    expect(global.fetch).toHaveBeenCalledWith(
      'https://testnet.binance.vision/api/v3/userDataStream',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-MBX-APIKEY': 'test-api-key',
        }),
      })
    );
    
    // Verify that we subscribed to the user data stream
    expect(BinanceTestnetWebSocketService.getInstance().subscribeUserData).toHaveBeenCalledWith(
      'test-listen-key',
      expect.any(Function)
    );
  });
  
  it('should handle user data messages', () => {
    // Create a spy for the event emitter
    const emitSpy = vi.spyOn(userDataService['eventEmitter'], 'emit');
    
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
    
    // Simulate receiving a WebSocket message
    (userDataService as any).handleUserDataMessage(executionReport);
    
    // Verify the event was emitted
    expect(emitSpy).toHaveBeenCalledWith(executionReport);
  });
  
  it('should ping the listen key to keep it alive', async () => {
    // Mock the current time
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    
    // Set up a listen key
    (userDataService as any).listenKey = 'test-listen-key';
    
    // Call the ping method
    await (userDataService as any).pingListenKey('default-api-key-id');
    
    // Verify that we pinged the listen key
    expect(global.fetch).toHaveBeenCalledWith(
      'https://testnet.binance.vision/api/v3/userDataStream?listenKey=test-listen-key',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'X-MBX-APIKEY': 'test-api-key',
        }),
      })
    );
  });
  
  it('should handle ping failures by creating a new listen key', async () => {
    // Set up a listen key
    (userDataService as any).listenKey = 'test-listen-key';
    
    // Mock fetch to fail on first call (ping) but succeed on second call (create)
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Error'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ listenKey: 'new-listen-key' }),
      });
    
    // Call the ping method
    await (userDataService as any).pingListenKey('default-api-key-id');
    
    // Verify that we tried to create a new listen key
    expect(global.fetch).toHaveBeenCalledWith(
      'https://testnet.binance.vision/api/v3/userDataStream',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-MBX-APIKEY': 'test-api-key',
        }),
      })
    );
    
    // Verify that the listen key was updated
    expect((userDataService as any).listenKey).toBe('new-listen-key');
  });
  
  it('should close the user data stream', async () => {
    // Set up a listen key and subscription ID
    (userDataService as any).listenKey = 'test-listen-key';
    (userDataService as any).subscriptionId = 'subscription-id';
    
    // Call the close method
    await userDataService.close();
    
    // Verify that we unsubscribed from the WebSocket
    expect(BinanceTestnetWebSocketService.getInstance().unsubscribe).toHaveBeenCalledWith('subscription-id');
    
    // Verify that we deleted the listen key
    expect(global.fetch).toHaveBeenCalledWith(
      'https://testnet.binance.vision/api/v3/userDataStream?listenKey=test-listen-key',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'X-MBX-APIKEY': 'test-api-key',
        }),
      })
    );
    
    // Verify that the listen key and subscription ID were cleared
    expect((userDataService as any).listenKey).toBeNull();
    expect((userDataService as any).subscriptionId).toBeNull();
  });
  
  it('should return the connection status', () => {
    // Initialize the service
    (userDataService as any).isInitialized = true;
    (userDataService as any).listenKey = 'test-listen-key';
    
    // Get the connection status
    const status = userDataService.getConnectionStatus();
    
    // Verify the status
    expect(status).toBe('connected');
  });
});
