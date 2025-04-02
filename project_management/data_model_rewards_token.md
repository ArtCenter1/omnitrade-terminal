# Data Model: Rewards and Omni Token

This document outlines the data structures related to the Omni Token and associated reward programs within the OmniTrade platform.

## Omni Token Information

Static or semi-static information about the native platform token.

| Attribute         | Type        | Description                                                                 | Example                                   | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------|--------------------------------------------|
| `tokenSymbol`     | String      | The official symbol of the token.                                           | "OMNI"                                    | Primary Identifier                         |
| `tokenName`       | String      | The full name of the token.                                                 | "Omni Token"                              |                                            |
| `contractAddress` | String      | The smart contract address (if applicable, e.g., on Ethereum/BSC).          | `0x123...abc`                             | Chain-dependent                            |
| `blockchain`      | String      | The blockchain the token resides on (if applicable).                        | "Ethereum"                                |                                            |
| `totalSupply`     | BigInt/Decimal| The total maximum supply of the token.                                      | `100000000`                               | Consider precision                         |
| `circulatingSupply`| BigInt/Decimal| The current circulating supply (updated periodically).                      | `45000000`                                | Can be dynamic                           |
| `description`     | Text        | A brief description of the token's purpose.                                 | "Native utility and governance token..."  |                                            |
| `logoUrl`         | String      | URL to the token's logo image.                                              | `/tokens/omni.svg`                        |                                            |

## User Token Balance

Tracks the amount of Omni Token held by each user within the platform (off-chain balance or linked wallet).

| Attribute         | Type        | Description                                                                 | Example                                   | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------|--------------------------------------------|
| `userId`          | UUID/String | Identifier of the user.                                                     | `u1b9e4c7-e8d0-a9b3-c1f7-e5a2db7a3f9d` | Foreign Key (references User model)        |
| `balance`         | Decimal     | The user's current available Omni Token balance on the platform.            | `1575.50`                                 | Consider precision                         |
| `lockedBalance`   | Decimal     | Balance locked in staking, orders, or other activities.                     | `1000.00`                                 | Optional, depends on implementation        |
| `lastUpdated`     | Timestamp   | Timestamp when the balance was last updated.                                | `2025-04-02T14:00:00Z`                    |                                            |

## Staking Program / Pool

Defines parameters for a specific staking pool or program.

| Attribute         | Type        | Description                                                                 | Example                                   | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------|--------------------------------------------|
| `poolId`          | UUID/String | Unique identifier for the staking pool.                                     | `spool_omni_90d`                          | Primary Key                                |
| `poolName`        | String      | Name of the staking pool.                                                   | "OMNI 90-Day Lock"                        |                                            |
| `stakedAsset`     | String      | The symbol of the asset being staked.                                       | "OMNI"                                    |                                            |
| `rewardAsset`     | String      | The symbol of the asset distributed as rewards.                             | "OMNI"                                    | Could be different in some cases           |
| `apyRate`         | Float       | Estimated Annual Percentage Yield.                                          | `0.20`                                    | (20%) - Can be variable                    |
| `lockDurationDays`| Integer     | The number of days assets are locked when staked.                           | `90`                                      | 0 for flexible staking                     |
| `minStakeAmount`  | Decimal     | Minimum amount required to stake.                                           | `100.0`                                   |                                            |
| `isActive`        | Boolean     | Whether the pool is currently active for new stakes.                        | `true`                                    |                                            |

## User Stake

Represents an individual user's stake in a specific pool.

| Attribute         | Type        | Description                                                                 | Example                                   | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------|--------------------------------------------|
| `stakeId`         | UUID/String | Unique identifier for this specific stake.                                  | `stk_abc123`                              | Primary Key                                |
| `userId`          | UUID/String | Identifier of the user who made the stake.                                  | `u1b9e4c7-e8d0-a9b3-c1f7-e5a2db7a3f9d` | Foreign Key (references User model)        |
| `poolId`          | UUID/String | Identifier of the staking pool.                                             | `spool_omni_90d`                          | Foreign Key (references Staking Pool)      |
| `stakedAmount`    | Decimal     | The amount of the asset staked by the user.                                 | `1000.00`                                 |                                            |
| `stakeTime`       | Timestamp   | Timestamp when the stake was initiated.                                     | `2025-04-01T10:00:00Z`                    |                                            |
| `unlockTime`      | Timestamp   | Timestamp when the stake becomes available for unstaking.                   | `2025-07-01T10:00:00Z`                    | Calculated based on `stakeTime` + `lockDurationDays` |
| `status`          | Enum/String | Current status of the stake.                                                | `STAKING`, `UNSTAKING`, `COMPLETED`       |                                            |
| `accumulatedReward`| Decimal    | Reward accumulated so far for this stake (updated periodically).            | `15.50`                                   | In `rewardAsset`                           |

## Reward Transaction Log

A record of all reward distributions.

| Attribute         | Type        | Description                                                                 | Example                                   | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------|--------------------------------------------|
| `logId`           | UUID/String | Unique identifier for the reward transaction.                               | `rew_xyz789`                              | Primary Key                                |
| `userId`          | UUID/String | Identifier of the user receiving the reward.                                | `u1b9e4c7-e8d0-a9b3-c1f7-e5a2db7a3f9d` | Foreign Key (references User model)        |
| `rewardType`      | Enum/String | The type of program generating the reward.                                  | `STAKING`, `LIQUIDITY_MINING`, `REFERRAL` |                                            |
| `sourceId`        | UUID/String | Identifier of the source (e.g., `stakeId`, `poolId`, `referralCode`).       | `stk_abc123`                              | Optional, provides context                 |
| `rewardAsset`     | String      | The symbol of the asset distributed as reward.                              | "OMNI"                                    |                                            |
| `rewardAmount`    | Decimal     | The amount of reward distributed in this transaction.                       | `0.50`                                    |                                            |
| `transactionTime` | Timestamp   | Timestamp when the reward was distributed/credited.                         | `2025-04-02T14:05:00Z`                    |                                            |
| `notes`           | Text        | Any additional notes about the reward.                                      | "Daily staking reward"                    | Optional                                   |

## Relationships

*   A `User` has one `User Token Balance`.
*   A `User` can have multiple `User Stakes`.
*   A `User Stake` belongs to one `User` and one `Staking Pool`.
*   A `User` can receive multiple `Reward Transactions`.
*   A `Reward Transaction` belongs to one `User`.

*(Note: Liquidity Mining would have similar structures for Pools and User Positions, potentially referencing Market Pairs).*