# Functional Components Implementation Priority Checklist

This checklist outlines the components that should be prioritized for functional implementation with mock data before moving to the sandbox stage.

## High Priority Components

### Account Selection and Management

- [x] **ExchangeAccountSelector** (Dashboard)
  - [x] Switch between different exchange accounts
  - [x] Display correct account names and values
  - [x] Show portfolio overview option
- [x] **ExchangeSelector** (Terminal)
  - [x] List available exchanges
  - [x] Select exchange and update related components

### Trading Functionality

- [x] **TradingTabs** (Buy/Sell Order Form)
  - [x] Market order placement
  - [x] Limit order placement
  - [x] Stop order placement
  - [x] Success/error feedback
  - [x] Update balances after order placement

### Portfolio Display

- [x] **PortfolioTable**
  - [x] Display assets and balances
  - [x] Show USD values
  - [x] Update when account is changed
  - [x] Handle loading and error states

### Market Data Display

- [x] **OrderBook**
  - [x] Display buy/sell orders
  - [x] Update when trading pair changes
  - [x] Show price and volume information
  - [x] Visual indicators for buy/sell walls
- [x] **ChartSection**
  - [x] TradingView integration
  - [x] Update when trading pair changes
  - [x] Time period selection (1d, 1w, 1m)

### Trading Pair Selection

- [x] **TradingPairSelector**
  - [x] List available pairs for selected exchange
  - [x] Select pair and update related components
  - [x] Display current price and 24h change

## Medium Priority Components

### Asset Management

- [ ] **Deposit/Withdraw** buttons
  - [ ] Show appropriate modal or navigation
  - [ ] Basic form validation

### Order History and Open Orders

- [x] **DashboardOrdersTable**
  - [x] Display open orders
  - [x] Display order history
  - [x] Cancel open orders
  - [ ] Filter by exchange/pair
- [x] **TerminalTabs** Order sections
  - [x] Display orders in terminal view
  - [x] Sync with dashboard data

### Performance Metrics

- [x] **PerformanceChart**
  - [x] Display portfolio performance
  - [ ] Time period selection (1d, 1w, 1m)
  - [ ] Update when account changes
- [x] **AllocationChart**
  - [x] Display asset allocation
  - [ ] Update when account changes

### Search and Filtering

- [ ] Asset search in Dashboard
- [ ] Filtering options in tables
- [x] Exchange filter in asset section

## Lower Priority (Can Wait for Sandbox)

### Advanced Features

- [ ] Complex sorting in data tables
- [ ] Detailed performance analytics
- [ ] Export functionality

### Secondary Actions

- [x] Account settings modification
- [x] Notification preferences
- [x] Theme switching (if not already implemented)

### Edge Cases

- [ ] Error recovery for specific API failures
- [ ] Handling of unusual market conditions
- [ ] Extreme portfolio sizes or values

## Market Data Integration Completion

- [ ] Refactor UI components to use the new custom hooks
  - [x] Markets.tsx
  - [ ] Trading Terminal components
  - [ ] Dashboard components

---

_Note: This checklist focuses on functional implementation with mock data. Complete verification with real data will be done during the sandbox stage._
