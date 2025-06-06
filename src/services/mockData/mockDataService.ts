// Mock data generation service

import {
  TradingPair,
  OrderBook,
  OrderBookEntry,
  Kline,
  Portfolio,
  PortfolioAsset,
  Order,
  OrderSide,
  OrderType,
  OrderStatus,
  PerformanceMetrics,
  Exchange,
  Trade,
} from '@/types/exchange';

import {
  randomInRange,
  randomIntInRange,
  roundToDecimals,
  COMMON_BASE_ASSETS,
  COMMON_QUOTE_ASSETS,
  PRICE_RANGES,
  DEFAULT_PRICE_RANGE,
  SUPPORTED_EXCHANGES,
} from './mockDataUtils';

// Mock data service class
export class MockDataService {
  private tradingPairs: Map<string, TradingPair[]> = new Map();
  private currentPrices: Map<string, number> = new Map(); // symbol -> price
  private mockOrders: Map<string, Order[]> = new Map(); // userId -> orders
  private lastOrderId = 1000;

  constructor() {
    // Initialize with empty data
  }

  // Get supported exchanges
  public getSupportedExchanges(): Exchange[] {
    return SUPPORTED_EXCHANGES;
  }

  // Get exchange by ID
  public getExchangeById(exchangeId: string): Exchange | undefined {
    return SUPPORTED_EXCHANGES.find((exchange) => exchange.id === exchangeId);
  }

  // Generate trading pairs for an exchange
  public generateTradingPairs(
    exchangeId: string,
    count: number = 30,
  ): TradingPair[] {
    if (this.tradingPairs.has(exchangeId)) {
      return this.tradingPairs.get(exchangeId)!;
    }

    const pairs: TradingPair[] = [];
    const usedPairs = new Set<string>();

    // Generate unique trading pairs
    while (pairs.length < count) {
      const baseAsset =
        COMMON_BASE_ASSETS[randomIntInRange(0, COMMON_BASE_ASSETS.length)];
      const quoteAsset =
        COMMON_QUOTE_ASSETS[randomIntInRange(0, COMMON_QUOTE_ASSETS.length)];

      // Skip if base and quote are the same or if pair already exists
      if (
        baseAsset === quoteAsset ||
        usedPairs.has(`${baseAsset}/${quoteAsset}`)
      ) {
        continue;
      }

      usedPairs.add(`${baseAsset}/${quoteAsset}`);

      const symbol = `${baseAsset}/${quoteAsset}`;
      const priceDecimals =
        baseAsset === 'SHIB'
          ? 8
          : baseAsset === 'BTC'
            ? 2
            : randomIntInRange(2, 6);
      const quantityDecimals = randomIntInRange(2, 6);

      pairs.push({
        symbol,
        baseAsset,
        quoteAsset,
        exchangeId,
        priceDecimals,
        quantityDecimals,
        minQuantity: roundToDecimals(0.001, quantityDecimals),
        maxQuantity: roundToDecimals(100000, 0),
        minPrice: roundToDecimals(0.00000001, 8),
        maxPrice: roundToDecimals(1000000, 0),
        minNotional: roundToDecimals(10, 2), // Minimum order value in quote currency
      });

      // Initialize a random price for this pair
      const baseRange = PRICE_RANGES[baseAsset] || DEFAULT_PRICE_RANGE;
      const initialPrice = roundToDecimals(
        randomInRange(baseRange.min, baseRange.max),
        priceDecimals,
      );
      this.currentPrices.set(`${exchangeId}:${symbol}`, initialPrice);
    }

    this.tradingPairs.set(exchangeId, pairs);
    return pairs;
  }

  // Get current price for a symbol
  public getCurrentPrice(exchangeId: string, symbol: string): number {
    const key = `${exchangeId}:${symbol}`;
    if (!this.currentPrices.has(key)) {
      const [baseAsset, quoteAsset] = symbol.split('/');
      const baseRange = PRICE_RANGES[baseAsset] || DEFAULT_PRICE_RANGE;
      const initialPrice = roundToDecimals(
        randomInRange(baseRange.min, baseRange.max),
        2,
      );
      this.currentPrices.set(key, initialPrice);
    }
    return this.currentPrices.get(key)!;
  }

  // Update price with a small random change
  public updatePrice(exchangeId: string, symbol: string): number {
    const currentPrice = this.getCurrentPrice(exchangeId, symbol);
    const changePercent = randomInRange(-2, 2) / 100; // -2% to +2%
    const newPrice = currentPrice * (1 + changePercent);

    // Find the trading pair to get the price decimals
    const pairs = this.tradingPairs.get(exchangeId) || [];
    const pair = pairs.find((p) => p.symbol === symbol);
    const priceDecimals = pair?.priceDecimals || 2;

    const roundedPrice = roundToDecimals(newPrice, priceDecimals);
    this.currentPrices.set(`${exchangeId}:${symbol}`, roundedPrice);
    return roundedPrice;
  }

  // Generate an order book for a symbol
  public generateOrderBook(
    exchangeId: string,
    symbol: string,
    depth: number = 20,
  ): OrderBook {
    try {
      const currentPrice = this.getCurrentPrice(exchangeId, symbol);
      const bids: OrderBookEntry[] = [];
      const asks: OrderBookEntry[] = [];

      // Generate bids (buy orders) slightly below current price
      for (let i = 0; i < depth; i++) {
        const priceDrop = (i + 1) * (randomInRange(0.1, 0.3) / 100); // 0.1% to 0.3% drop per level
        const price = roundToDecimals(currentPrice * (1 - priceDrop), 2);
        const quantity = roundToDecimals(randomInRange(0.1, 10), 4);
        bids.push({ price, quantity });
      }

      // Generate asks (sell orders) slightly above current price
      for (let i = 0; i < depth; i++) {
        const priceIncrease = (i + 1) * (randomInRange(0.1, 0.3) / 100); // 0.1% to 0.3% increase per level
        const price = roundToDecimals(currentPrice * (1 + priceIncrease), 2);
        const quantity = roundToDecimals(randomInRange(0.1, 10), 4);
        asks.push({ price, quantity });
      }

      // Sort bids in descending order (highest price first)
      bids.sort((a, b) => b.price - a.price);

      // Sort asks in ascending order (lowest price first)
      asks.sort((a, b) => a.price - b.price);

      return {
        symbol,
        exchangeId,
        timestamp: Date.now(),
        lastUpdateId: Date.now(),
        bids,
        asks,
      };
    } catch (error) {
      console.error(
        `[MockDataService] Error generating order book for ${symbol}:`,
        error,
      );

      // Return a simple fallback order book
      return {
        symbol,
        exchangeId,
        timestamp: Date.now(),
        lastUpdateId: Date.now(),
        bids: [
          { price: 30000, quantity: 1.5 },
          { price: 29900, quantity: 2.0 },
          { price: 29800, quantity: 1.0 },
        ],
        asks: [
          { price: 30100, quantity: 1.0 },
          { price: 30200, quantity: 2.5 },
          { price: 30300, quantity: 1.2 },
        ],
      };
    }
  }

  // Generate ticker statistics
  public generateTickerStats(exchangeId: string, symbol: string): TickerStats {
    const currentPrice = this.getCurrentPrice(exchangeId, symbol);

    // Generate random price change (±5%)
    const priceChangePercent = randomInRange(-5, 5);
    const priceChange = roundToDecimals(
      (currentPrice * priceChangePercent) / 100,
      2,
    );

    // Generate other random values
    const openPrice = roundToDecimals(currentPrice - priceChange, 2);
    const highPrice = roundToDecimals(
      Math.max(currentPrice, openPrice) * (1 + randomInRange(0, 2) / 100),
      2,
    );
    const lowPrice = roundToDecimals(
      Math.min(currentPrice, openPrice) * (1 - randomInRange(0, 2) / 100),
      2,
    );
    const volume = roundToDecimals(randomInRange(100, 10000), 2);
    const lastQty = roundToDecimals(randomInRange(0.1, 5), 6);

    // Generate bid and ask prices
    const bidPrice = roundToDecimals(currentPrice * 0.999, 2); // Slightly below current price
    const askPrice = roundToDecimals(currentPrice * 1.001, 2); // Slightly above current price

    // Current time and 24 hours ago
    const closeTime = Date.now();
    const openTime = closeTime - 24 * 60 * 60 * 1000;

    console.log(`Generated closeTime: ${closeTime}, openTime: ${openTime}`);

    return {
      symbol: symbol,
      exchangeId: exchangeId,
      priceChange: priceChange,
      priceChangePercent: priceChangePercent,
      weightedAvgPrice: roundToDecimals((openPrice + currentPrice) / 2, 2),
      prevClosePrice: openPrice,
      lastPrice: currentPrice,
      lastQty: lastQty,
      bidPrice: bidPrice,
      bidQty: roundToDecimals(randomInRange(1, 10), 6),
      askPrice: askPrice,
      askQty: roundToDecimals(randomInRange(1, 10), 6),
      openPrice: openPrice,
      highPrice: highPrice,
      lowPrice: lowPrice,
      volume: volume,
      quoteVolume: roundToDecimals(volume * currentPrice, 2),
      openTime: openTime,
      closeTime: closeTime,
      count: randomIntInRange(100, 5000), // Number of trades
    };
  }

  // Generate recent trades
  public generateRecentTrades(
    exchangeId: string,
    symbol: string,
    limit: number = 500,
  ): Trade[] {
    const trades: Trade[] = [];
    const currentPrice = this.getCurrentPrice(exchangeId, symbol);

    // Generate random trades around the current price
    for (let i = 0; i < limit; i++) {
      // Random price variation within ±1%
      const priceVariation = randomInRange(-0.01, 0.01);
      const price = roundToDecimals(currentPrice * (1 + priceVariation), 2);

      // Random quantity between 0.001 and 5
      const quantity = roundToDecimals(randomInRange(0.001, 5), 6);

      // Random timestamp within the last hour
      const timestamp = Date.now() - randomIntInRange(0, 60 * 60 * 1000);

      // Random buyer/seller
      const isBuyerMaker = Math.random() > 0.5;

      trades.push({
        id: (1000000 + i).toString(),
        price,
        quantity,
        timestamp,
        isBuyerMaker,
        isBestMatch: Math.random() > 0.8, // 20% chance of being best match
      });
    }

    // Sort by timestamp (newest first)
    trades.sort((a, b) => b.timestamp - a.timestamp);

    return trades;
  }

  // Generate klines (candlestick data)
  public generateKlines(
    exchangeId: string,
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100,
  ): Kline[] {
    console.log(
      `Generating klines for ${exchangeId}:${symbol} with interval ${interval}`,
    );
    const klines: Kline[] = [];
    const currentPrice = this.getCurrentPrice(exchangeId, symbol);
    console.log(`Current price for ${symbol}: ${currentPrice}`);

    // Determine interval in milliseconds
    let intervalMs = 60000; // Default to 1 minute
    if (interval === '15m') intervalMs = 15 * 60000; // 15 minutes
    if (interval === '1h') intervalMs = 3600000; // 1 hour
    if (interval === '1d') intervalMs = 86400000; // 1 day
    if (interval === '1w') intervalMs = 604800000; // 1 week

    // Set default times if not provided
    const end = endTime || Date.now();
    const start = startTime || end - intervalMs * limit;

    // For portfolio performance data with week view, generate hourly data points
    // This creates a more detailed and natural-looking chart
    if (symbol.startsWith('PORTFOLIO/') && interval === '1h' && limit === 168) {
      console.log(
        'Generating optimized hourly portfolio performance data for week view',
      );

      // Adjust start time to be exactly 7 days ago at midnight
      const adjustedEnd = new Date(end);
      adjustedEnd.setHours(0, 0, 0, 0);
      adjustedEnd.setDate(adjustedEnd.getDate() + 1); // Move to next midnight

      const adjustedStart = new Date(adjustedEnd);
      adjustedStart.setDate(adjustedStart.getDate() - 7);

      // Use these adjusted times
      const newEnd = adjustedEnd.getTime();
      const newStart = adjustedStart.getTime();

      console.log(
        `Adjusted klines time range from ${new Date(newStart).toISOString()} to ${new Date(newEnd).toISOString()}`,
      );

      // Generate hourly data points for the week (168 hours)
      let lastClose = currentPrice * randomInRange(0.95, 1.05); // Start with a price around current

      for (let i = 0; i < 168; i++) {
        const time = newStart + i * 60 * 60 * 1000; // Add one hour for each step
        const date = new Date(time);
        const dayIndex = date.getDay(); // 0-6 for Sun-Sat
        const hour = date.getHours(); // 0-23

        // Calculate overall progress through the week (0 to 1)
        const hourProgress = i / 167;

        // Create a more dynamic trend with natural-looking fluctuations
        // Use a non-linear function to create more interesting patterns
        const trendValue = 0.95 + Math.pow(hourProgress, 0.6) * 0.15; // Even more pronounced upward trend

        // Add time-of-day pattern (higher during market hours, lower at night)
        // Market hours roughly 9am-5pm, peak around 1-2pm
        const timeOfDayFactor = Math.sin(((hour - 9) * Math.PI) / 12) * 0.03; // Tripled impact

        // Add some randomness that's consistent within each day
        // Use a combination of sine waves for more natural patterns
        const dailyRandomness =
          Math.sin(dayIndex * 5 + hour / 4) * 0.04 +
          Math.sin(dayIndex * 3 + hour / 2) * 0.025 +
          Math.cos(dayIndex * 7 + hour / 3) * 0.015;

        // Add smaller random fluctuations with more variation
        const hourlyRandomness =
          Math.sin(i * 0.8) * 0.015 +
          Math.sin(i * 1.3) * 0.012 +
          Math.cos(i * 2.1) * 0.008 +
          // Add some truly random noise for more realism
          (Math.random() - 0.5) * 0.01;

        // Calculate the change percentage for this hour
        const changePercent =
          (trendValue + timeOfDayFactor + dailyRandomness + hourlyRandomness) *
          100;

        // Log the components for debugging (only for a few points to avoid flooding the console)
        if (i % 24 === 0) {
          console.log(`Day ${Math.floor(i / 24)}, Hour ${hour} components:`, {
            trendValue: trendValue.toFixed(4),
            timeOfDayFactor: timeOfDayFactor.toFixed(4),
            dailyRandomness: dailyRandomness.toFixed(4),
            hourlyRandomness: hourlyRandomness.toFixed(4),
            totalChangePercent: changePercent.toFixed(4),
          });
        }

        // Apply the change to the last close price for more realistic price movement
        const close = roundToDecimals(lastClose * (1 + changePercent / 100), 2);

        // Generate high and low around close
        const highExtra = randomInRange(0, 0.5) / 100; // 0% to 0.5% above close
        const lowExtra = randomInRange(0, 0.5) / 100; // 0% to 0.5% below close

        const high = roundToDecimals(close * (1 + highExtra), 2);
        const low = roundToDecimals(close * (1 - lowExtra), 2);

        // Open is the last candle's close
        const open = lastClose;

        // Generate random volume with higher volume during market hours
        const volumeBase = randomInRange(10, 100);
        const volumeFactor = hour >= 9 && hour <= 16 ? 1.5 : 1.0; // Higher volume during market hours
        const volume = roundToDecimals(volumeBase * volumeFactor, 2);

        klines.push({
          timestamp: time,
          open,
          high,
          close,
          low,
          volume,
        });

        lastClose = close; // Update last close for the next iteration
      }

      console.log(
        `Generated ${klines.length} optimized hourly klines for weekly portfolio view`,
      );

      // Log a sample of the generated data points (every 24 hours)
      console.log('Sample of generated data points:');
      for (let i = 0; i < klines.length; i += 24) {
        const date = new Date(klines[i].timestamp);
        console.log(
          `Day ${Math.floor(i / 24)}: ${date.toISOString()} - Open: ${klines[i].open}, Close: ${klines[i].close}`,
        );
      }

      return klines;
    }

    console.log(
      `Generating klines from ${new Date(start).toISOString()} to ${new Date(end).toISOString()}`,
    );

    let lastClose = currentPrice * randomInRange(0.8, 1.2); // Start with a price around current

    for (let time = start; time < end; time += intervalMs) {
      // Generate a random price movement
      const changePercent = randomInRange(-3, 3) / 100; // -3% to +3%
      const close = roundToDecimals(lastClose * (1 + changePercent), 2);

      // Generate high and low around close
      const highExtra = randomInRange(0, 2) / 100; // 0% to 2% above close
      const lowExtra = randomInRange(0, 2) / 100; // 0% to 2% below close

      const high = roundToDecimals(close * (1 + highExtra), 2);
      const low = roundToDecimals(close * (1 - lowExtra), 2);

      // Open is the last candle's close
      const open = lastClose;

      // Generate random volume
      const volume = roundToDecimals(randomInRange(10, 100), 2);

      klines.push({
        timestamp: time,
        open,
        high,
        close,
        low,
        volume,
      });

      lastClose = close;
    }

    console.log(`Generated ${klines.length} klines for ${symbol}`);
    if (klines.length > 0) {
      console.log(`First kline: ${JSON.stringify(klines[0])}`);
      console.log(`Last kline: ${JSON.stringify(klines[klines.length - 1])}`);
    }

    return klines;
  }

  // Generate a portfolio for a user
  public generatePortfolio(exchangeId: string, seed?: number): Portfolio {
    const assets: PortfolioAsset[] = [];
    let totalUsdValue = 0;

    // Use a seed if provided for consistent results
    const random = seed
      ? () => {
          seed = (seed! * 9301 + 49297) % 233280;
          return seed / 233280;
        }
      : Math.random;

    // Add a random selection of assets
    const assetCount = Math.floor(random() * 8) + 3; // 3 to 10 assets
    const selectedAssets = new Set<string>();

    // Always include some stablecoins
    selectedAssets.add('USDT');
    selectedAssets.add('USDC');

    // Add random other assets
    while (selectedAssets.size < assetCount) {
      const asset =
        COMMON_BASE_ASSETS[Math.floor(random() * COMMON_BASE_ASSETS.length)];
      selectedAssets.add(asset);
    }

    // Generate balances for each asset
    for (const asset of selectedAssets) {
      const priceRange = PRICE_RANGES[asset] || DEFAULT_PRICE_RANGE;
      const price =
        priceRange.min + (priceRange.max - priceRange.min) * random();

      // Generate larger balances for stablecoins
      const isStablecoin = ['USDT', 'USDC', 'BUSD', 'USD'].includes(asset);
      const balanceMultiplier = isStablecoin ? 1000 : 10;

      const free = roundToDecimals(random() * balanceMultiplier, 6);
      const locked = roundToDecimals(random() * (free * 0.2), 6); // Up to 20% might be in orders
      const total = roundToDecimals(free + locked, 6);
      const usdValue = roundToDecimals(total * price, 2);

      assets.push({
        asset,
        free,
        locked,
        total,
        usdValue,
        exchangeId,
      });

      totalUsdValue += usdValue;
    }

    // Sort by USD value (descending)
    assets.sort((a, b) => b.usdValue - a.usdValue);

    return {
      totalUsdValue: roundToDecimals(totalUsdValue, 2),
      assets,
      lastUpdated: new Date(),
    };
  }

  // Generate performance metrics
  public generatePerformanceMetrics(period: string = '1m'): PerformanceMetrics {
    // Determine start date based on period
    const end = new Date();
    let start = new Date();

    switch (period) {
      case '1d':
        start.setDate(start.getDate() - 1);
        break;
      case '1w':
        start.setDate(start.getDate() - 7);
        break;
      case '1m':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3m':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'all':
        start = new Date(2020, 0, 1); // Start from 2020
        break;
      default:
        start.setMonth(start.getMonth() - 1); // Default to 1 month
    }

    // Generate random performance metrics
    const roi = roundToDecimals(randomInRange(-20, 50), 2);
    const profitLoss = roundToDecimals(randomInRange(-5000, 15000), 2);
    const winRate = roundToDecimals(randomInRange(40, 80), 2);
    const drawdown = roundToDecimals(randomInRange(5, 30), 2);
    const sharpeRatio = roundToDecimals(randomInRange(-1, 3), 2);
    const trades = randomIntInRange(10, 200);

    return {
      roi,
      profitLoss,
      winRate,
      drawdown,
      sharpeRatio,
      trades,
      period: {
        start,
        end,
      },
    };
  }

  // Generate mock orders for a user
  public generateOrders(
    userId: string,
    exchangeId: string,
    symbol: string,
    count: number = 10,
  ): Order[] {
    if (!this.mockOrders.has(userId)) {
      this.mockOrders.set(userId, []);
    }

    const orders = this.mockOrders.get(userId)!;
    const currentPrice = this.getCurrentPrice(exchangeId, symbol);

    // Generate a mix of order types and statuses
    for (let i = 0; i < count; i++) {
      const side: OrderSide = Math.random() > 0.5 ? 'buy' : 'sell';
      const type: OrderType = Math.random() > 0.3 ? 'limit' : 'market';

      // For simplicity, generate mostly filled or canceled orders, with some open ones
      let status: OrderStatus;
      const statusRandom = Math.random();
      if (statusRandom < 0.6) {
        status = 'filled';
      } else if (statusRandom < 0.9) {
        status = 'canceled';
      } else {
        status = 'new';
      }

      const price =
        type === 'limit'
          ? roundToDecimals(currentPrice * (side === 'buy' ? 0.98 : 1.02), 2)
          : undefined;

      const quantity = roundToDecimals(randomInRange(0.1, 2), 4);
      const executed =
        status === 'filled'
          ? quantity
          : status === 'partially_filled'
            ? roundToDecimals(quantity * randomInRange(0.1, 0.9), 4)
            : 0;

      const remaining = roundToDecimals(quantity - executed, 4);
      const cost =
        executed > 0
          ? roundToDecimals(executed * (price || currentPrice), 2)
          : undefined;

      // Generate a timestamp within the last week
      const timestamp =
        Date.now() - randomIntInRange(0, 7 * 24 * 60 * 60 * 1000);

      const order: Order = {
        id: (this.lastOrderId++).toString(),
        exchangeId,
        symbol,
        side,
        type,
        status,
        price,
        quantity,
        executed,
        remaining,
        cost,
        timestamp,
        lastUpdated: timestamp + randomIntInRange(0, 60 * 60 * 1000), // Up to an hour later
      };

      orders.push(order);
    }

    // Sort by timestamp (newest first)
    orders.sort((a, b) => b.timestamp - a.timestamp);

    return orders;
  }

  // Get open orders for a user
  public getOpenOrders(
    userId: string,
    exchangeId?: string,
    symbol?: string,
  ): Order[] {
    if (!this.mockOrders.has(userId)) {
      return [];
    }

    const orders = this.mockOrders.get(userId)!;
    return orders.filter((order) => {
      const statusMatch =
        order.status === 'new' || order.status === 'partially_filled';
      const exchangeMatch = !exchangeId || order.exchangeId === exchangeId;
      const symbolMatch = !symbol || order.symbol === symbol;
      return statusMatch && exchangeMatch && symbolMatch;
    });
  }

  // Get order history for a user
  public getOrderHistory(
    userId: string,
    exchangeId?: string,
    symbol?: string,
    limit: number = 50,
  ): Order[] {
    if (!this.mockOrders.has(userId)) {
      return [];
    }

    const orders = this.mockOrders.get(userId)!;
    const filteredOrders = orders.filter((order) => {
      const statusMatch =
        order.status !== 'new' && order.status !== 'partially_filled';
      const exchangeMatch = !exchangeId || order.exchangeId === exchangeId;
      const symbolMatch = !symbol || order.symbol === symbol;
      return statusMatch && exchangeMatch && symbolMatch;
    });

    // Return the most recent orders up to the limit
    return filteredOrders.slice(0, limit);
  }

  // Place a new order
  public placeOrder(userId: string, orderData: Partial<Order>): Order {
    if (!this.mockOrders.has(userId)) {
      this.mockOrders.set(userId, []);
    }

    const orders = this.mockOrders.get(userId)!;
    const orderId = (this.lastOrderId++).toString();

    // Create a new order with default values for missing fields
    const order: Order = {
      id: orderId,
      exchangeId: orderData.exchangeId || 'binance',
      symbol: orderData.symbol || 'BTC/USDT',
      side: orderData.side || 'buy',
      type: orderData.type || 'limit',
      status: 'new',
      price: orderData.price,
      quantity: orderData.quantity || 1,
      executed: 0,
      remaining: orderData.quantity || 1,
      timestamp: Date.now(),
    };

    orders.push(order);

    // For market orders, simulate immediate execution
    if (order.type === 'market') {
      setTimeout(() => {
        order.status = 'filled';
        order.executed = order.quantity;
        order.remaining = 0;
        order.lastUpdated = Date.now();

        // Calculate cost based on current price
        const currentPrice = this.getCurrentPrice(
          order.exchangeId,
          order.symbol,
        );
        order.cost = roundToDecimals(order.quantity * currentPrice, 2);
      }, 500);
    }

    return order;
  }

  // Cancel an order
  public cancelOrder(userId: string, orderId: string): boolean {
    if (!this.mockOrders.has(userId)) {
      return false;
    }

    const orders = this.mockOrders.get(userId)!;
    const orderIndex = orders.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      return false;
    }

    const order = orders[orderIndex];

    // Can only cancel orders that are new or partially filled
    if (order.status !== 'new' && order.status !== 'partially_filled') {
      return false;
    }

    order.status = 'canceled';
    order.lastUpdated = Date.now();

    return true;
  }

  // Validate API key (mock implementation)
  public async validateApiKey(
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean> {
    // Add a small delay to simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For mock purposes, consider any non-empty strings as valid
    return apiKey.length > 0 && apiSecret.length > 0;
  }

  // Update an order's status
  public updateOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
    executedQuantity?: number,
  ): boolean {
    if (!this.mockOrders.has(userId)) {
      return false;
    }

    const orders = this.mockOrders.get(userId)!;
    const orderIndex = orders.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      return false;
    }

    const order = orders[orderIndex];

    // Update the order status
    order.status = status;
    order.lastUpdated = Date.now();

    // Update executed quantity if provided
    if (executedQuantity !== undefined) {
      order.executed = executedQuantity;
      order.remaining = order.quantity - executedQuantity;

      // Calculate cost based on executed quantity
      const price =
        order.price || this.getCurrentPrice(order.exchangeId, order.symbol);
      order.cost = roundToDecimals(executedQuantity * price, 2);
    }

    return true;
  }
}
