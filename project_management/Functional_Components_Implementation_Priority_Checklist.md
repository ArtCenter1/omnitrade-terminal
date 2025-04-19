# Functional Components Implementation Priority Checklist

This checklist outlines the components that should be prioritized for functional implementation with mock data before moving to the sandbox stage.

## High Priority Components

### Account Selection and Management

- [ ] **ExchangeAccountSelector** (Dashboard)
  - [x] Switch between different exchange accounts
  - [ ] Display correct account names and values
  - [ ] Show portfolio overview option
- [ ] **ExchangeSelector** (Terminal)
  - [ ] List available exchanges
  - [ ] Select exchange and update related components

### Trading Functionality

- [ ] **TradingTabs** (Buy/Sell Order Form)
  - [ ] Market order placement
  - [ ] Limit order placement
  - [ ] Stop order placement
  - [ ] Success/error feedback
  - [ ] Update balances after order placement

### Portfolio Display

- [ ] **PortfolioTable**
  - [ ] Display assets and balances
  - [ ] Show USD values
  - [ ] Update when account is changed
  - [ ] Handle loading and error states

### Market Data Display

- [ ] **OrderBook**
  - [ ] Display buy/sell orders
  - [ ] Update when trading pair changes
  - [ ] Show price and volume information
  - [ ] Visual indicators for buy/sell walls
- [ ] **ChartSection**
  - [ ] TradingView integration
  - [ ] Update when trading pair changes
  - [ ] Time period selection (1d, 1w, 1m)

### Trading Pair Selection

- [ ] **TradingPairSelector**
  - [ ] List available pairs for selected exchange
  - [ ] Select pair and update related components
  - [ ] Display current price and 24h change

## Medium Priority Components

### Asset Management

- [ ] **Deposit/Withdraw** buttons
  - [ ] Show appropriate modal or navigation
  - [ ] Basic form validation

### Order History and Open Orders

- [ ] **DashboardOrdersTable**
  - [ ] Display open orders
  - [ ] Display order history
  - [ ] Cancel open orders
  - [ ] Filter by exchange/pair
- [ ] **TerminalTabs** Order sections
  - [ ] Display orders in terminal view
  - [ ] Sync with dashboard data

### Performance Metrics

- [ ] **PerformanceChart**
  - [ ] Display portfolio performance
  - [ ] Time period selection (1d, 1w, 1m)
  - [ ] Update when account changes
- [ ] **AllocationChart**
  - [ ] Display asset allocation
  - [ ] Update when account changes

### Search and Filtering

- [ ] Asset search in Dashboard
- [ ] Filtering options in tables
- [ ] Exchange filter in asset section

## Lower Priority (Can Wait for Sandbox)

### Advanced Features

- [ ] Complex sorting in data tables
- [ ] Detailed performance analytics
- [ ] Export functionality

### Secondary Actions

- [ ] Account settings modification
- [ ] Notification preferences
- [ ] Theme switching (if not already implemented)

### Edge Cases

- [ ] Error recovery for specific API failures
- [ ] Handling of unusual market conditions
- [ ] Extreme portfolio sizes or values

## Market Data Integration Completion

- [ ] Refactor UI components to use the new custom hooks
  - [ ] Markets.tsx
  - [ ] Trading Terminal components
  - [ ] Dashboard components

---

_Note: This checklist focuses on functional implementation with mock data. Complete verification with real data will be done during the sandbox stage._
