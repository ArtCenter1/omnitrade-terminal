# Data Model: Trading Bot

This document defines the data structure for representing a trading bot within the OmniTrade platform.

## Bot Configuration

| Attribute         | Type        | Description                                                                 | Example                                   | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------|--------------------------------------------|
| `botId`           | UUID/String | Unique identifier for the bot instance.                                     | `b7a3f9d0-1b9e-4c7e-8d0a-9b3c1f7e5a2d` | Primary Key                                |
| `userId`          | UUID/String | Identifier of the user who owns the bot.                                    | `u1b9e4c7-e8d0-a9b3-c1f7-e5a2db7a3f9d` | Foreign Key (references User model)        |
| `botName`         | String      | User-defined name for the bot.                                              | "My ETH Grid Bot"                         |                                            |
| `strategyType`    | Enum/String | The type of strategy the bot employs.                                       | `GRID`, `DCA`, `SIGNAL_TA`, `CUSTOM`      |                                            |
| `exchangeAccountId`| UUID/String | Identifier of the connected exchange account the bot trades on.             | `ea9b3c1f-7e5a-2db7-a3f9-d01b9e4c7e8d` | Foreign Key (references Exchange Account) |
| `marketPair`      | String      | The trading pair the bot operates on (e.g., BTC/USDT).                      | "ETH/USDT"                                | Format: BASE/QUOTE                         |
| `parameters`      | JSON/Object | Strategy-specific configuration parameters.                                 | `{"gridLevels": 10, "rangeLow": 1800, ...}` | Structure varies based on `strategyType` |
| `allocatedCapital`| Decimal     | Amount of capital allocated to this bot from the user's account.            | `1000.00`                                 | In the quote currency of `marketPair`      |
| `status`          | Enum/String | Current operational status of the bot.                                      | `ACTIVE`, `PAUSED`, `STOPPED`, `ERROR`    |                                            |
| `createdAt`       | Timestamp   | Timestamp when the bot configuration was created.                           | `2025-04-02T13:30:00Z`                    |                                            |
| `updatedAt`       | Timestamp   | Timestamp when the bot configuration was last updated.                      | `2025-04-02T13:35:00Z`                    |                                            |
| `isActive`        | Boolean     | Simplified flag indicating if the bot is currently running (derived/actual). | `true`                                    | Can be derived from `status`               |

## Bot Performance & State (Potentially separate table/document store)

| Attribute         | Type        | Description                                                                 | Example                                   | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------|--------------------------------------------|
| `botId`           | UUID/String | Unique identifier for the bot instance.                                     | `b7a3f9d0-1b9e-4c7e-8d0a-9b3c1f7e5a2d` | Foreign Key (references Bot Configuration) |
| `currentProfitLoss`| Decimal     | Realized + Unrealized P/L since the bot started.                            | `55.75`                                   | In the quote currency                      |
| `totalTrades`     | Integer     | Total number of trades executed by the bot.                                 | `128`                                     |                                            |
| `winRate`         | Float       | Percentage of winning trades.                                               | `0.65`                                    | (Winning Trades / Total Trades)            |
| `lastExecutionTime`| Timestamp   | Timestamp of the bot's last trade execution or check-in.                    | `2025-04-02T13:40:15Z`                    |                                            |
| `runningSince`    | Timestamp   | Timestamp when the bot was last started/activated.                          | `2025-04-01T10:00:00Z`                    |                                            |
| `currentStateData`| JSON/Object | Internal state information needed for the bot's logic (e.g., open orders). | `{"openOrderId": "xyz", "lastPrice": 1950}` | Highly strategy-dependent                |

## Relationships

*   A `User` can have multiple `Trading Bots`.
*   A `Trading Bot` belongs to one `User`.
*   A `Trading Bot` is linked to one `Exchange Account`.
*   A `Trading Bot` operates on one `Market Pair`.
*   A `Trading Bot` has one set of `Performance/State` data (could be 1:1 or 1:N if tracking historical states).

This provides a starting point for the trading bot data model. We can refine this further.