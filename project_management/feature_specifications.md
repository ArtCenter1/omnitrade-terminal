# Feature Specifications

This document provides detailed specifications for the features outlined in the User Stories document.

## Feature: Trading Chart Display (Relates to Story 4)

### 1. Overview

Display an interactive financial chart for a selected trading pair using the TradingView Lightweight Charts library or Widget.

### 2. Requirements

*   **Data Source:** Fetch real-time or near real-time candlestick data (OHLCV - Open, High, Low, Close, Volume) from the selected exchange's API (e.g., Binance).
*   **Pair Selection:** Allow users to select the trading pair to display (e.g., BTC/USDT, ETH/BTC). This might be via a dropdown or search input.
*   **Timeframe Selection:** Provide options to switch between different timeframes (e.g., 1m, 5m, 15m, 1h, 4h, 1D, 1W). The selected timeframe should be clearly indicated.
*   **Chart Type:** Default to candlestick chart. (Consider adding Line, Area charts later).
*   **Interactivity:**
    *   Users should be able to zoom in/out on the chart.
    *   Users should be able to pan the chart horizontally.
    *   Hovering over a data point (candle) should display its OHLCV data and date/time.
*   **Drawing Tools:** Provide basic drawing tools (accessible via a toolbar):
    *   Trend Line
    *   Horizontal Line
    *   Fibonacci Retracement
    *   (Others TBD)
*   **Indicators:** Allow users to add basic technical indicators (e.g., Moving Average, RSI, MACD). (Implementation details TBD - might be built-in TradingView feature or custom).
*   **Theme:** Chart should respect the application's theme (e.g., dark mode).
*   **Responsiveness:** Chart should resize appropriately within its container on different screen sizes.

### 3. UI Elements

*   Chart container area.
*   Timeframe selector buttons/dropdown.
*   (If applicable) Pair selector input/dropdown.
*   (If applicable) Indicators button/menu.
*   Drawing tools toolbar (provided by TradingView widget).

### 4. Error Handling

*   Display a clear message if chart data fails to load for the selected pair or timeframe.
*   Handle API rate limits gracefully if applicable.

## Feature: Order Book Display (Relates to Story 5)

### 1. Overview

Display a real-time order book (depth chart) for the selected trading pair, showing current buy (bids) and sell (asks) orders.

### 2. Requirements

*   **Data Source:** Fetch real-time order book data (lists of bids and asks with price and quantity) from the selected exchange's API.
*   **Pair Synchronization:** Order book must always display data for the currently selected trading pair in the terminal.
*   **Real-time Updates:** Order book should update in real-time via WebSocket or frequent polling, reflecting new, modified, or cancelled orders.
*   **Display Format:**
    *   Separate sections for Bids (usually green) and Asks (usually red).
    *   Each row should display Price, Amount (Size), and Total (cumulative size or value).
    *   The spread (difference between the highest bid and lowest ask) should be clearly visible.
*   **Grouping/Precision:** Allow users to adjust the price precision or grouping level (e.g., group orders by 0.01, 0.1, 1).
*   **Depth Visualization (Optional):** Display a background bar indicating the relative depth/size of orders at each price level.

### 3. UI Elements

*   Bid table/list.
*   Ask table/list.
*   Spread indicator.
*   (Optional) Precision/grouping controls.

### 4. Error Handling

*   Display a message if order book data fails to load or update.

---
*More feature specifications will be added here.*

## Feature: Community & Leaderboards (Relates to Future User Stories)

### 1. Overview

Provide a dedicated "Community" page showcasing the performance of user-created trading bots via public leaderboards. This serves to foster community engagement, allow users to compare strategies, and act as a discovery mechanism for potential copy trading.

### 2. Requirements

*   **Community Page:** Create a new top-level page/section accessible from the main navigation.
*   **Bot Sharing Opt-In:**
    *   Users must explicitly choose to make a specific bot's performance (backtest results or live trading) public for leaderboard inclusion.
    *   This setting should be configurable per bot.
    *   Clear indication of privacy implications when sharing.
*   **Performance Tracking (Backend):**
    *   **Backtests:** Store standardized results of backtests run on the platform, including configuration, duration, and key metrics (ROI, Drawdown, Win Rate, Profit Factor, etc.).
    *   **Live Trading:** Continuously track the performance of *shared* live bots. This requires recording trades executed by the bot, calculating P/L, and deriving metrics over time. Data needs to be aggregated periodically (e.g., daily, weekly) for leaderboard display.
    *   *Requires significant data model updates (e.g., `shared_bots`, `bot_performance_snapshots`, `backtest_results` tables/collections).*
*   **Leaderboards Display:**
    *   Display two distinct leaderboards side-by-side on the Community page:
        *   **Backtest Leaderboard:** Ranks bots based on their historical backtest performance.
        *   **Live Trade Leaderboard:** Ranks currently running (or recently active) shared bots based on their live trading performance.
    *   Each leaderboard should display key information for each ranked bot:
        *   Rank
        *   Bot Name (User-defined)
        *   Strategy Type (e.g., GRID, DCA)
        *   Market Pair
        *   Key Performance Metric (e.g., ROI%, Profit Factor - configurable sort?)
        *   Duration (Backtest period or Live trading duration)
        *   Creator Username/Alias (Optional, user configurable?)
        *   Link to view more detailed bot performance (Future feature)
        *   "Copy" button/indicator (Future feature - links to copy trading setup)
*   **Filtering & Sorting:**
    *   Allow users to filter leaderboards by Strategy Type, Market Pair, Timeframe (for live performance, e.g., 7d, 30d, 90d, All-time).
    *   Allow users to sort leaderboards by different performance metrics (ROI, Profit Factor, etc.).
*   **Data Freshness:** Indicate when the leaderboard data was last updated. Live leaderboard data should be updated reasonably frequently (e.g., hourly or daily).
*   **Landing Page Preview:**
    *   Display a preview section of a leaderboard (e.g., Top 3-5 Live Bots by ROI%) on the main public landing page.
    *   This section should highlight key attractive metrics (e.g., ROI, Win Rate).
    *   Include a clear Call to Action (CTA) linking to the full Community page or registration.
    *   Requires a dedicated public API endpoint to fetch this preview data without authentication.

### 3. UI Elements

*   Community Page Layout (potentially two columns for leaderboards).
*   Leaderboard Table Component (reusable for both backtest and live).
*   Filtering controls (Dropdowns, buttons).
*   Sorting controls (Clickable table headers).
*   Pagination for leaderboards if they become long.
*   Bot sharing toggle/checkbox within the bot configuration UI.
*   Landing Page Leaderboard Preview Component.

### 4. Data Model Considerations

*   Need new tables/collections to store shared bot status, backtest results, and aggregated live performance snapshots.
*   Need to define standardized performance metrics and calculation logic.
*   User profile settings might need additions for public alias/sharing preferences.

### 5. Copy Trading Link

*   The leaderboards are the primary source for users to find bots they might want to copy. The UI should facilitate this transition once copy trading is implemented (e.g., via a "Copy" button).

### 6. Error Handling

*   Display appropriate messages if leaderboard data cannot be loaded.
*   Handle cases where a user stops sharing a bot (it should be removed from the live leaderboard).

## Feature: AI-Driven Trading (Relates to Future User Stories & Roadmap Phase 5)

### 1. Overview

Introduce AI capabilities into the platform, offering both pre-built AI-powered trading strategies provided by OpenTrade and allowing advanced users to integrate their own external AI models/signals via API ("Bring Your Own AI" - BYOAI). This feature aims to attract users interested in cutting-edge trading automation.

### 2. Requirements

*   **Landing Page Introduction:**
    *   Add a dedicated section on the public landing page introducing the AI trading capabilities.
    *   Briefly explain the concept of platform AI bots and the BYOAI feature.
    *   Highlight potential benefits (e.g., advanced signal processing, adaptive strategies).
    *   Include a Call to Action (CTA) encouraging users to sign up to access these features.
*   **Platform AI Bots (Post-MVP/Later Phase):**
    *   Develop and offer a selection of pre-built trading bots powered by AI/ML models (e.g., sentiment analysis, predictive models).
    *   Users can browse, select, configure (limited parameters), and deploy these bots similar to standard strategy bots.
    *   Performance and configuration details for these specific AI models need definition.
    *   Requires significant backend AI model development/integration and infrastructure.
*   **Custom AI Integration (BYOAI) (Post-MVP/Later Phase):**
    *   **API Endpoint for Signals:** Provide a secure API endpoint within the OpenTrade platform for users' external AI models to send trading signals (e.g., BUY, SELL, HOLD, specific order parameters).
    *   **Signal Definition:** Define a clear and standardized format for incoming API signals (e.g., JSON payload specifying market pair, action, quantity/percentage, optional price limits, unique signal ID).
    *   **Authentication:** Secure the API endpoint using user-specific API keys generated within the platform.
    *   **Bot Configuration:** Create a new "Custom AI Signal" bot type in the bot configuration UI.
        *   Users select this type when creating a bot.
        *   Users configure the market pair, exchange account, risk parameters (e.g., max position size, capital allocation).
        *   The UI displays the dedicated API endpoint URL and allows the user to generate/manage API keys for this specific bot/signal source.
    *   **Signal Execution:** When the platform receives a valid signal via the API endpoint for a configured BYOAI bot, it translates the signal into the corresponding trade order(s) and executes them on the user's linked exchange account, respecting the bot's risk parameters.
    *   **Logging & Monitoring:** Log all incoming signals, validation results, and resulting trade executions for user visibility and debugging.
*   **Dedicated AI Section (Authenticated App):**
    *   Create a new section/page within the authenticated application dedicated to AI Trading.
    *   This section would list available Platform AI Bots (when implemented).
    *   This section would provide the interface for configuring BYOAI bots and managing their API keys/endpoints.

### 3. UI Elements

*   Landing Page AI Introduction Section Component.
*   Authenticated App:
    *   AI Trading main page/section.
    *   Configuration UI for "Custom AI Signal" bot type.
    *   Display area for BYOAI API endpoint URL and key management.
    *   (Future) Cards/Listings for Platform AI Bots.
    *   Monitoring view for BYOAI signal logs and executions.

### 4. Data Model Considerations

*   Extend `trading_bots` table/model to include `strategyType = 'CUSTOM_AI_SIGNAL'`.
*   Need a new table/collection to store API keys associated with BYOAI bots (`ai_signal_api_keys`?).
*   Need a table/collection to log incoming AI signals (`ai_signal_logs`?).
*   (Future) Need models for Platform AI Bot definitions and configurations.

### 5. Backend Considerations

*   Implement the secure API endpoint for receiving external AI signals.
*   Develop the logic to validate incoming signals against bot configuration and user permissions.
*   Implement the signal-to-trade execution translation layer.
*   Develop API key generation and management functionality.
*   (Future) Develop/integrate platform AI models.

### 6. Error Handling

*   Provide clear error responses for invalid API signals (bad format, invalid key, unknown bot, etc.).
*   Log errors during signal processing or trade execution.
*   Notify users (optional) of persistent signal failures or execution issues.