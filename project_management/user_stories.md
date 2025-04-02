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

### Epic: Community & Leaderboards

*   **Story 12:** As a Bot User, I want to choose to share a specific bot's backtest results publicly so that I can contribute to the community leaderboard and showcase its potential.
    *   AC 1: A toggle/checkbox exists in the bot configuration or backtest results view to enable sharing.
    *   AC 2: Enabling sharing makes the relevant backtest result eligible for the Backtest Leaderboard.
    *   AC 3: User is informed that sharing makes results public.
    *   AC 4: User can disable sharing, removing the result from public view (if already displayed).
*   **Story 13:** As a Bot User, I want to choose to share a specific running bot's live performance publicly so that I can contribute to the community leaderboard and demonstrate its real-world effectiveness.
    *   AC 1: A toggle/checkbox exists in the bot management view for live bots to enable sharing.
    *   AC 2: Enabling sharing makes the bot's ongoing performance eligible for the Live Trade Leaderboard.
    *   AC 3: User is informed that sharing makes performance data public.
    *   AC 4: User can disable sharing, removing the bot from the live leaderboard.
*   **Story 14:** As a Trader or Bot User, I want to view the Community page with leaderboards for top-performing backtested and live bots so that I can discover successful strategies and compare performance.
    *   AC 1: A "Community" link is available in the main navigation.
    *   AC 2: The Community page displays two distinct leaderboards: Backtest and Live Trade.
    *   AC 3: Each leaderboard shows Rank, Bot Name, Strategy, Market, Key Metric, Duration, and Creator (Alias if available).
    *   AC 4: Only bots explicitly shared by their creators appear on the leaderboards.
*   **Story 15:** As a Trader or Bot User viewing the leaderboards, I want to filter the results by strategy type and market pair so that I can find bots relevant to my interests.
    *   AC 1: Filter controls (e.g., dropdowns) are available for Strategy Type and Market Pair.
    *   AC 2: Applying filters updates both leaderboards to show only matching shared bots.
*   **Story 16:** As a Trader or Bot User viewing the leaderboards, I want to sort the results by different performance metrics (e.g., ROI, Profit Factor) so that I can rank bots based on criteria important to me.
    *   AC 1: Table headers for key performance metrics are clickable.
    *   AC 2: Clicking a header sorts the respective leaderboard based on that metric (ascending/descending).
*   **(Optional) Story 17:** As a User, I want to set a public alias in my profile settings so that my leaderboard contributions are displayed under that alias instead of my real name or email.
    *   AC 1: A field for "Public Alias" exists in the user profile settings.
    *   AC 2: If set, this alias is displayed on leaderboards instead of other identifiers.
    *   AC 3: If not set, a default non-identifying placeholder might be used (TBD).
*   **Story 18:** As an unregistered visitor, I want to see a preview of the top-performing community bots on the landing page so that I am motivated to sign up and explore the platform further.
    *   AC 1: The landing page displays a section showcasing leaderboard highlights (e.g., Top 3-5 bots).
    *   AC 2: The preview shows key attractive metrics (e.g., ROI, Win Rate).
    *   AC 3: The preview includes a clear call to action (e.g., "See Full Leaderboard", "Sign Up").
    *   AC 4: The data shown is publicly accessible without login.

### Epic: AI-Driven Trading

*   **Story 19:** As an unregistered visitor, I want to see an introduction to AI trading features on the landing page so that I understand the platform's advanced capabilities and am encouraged to sign up.
    *   AC 1: Landing page includes a section describing Platform AI Bots and Custom AI Integration (BYOAI).
    *   AC 2: The section highlights potential benefits of AI trading.
    *   AC 3: A clear call to action links to registration or further information.
*   **Story 20:** As a Bot User, I want to configure a "Custom AI Signal" bot so that I can have the platform execute trades based on signals sent from my external AI model via API.
    *   AC 1: A "Custom AI Signal" strategy type is available during bot creation.
    *   AC 2: User can configure market pair, exchange account, and risk parameters for this bot type.
    *   AC 3: The configuration UI displays a unique, secure API endpoint URL for the user's external AI to send signals to.
    *   AC 4: User can generate and view an API key required to authenticate signals sent to the endpoint.
*   **Story 21:** As a Bot User with a configured "Custom AI Signal" bot, I want the platform to securely receive and validate signals sent from my external AI model so that only authorized and correctly formatted instructions are processed.
    *   AC 1: The platform provides a secure HTTPS API endpoint.
    *   AC 2: Incoming requests must include the correct API key for authentication.
    *   AC 3: Incoming signal payload must match the defined standard format (market, action, quantity, etc.).
    *   AC 4: Invalid signals (bad key, bad format, unknown bot) are rejected with appropriate error codes/messages.
*   **Story 22:** As a Bot User with a configured "Custom AI Signal" bot, I want the platform to execute trades on my linked exchange account based on validated signals received from my external AI model so that my AI's decisions are automatically traded.
    *   AC 1: Validated BUY/SELL signals trigger corresponding market or limit orders (based on signal content).
    *   AC 2: Trade execution respects the risk parameters set in the bot configuration (e.g., capital allocation).
    *   AC 3: Execution results (fills, errors) are logged.
*   **Story 23:** As a Bot User using the "Custom AI Signal" feature, I want to view logs of incoming signals and their processing status (e.g., received, validated, executed, rejected) so that I can monitor and debug my integration.
    *   AC 1: A dedicated view shows a history of signals received for the user's BYOAI bots.
    *   AC 2: Logs include timestamp, signal content, validation status, and any resulting trade execution IDs or error messages.
*   **(Future) Story 24:** As a Bot User, I want to browse and deploy pre-built Platform AI Bots so that I can leverage advanced AI strategies without building my own models.
    *   AC 1: A selection of Platform AI Bots is available in the AI Trading section.
    *   AC 2: User can view descriptions and potential performance characteristics of each Platform AI Bot.
    *   AC 3: User can configure and deploy a Platform AI Bot similar to standard strategy bots.