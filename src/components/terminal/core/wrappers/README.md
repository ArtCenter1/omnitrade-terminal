# Terminal Component Wrappers

This directory contains wrapper components that adapt existing terminal components to work with the new component registry system. These wrappers implement the `IComponent` interface, allowing the existing components to be used within the new workspace layout system.

## Available Wrappers

### ChartSectionWrapper

Wraps the `ChartSection` component, which displays price charts with TradingView integration.

```typescript
// Example usage
import { componentRegistry } from '@/lib/component-registry';
import { ChartSectionComponent } from './ChartSectionWrapper';

// Register the component
componentRegistry.register(ChartSectionComponent);

// Create an instance
const chartSection = componentRegistry.createInstance('chart-section');
```

### OrderBookWrapper

Wraps the `OrderBook` component, which displays real-time order book data for trading pairs.

```typescript
// Example usage
import { componentRegistry } from '@/lib/component-registry';
import { OrderBookComponent } from './OrderBookWrapper';

// Register the component
componentRegistry.register(OrderBookComponent);

// Create an instance
const orderBook = componentRegistry.createInstance('order-book');
```

### TradingSidebarWrapper

Wraps the `TradingSidebar` component, which provides trading functionality and account information.

```typescript
// Example usage
import { componentRegistry } from '@/lib/component-registry';
import { TradingSidebarComponent } from './TradingSidebarWrapper';

// Register the component
componentRegistry.register(TradingSidebarComponent);

// Create an instance
const tradingSidebar = componentRegistry.createInstance('trading-sidebar');
```

### TerminalTabsWrapper

Wraps the `TerminalTabs` component, which displays orders, positions, and other trading information.

```typescript
// Example usage
import { componentRegistry } from '@/lib/component-registry';
import { TerminalTabsComponent } from './TerminalTabsWrapper';

// Register the component
componentRegistry.register(TerminalTabsComponent);

// Create an instance
const terminalTabs = componentRegistry.createInstance('terminal-tabs');
```

### TradesWrapper

Wraps the `RecentTradesTable` component, which displays recent trades for a trading pair.

```typescript
// Example usage
import { componentRegistry } from '@/lib/component-registry';
import { TradesComponent } from './TradesWrapper';

// Register the component
componentRegistry.register(TradesComponent);

// Create an instance
const trades = componentRegistry.createInstance('trades-component');
```

### PositionsWrapper

Wraps the `PositionsList` component, which displays and manages trading positions.

```typescript
// Example usage
import { componentRegistry } from '@/lib/component-registry';
import { PositionsComponent } from './PositionsWrapper';

// Register the component
componentRegistry.register(PositionsComponent);

// Create an instance
const positions = componentRegistry.createInstance('positions-component');
```

## How the Wrappers Work

Each wrapper follows the same pattern:

1. Implements the `IComponent` interface by extending `BaseTerminalComponent`
2. Provides component metadata (id, name, description, etc.)
3. Renders the wrapped component using React's `createRoot` API
4. Handles component lifecycle methods (initialize, render, update, dispose)
5. Manages component state and props
6. Provides settings that can be changed through the component registry

## Adding New Wrappers

To create a new wrapper for an existing component:

1. Create a new file in this directory (e.g., `MyComponentWrapper.tsx`)
2. Extend `BaseTerminalComponent` and implement the `IComponent` interface
3. Define the component metadata and state
4. Implement the required lifecycle methods
5. Register the component in `src/lib/component-registry/init.ts`

## Integration with Workspace System

These wrapped components can be used in workspace layouts by referencing their component IDs:

```typescript
// Example workspace layout
const layout = {
  id: 'root',
  type: LayoutItemType.CONTAINER,
  direction: SplitDirection.HORIZONTAL,
  children: [
    {
      id: 'chart',
      type: LayoutItemType.COMPONENT,
      componentId: 'chart-section',
      componentState: {
        symbol: 'BTC/USDT'
      },
      title: 'Chart'
    },
    {
      id: 'order-book',
      type: LayoutItemType.COMPONENT,
      componentId: 'order-book',
      componentState: {
        symbol: 'BTC/USDT'
      },
      title: 'Order Book'
    }
  ],
  sizes: [70, 30]
};
```
