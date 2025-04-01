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