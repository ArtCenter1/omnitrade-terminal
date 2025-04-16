# Wireframe Descriptions

This document provides textual descriptions of the intended wireframes for key pages of the OpenTrade platform. These descriptions should guide the visual wireframing process.

## General Elements

- **Navbar (Authenticated):** Present on most pages when logged in. Contains Logo, main navigation links (Dashboard, Terminal, Bots, Earn, Profile/Settings), Logout button.
- **Theme:** Assume a dark theme as default for wireframes.

## 1. Login Page (`/login`)

- **Layout:** Centered content area on the page.
- **Elements:**
  - Logo
  - Page Title ("Login")
  - Email Input Field (Label: "Email")
  - Password Input Field (Label: "Password", type="password")
  - "Remember Me" Checkbox (Optional)
  - Login Button (Text: "Login")
  - Link to Registration Page (Text: "Don't have an account? Sign Up")
  - Link to Password Reset Page (Text: "Forgot Password?")
- **Flow:** User enters credentials, clicks Login. On success, redirect to Dashboard. On failure, show error message near form.

## 2. Registration Page (`/register`)

- **Layout:** Centered content area on the page.
- **Elements:**
  - Logo
  - Page Title ("Create Account")
  - Email Input Field (Label: "Email")
  - Password Input Field (Label: "Password", type="password")
  - Confirm Password Input Field (Label: "Confirm Password", type="password")
  - Full Name Input Field (Optional, Label: "Full Name")
  - Terms of Service Checkbox (Label: "I agree to the Terms of Service")
  - Register Button (Text: "Create Account")
  - Link to Login Page (Text: "Already have an account? Log In")
- **Flow:** User enters details, agrees to ToS, clicks Register. On success, show success message/redirect to login or email verification step. On failure, show error messages near relevant fields.

## 3. Dashboard Page (`/dashboard`)

- **Layout:** Main content area with potential sidebar or header elements defined by `Navbar`.
- **Elements:**
  - **Navbar:** (As described above)
  - **Header Section:**
    - Page Title ("Dashboard")
    - Date/Time Display (Optional)
    - Global Actions (e.g., "Add Widget" - Future)
  - **Portfolio Overview Widget:**
    - Total Portfolio Value (Large font)
    - 24h Change (%)
    - Performance Chart (Small line/area chart showing portfolio value over time - e.g., 24h, 7d, 30d)
  - **Asset Allocation Widget:**
    - Donut/Pie Chart showing allocation by asset (BTC, ETH, USDT, etc.)
    - Legend or list showing asset, percentage, and value.
  - **Exchange Balances Widget:**
    - Tabs or sections for each connected exchange.
    - Table/List showing assets held on the selected exchange, quantity, and current value.
  - **Recent Activity Widget (Optional):**
    - List of recent trades placed via the platform or recent large portfolio changes.
- **Flow:** Default page after login. Displays aggregated information from connected exchanges. Widgets might be configurable in the future.

## 4. Trading Terminal Page (`/terminal`)

- **Layout:** Multi-panel layout, typically 3 main columns/sections.
- **Elements:**
  - **Navbar:** (As described above)
  - **(Left) Trading Sidebar:**
    - Market Selector (Search/Dropdown for trading pair, e.g., BTC/USDT)
    - Exchange Selector (Dropdown to choose which connected exchange context to use)
    - Trading Form:
      - Tabs for Buy/Sell
      - Order Type Selector (Market, Limit, Stop-Limit - Future)
      - Price Input (for Limit orders)
      - Amount/Quantity Input (Allow input in base or quote currency, potentially with percentage buttons: 25%, 50%, 75%, 100%)
      - Total Value Display
      - Place Order Button ("Buy BTC", "Sell BTC")
    - Available Balances Display (Shows available base and quote currency for trading)
  - **(Center) Charting Area:**
    - Price Overview Bar (Current Price, 24h Change, High, Low, Volume)
    - Main Chart Display (TradingView Widget/Library)
      - Candlestick Chart Area
      - Drawing Toolbar (Visible on the side)
    - Timeframe Selector (Buttons: 1m, 5m, 1h, 4h, 1D, etc.) below the chart.
  - **(Right) Market Info Area:**
    - Order Book:
      - Asks List (Price, Amount, Total)
      - Spread Display
      - Bids List (Price, Amount, Total)
      - (Optional) Grouping/Precision controls.
    - Recent Trades Feed:
      - List of recent market trades (Time, Price, Amount).
  - **(Bottom) User Data Area:**
    - Tabs: Positions, Open Orders, Order History, Trade History
    - Table displaying relevant data for the selected tab (e.g., Open Orders table with Symbol, Side, Price, Amount, Status, Cancel button).
- **Flow:** User selects market/exchange. Data panels (chart, order book, trades) update. User interacts with form to place trades. User views their positions/orders at the bottom.

---

_These descriptions cover the core pages. Wireframes for Profile, Bots, Earn pages would follow similar principles, breaking down the required information into logical sections and components._
