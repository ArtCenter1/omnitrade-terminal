# Data Model: Market Data

This document defines the data structures for representing market information within the OmniTrade platform.

## Market Pair Information

This represents static or semi-static information about a tradable market pair.

| Attribute         | Type        | Description                                                                 | Example        | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|----------------|--------------------------------------------|
| `symbol`          | String      | The standardized symbol for the market pair (e.g., BASE/QUOTE).             | "BTC/USDT"     | Primary Key (or composite with exchange)   |
| `exchange`        | String      | The exchange where this market pair is traded.                              | "Binance"      | Part of composite key if needed            |
| `baseAsset`       | String      | The base currency symbol.                                                   | "BTC"          |                                            |
| `quoteAsset`      | String      | The quote currency symbol.                                                  | "USDT"         |                                            |
| `pricePrecision`  | Integer     | Number of decimal places for price values.                                  | 2              | e.g., 1 price tick = 0.01                  |
| `quantityPrecision`| Integer     | Number of decimal places for quantity/amount values.                        | 6              | e.g., 1 quantity step = 0.000001           |
| `minOrderSize`    | Decimal     | Minimum order size allowed in the base asset.                               | 0.0001         |                                            |
| `maxOrderSize`    | Decimal     | Maximum order size allowed in the base asset.                               | 100.0          | Optional                                   |
| `status`          | Enum/String | Trading status of the pair on the exchange.                                 | `TRADING`, `BREAK`, `HALTED` |                                            |
| `isSpotTradingAllowed` | Boolean | Indicates if spot trading is enabled.                                     | `true`         |                                            |
| `isMarginTradingAllowed`| Boolean | Indicates if margin trading is enabled.                                   | `false`        | Optional                                   |
| `tags`            | Array[String]| Tags associated with the market (e.g., DeFi, NFT, Layer2).                  | ["Layer1"]     | Optional                                   |

## OHLCV Data (Candlestick Data)

Represents historical price data for a specific market pair and time interval. Often stored in time-series databases.

| Attribute         | Type        | Description                                                                 | Example        | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|----------------|--------------------------------------------|
| `symbol`          | String      | The market pair symbol.                                                     | "BTC/USDT"     | Part of composite key/index                |
| `exchange`        | String      | The exchange where the data originated.                                     | "Binance"      | Part of composite key/index                |
| `interval`        | String      | The time interval of the candle (e.g., 1m, 5m, 1h, 1d).                     | "1h"           | Part of composite key/index                |
| `openTime`        | Timestamp   | The starting timestamp of the candle interval.                              | `2025-04-02T13:00:00Z` | Primary time index                         |
| `openPrice`       | Decimal     | The price at the start of the interval.                                     | `58500.50`     |                                            |
| `highPrice`       | Decimal     | The highest price reached during the interval.                              | `59100.00`     |                                            |
| `lowPrice`        | Decimal     | The lowest price reached during the interval.                               | `58450.25`     |                                            |
| `closePrice`      | Decimal     | The price at the end of the interval.                                       | `59050.75`     |                                            |
| `volume`          | Decimal     | The trading volume during the interval (in the base asset).                 | `150.753`      |                                            |
| `closeTime`       | Timestamp   | The ending timestamp of the candle interval.                                | `2025-04-02T13:59:59Z` | Optional, can be derived                   |
| `quoteVolume`     | Decimal     | The trading volume during the interval (in the quote asset).                | `8899543.12`   | Optional                                   |
| `tradeCount`      | Integer     | The number of trades executed during the interval.                          | `2530`         | Optional                                   |

## Order Book Data (Level 2)

Represents the current state of the order book for a market pair. This data is highly volatile.

| Attribute         | Type        | Description                                                                 | Example                                   | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------|--------------------------------------------|
| `symbol`          | String      | The market pair symbol.                                                     | "BTC/USDT"     |                                            |
| `exchange`        | String      | The exchange where the data originated.                                     | "Binance"      |                                            |
| `timestamp`       | Timestamp   | Timestamp when this order book snapshot was taken or updated.               | `2025-04-02T13:45:10.123Z` |                                            |
| `lastUpdateId`    | Integer/String| Sequence number or ID for managing stream updates.                          | `123456789`    | Exchange-specific                          |
| `bids`            | Array[Tuple]| List of current bid levels. Each tuple is `[price, quantity]`.              | `[["59050.75", "0.5"], ["59050.50", "1.2"]]` | Sorted highest price first                 |
| `asks`            | Array[Tuple]| List of current ask levels. Each tuple is `[price, quantity]`.              | `[["59051.00", "0.8"], ["59051.25", "0.3"]]` | Sorted lowest price first                  |

## Trade Data (Real-time Ticker)

Represents individual trades executed on the market.

| Attribute         | Type        | Description                                                                 | Example        | Notes                                      |
|-------------------|-------------|-----------------------------------------------------------------------------|----------------|--------------------------------------------|
| `tradeId`         | String/Integer| Unique identifier for the trade on the exchange.                            | "t12345678"    | Exchange-specific                          |
| `symbol`          | String      | The market pair symbol.                                                     | "BTC/USDT"     |                                            |
| `exchange`        | String      | The exchange where the trade occurred.                                      | "Binance"      |                                            |
| `price`           | Decimal     | The price at which the trade was executed.                                  | `59051.00`     |                                            |
| `quantity`        | Decimal     | The amount of the base asset traded.                                        | `0.05`         |                                            |
| `timestamp`       | Timestamp   | Timestamp when the trade occurred.                                          | `2025-04-02T13:45:11.500Z` |                                            |
| `isBuyerMaker`    | Boolean     | Indicates if the buyer was the maker (resting order).                       | `false`        | `true` means seller was taker              |

## Relationships

*   Market data (OHLCV, Order Book, Trades) is associated with a specific `Market Pair` on a specific `Exchange`.
*   Data is typically partitioned or indexed by `symbol`, `exchange`, and `timestamp` or `interval`.