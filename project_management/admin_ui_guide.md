# Admin UI Guide

This document provides an overview of the Admin UI in OmniTrade, including the Developer Settings and Connection Modes.

## Table of Contents

1. [Admin Dashboard Overview](#admin-dashboard-overview)
2. [Developer Settings](#developer-settings)
3. [Connection Modes](#connection-modes)
4. [Feature Flags](#feature-flags)
5. [Exchange Settings](#exchange-settings)
6. [API Explorer](#api-explorer)
7. [Binance Testnet Rate Limits](#binance-testnet-rate-limits)

## Admin Dashboard Overview

The Admin Dashboard is accessible only to users with the 'admin' role. It provides access to various administrative tools and settings for managing the OmniTrade platform.

### Accessing the Admin Dashboard

1. Log in as an admin user
2. Click on your profile picture in the top-right corner
3. In the dropdown menu, look for the "ADMIN ACCESS" section
4. Click on "Admin Dashboard" or navigate directly to `/admin`

### Admin Sections

- **Admin Dashboard** (`/admin`): Overview statistics and links to admin tools
- **User & Role Management** (`/admin/users-roles`): Manage user accounts and roles
- **Developer Settings** (`/admin/dev-settings`): Configure feature flags and development tools

## Developer Settings

The Developer Settings page (`/admin/dev-settings`) contains tools and settings for configuring the application's behavior during development and testing.

### Accessing Developer Settings

Navigate to `/admin/dev-settings` or access it through the Admin Dashboard.

### Developer Settings Sections

1. **Feature Flags**: Toggle features for development and testing
2. **Connection Status**: View the status of connections to various services
3. **Exchange Settings**: Configure exchange-specific settings
4. **API Explorer**: Test API endpoints
5. **CoinGecko API Status**: Monitor CoinGecko API usage and cache statistics

## Connection Modes

The Connection Mode setting is a global configuration that determines how the application connects to external services and data sources. It affects the behavior of all exchanges and accounts in the application.

### Connection Mode Options

The application supports three connection modes:

1. **Mock Mode**

   - Uses entirely simulated data with no external API calls
   - All data is generated by the MockDataService
   - No real API authentication required
   - Orders are simulated entirely within the application
   - Fastest performance since everything is local

2. **Sandbox Mode** (default in production)

   - Uses test environments where available
   - For Binance: Uses Binance Testnet when enabled
   - For Demo Account: Uses Binance Testnet when enabled, falls back to mock data if disabled
   - Requires Testnet API keys for authentication
   - Orders are executed on test environments (with test tokens, not real money)
   - Subject to test environment rate limits (more lenient than production)

3. **Live Mode**
   - Uses production environments
   - Makes real API calls to production exchange servers
   - Requires valid production API keys
   - Orders are executed with real money
   - Subject to stricter production API rate limits

### How Connection Mode Affects Account Behavior

#### Demo Account

| Connection Mode | Data Source                  | API Calls         | Authentication   | Order Execution          |
| --------------- | ---------------------------- | ----------------- | ---------------- | ------------------------ |
| Mock            | Simulated                    | None              | None             | Simulated                |
| Sandbox         | Binance Testnet (if enabled) | Real (to Testnet) | Testnet API keys | On Testnet (test tokens) |
| Live            | Binance Testnet (for safety) | Real (to Testnet) | Testnet API keys | On Testnet (test tokens) |

#### Binance Account (when implemented)

| Connection Mode | Data Source        | API Calls            | Authentication      | Order Execution            |
| --------------- | ------------------ | -------------------- | ------------------- | -------------------------- |
| Mock            | Simulated          | None                 | None                | Simulated                  |
| Sandbox         | Binance Testnet    | Real (to Testnet)    | Testnet API keys    | On Testnet (test tokens)   |
| Live            | Binance Production | Real (to Production) | Production API keys | On Production (real money) |

### Changing Connection Mode

1. Navigate to Developer Settings (`/admin/dev-settings`)
2. In the Feature Flags section, find the "Connection Mode" dropdown
3. Select the desired mode: Mock, Sandbox, or Live
4. The change takes effect immediately

### Technical Implementation

The Connection Mode setting is defined in `exchangeConfig.ts` and affects the entire application's data source strategy. It's used by the `ExchangeFactory` to determine which adapter to use for each exchange.

## Feature Flags

Feature flags allow you to toggle various features and behaviors in the application. Key feature flags include:

- **Use Mock Data**: Toggle to use mock data instead of real API calls
- **Use Real Market Data**: Toggle to use real market data
- **Connection Mode**: Switch between Mock, Sandbox, and Live modes
- **Enable Demo Account**: Toggle to enable/disable the Demo account
- **Enable Debug Tools**: Toggle to enable/disable debug tools
- **Use Binance Testnet**: Toggle to use Binance Testnet for the Demo account
- **Show Performance Metrics**: Toggle to show/hide performance metrics

## Exchange Settings

The Exchange Settings section contains configuration options for specific exchanges:

### Binance Testnet Settings

- **API Key**: Enter your Binance Testnet API key
- **API Secret**: Enter your Binance Testnet API secret
- **Test Connection**: Test the connection to Binance Testnet
- **Save**: Save your API key and secret

## API Explorer

The API Explorer allows you to test API endpoints and view responses. This feature is marked as "coming soon" in the current version.

## Binance Testnet Rate Limits

When using the Demo account in Sandbox mode with Binance Testnet enabled, you need to be aware of the rate limits imposed by Binance Testnet. Exceeding these limits can result in temporary bans and service disruptions.

### Rate Limit Types

Binance Testnet enforces several types of rate limits:

1. **Request Weight Limits**: 1200 request weight per minute per IP address

   - Each API endpoint has a specific weight
   - More complex requests consume more weight
   - The system tracks used weight through the `X-MBX-USED-WEIGHT-1M` response header

2. **Order Rate Limits**:

   - 10 orders per second per IP
   - 100,000 orders per 24 hours per account
   - The system tracks order count through the `X-MBX-ORDER-COUNT-1D` response header

3. **Raw Request Limits**: 6000 raw requests per 5 minutes per IP

4. **Connection Rate Limits**:

   - WebSocket services send ping frames every 20 seconds
   - Allowed pong delay is 1 minute
   - WebSocket connections have a limit of 5 incoming messages per second
   - A single WebSocket connection can listen to a maximum of 1024 streams

5. **FIX API Limits**:
   - FIX Order Entry: Maximum 10 concurrent connections per account
   - FIX Order Entry: 15 connection attempts within 30 seconds
   - FIX Drop Copy: 15 connection attempts within 30 seconds
   - FIX Market Data: 300 connection attempts within 300 seconds
   - FIX Drop Copy sessions: 60 messages per minute
   - FIX Market Data sessions: 2000 messages per minute

### Common Endpoint Weights

| Endpoint                      | Weight | Notes                                         |
| ----------------------------- | ------ | --------------------------------------------- |
| GET /api/v3/ping              | 1      | Server ping                                   |
| GET /api/v3/time              | 1      | Server time                                   |
| GET /api/v3/exchangeInfo      | 10     | Exchange information                          |
| GET /api/v3/depth             | 1-50   | Order book (weight varies by limit parameter) |
| GET /api/v3/trades            | 25     | Recent trades                                 |
| GET /api/v3/historicalTrades  | 25     | Historical trades                             |
| GET /api/v3/aggTrades         | 4      | Aggregate trades                              |
| GET /api/v3/klines            | 1      | Candlestick data                              |
| GET /api/v3/ticker/24hr       | 1-40   | 24hr price change statistics                  |
| GET /api/v3/ticker/price      | 1-2    | Latest price                                  |
| GET /api/v3/ticker/bookTicker | 1-2    | Best price/qty on the order book              |
| POST /api/v3/order            | 1      | Place an order                                |
| DELETE /api/v3/order          | 1      | Cancel an order                               |
| GET /api/v3/order             | 2      | Check order status                            |
| GET /api/v3/openOrders        | 3-40   | Current open orders                           |
| GET /api/v3/allOrders         | 10     | All orders                                    |
| GET /api/v3/account           | 10     | Account information                           |
| GET /api/v3/myTrades          | 5-10   | Trade history (5 with orderId, 10 without)    |

### Rate Limit Headers

The application tracks rate limits using response headers from Binance Testnet:

- `X-MBX-USED-WEIGHT-1M`: Used weight in the last 1 minute
- `X-MBX-ORDER-COUNT-1D`: Order count in the last 24 hours
- `X-MBX-ORDER-COUNT-1S`: Order count in the last 1 second
- `Retry-After`: Seconds until rate limit ban is lifted (when limits are exceeded)

### Best Practices to Avoid Rate Limits

1. **Monitor Headers**: Keep track of the rate limit headers to understand your current usage
2. **Batch Requests**: Combine multiple operations into a single request where possible
3. **Optimize Request Frequency**: Only request data when needed, not on a fixed schedule
4. **Use WebSockets for Real-time Data**: Instead of repeatedly polling REST endpoints
5. **Implement Exponential Backoff**: When rate limits are hit, wait progressively longer before retrying
6. **Cache Responses**: Store and reuse data that doesn't change frequently
7. **Limit Concurrent Requests**: Avoid sending too many requests simultaneously
8. **Use Lower Weight Endpoints**: Choose endpoints with lower weights when possible
9. **Handle 429 and 418 Responses**: Properly handle rate limit errors by respecting the Retry-After header

### Fallback Mechanism

If Binance Testnet is unavailable or rate limits are exceeded, the application will automatically fall back to mock data to ensure uninterrupted functionality.

## Rate Limit Prevention Mechanisms

The application implements several mechanisms to prevent hitting rate limits and protect our API privileges when connecting to Binance Testnet. These mechanisms ensure smooth operation even under heavy usage.

### 1. RateLimitManager

The core of our rate limiting system is the `RateLimitManager` class, which:

- Tracks used request weights and order counts
- Queues requests to stay within limits
- Implements automatic retry with backoff strategies
- Monitors rate limit headers from API responses

```typescript
/**
 * Rate limit manager for Binance Testnet API
 * Handles tracking and managing API rate limits
 */
export class RateLimitManager {
  private static instance: RateLimitManager;
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private requestQueues: Map<string, Array<() => Promise<any>>> = new Map();
  private processingQueues: Map<string, boolean> = new Map();

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Initialize with default rate limits for known exchanges
    this.initializeRateLimits('binance_testnet', {
      usedWeight: 0,
      weightLimit: 1200, // 1200 weight per minute
      orderCount: 0,
      orderLimit: 100000, // 100,000 orders per day
      resetTime: new Date(Date.now() + 60000), // 1 minute from now
      isRateLimited: false,
    });
  }
}
```

### 2. Request Queuing System

All API requests are queued and processed according to available rate limit capacity:

```typescript
public async queueRequest<T>(
  exchangeId: string,
  requestFn: () => Promise<T>,
  weight: number = 1,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const queue = this.requestQueues.get(exchangeId) || [];
    queue.push(async () => {
      try {
        const result = await requestFn();
        resolve(result);
        return result;
      } catch (error) {
        reject(error);
        throw error;
      }
    });
    this.requestQueues.set(exchangeId, queue);

    this.processQueue(exchangeId, weight);
  });
}
```

### 3. Dynamic Rate Limit Tracking

The system updates rate limit information from response headers:

```typescript
public updateFromHeaders(
  exchangeId: string,
  headers: Record<string, string>,
): void {
  const currentInfo = this.getRateLimitInfo(exchangeId);
  const updatedInfo: RateLimitInfo = { ...currentInfo };

  // Update used weight
  if (headers['x-mbx-used-weight-1m']) {
    updatedInfo.usedWeight = parseInt(headers['x-mbx-used-weight-1m']);
  }

  // Update order count
  if (headers['x-mbx-order-count-1d']) {
    updatedInfo.orderCount = parseInt(headers['x-mbx-order-count-1d']);
  }

  // Check if we're rate limited
  if (headers['retry-after']) {
    const retryAfter = parseInt(headers['retry-after']);
    updatedInfo.isRateLimited = true;
    updatedInfo.retryAfter = retryAfter;
    updatedInfo.resetTime = new Date(Date.now() + retryAfter * 1000);
  }

  // Update the rate limit info
  this.rateLimits.set(exchangeId, updatedInfo);
}
```

### 4. Automatic Retry with Exponential Backoff

When rate limits are hit, the system automatically retries with increasing delays:

```typescript
// If rate limited, wait for the specified time
if (lastError.message.includes('Rate limited')) {
  const retryAfterMatch = lastError.message.match(/Retry after (\d+) seconds/);
  const retryAfter = retryAfterMatch
    ? parseInt(retryAfterMatch[1]) * 1000
    : retryDelay;
  await new Promise((resolve) => setTimeout(resolve, retryAfter));
} else if (attempt < retries) {
  // For other errors, use exponential backoff
  await new Promise((resolve) =>
    setTimeout(resolve, retryDelay * Math.pow(2, attempt)),
  );
}
```

### 5. Mock Data Fallback

If rate limits are exceeded or the Testnet API is unavailable, the system falls back to mock data:

```typescript
try {
  // Try to get order book from Binance Testnet
  if (this.useBinanceTestnet) {
    const testOrderBook = await this.binanceTestAdapter.getOrderBook(
      symbol,
      limit,
    );
    // If we got data from Binance, use it
    if (testOrderBook) {
      return testOrderBook;
    }
  }
} catch (error) {
  console.error(
    `[SandboxAdapter] Error getting order book from Binance${
      this.useBinanceTestnet ? ' Testnet' : ''
    }:`,
    error,
  );
}

// Fallback to mock data if Binance fails
return this.mockDataService.generateOrderBook(this.exchangeId, symbol, limit);
```

### 6. Connection Status Monitoring

The system monitors the connection status to Binance Testnet and updates the UI accordingly:

```typescript
// Update connection status to connected
connectionManager.setStatus(exchangeId, {
  status: 'connected',
  message: `Successfully completed ${method} request to ${url}`,
  // Include rate limit info in the status
  rateLimit: rateLimitManager.getRateLimitInfo(exchangeId),
});
```

### 7. Rate Limit Visualization

The Developer Settings page includes a visualization of current rate limit usage, allowing administrators to monitor:

- Current used weight (out of 1200 per minute)
- Order count (out of 100,000 per day)
- Time until rate limit reset
- Connection status with rate limit information

### Benefits of Our Rate Limit Prevention System

1. **Prevents API Bans**: By respecting Binance's rate limits, we avoid temporary IP bans
2. **Ensures Continuous Operation**: Fallback to mock data ensures the application remains functional
3. **Optimizes API Usage**: Request queuing prevents wasting API calls during rate-limited periods
4. **Self-Healing**: Automatic retry with backoff allows recovery from temporary issues
5. **Transparent Monitoring**: Administrators can view current rate limit status in real-time
6. **Graceful Degradation**: The system gracefully falls back to less-real-time data sources when needed

### Scaling Challenges with Shared Testnet Account

As our user base grows, using a single Binance Testnet account for all users will present significant challenges:

#### What Happens When User Base Grows

1. **Rate Limit Exhaustion**:

   - The 1200 weight per minute limit will be quickly consumed
   - The 10 orders per second limit will be easily exceeded
   - The 100,000 orders per day limit could be reached during high activity

2. **Service Degradation**:

   - Users will experience increased latency as requests queue up
   - More requests will fall back to mock data instead of real Testnet data
   - The application will spend more time in "waiting" states

3. **Inconsistent Experience**:
   - Early users in a time window get real data while later users get mock data
   - Order placement may work for some users but not others
   - Market data quality will vary throughout the day

#### How Our System Handles This Situation

Our rate limit prevention system will:

1. **Queue Excess Requests**:

   - Requests beyond the rate limit will be queued
   - The queue can grow very large during peak usage
   - Processing time increases as the queue grows

2. **Increase Fallback to Mock Data**:

   - More requests will trigger the fallback mechanism
   - Users will see more simulated data than real Testnet data
   - The "connected to Testnet" indicator may fluctuate frequently

3. **Extend Retry Intervals**:
   - Exponential backoff will result in longer wait times
   - Some requests might be delayed significantly
   - Critical operations like order placement might time out

#### Recommended Solutions for MVP/Alpha Scale-Up

To address these limitations as we scale beyond initial MVP/Alpha:

1. **Multiple Testnet Accounts**:

   - Create multiple Binance Testnet accounts
   - Distribute users across different accounts
   - Implement a load balancing mechanism

2. **User-Specific Rate Limits**:

   - Allocate a portion of the total rate limit to each user
   - Prioritize critical operations (order placement) over data requests
   - Implement fair usage policies

3. **Enhanced Caching**:

   - Increase cache durations for market data
   - Implement shared caching across users for common data
   - Use WebSocket connections more aggressively to reduce REST API calls

4. **Hybrid Data Strategy**:
   - Use real-time WebSockets for critical data (price updates)
   - Use cached/mock data for less critical information
   - Implement progressive data loading strategies

> **Note**: This is a critical consideration for our post-MVP roadmap. As user adoption grows, we'll need to implement one or more of these solutions to maintain a quality user experience.
