# Frontend-Backend Integration Checklist

This checklist tracks the prioritized integration of the core frontend components (User Profile/Settings, Dashboard, Terminal) with the backend.

---

## Phase 0: Mock Data & Exchange Adapter System (Completed)

- [x] Define exchange interfaces and data types
- [x] Implement mock data generation service
- [x] Create exchange adapter pattern with mock implementations
- [x] Implement configuration system for switching between mock/sandbox/live modes
- [x] Update exchange API key service to integrate with adapters

---

## Phase 1: Exchange Connection & Basic Data Retrieval

- [x] Implement secure backend API endpoints for:
  - [x] Add new API key (with encryption)
  - [x] List connected exchanges/keys for the user
  - [x] Delete an API key
  - [x] Test connection/credentials with the exchange
- [x] Connect frontend API key management UI to backend endpoints:
  - [x] Add key form submission
  - [x] Display list of connected exchanges/keys
  - [x] Delete key functionality
  - [x] User feedback on connection status

---

## Phase 2: Portfolio Display

- [x] Implement mock portfolio data generation
- [ ] Implement backend API endpoint to fetch and aggregate user portfolio data from all connected exchanges
- [ ] Connect Dashboard page and components to portfolio endpoint:
  - [ ] Fetch and display portfolio data
  - [ ] Display asset breakdown and charts
  - [ ] Handle loading and error states

---

## Phase 3: Trading Terminal Integration

- [x] Implement mock trading data (pairs, orderbooks, klines)
- [x] Implement mock order management (place, cancel, history)
- [ ] Implement backend endpoints/WebSocket for:
  - [ ] Fetching available trading pairs per exchange
  - [ ] Streaming live market data for selected pair/exchange
  - [ ] Placing trade orders
  - [ ] Fetching open orders/trade history
- [ ] Connect Terminal page components:
  - [ ] Fetch and display available pairs
  - [ ] Subscribe to and display live market data
  - [ ] Submit trade orders
  - [ ] Display open orders/history
  - [ ] Handle real-time updates and errors

---
