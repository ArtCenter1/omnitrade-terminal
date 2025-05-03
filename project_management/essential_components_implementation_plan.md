# Essential Terminal Components Implementation Plan

This document outlines the detailed implementation plan for the Essential Terminal Components, which is a key focus area of Phase 1. It provides specifications, implementation details, and integration plans for each core component.

## Chart Component with TradingView Integration

### Overview
The Chart Component will integrate TradingView's charting library to provide professional-grade technical analysis capabilities. It will support multiple chart types, timeframes, and technical indicators.

### Implementation Details

#### TradingView Integration Options
- **TradingView Charting Library**: Licensed library for embedding TradingView charts
- **TradingView Widget**: Simpler integration with fewer customization options
- **Custom Implementation**: Build our own charting solution using D3.js or similar

#### Component Structure
```typescript
interface ChartComponentConfig {
  symbol: string;
  interval: string; // 1m, 5m, 15m, 1h, 4h, 1d, etc.
  chartType: 'candle' | 'line' | 'bar' | 'area';
  indicators: IndicatorConfig[];
  theme: 'light' | 'dark';
  showVolume: boolean;
  showGrid: boolean;
  showLegend: boolean;
}

class ChartComponent implements Component {
  id = 'chart';
  name = 'Chart';
  description = 'TradingView chart component';
  category = ComponentCategory.VISUALIZATION;
  
  create(config: ChartComponentConfig): ChartComponentInstance {
    // Initialize TradingView chart
    // Set up event listeners
    // Configure initial state
    return new ChartComponentInstance(config);
  }
  
  getConfigSchema(): JSONSchema {
    // Return JSON Schema for ChartComponentConfig
  }
  
  getDefaultConfig(): ChartComponentConfig {
    return {
      symbol: 'BTCUSDT',
      interval: '1h',
      chartType: 'candle',
      indicators: [],
      theme: 'dark',
      showVolume: true,
      showGrid: true,
      showLegend: true
    };
  }
}
```

#### Integration with Data Services
- Subscribe to market data for the selected symbol and interval
- Handle real-time updates for price data
- Support historical data loading for different timeframes

#### User Interactions
- Symbol selection via dropdown or search
- Timeframe selection via toolbar buttons
- Chart type switching via toolbar buttons
- Drawing tools for technical analysis
- Indicator addition and configuration

### Timeline
- **Week 1**: Research TradingView integration options, set up development environment
- **Week 2**: Implement basic chart component with TradingView integration
- **Week 3**: Add configuration UI and user interactions
- **Week 4**: Integrate with market data service and implement real-time updates

## Order Book Visualization

### Overview
The Order Book component will display the current buy and sell orders for a trading pair, showing price levels, order sizes, and cumulative totals. It will support real-time updates and interactive features.

### Implementation Details

#### Component Structure
```typescript
interface OrderBookComponentConfig {
  symbol: string;
  depth: number; // Number of price levels to display
  aggregation: number; // Price aggregation level
  showCumulative: boolean;
  showChart: boolean; // Show depth chart
  showTrades: boolean; // Highlight recent trades
}

class OrderBookComponent implements Component {
  id = 'orderBook';
  name = 'Order Book';
  description = 'Real-time order book visualization';
  category = ComponentCategory.VISUALIZATION;
  
  create(config: OrderBookComponentConfig): OrderBookComponentInstance {
    // Initialize order book display
    // Set up data subscriptions
    // Configure initial state
    return new OrderBookComponentInstance(config);
  }
  
  getConfigSchema(): JSONSchema {
    // Return JSON Schema for OrderBookComponentConfig
  }
  
  getDefaultConfig(): OrderBookComponentConfig {
    return {
      symbol: 'BTCUSDT',
      depth: 20,
      aggregation: 0, // No aggregation
      showCumulative: true,
      showChart: true,
      showTrades: true
    };
  }
}
```

#### Data Structures
```typescript
interface OrderBookLevel {
  price: number;
  size: number;
  total: number; // Cumulative size
  orders?: number; // Number of orders at this level (if available)
}

interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
  lastUpdateId?: number;
}
```

#### Rendering Approach
- Use virtualized lists for efficient rendering of large order books
- Implement color coding for price levels based on size
- Show animations for updates to highlight changes
- Implement hover effects to show additional information

#### User Interactions
- Click on price level to set price in order entry form
- Adjust aggregation level via dropdown or buttons
- Toggle cumulative view, depth chart, and trade highlighting
- Hover on levels to see detailed information

### Timeline
- **Week 1**: Design order book component and data structures
- **Week 2**: Implement basic order book display with static data
- **Week 3**: Add real-time updates and animations
- **Week 4**: Implement user interactions and integration with other components

## Order Entry Forms

### Overview
The Order Entry component will provide forms for placing different types of orders (market, limit, stop) with real-time validation, price suggestions, and order previews.

### Implementation Details

#### Component Structure
```typescript
type OrderType = 'market' | 'limit' | 'stopLimit' | 'stopMarket';
type OrderSide = 'buy' | 'sell';

interface OrderEntryComponentConfig {
  symbol: string;
  defaultOrderType: OrderType;
  defaultOrderSide: OrderSide;
  showOrderPreview: boolean;
  showTotalCost: boolean;
  showFeeEstimate: boolean;
}

class OrderEntryComponent implements Component {
  id = 'orderEntry';
  name = 'Order Entry';
  description = 'Order entry forms for trading';
  category = ComponentCategory.CONTROL;
  
  create(config: OrderEntryComponentConfig): OrderEntryComponentInstance {
    // Initialize order entry forms
    // Set up validation
    // Configure initial state
    return new OrderEntryComponentInstance(config);
  }
  
  getConfigSchema(): JSONSchema {
    // Return JSON Schema for OrderEntryComponentConfig
  }
  
  getDefaultConfig(): OrderEntryComponentConfig {
    return {
      symbol: 'BTCUSDT',
      defaultOrderType: 'limit',
      defaultOrderSide: 'buy',
      showOrderPreview: true,
      showTotalCost: true,
      showFeeEstimate: true
    };
  }
}
```

#### Order Form Structure
```typescript
interface OrderFormState {
  symbol: string;
  type: OrderType;
  side: OrderSide;
  quantity: string;
  price: string; // For limit orders
  stopPrice: string; // For stop orders
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  reduceOnly: boolean;
  postOnly: boolean;
}

interface OrderPreview {
  cost: number;
  fee: number;
  total: number;
  slippage?: number; // For market orders
  liquidationPrice?: number; // If using leverage
}
```

#### Validation Rules
- Quantity must be greater than the minimum allowed for the symbol
- Price must be within the allowed price range for the symbol
- Stop price must be valid based on the current market price
- Total cost must not exceed the available balance
- Order must comply with exchange-specific rules

#### User Interactions
- Switch between order types via tabs
- Toggle between buy and sell via buttons
- Enter quantity and price in input fields
- Use percentage buttons for quick quantity selection
- Submit order via button
- View order preview before submission

### Timeline
- **Week 1**: Design order entry component and form structure
- **Week 2**: Implement basic order forms with validation
- **Week 3**: Add order preview and integration with trading service
- **Week 4**: Implement advanced features and order confirmation

## Market Depth Visualization

### Overview
The Market Depth component will visualize the order book as a depth chart, showing the cumulative buy and sell orders at different price levels. It will support zooming, panning, and interactive features.

### Implementation Details

#### Component Structure
```typescript
interface MarketDepthComponentConfig {
  symbol: string;
  depth: number; // Number of price levels to include
  zoomLevel: number;
  showMidPrice: boolean;
  showTooltips: boolean;
  fillAreas: boolean;
}

class MarketDepthComponent implements Component {
  id = 'marketDepth';
  name = 'Market Depth';
  description = 'Visualization of order book depth';
  category = ComponentCategory.VISUALIZATION;
  
  create(config: MarketDepthComponentConfig): MarketDepthComponentInstance {
    // Initialize depth chart
    // Set up data subscriptions
    // Configure initial state
    return new MarketDepthComponentInstance(config);
  }
  
  getConfigSchema(): JSONSchema {
    // Return JSON Schema for MarketDepthComponentConfig
  }
  
  getDefaultConfig(): MarketDepthComponentConfig {
    return {
      symbol: 'BTCUSDT',
      depth: 100,
      zoomLevel: 1,
      showMidPrice: true,
      showTooltips: true,
      fillAreas: true
    };
  }
}
```

#### Rendering Approach
- Use D3.js or Chart.js for rendering the depth chart
- Implement smooth animations for updates
- Use different colors for buy and sell sides
- Show the mid price as a vertical line
- Implement tooltips for detailed information at each price level

#### User Interactions
- Zoom in/out using mouse wheel or buttons
- Pan the view using drag gestures
- Hover on the chart to see detailed information
- Click on the chart to set price in order entry form

### Timeline
- **Week 1**: Design market depth component and visualization approach
- **Week 2**: Implement basic depth chart with static data
- **Week 3**: Add real-time updates and animations
- **Week 4**: Implement user interactions and integration with other components

## Trade History Display

### Overview
The Trade History component will display recent trades for a trading pair, showing price, size, time, and direction. It will support real-time updates, filtering, and sorting.

### Implementation Details

#### Component Structure
```typescript
interface TradeHistoryComponentConfig {
  symbol: string;
  maxTrades: number;
  showTimeColumn: boolean;
  showSizeColumn: boolean;
  showPriceColumn: boolean;
  highlightUserTrades: boolean;
}

class TradeHistoryComponent implements Component {
  id = 'tradeHistory';
  name = 'Trade History';
  description = 'Display of recent trades';
  category = ComponentCategory.VISUALIZATION;
  
  create(config: TradeHistoryComponentConfig): TradeHistoryComponentInstance {
    // Initialize trade history display
    // Set up data subscriptions
    // Configure initial state
    return new TradeHistoryComponentInstance(config);
  }
  
  getConfigSchema(): JSONSchema {
    // Return JSON Schema for TradeHistoryComponentConfig
  }
  
  getDefaultConfig(): TradeHistoryComponentConfig {
    return {
      symbol: 'BTCUSDT',
      maxTrades: 100,
      showTimeColumn: true,
      showSizeColumn: true,
      showPriceColumn: true,
      highlightUserTrades: true
    };
  }
}
```

#### Data Structures
```typescript
interface Trade {
  id: string;
  symbol: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
  isUserTrade?: boolean;
}
```

#### Rendering Approach
- Use virtualized lists for efficient rendering of large trade histories
- Implement color coding for buy/sell trades
- Show animations for new trades
- Use relative time formatting for timestamps

#### User Interactions
- Filter trades by size or price
- Sort trades by different columns
- Click on trade to see detailed information
- Export trade history to CSV

### Timeline
- **Week 1**: Design trade history component and data structures
- **Week 2**: Implement basic trade history display with static data
- **Week 3**: Add real-time updates and animations
- **Week 4**: Implement filtering, sorting, and export functionality

## Position Management Panel

### Overview
The Position Management component will display current positions, allowing users to view details, modify, and close positions. It will show key metrics like entry price, current price, P&L, and liquidation price.

### Implementation Details

#### Component Structure
```typescript
interface PositionManagementComponentConfig {
  showClosedPositions: boolean;
  showPnLChart: boolean;
  showLiquidationPrice: boolean;
  refreshInterval: number; // in milliseconds
}

class PositionManagementComponent implements Component {
  id = 'positionManagement';
  name = 'Position Management';
  description = 'Management of open positions';
  category = ComponentCategory.CONTROL;
  
  create(config: PositionManagementComponentConfig): PositionManagementComponentInstance {
    // Initialize position display
    // Set up data subscriptions
    // Configure initial state
    return new PositionManagementComponentInstance(config);
  }
  
  getConfigSchema(): JSONSchema {
    // Return JSON Schema for PositionManagementComponentConfig
  }
  
  getDefaultConfig(): PositionManagementComponentConfig {
    return {
      showClosedPositions: false,
      showPnLChart: true,
      showLiquidationPrice: true,
      refreshInterval: 1000
    };
  }
}
```

#### Data Structures
```typescript
interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice?: number;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
  initialMargin: number;
  maintenanceMargin: number;
  openTime: number;
}
```

#### Rendering Approach
- Use a table layout for position information
- Implement color coding for P&L values
- Show mini charts for price movement since entry
- Use progress bars for margin usage visualization

#### User Interactions
- Click on position to see detailed information
- Modify position size via input fields
- Close position via button
- Set take profit and stop loss levels

### Timeline
- **Week 1**: Design position management component and data structures
- **Week 2**: Implement basic position display with static data
- **Week 3**: Add position modification and closing functionality
- **Week 4**: Implement P&L visualization and integration with trading service

## Integration Plan

These essential components will be integrated with the terminal architecture and data services:

1. All components will register with the `ComponentRegistry`
2. Components will be placed in the workspace layout using the `WorkspaceManager`
3. Components will subscribe to data from the market data and trading services
4. Components will communicate with each other through a pub/sub event system
5. User interactions in one component can affect the state of other components

### Component Communication Examples

- Clicking a price level in the Order Book sets the price in the Order Entry form
- Selecting a symbol in one component updates all other components to show data for that symbol
- Placing an order through the Order Entry form updates the Position Management panel
- Trades executed by the user appear highlighted in the Trade History display

## Testing Strategy

- **Unit Tests**: Each component will have comprehensive unit tests
- **Integration Tests**: Tests that verify the interaction between different components
- **Visual Regression Tests**: Ensure components render correctly in different states
- **Performance Tests**: Verify that components can handle large datasets and frequent updates
- **User Interaction Tests**: Test user interactions and component responses

## Documentation Deliverables

- Component API documentation
- Configuration options for each component
- User guides for interacting with components
- Developer guides for extending components
- Example configurations for common use cases
