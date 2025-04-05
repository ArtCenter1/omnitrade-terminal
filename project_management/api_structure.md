# API Structure Plan (Initial)

This document outlines the initial plan for the backend API structure that will serve the OpenTrade frontend application.

**Note:** This plan assumes a RESTful approach. GraphQL could be considered as an alternative, especially if frontend data requirements become highly varied and complex.

## Base URL

The API will be versioned.
*   `/api/v1/`

## Authentication

*   Authentication will likely use JWT (JSON Web Tokens).
*   A login endpoint will return a token upon successful credential validation.
*   This token must be included in the `Authorization` header (e.g., `Authorization: Bearer <token>`) for all subsequent authenticated requests.
*   Endpoints will be clearly marked as requiring authentication.

## Resources and Endpoints

### 1. Authentication (`/auth`)

*   **`POST /api/v1/auth/register`**
    *   **Description:** Register a new user.
    *   **Request Body:** `{ email, password, fullName? }`
    *   **Response:** `{ userId, email }` (or success message)
    *   **Auth Required:** No
*   **`POST /api/v1/auth/login`**
    *   **Description:** Log in an existing user.
    *   **Request Body:** `{ email, password }`
    *   **Response:** `{ accessToken, refreshToken?, user: { userId, email, fullName? } }`
    *   **Auth Required:** No
*   **`POST /api/v1/auth/refresh`**
    *   **Description:** Obtain a new access token using a refresh token.
    *   **Request Body:** `{ refreshToken }`
    *   **Response:** `{ accessToken }`
    *   **Auth Required:** No (Requires valid refresh token)
*   **`POST /api/v1/auth/logout`**
    *   **Description:** Log out the user (e.g., invalidate refresh token if applicable).
    *   **Request Body:** (Optional, might just use access token)
    *   **Response:** Success message
    *   **Auth Required:** Yes

### 2. User Profile (`/users`)

*   **`GET /api/v1/users/me`**
    *   **Description:** Get the profile information for the currently authenticated user.
    *   **Response:** `{ userId, email, fullName, createdAt, lastLoginAt }`
    *   **Auth Required:** Yes
*   **`PUT /api/v1/users/me`**
    *   **Description:** Update the profile information for the currently authenticated user.
    *   **Request Body:** `{ fullName? }` (Other fields TBD)
    *   **Response:** Updated user profile object.
    *   **Auth Required:** Yes
*   **`PUT /api/v1/users/me/password`**
    *   **Description:** Change the password for the currently authenticated user.
    *   **Request Body:** `{ currentPassword, newPassword }`
    *   **Response:** Success message.
    *   **Auth Required:** Yes

### 3. Exchanges (`/exchanges`)

*   **`GET /api/v1/exchanges`**
    *   **Description:** Get a list of supported and active exchanges.
    *   **Response:** `[ { exchangeId, exchangeName }, ... ]`
    *   **Auth Required:** No (or Yes, depending on whether the list is sensitive)

### 4. User API Keys (`/user-api-keys`)

*   **`GET /api/v1/user-api-keys`**
    *   **Description:** Get a list of API keys configured by the authenticated user. (Does NOT return the actual keys).
    *   **Response:** `[ { apiKeyId, exchangeId, keyNickname, createdAt, isValid?, permissions? }, ... ]`
    *   **Auth Required:** Yes
*   **`POST /api/v1/user-api-keys`**
    *   **Description:** Add a new API key for a specific exchange.
    *   **Request Body:** `{ exchangeId, apiKey, apiSecret, keyNickname? }`
    *   **Response:** `{ apiKeyId, exchangeId, keyNickname, createdAt }` (Confirms creation, no keys returned)
    *   **Auth Required:** Yes
*   **`DELETE /api/v1/user-api-keys/{apiKeyId}`**
    *   **Description:** Delete a specific API key configuration.
    *   **Response:** Success message (204 No Content)
    *   **Auth Required:** Yes
*   **`PUT /api/v1/user-api-keys/{apiKeyId}`**
    *   **Description:** Update the nickname for a specific API key.
    *   **Request Body:** `{ keyNickname }`
    *   **Response:** Updated API key info object (no keys returned).
    *   **Auth Required:** Yes

### 5. Market Data (`/market-data`) - Proxied

*   **`GET /api/v1/market-data/symbols`**
    *   **Description:** Get available trading symbols/pairs for a given exchange.
    *   **Query Params:** `exchangeId=binance`
    *   **Response:** `[ { symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT", ... }, ... ]` (Structure depends on exchange)
    *   **Auth Required:** No (Potentially Yes if access is restricted)
*   **`GET /api/v1/market-data/klines`**
    *   **Description:** Get candlestick/kline data for a symbol.
    *   **Query Params:** `exchangeId=binance`, `symbol=BTCUSDT`, `interval=1h`, `startTime?`, `endTime?`, `limit?`
    *   **Response:** Array of kline data `[ [timestamp, open, high, low, close, volume], ... ]` (Standard format)
    *   **Auth Required:** No (Potentially Yes)
*   **`GET /api/v1/market-data/orderbook`**
    *   **Description:** Get the order book depth for a symbol.
    *   **Query Params:** `exchangeId=binance`, `symbol=BTCUSDT`, `limit?`
    *   **Response:** `{ bids: [ [price, quantity], ... ], asks: [ [price, quantity], ... ], lastUpdateId? }`
    *   **Auth Required:** No (Potentially Yes)
*   **WebSocket:** A separate WebSocket endpoint (e.g., `/ws/v1/market-data`) might be needed for streaming real-time data (order books, trades, klines) to avoid excessive polling. Authentication for WS needs consideration (e.g., token in connection URL or initial message).

### 6. Trading (`/trading`) - Requires API Key context

*   **`POST /api/v1/trading/orders`**
    *   **Description:** Place a new order on a specific exchange using a configured API key.
    *   **Request Body:** `{ apiKeyId, symbol, side: "BUY" | "SELL", type: "MARKET" | "LIMIT", quantity?, price? (for LIMIT), timeInForce? }`
    *   **Response:** Order confirmation details from the exchange `{ orderId, symbol, status, ... }`
    *   **Auth Required:** Yes
*   **`GET /api/v1/trading/orders`**
    *   **Description:** Get open orders for the user on a specific exchange/symbol.
    *   **Query Params:** `apiKeyId`, `symbol?`
    *   **Response:** `[ { orderId, symbol, status, price, quantity, ... }, ... ]`
    *   **Auth Required:** Yes
*   **`GET /api/v1/trading/orders/{orderId}`**
    *   **Description:** Get details of a specific order.
    *   **Query Params:** `apiKeyId` (or derived from orderId context)
    *   **Response:** `{ orderId, symbol, status, price, quantity, executedQuantity, ... }`
    *   **Auth Required:** Yes
*   **`DELETE /api/v1/trading/orders/{orderId}`**
    *   **Description:** Cancel an open order.
    *   **Query Params:** `apiKeyId` (or derived from orderId context)
    *   **Response:** Cancellation confirmation details.
    *   **Auth Required:** Yes
*   **`GET /api/v1/trading/balances`**
    *   **Description:** Get account balances for the user on a specific exchange.
    *   **Query Params:** `apiKeyId`
    *   **Response:** `{ [asset: string]: { free: string, locked: string } }` (e.g., `{ "BTC": { "free": "0.1", "locked": "0.01" }, ... }`)
    *   **Auth Required:** Yes

### 7. Performance Tracking (`/performance`)

*   **`GET /api/v1/performance/bots/{botId}`**
    *   **Description:** Get the latest live performance snapshot and recent backtest results for a specific bot owned by the authenticated user.
    *   **Path Params:** `botId` (string, required) - The ID of the bot.
    *   **Response:** `{ live: BotPerformance | null, backtests: BacktestResult[] }`
        *   `BotPerformance`: `{ performance_id, bot_id, timestamp, roi, win_rate, max_drawdown, profit_factor, total_trades, sharpe_ratio?, sortino_ratio?, equity, is_live, created_at, updated_at }`
        *   `BacktestResult`: `{ backtest_id, bot_id, strategy_config, start_date, end_date, roi, win_rate, max_drawdown, profit_factor, total_trades, sharpe_ratio?, sortino_ratio?, equity_curve?, created_at }`
    *   **Auth Required:** Yes
*   **`GET /api/v1/performance/leaderboard`**
    *   **Description:** Get aggregated performance data for leaderboards (e.g., top bots by ROI). Currently uses mock data.
    *   **Query Params:**
        *   `metric` (string, optional, default: 'roi'): The performance metric to rank by (e.g., 'roi', 'profit_factor').
        *   `timePeriod` (string, optional, default: 'all'): The time period for aggregation (e.g., '1d', '7d', '30d', 'all'). (Note: Mock data ignores this currently).
        *   `limit` (integer, optional, default: 10): The maximum number of leaderboard entries to return.
    *   **Response:** `[ { rank, bot_id, bot_name, user_name, metric_value, metric_name, timestamp }, ... ]`
    *   **Auth Required:** Yes

## Data Formats

*   Use JSON for request and response bodies.
*   Use standard HTTP status codes (200, 201, 204, 400, 401, 403, 404, 500).
*   Provide clear error messages in response bodies for client errors (4xx) and server errors (5xx). Example error format: `{ "error": { "code": "INVALID_INPUT", "message": "Email format is invalid." } }`

---
*This is an initial plan and will be refined. Specific response structures for proxied exchange data will depend on the exchanges.*