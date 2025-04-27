/**
 * Binance Testnet Market Data Service
 * 
 * Provides real-time market data from Binance Testnet using WebSockets.
 * This service integrates with UI components to provide live updates.
 */

import { BinanceTestnetWebSocketService } from './binanceTestnetWebSocketService';
import { BinanceTestnetService } from './binanceTestnetService';
import { OrderBook, Trade, TickerStats, Kline } from '@/types/exchange';
import { EventEmitter } from '@/utils/eventEmitter';

// Define event types
export type MarketDataEventType = 
  | 'ticker'
  | 'orderbook'
  | 'trades'
  | 'klines';

// Define market data events
export interface MarketDataEvent {
  type: MarketDataEventType;
  symbol: string;
  data: any;
}

/**
 * Binance Testnet Market Data Service
 */
export class BinanceTestnetMarketDataService {
  private static instance: BinanceTestnetMarketDataService;
  private wsService: BinanceTestnetWebSocketService;
  private binanceService: BinanceTestnetService;
  private eventEmitter: EventEmitter<MarketDataEvent>;
  private subscriptions: Map<string, string> = new Map();
  private activeSymbols: Set<string> = new Set();
  private isInitialized = false;
  private exchangeId = 'binance_testnet';
  
  // Cache for market data
  private tickerCache: Map<string, TickerStats> = new Map();
  private orderBookCache: Map<string, OrderBook> = new Map();
  private tradesCache: Map<string, Trade[]> = new Map();
  private klinesCache: Map<string, Map<string, Kline[]>> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.wsService = BinanceTestnetWebSocketService.getInstance();
    this.binanceService = BinanceTestnetService.getInstance();
    this.eventEmitter = new EventEmitter<MarketDataEvent>();
  }

  /**
   * Get the BinanceTestnetMarketDataService instance
   * @returns The BinanceTestnetMarketDataService instance
   */
  public static getInstance(): BinanceTestnetMarketDataService {
    if (!BinanceTestnetMarketDataService.instance) {
      BinanceTestnetMarketDataService.instance = new BinanceTestnetMarketDataService();
    }
    return BinanceTestnetMarketDataService.instance;
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if Binance Testnet is enabled
      const isEnabled = await this.binanceService.isEnabled();
      if (!isEnabled) {
        console.log('Binance Testnet Market Data service not initialized: Testnet is disabled');
        return;
      }

      // Initialize WebSocket service
      await this.wsService.initialize();
      
      this.isInitialized = true;
      console.log('Binance Testnet Market Data service initialized');
    } catch (error) {
      console.error('Failed to initialize Binance Testnet Market Data service:', error);
    }
  }

  /**
   * Subscribe to ticker updates for a symbol
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @returns The subscription ID
   */
  public subscribeTicker(symbol: string): string {
    // Initialize if not already
    if (!this.isInitialized) {
      this.initialize();
    }

    // Add to active symbols
    this.activeSymbols.add(symbol);
    
    // Create subscription key
    const key = `ticker_${symbol}`;
    
    // Check if already subscribed
    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key)!;
    }
    
    // Subscribe to WebSocket
    const subscriptionId = this.wsService.subscribeTicker(symbol, (data) => {
      // Cache the data
      this.tickerCache.set(symbol, data);
      
      // Emit event
      this.eventEmitter.emit({
        type: 'ticker',
        symbol,
        data,
      });
    });
    
    // Store subscription
    this.subscriptions.set(key, subscriptionId);
    
    return subscriptionId;
  }

  /**
   * Subscribe to order book updates for a symbol
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param limit The number of levels (default: 10)
   * @returns The subscription ID
   */
  public subscribeOrderBook(symbol: string, limit: number = 10): string {
    // Initialize if not already
    if (!this.isInitialized) {
      this.initialize();
    }

    // Add to active symbols
    this.activeSymbols.add(symbol);
    
    // Create subscription key
    const key = `orderbook_${symbol}_${limit}`;
    
    // Check if already subscribed
    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key)!;
    }
    
    // Subscribe to WebSocket
    const subscriptionId = this.wsService.subscribeOrderBook(
      symbol,
      limit,
      (data) => {
        // Format as OrderBook
        const orderBook: OrderBook = {
          symbol,
          exchangeId: this.exchangeId,
          bids: data.bids,
          asks: data.asks,
          timestamp: data.timestamp,
        };
        
        // Cache the data
        this.orderBookCache.set(symbol, orderBook);
        
        // Emit event
        this.eventEmitter.emit({
          type: 'orderbook',
          symbol,
          data: orderBook,
        });
      },
    );
    
    // Store subscription
    this.subscriptions.set(key, subscriptionId);
    
    return subscriptionId;
  }

  /**
   * Subscribe to trade updates for a symbol
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @returns The subscription ID
   */
  public subscribeTrades(symbol: string): string {
    // Initialize if not already
    if (!this.isInitialized) {
      this.initialize();
    }

    // Add to active symbols
    this.activeSymbols.add(symbol);
    
    // Create subscription key
    const key = `trades_${symbol}`;
    
    // Check if already subscribed
    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key)!;
    }
    
    // Initialize trades cache for this symbol if it doesn't exist
    if (!this.tradesCache.has(symbol)) {
      this.tradesCache.set(symbol, []);
    }
    
    // Subscribe to WebSocket
    const subscriptionId = this.wsService.subscribeTrades(symbol, (data) => {
      // Get current trades
      const trades = this.tradesCache.get(symbol) || [];
      
      // Add new trade to the beginning
      trades.unshift(data);
      
      // Limit to 100 trades
      if (trades.length > 100) {
        trades.pop();
      }
      
      // Update cache
      this.tradesCache.set(symbol, trades);
      
      // Emit event
      this.eventEmitter.emit({
        type: 'trades',
        symbol,
        data: trades,
      });
    });
    
    // Store subscription
    this.subscriptions.set(key, subscriptionId);
    
    return subscriptionId;
  }

  /**
   * Subscribe to candlestick updates for a symbol
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param interval The candlestick interval (e.g., '1m', '5m', '1h')
   * @returns The subscription ID
   */
  public subscribeKlines(symbol: string, interval: string): string {
    // Initialize if not already
    if (!this.isInitialized) {
      this.initialize();
    }

    // Add to active symbols
    this.activeSymbols.add(symbol);
    
    // Create subscription key
    const key = `klines_${symbol}_${interval}`;
    
    // Check if already subscribed
    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key)!;
    }
    
    // Initialize klines cache for this symbol if it doesn't exist
    if (!this.klinesCache.has(symbol)) {
      this.klinesCache.set(symbol, new Map());
    }
    
    // Initialize klines cache for this interval if it doesn't exist
    const symbolKlinesCache = this.klinesCache.get(symbol)!;
    if (!symbolKlinesCache.has(interval)) {
      symbolKlinesCache.set(interval, []);
    }
    
    // Subscribe to WebSocket
    const subscriptionId = this.wsService.subscribeKlines(
      symbol,
      interval,
      (data) => {
        // Get current klines
        const symbolCache = this.klinesCache.get(symbol)!;
        const klines = symbolCache.get(interval) || [];
        
        // Check if we need to update an existing kline or add a new one
        const existingIndex = klines.findIndex(
          (k) => k.timestamp === data.startTime,
        );
        
        if (existingIndex !== -1) {
          // Update existing kline
          klines[existingIndex] = {
            timestamp: data.startTime,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
          };
        } else {
          // Add new kline to the beginning
          klines.unshift({
            timestamp: data.startTime,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
          });
          
          // Sort by timestamp (newest first)
          klines.sort((a, b) => b.timestamp - a.timestamp);
          
          // Limit to 500 klines
          if (klines.length > 500) {
            klines.pop();
          }
        }
        
        // Update cache
        symbolCache.set(interval, klines);
        this.klinesCache.set(symbol, symbolCache);
        
        // Emit event
        this.eventEmitter.emit({
          type: 'klines',
          symbol,
          data: {
            interval,
            klines,
          },
        });
      },
    );
    
    // Store subscription
    this.subscriptions.set(key, subscriptionId);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from all market data for a symbol
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   */
  public unsubscribeSymbol(symbol: string): void {
    // Remove from active symbols
    this.activeSymbols.delete(symbol);
    
    // Find all subscriptions for this symbol
    const keysToRemove: string[] = [];
    
    for (const [key, subscriptionId] of this.subscriptions.entries()) {
      if (key.includes(`_${symbol}_`) || key.endsWith(`_${symbol}`)) {
        // Unsubscribe
        this.wsService.unsubscribe(subscriptionId);
        
        // Add to keys to remove
        keysToRemove.push(key);
      }
    }
    
    // Remove from subscriptions
    for (const key of keysToRemove) {
      this.subscriptions.delete(key);
    }
    
    // Clear caches for this symbol
    this.tickerCache.delete(symbol);
    this.orderBookCache.delete(symbol);
    this.tradesCache.delete(symbol);
    this.klinesCache.delete(symbol);
  }

  /**
   * Unsubscribe from all market data
   */
  public unsubscribeAll(): void {
    // Unsubscribe from all WebSocket subscriptions
    for (const subscriptionId of this.subscriptions.values()) {
      this.wsService.unsubscribe(subscriptionId);
    }
    
    // Clear subscriptions
    this.subscriptions.clear();
    
    // Clear active symbols
    this.activeSymbols.clear();
    
    // Clear caches
    this.tickerCache.clear();
    this.orderBookCache.clear();
    this.tradesCache.clear();
    this.klinesCache.clear();
  }

  /**
   * Subscribe to market data events
   * @param callback The callback function
   * @returns A function to unsubscribe
   */
  public subscribe(
    callback: (event: MarketDataEvent) => void,
  ): () => void {
    return this.eventEmitter.subscribe(callback);
  }

  /**
   * Get cached ticker data
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @returns The cached ticker data or undefined
   */
  public getCachedTicker(symbol: string): TickerStats | undefined {
    return this.tickerCache.get(symbol);
  }

  /**
   * Get cached order book data
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @returns The cached order book data or undefined
   */
  public getCachedOrderBook(symbol: string): OrderBook | undefined {
    return this.orderBookCache.get(symbol);
  }

  /**
   * Get cached trades data
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @returns The cached trades data or undefined
   */
  public getCachedTrades(symbol: string): Trade[] | undefined {
    return this.tradesCache.get(symbol);
  }

  /**
   * Get cached klines data
   * @param symbol The trading pair symbol (e.g., 'BTC/USDT')
   * @param interval The candlestick interval (e.g., '1m', '5m', '1h')
   * @returns The cached klines data or undefined
   */
  public getCachedKlines(
    symbol: string,
    interval: string,
  ): Kline[] | undefined {
    const symbolCache = this.klinesCache.get(symbol);
    if (!symbolCache) {
      return undefined;
    }
    
    return symbolCache.get(interval);
  }

  /**
   * Get all active symbols
   * @returns An array of active symbols
   */
  public getActiveSymbols(): string[] {
    return Array.from(this.activeSymbols);
  }

  /**
   * Get the connection status
   * @returns The connection status
   */
  public getConnectionStatus(): string {
    return this.wsService.getConnectionStatus();
  }
}
