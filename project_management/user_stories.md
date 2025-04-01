# User Stories

This document outlines the user stories for the OpenTrade platform, describing features from the perspective of different user roles.

## User Roles

*   **Trader:** An individual user focused on executing trades, analyzing markets, and managing their portfolio.
*   **Bot User:** A user interested in deploying and managing automated trading bots.
*   **Staker/Earner:** A user focused on earning rewards through staking or other platform mechanisms.
*   **(Future) Admin:** A user responsible for platform maintenance and oversight.

## Story Format

We will use the standard user story format:

**As a [type of user], I want to [perform some task] so that I can [achieve some goal].**

Acceptance Criteria (AC) will be defined for each story.

## Epics & Stories

### Epic: User Authentication & Profile Management

*   **Story 1:** As a new user, I want to register for an account using my email and password so that I can access the platform.
    *   AC 1: User provides a valid email and a strong password.
    *   AC 2: Account is created successfully.
    *   AC 3: User receives a confirmation email (optional).
    *   AC 4: User can log in with the new credentials.
*   **Story 2:** As a registered user, I want to log in to my account so that I can access my dashboard and trading features.
    *   AC 1: User provides correct email and password.
    *   AC 2: User is redirected to their dashboard upon successful login.
    *   AC 3: Error message shown for incorrect credentials.
*   **Story 3:** As a logged-in user, I want to view and update my profile information (e.g., name, password) so that my account details are accurate.
    *   AC 1: User can access a profile settings page.
    *   AC 2: User can change their password following security requirements.
    *   AC 3: User can update basic profile details.

### Epic: Trading Terminal

*   **Story 4:** As a trader, I want to view a real-time price chart for a selected trading pair (e.g., BTC/USDT) so that I can analyze price movements.
    *   AC 1: Chart displays data from a selected exchange (e.g., Binance).
    *   AC 2: Chart updates in real-time or near real-time.
    *   AC 3: User can select different timeframes (1m, 5m, 1h, 1D, etc.).
    *   AC 4: User can use basic drawing tools on the chart.
*   **Story 5:** As a trader, I want to view the order book for a selected trading pair so that I can see market depth and current bids/asks.
    *   AC 1: Order book displays bids and asks separately.
    *   AC 2: Order book updates in real-time.
    *   AC 3: User can see price, amount, and total for each level.
*   **Story 6:** As a trader, I want to place a market order (buy/sell) for a selected trading pair so that I can execute a trade immediately at the best available price.
    *   AC 1: User selects market order type.
    *   AC 2: User inputs the amount to buy/sell.
    *   AC 3: Order is submitted to the connected exchange account.
    *   AC 4: User receives confirmation of order placement/execution.
*   **Story 7:** As a trader, I want to place a limit order (buy/sell) for a selected trading pair so that I can execute a trade at a specific price or better.
    *   AC 1: User selects limit order type.
    *   AC 2: User inputs the amount and the limit price.
    *   AC 3: Order is submitted to the connected exchange account.
    *   AC 4: User receives confirmation of order placement.

### Epic: Dashboard & Portfolio

*   **Story 8:** As a logged-in user, I want to see an overview of my total portfolio value so that I understand my current holdings.
*   **Story 9:** As a logged-in user, I want to see a breakdown of my assets across connected exchanges so that I know where my funds are located.

### Epic: Trading Bots (Placeholder)

*   **Story 10:** As a bot user, I want to browse available trading bot strategies so that I can choose one to deploy.

### Epic: Earn/Staking (Placeholder)

*   **Story 11:** As a staker, I want to view available staking options and their potential rewards so that I can decide where to allocate my assets.

---
*This is an initial list and will be expanded and refined.*