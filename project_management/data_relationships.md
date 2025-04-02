# Data Relationship Plan

This document outlines the key relationships between the core data entities defined for the OmniTrade platform, primarily focusing on database-level foreign key relationships.

## Core Entities

*   **Users:** Represents registered users of the platform. (`users` table, PK: `user_id`)
*   **Exchange Accounts:** Represents user-linked accounts on external exchanges (Implied, needs formal definition). (e.g., `exchange_accounts` table, PK: `account_id`)
*   **Trading Bots:** Represents automated trading strategies configured by users. (`trading_bots` table, PK: `botId`)
*   **Bot Performance:** Tracks the performance metrics and state of a trading bot. (`bot_performance` table/collection, FK: `botId`)
*   **Market Pairs:** Represents tradable assets on exchanges. (`market_pairs` table, PK: `symbol` [+ `exchange` if needed])
*   **User Token Balances:** Tracks users' Omni Token holdings on the platform. (`user_token_balances` table, FK: `userId`)
*   **Staking Pools:** Defines available staking programs. (`staking_pools` table, PK: `poolId`)
*   **User Stakes:** Represents individual user stakes in pools. (`user_stakes` table, PK: `stakeId`)
*   **Reward Transactions:** Logs reward distributions to users. (`reward_transaction_logs` table, PK: `logId`)

## Key Relationships (Foreign Keys)

1.  **User <-> Trading Bot:**
    *   `trading_bots.userId` -> `users.user_id` (Many-to-One: A user can have multiple bots, a bot belongs to one user).
2.  **User <-> Exchange Account:** (Assuming `exchange_accounts` table)
    *   `exchange_accounts.userId` -> `users.user_id` (Many-to-One: A user can link multiple exchange accounts, an account belongs to one user).
3.  **Trading Bot <-> Exchange Account:**
    *   `trading_bots.exchangeAccountId` -> `exchange_accounts.account_id` (Many-to-One: Multiple bots might use the same exchange account, a bot uses one specific account).
4.  **Trading Bot <-> Market Pair:**
    *   `trading_bots.marketPair` -> `market_pairs.symbol` (Many-to-One: Multiple bots can trade the same pair, a bot operates on one pair). *Note: This assumes `marketPair` stores the `symbol`. If exchange-specific pairs are needed, the relationship might involve a composite key.*
5.  **Trading Bot <-> Bot Performance:**
    *   `bot_performance.botId` -> `trading_bots.botId` (One-to-One or One-to-Many: Typically one performance record per bot, but could be historical).
6.  **User <-> User Token Balance:**
    *   `user_token_balances.userId` -> `users.user_id` (One-to-One: Each user has one balance record).
7.  **User <-> User Stake:**
    *   `user_stakes.userId` -> `users.user_id` (Many-to-One: A user can have multiple stakes).
8.  **Staking Pool <-> User Stake:**
    *   `user_stakes.poolId` -> `staking_pools.poolId` (Many-to-One: A pool can have multiple user stakes).
9.  **User <-> Reward Transaction Log:**
    *   `reward_transaction_logs.userId` -> `users.user_id` (Many-to-One: A user can receive multiple rewards).
10. **User Stake <-> Reward Transaction Log:** (Optional Context)
    *   `reward_transaction_logs.sourceId` -> `user_stakes.stakeId` (Many-to-One: A stake can generate multiple reward transactions, a reward transaction might originate from one stake). *Note: `sourceId` is polymorphic.*

## Implied Entity: Exchange Accounts

A basic structure for `exchange_accounts` could be:

| Column Name      | Data Type    | Constraints              | Description                                      |
| :--------------- | :----------- | :----------------------- | :----------------------------------------------- |
| `account_id`     | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the linked account       |
| `user_id`        | UUID         | NOT NULL, FK (users)     | The user who owns this account link            |
| `exchange_name`  | VARCHAR(100) | NOT NULL                 | Name of the exchange (e.g., "Binance", "KuCoin") |
| `api_key_hash`   | VARCHAR(255) | NOT NULL                 | Hashed API key provided by the user            |
| `api_secret_hash`| VARCHAR(255) | NOT NULL                 | Hashed API secret provided by the user           |
| `account_nickname`| VARCHAR(100) | NULL                     | User-defined nickname for the account          |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()  | Timestamp when the account link was created    |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()  | Timestamp when the link was last updated       |
| `is_valid`       | BOOLEAN      | NOT NULL, DEFAULT FALSE  | Flag indicating if the API credentials are valid |

*Note: Storing hashed API keys/secrets is crucial for security.*

This plan provides a consolidated view of how the different data models connect within the OmniTrade system.