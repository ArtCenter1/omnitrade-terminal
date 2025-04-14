# Omnitrade Market Data WebSocket API

## Overview
The Omnitrade WebSocket API provides real-time market data updates including ticker prices, order book changes, and recent trades.

- **Endpoint:** `wss://api.omnitrade.example.com/ws/v1/market-data`
- **Protocol:** Socket.IO
- **Authentication:** None required
- **CORS:** Allowed from any origin

---

## Connection
Connect using a Socket.IO client:

```js
const socket = io('wss://api.omnitrade.example.com/ws/v1/market-data');
```

---

## Subscription

### Subscribe to a data stream

Send:

```json
{
  "event": "subscribe",
  "data": {
    "type": "ticker" | "orderbook" | "trade",
    "symbol": "BTCUSDT"
  }
}
```

### Unsubscribe from a data stream

Send:

```json
{
  "event": "unsubscribe",
  "data": {
    "type": "ticker" | "orderbook" | "trade",
    "symbol": "BTCUSDT"
  }
}
```

---

## Real-time Events

### Ticker Update

Event: `ticker`

```json
{
  "event": "ticker",
  "data": {
    "symbol": "BTCUSDT",
    "price": "50000.00",
    "timestamp": 1617181723000
  }
}
```

### Order Book Update

Event: `orderbookUpdate`

```json
{
  "event": "orderbookUpdate",
  "data": {
    "bids": [["50000.00", "1.2"], ["49950.00", "0.5"]],
    "asks": [["50010.00", "0.8"], ["50020.00", "1.0"]],
    "timestamp": 1617181723000
  }
}
```

### Trade Update

Event: `trade`

```json
{
  "event": "trade",
  "data": {
    "price": "50000.00",
    "quantity": "0.1",
    "timestamp": 1617181723000
  }
}
```

---

## Error Handling
- Invalid subscription requests will be ignored or may receive an error event (future enhancement).
- Disconnections may occur; clients should handle reconnection logic.

---

## Notes
- Subscribe to multiple streams by sending multiple subscribe messages.
- Unsubscribe to stop receiving updates.
- Message formats may evolve; check for updates regularly.