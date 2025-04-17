# Exchange Adapter System

This directory contains the exchange adapter system, which provides a consistent interface for interacting with different cryptocurrency exchanges.

## Overview

The exchange adapter system is designed to:

1. Provide a unified interface for all exchange operations
2. Support multiple exchanges (Binance, Coinbase, etc.)
3. Allow switching between mock, sandbox, and live modes
4. Generate realistic mock data for development

## Components

### Exchange Interfaces (`/src/types/exchange.ts`)

Defines the common interfaces for all exchange-related data structures and operations:

- `Exchange`: Basic exchange information
- `TradingPair`: Trading pair information
- `OrderBook`: Order book data
- `Kline`: Candlestick/kline data
- `Portfolio`: User portfolio data
- `Order`: Order information
- `PerformanceMetrics`: Trading performance metrics
- `ExchangeAdapter`: Main interface for exchange operations

### Mock Data Service (`/src/services/mockData/`)

Generates realistic mock data for development:

- `mockDataUtils.ts`: Utility functions and constants
- `mockDataService.ts`: Main service for generating mock data

### Exchange Adapters (`/src/services/exchange/`)

Implements the `ExchangeAdapter` interface for different exchanges:

- `baseExchangeAdapter.ts`: Base class for all exchange adapters
- `binanceAdapter.ts`: Adapter for Binance
- `coinbaseAdapter.ts`: Adapter for Coinbase
- `exchangeFactory.ts`: Factory for creating exchange adapters

### Configuration (`/src/config/exchangeConfig.ts`)

Controls the behavior of the exchange adapters:

- Environment modes: development, test, production
- Connection modes: mock, sandbox, live
- API endpoints for different connection modes

## Usage

### Getting an Exchange Adapter

```typescript
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';

// Get an adapter for Binance
const binanceAdapter = ExchangeFactory.getAdapter('binance');

// Get an adapter for Coinbase
const coinbaseAdapter = ExchangeFactory.getAdapter('coinbase');
```

### Fetching Market Data

```typescript
// Get trading pairs
const pairs = await binanceAdapter.getTradingPairs();

// Get order book
const orderBook = await binanceAdapter.getOrderBook('BTC/USDT');

// Get klines (candlestick data)
const klines = await binanceAdapter.getKlines(
  'BTC/USDT',
  '1h',
  startTime,
  endTime,
  100,
);
```

### User Operations

```typescript
// Get user portfolio
const portfolio = await binanceAdapter.getPortfolio(apiKeyId);

// Place an order
const order = await binanceAdapter.placeOrder(apiKeyId, {
  symbol: 'BTC/USDT',
  side: 'buy',
  type: 'limit',
  price: 30000,
  quantity: 0.1,
});

// Get open orders
const openOrders = await binanceAdapter.getOpenOrders(apiKeyId);

// Get order history
const orderHistory = await binanceAdapter.getOrderHistory(apiKeyId);

// Get performance metrics
const performance = await binanceAdapter.getPerformanceMetrics(apiKeyId, '1m');
```

### Switching Between Modes

```typescript
import { setConnectionMode } from '@/config/exchangeConfig';

// Switch to mock mode
setConnectionMode('mock');

// Switch to sandbox mode
setConnectionMode('sandbox');

// Switch to live mode
setConnectionMode('live');
```

## Adding a New Exchange

To add support for a new exchange:

1. Create a new adapter class that extends `BaseExchangeAdapter`
2. Implement all required methods
3. Add the exchange to the `ExchangeFactory`
4. Add endpoints to the configuration

## Mock Data

The mock data system generates realistic data for development:

- Trading pairs with appropriate price ranges
- Order books with realistic price levels
- Candlestick data with realistic price movements
- User portfolios with a mix of assets
- Orders with various statuses and types
- Performance metrics

The data is consistent within a session but randomized between sessions.
