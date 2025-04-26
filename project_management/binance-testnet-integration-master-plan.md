# Binance Testnet Integration Master Plan

## Critical Context

**IMPORTANT**: The Binance Testnet integration is a critical component of our application:

- We do not have a built-in matching engine
- Binance Testnet serves as our default matching engine
- Order placement testing is blocked until we successfully connect to Binance Testnet
- All trading functionality depends on this integration

## Implementation Timeline

- **Phase 1**: Setup & Authentication (1-2 days) - **IN PROGRESS**
- **Phase 2**: Market Data Integration (1-2 days)
- **Phase 3**: Order Management (2-3 days)
- **Phase 4**: Account Management (1-2 days)
- **Phase 5**: Integration with Existing Sandbox Mode (1-2 days)
- **Phase 6**: Testing & Documentation (1-2 days)

**Total Estimated Time**: 8-13 days

## Prerequisites

- [x] **CRITICAL**: Binance Testnet account created
- [x] **CRITICAL**: API keys generated and secured
- [x] Testnet endpoints documented
- [ ] Rate limits understood and documented
- [x] Existing Sandbox mode functionality reviewed

## Phase 1: Setup & Authentication (IN PROGRESS)

### Environment Configuration

- [x] Create configuration file for Binance Testnet endpoints
- [x] Configure switching mechanism between mock and Binance Testnet
- [x] Update feature flags to include `useBinanceTestnet` option
- [ ] **CRITICAL**: Set up environment variables for API keys and secrets

### Authentication Implementation

- [x] Create `BinanceTestnetAdapter` class extending `BaseExchangeAdapter`
- [x] Implement HMAC-SHA256 signature generation for API requests
- [x] Create authentication header builder function
- [x] Implement API key validation test function
- [x] Add timestamp and recvWindow parameters to requests
- [x] **CRITICAL**: Secure storage implemented for API keys (ApiKeyManager)

### Connection Management

- [x] **CRITICAL**: Implement connection status tracking with clear UI indicators
- [x] Create reconnection logic with exponential backoff
- [x] Add connection health check mechanism
- [x] Implement API request throttling to respect rate limits

### Testing Authentication

- [x] Create test for API key validation
- [ ] **CRITICAL**: Test basic authenticated request with real API keys
- [x] Verify signature generation
- [ ] Test error handling for invalid credentials

## Phase 2: Market Data Integration

### REST API Market Data

- [ ] Implement exchange information endpoint (`/api/v3/exchangeInfo`)
- [ ] Create trading pairs retrieval (`/api/v3/ticker/24hr`)
- [ ] Implement order book data fetching (`/api/v3/depth`)
- [ ] Add recent trades retrieval (`/api/v3/trades`)
- [ ] Implement klines/candlestick data (`/api/v3/klines`)

### WebSocket Market Data

- [ ] Set up WebSocket connection manager
- [ ] Implement market data streams (ticker, depth, trades)
- [ ] Create message parsing and normalization
- [ ] Add reconnection and error handling
- [ ] Implement data caching for connection drops

### Data Normalization

- [ ] Create adapters to normalize Binance data to application format
- [ ] Implement symbol name conversion (e.g., BTCUSDT → BTC/USDT)
- [ ] Add price and quantity precision handling
- [ ] Create unified market data interface

### Testing Market Data

- [ ] Test REST API endpoints with sample requests
- [ ] Verify WebSocket data streams
- [ ] Test data normalization
- [ ] Benchmark performance and latency

## Phase 3: Order Management

### Basic Order Operations

- [ ] Implement order placement (`/api/v3/order`)
  - [ ] Market orders
  - [ ] Limit orders
  - [ ] Stop-limit orders
- [ ] Add order cancellation (`/api/v3/order`)
- [ ] Implement order status checking (`/api/v3/order`)
- [ ] Create open orders retrieval (`/api/v3/openOrders`)
- [ ] Add order history retrieval (`/api/v3/allOrders`)

### Order Tracking

- [ ] Create order tracking system
- [ ] Implement local order cache
- [ ] Add order status update mechanism
- [ ] Create order execution reporting
- [ ] Implement fill tracking

### WebSocket Order Updates

- [ ] Set up user data stream (`/api/v3/userDataStream`)
- [ ] Implement account update handling
- [ ] Add order update processing
- [ ] Create trade update handling

### Error Handling

- [ ] Implement comprehensive error code handling
- [ ] Add retry logic for transient errors
- [ ] Create user-friendly error messages
- [ ] Implement logging for debugging

### Testing Order Management

- [ ] Test market order placement and execution
- [ ] Test limit order placement and execution
- [ ] Test order cancellation
- [ ] Verify order status updates
- [ ] Test error scenarios

## Phase 4: Account Management

### Account Information

- [ ] Implement account information retrieval (`/api/v3/account`)
- [ ] Create balance tracking
- [ ] Add position management
- [ ] Implement asset information retrieval

### Balance Updates

- [ ] Create balance update handling from WebSocket
- [ ] Implement available balance calculation
- [ ] Add balance reservation for orders
- [ ] Create balance reconciliation mechanism

### Account Limits

- [ ] Implement trading limits checking
- [ ] Add leverage limits (if applicable)
- [ ] Create position size validation

### Testing Account Management

- [ ] Test account information retrieval
- [ ] Verify balance updates
- [ ] Test balance reservation
- [ ] Validate position tracking

## Phase 5: Integration with Existing Sandbox Mode

### Adapter Integration

- [x] Update `ExchangeFactory` to support Binance Testnet
- [x] Modify `SandboxAdapter` to use Binance Testnet
- [x] Create fallback mechanism to mock implementation
- [x] Implement feature flag checking

### UI Integration

- [ ] Update exchange selection UI to show Binance Testnet
- [x] **CRITICAL**: Add connection status indicator with clear visual feedback
- [x] Create settings for Testnet configuration
- [x] Implement error display for Testnet connection issues

### Testing Integration

- [ ] Test switching between mock and Testnet modes
- [ ] Verify UI updates correctly
- [ ] Test error handling and fallbacks
- [ ] **CRITICAL**: Validate end-to-end order flow with Testnet

## Phase 6: Testing & Documentation

### Comprehensive Testing

- [ ] Create integration test suite
- [ ] Implement automated tests for critical paths
- [ ] Add performance testing
- [ ] Create edge case tests

### Documentation

- [ ] Update API documentation
- [ ] Create usage examples
- [ ] Document known limitations
- [ ] Add troubleshooting guide

### Monitoring & Logging

- [ ] Implement detailed logging
- [ ] Create performance metrics
- [ ] Add error tracking
- [ ] Implement usage statistics

## Technical Specifications

### API Endpoints

- Base URL: `https://testnet.binance.vision/api`
- WebSocket Base: `wss://testnet.binance.vision/ws`
- User Data Stream: `wss://testnet.binance.vision/ws/<listenKey>`

### Authentication

- HMAC-SHA256 signature
- API Key in `X-MBX-APIKEY` header
- Parameters: `timestamp`, `signature`, optional `recvWindow`

### Rate Limits

- **Request Weight Limits**: 1200 request weight per minute per IP address
- **Order Rate Limits**: 10 orders per second per IP, 100,000 orders per 24 hours per account
- **Raw Request Limits**: 6000 raw requests per 5 minutes per IP

#### Endpoint Weights

| Endpoint                 | Weight | Notes                                                                          |
| ------------------------ | ------ | ------------------------------------------------------------------------------ |
| GET /api/v3/ping         | 1      | Server ping                                                                    |
| GET /api/v3/exchangeInfo | 10     | Exchange information                                                           |
| GET /api/v3/depth        | 1-50   | 1 for limit ≤ 100, 5 for limit ≤ 500, 10 for limit ≤ 1000, 50 for limit > 1000 |
| GET /api/v3/trades       | 1      | Recent trades                                                                  |
| GET /api/v3/klines       | 1      | Candlestick data                                                               |
| GET /api/v3/ticker/24hr  | 1-40   | 1 for a single symbol, 40 for all symbols                                      |
| POST /api/v3/order       | 1      | Place an order                                                                 |
| DELETE /api/v3/order     | 1      | Cancel an order                                                                |
| GET /api/v3/order        | 2      | Check order status                                                             |
| GET /api/v3/openOrders   | 3-40   | 3 for a single symbol, 40 for all symbols                                      |
| GET /api/v3/account      | 10     | Account information                                                            |
| GET /api/v3/myTrades     | 10     | Trade history                                                                  |
| GET /api/v3/allOrders    | 10     | Order history                                                                  |

#### Rate Limit Headers

- `X-MBX-USED-WEIGHT-1M`: Used weight in the last 1 minute
- `X-MBX-ORDER-COUNT-1D`: Order count in the last 24 hours
- `Retry-After`: Seconds until rate limit ban is lifted

### Data Formats

- REST: JSON
- WebSocket: JSON
- Timestamps: milliseconds since epoch

## Risks and Contingencies

### Risk: Testnet Availability

- **Contingency**: Implement fallback to mock implementation
- **Monitoring**: Regular health checks of Testnet API

### Risk: API Changes

- **Contingency**: Version-specific implementation
- **Monitoring**: Subscribe to Binance API announcements

### Risk: Rate Limiting

- **Contingency**: Implement request queuing and throttling
- **Monitoring**: Track rate limit headers in responses

### Risk: Data Inconsistency

- **Contingency**: Regular reconciliation with REST API
- **Monitoring**: Compare WebSocket and REST data

## Critical Success Criteria

1. **CRITICAL**: Successfully connect to Binance Testnet with real API keys
2. **CRITICAL**: Place and execute orders on Binance Testnet
3. **CRITICAL**: Display clear UI indicators showing connection status
4. **CRITICAL**: Implement fallback to mock data when Testnet unavailable
5. Real-time market data displayed in the application
6. Account balances accurately reflected
7. Seamless switching between mock and Testnet modes
8. Comprehensive error handling and user feedback

## Progress Summary

### Completed Items

- [x] Configuration file created for Binance Testnet endpoints
- [x] Switching mechanism configured between mock and Binance Testnet
- [x] Feature flags updated to include `useBinanceTestnet` option
- [x] `BinanceTestnetAdapter` class created extending `BaseExchangeAdapter`
- [x] HMAC-SHA256 signature generation implemented for API requests
- [x] Authentication header builder function created
- [x] API key validation test function implemented
- [x] Timestamp and recvWindow parameters added to requests
- [x] Secure API key storage implemented (ApiKeyManager)
- [x] Connection status tracking implemented with clear UI indicators
- [x] Connection status UI components created
- [x] Reconnection logic created with exponential backoff
- [x] Connection health check mechanism added
- [x] `ExchangeFactory` updated to support Binance Testnet
- [x] `SandboxAdapter` modified to use Binance Testnet
- [x] Fallback mechanism created to mock implementation
- [x] Feature flag checking implemented
- [x] Settings created for Testnet configuration
- [x] Error display implemented for Testnet connection issues
- [x] Rate limit tracking and management implemented
- [x] Request queuing and throttling implemented for API rate limits
- [x] Comprehensive documentation of rate limits added

### In Progress

- [ ] **CRITICAL**: Test basic authenticated request with real API keys
- [ ] **CRITICAL**: Guided setup process created for API key configuration
- [x] API request throttling implemented to respect rate limits
- [ ] Error handling tested for invalid credentials

### Next Steps

1. **CRITICAL**: Create a guided setup wizard for Binance Testnet API keys
2. **CRITICAL**: Test with real Binance Testnet API keys
3. Implement order placement testing
4. Add WebSocket connection for real-time data

## Weekly Progress Tracking

### Week 1 (Current)

- [x] Start Phase 1: Setup & Authentication
  - [x] Environment Configuration (75% complete)
  - [x] Authentication Implementation (100% complete)
  - [x] Connection Management (100% complete)
  - [ ] Testing Authentication (50% complete)
- [ ] Start Phase 2: Market Data Integration

### Week 2 (Planned)

- [ ] Complete Phase 1: Setup & Authentication
- [ ] Complete Phase 2: Market Data Integration
- [ ] Start Phase 3: Order Management

### Week 3 (Planned)

- [ ] Complete Phase 3: Order Management
- [ ] Complete Phase 4: Account Management
- [ ] Complete Phase 5: Integration with Existing Sandbox Mode
- [ ] Start Phase 6: Testing & Documentation

### Week 4 (Planned)

- [ ] Complete Phase 6: Testing & Documentation
- [ ] Final testing and bug fixes
- [ ] Release preparation
