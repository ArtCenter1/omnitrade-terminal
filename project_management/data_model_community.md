# Data Model: Community & Performance Tracking

This document outlines the necessary data model additions and modifications to support the Community/Leaderboard feature, including bot sharing, backtest result storage, and live performance tracking.

## 1. Modifications to Existing Models

### 1.1. `trading_bots` Table (Ref: `data_model_trading_bot.md`)

Add the following columns to track sharing preferences:

| Column Name       | Data Type    | Constraints             | Description                                                   |
| :---------------- | :----------- | :---------------------- | :------------------------------------------------------------ |
| `share_backtest`  | BOOLEAN      | NOT NULL, DEFAULT FALSE | User's choice to share this bot's backtest results publicly.  |
| `share_live`      | BOOLEAN      | NOT NULL, DEFAULT FALSE | User's choice to share this bot's live performance publicly.  |
| `public_bot_name` | VARCHAR(255) | NULL                    | Optional public name for the bot if different from `botName`. |

### 1.2. `users` Table (Ref: `data_model_user.md`) (Optional)

Consider adding a field for a public alias if `email` or `full_name` are not suitable for public display on leaderboards:

| Column Name    | Data Type    | Constraints  | Description                                      |
| :------------- | :----------- | :----------- | :----------------------------------------------- |
| `public_alias` | VARCHAR(100) | UNIQUE, NULL | User-defined public alias for leaderboards, etc. |

## 2. New Entities

### 2.1. `backtest_results` Table/Collection

Stores the results of individual backtest executions.

| Attribute            | Type           | Description                                                     | Example                   | Notes                                   |
| -------------------- | -------------- | --------------------------------------------------------------- | ------------------------- | --------------------------------------- |
| `resultId`           | UUID/String    | Unique identifier for the backtest result.                      | `br_a1b2c3`               | Primary Key                             |
| `botId`              | UUID/String    | Identifier of the bot configuration used for the backtest.      | `b7a3f9d0...`             | Foreign Key (references `trading_bots`) |
| `userId`             | UUID/String    | Identifier of the user who ran the backtest.                    | `u1b9e4c7...`             | Foreign Key (references `users`)        |
| `runTimestamp`       | Timestamp      | When the backtest was executed.                                 | `2025-04-02T15:00:00Z`    |                                         |
| `marketPair`         | String         | Market pair used in the backtest.                               | "ETH/USDT"                |                                         |
| `timeframe`          | String         | Timeframe of the historical data used.                          | "1h"                      |                                         |
| `startDate`          | Date/Timestamp | Start date of the backtest period.                              | `2024-01-01`              |                                         |
| `endDate`            | Date/Timestamp | End date of the backtest period.                                | `2024-12-31`              |                                         |
| `initialCapital`     | Decimal        | Starting capital for the backtest.                              | `10000.00`                |                                         |
| `finalCapital`       | Decimal        | Ending capital after the backtest.                              | `13500.00`                |                                         |
| `totalReturnPct`     | Float          | Total return percentage.                                        | `0.35`                    | (35%)                                   |
| `maxDrawdownPct`     | Float          | Maximum drawdown percentage during the backtest.                | `0.15`                    | (15%)                                   |
| `profitFactor`       | Float          | Gross profit / Gross loss.                                      | `2.5`                     |                                         |
| `winRate`            | Float          | Percentage of winning trades.                                   | `0.60`                    | (60%)                                   |
| `totalTrades`        | Integer        | Total number of trades executed.                                | `250`                     |                                         |
| `sharpeRatio`        | Float          | Risk-adjusted return (requires risk-free rate).                 | `1.8`                     | Optional                                |
| `parametersSnapshot` | JSON/Object    | Snapshot of the bot parameters used for this specific backtest. | `{"gridLevels": 10, ...}` | Important for reproducibility           |
| `logOutput`          | Text/String    | Path to detailed log file or stored log output (optional).      | `/logs/br_a1b2c3.log`     | Optional                                |

### 2.2. `bot_performance_snapshots` Table/Collection

Stores periodic snapshots of key performance metrics for _shared_ live trading bots. Used to populate the live leaderboard efficiently.

| Attribute              | Type        | Description                                                                | Example                                  | Notes                                   |
| ---------------------- | ----------- | -------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------- |
| `snapshotId`           | UUID/String | Unique identifier for the snapshot.                                        | `bps_x1y2z3`                             | Primary Key                             |
| `botId`                | UUID/String | Identifier of the live trading bot.                                        | `b7a3f9d0...`                            | Foreign Key (references `trading_bots`) |
| `userId`               | UUID/String | Identifier of the bot owner.                                               | `u1b9e4c7...`                            | Foreign Key (references `users`)        |
| `snapshotTimestamp`    | Timestamp   | Timestamp when this snapshot was taken (e.g., end of day UTC).             | `2025-04-02T23:59:59Z`                   | Time index                              |
| `period`               | Enum/String | The aggregation period this snapshot represents (e.g., `DAILY`, `WEEKLY`). | `DAILY`                                  | Allows different granularity            |
| `cumulativeProfitLoss` | Decimal     | Total realized P/L since the bot started _up to this snapshot time_.       | `150.75`                                 | Quote currency                          |
| `cumulativeReturnPct`  | Float       | Total return percentage since bot start _up to this snapshot time_.        | `0.15075`                                | (15.075%)                               |
| `totalTrades`          | Integer     | Total number of trades executed _up to this snapshot time_.                | `55`                                     |                                         |
| `metrics`              | JSON/Object | Other relevant metrics calculated for the period or cumulatively.          | `{"winRate": 0.65, "profitFactor": 2.1}` | Flexible for adding more metrics        |
| `runningSince`         | Timestamp   | Timestamp when the bot instance contributing to this snapshot started.     | `2025-04-01T10:00:00Z`                   | For calculating duration                |

## 3. Updated Relationships (Ref: `data_relationships.md`)

- **Trading Bot <-> Backtest Result:**
  - `backtest_results.botId` -> `trading_bots.botId` (Many-to-One: A bot config can have multiple backtest results).
- **User <-> Backtest Result:**
  - `backtest_results.userId` -> `users.user_id` (Many-to-One: A user can run multiple backtests).
- **Trading Bot <-> Performance Snapshot:**
  - `bot_performance_snapshots.botId` -> `trading_bots.botId` (Many-to-Many via time: A bot has many snapshots over time).
- **User <-> Performance Snapshot:**
  - `bot_performance_snapshots.userId` -> `users.user_id` (Many-to-Many via time: A user's bots have many snapshots).

This structure provides the necessary data points to track performance, manage sharing, and populate the community leaderboards.
