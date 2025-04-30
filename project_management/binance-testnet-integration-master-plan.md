# Binance Testnet Integration Master Plan

## Critical Context

**IMPORTANT**: The Binance Testnet integration is a critical component of our application:

- We do not have a built-in matching engine
- Binance Testnet serves as our default matching engine
- Order placement testing is blocked until we successfully connect to Binance Testnet
- All trading functionality depends on this integration

## Implementation Timeline

- **Phase 1**: Setup & Authentication (1-2 days) - **COMPLETED**
- **Phase 2**: Market Data Integration (1-2 days) - **COMPLETED**
- **Phase 3**: Order Management (2-3 days) - **COMPLETED**
- **Phase 4**: Account Management (1-2 days) - **IN PROGRESS**
- **Phase 5**: Integration with Existing Demo Mode (1-2 days)
- **Phase 6**: Testing & Documentation (1-2 days)

**Total Estimated Time**: 8-13 days

## Prerequisites

- [x] **CRITICAL**: Binance Testnet account created
- [x] **CRITICAL**: API keys generated and secured
- [x] Testnet endpoints documented
- [x] Rate limits understood and documented
- [x] Existing Demo mode functionality reviewed

## Phase 1: Setup & Authentication (COMPLETED)

### Environment Configuration

- [x] Create configuration file for Binance Testnet endpoints
- [x] Configure switching mechanism between mock and Binance Testnet
- [x] Update feature flags to include `useBinanceTestnet` option
- [x] **CRITICAL**: Set up environment variables for API keys and secrets

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
- [x] **CRITICAL**: Test basic authenticated request with real API keys
- [x] Verify signature generation
- [x] Test error handling for invalid credentials

## Phase 2: Market Data Integration (COMPLETED)

### REST API Market Data

- [x] Implement exchange information endpoint (`/api/v3/exchangeInfo`)
- [x] Create trading pairs retrieval (`/api/v3/ticker/24hr`)
- [x] Implement order book data fetching (`/api/v3/depth`)
- [x] Add recent trades retrieval (`/api/v3/trades`)
- [x] Implement klines/candlestick data (`/api/v3/klines`)

### WebSocket Market Data

- [x] Set up WebSocket connection manager
- [x] Implement market data streams (ticker, depth, trades)
- [x] Create message parsing and normalization
- [x] Add reconnection and error handling
- [x] Implement data caching for connection drops

### Data Normalization

- [x] Create adapters to normalize Binance data to application format
- [x] Implement symbol name conversion (e.g., BTCUSDT → BTC/USDT)
- [x] Add price and quantity precision handling
- [x] Create unified market data interface

### Testing Market Data

- [x] Test REST API endpoints with sample requests
- [x] Verify WebSocket data streams
- [x] Test data normalization
- [x] **PRIORITY**: Benchmark performance and latency (Phase 1 - Basic Metrics) - IMPLEMENTATION IN PROGRESS

## Phase 3: Order Management (COMPLETED)

### Basic Order Operations

- [x] Implement order placement (`/api/v3/order`)
  - [x] Market orders
  - [x] Limit orders
  - [x] Stop-limit orders
  - [x] Stop-market orders
- [x] Add order cancellation (`/api/v3/order`)
- [x] Implement order status checking (via `/api/v3/openOrders` and `/api/v3/allOrders`)
- [x] Create open orders retrieval (`/api/v3/openOrders`)
- [x] Add order history retrieval (`/api/v3/allOrders`)

### Order Tracking

- [x] Create order tracking system
- [x] Implement local order cache
- [x] Add order status update mechanism
- [x] Create order execution reporting
- [x] Implement fill tracking

### WebSocket Order Updates

- [x] Set up user data stream (`/api/v3/userDataStream`)
- [x] Implement account update handling
- [x] Add order update processing
- [x] Create trade update handling

### Error Handling

- [x] Implement comprehensive error code handling
- [x] Add retry logic for transient errors
- [x] Create user-friendly error messages
- [x] Implement logging for debugging

### Testing Order Management

- [x] Test market order placement and execution
- [x] Test limit order placement and execution
- [x] Test stop order placement
- [x] Test order cancellation
- [x] Verify order status updates
- [x] Test error scenarios
- [x] Create UI for testing order placement

## Phase 4: Account Management

### Account Information

- [x] Implement account information retrieval (`/api/v3/account`)
- [x] Create balance tracking
- [x] Add position management
- [ ] Implement asset information retrieval

### Balance Updates

- [x] Create balance update handling from WebSocket
- [x] Implement available balance calculation
- [x] Add balance reservation for orders
- [x] Create balance reconciliation mechanism

### Account Limits

- [ ] Implement trading limits checking
- [ ] Add leverage limits (if applicable)
- [ ] Create position size validation

### Testing Account Management

- [x] Test account information retrieval
- [x] Verify balance updates
- [x] Test balance reservation
- [x] Validate position tracking

## Phase 5: Integration with Existing Demo Mode

### Adapter Integration

- [x] Update `ExchangeFactory` to support Binance Testnet
- [x] Modify `DemoAdapter` (formerly SandboxAdapter) to use Binance Testnet
- [x] Create fallback mechanism to mock implementation
- [x] Implement feature flag checking

### UI Integration

- [x] Update exchange selection UI to show Binance Testnet
- [x] **CRITICAL**: Add connection status indicator with clear visual feedback
- [x] Create settings for Testnet configuration
- [x] Implement error display for Testnet connection issues

### Testing Integration

- [x] Test switching between mock and Testnet modes
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

- **Contingency**: ✅ Implement request queuing and throttling
- **Monitoring**: ✅ Track rate limit headers in responses

### Risk: Data Inconsistency

- **Contingency**: Regular reconciliation with REST API
- **Monitoring**: Compare WebSocket and REST data

## Critical Success Criteria

1. ✅ **CRITICAL**: Successfully connect to Binance Testnet with real API keys
2. ✅ **CRITICAL**: Place and execute orders on Binance Testnet
3. ✅ **CRITICAL**: Display clear UI indicators showing connection status
4. ✅ **CRITICAL**: Implement fallback to mock data when Testnet unavailable
5. ✅ Real-time market data displayed in the application
6. Account balances accurately reflected
7. ✅ Seamless switching between mock and Testnet modes
8. ✅ Comprehensive error handling and user feedback

## Next Steps

1. ✅ Implement REST API Market Data Integration (Phase 2) - COMPLETED

2. ✅ Add WebSocket connection for real-time market data - COMPLETED:

   - ✅ Set up WebSocket connection manager
   - ✅ Implement market data streams (ticker, depth, trades)
   - ✅ Create message parsing and normalization
   - ✅ Add reconnection and error handling
   - ✅ Implement data caching for connection drops

3. ✅ Implement Order Management (Phase 3) - COMPLETED:

   - ✅ Implement order placement (market, limit, stop orders)
   - ✅ Add order cancellation
   - ✅ Create open orders retrieval
   - ✅ Add order history retrieval
   - ✅ Create UI for testing order placement

4. ✅ Implement Order Tracking and WebSocket Order Updates - COMPLETED:

   - ✅ Create order tracking system with local cache
   - ✅ Set up user data stream for real-time order updates
   - ✅ Implement order status update mechanism
   - ✅ Add order execution reporting and fill tracking
   - ✅ Create handlers for account and trade updates

5. **PRIORITY**: Complete Phase 1 of performance benchmarking for Market Data Integration:

   - Implement basic performance logging in the `BinanceTestnetAdapter`
   - Measure latency for key REST API endpoints (order book, recent trades, ticker)
   - Track rate limit utilization metrics (weight usage, order count)
   - Document baseline performance metrics

   See [Binance Testnet Basic Benchmarking](binance-testnet-basic-benchmarking.md) for Phase 1 approach.

   Note: Phase 2 (comprehensive benchmarking and visualization) will be deferred until after MVP. See [Binance Testnet Benchmarking Plan](binance-testnet-benchmarking-plan.md) for the full approach.

6. Proceed to Account Management (Phase 4)

Note: The guided setup wizard for Binance Testnet API keys has been moved to the Comprehensive Onboarding Experience roadmap to be integrated with the user onboarding tour.

## Post-MVP Scaling Considerations

**IMPORTANT**: As user adoption grows beyond the initial MVP/Alpha release, the current rate limit implementation will become a bottleneck. A single Binance Testnet account (1200 weight/minute, 10 orders/second) cannot support multiple concurrent users.

For post-MVP scaling, we will need to implement:

1. **Multiple Testnet Accounts**: Load balancing system to distribute users across multiple accounts
2. **User-Specific Rate Limits**: Fair usage policy with allocated rate limits per user
3. **Enhanced Caching**: Shared caching for common market data to reduce API calls
4. **WebSocket Optimization**: Maximize WebSocket usage to minimize REST API calls
5. **Request Prioritization**: System to prioritize critical operations over data requests

This scaling work has been added to the project roadmap under "Post-MVP Scaling Considerations" and should be prioritized once we reach a certain user threshold.

## Resources

- [Binance Testnet Documentation](https://testnet.binance.vision/)
- [Binance API Documentation](https://binance-docs.github.io/apidocs/spot/en/)
- [Existing Demo Implementation](src/services/exchange/sandboxAdapter.ts)
- [Basic Benchmarking Plan (Phase 1)](binance-testnet-basic-benchmarking.md)
- [Comprehensive Benchmarking Plan (Phase 2)](binance-testnet-benchmarking-plan.md)
