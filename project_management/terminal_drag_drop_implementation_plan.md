# OmniTrade Terminal Drag and Drop Implementation Plan

This document outlines the plan to implement a TabTrader-like drag and drop modular interface for the OmniTrade Terminal page. This implementation will replace the current Terminal page with a more flexible and intuitive workspace management system.

## Overview

The goal is to create a workspace system where users can:
- Drag and drop modules to create custom layouts
- Arrange tabs in a VS Code-like manner (side by side or stacked)
- Save and load workspace configurations
- Start with a default layout similar to TabTrader

## Current State Analysis

The codebase currently has:
- A workspace management system with templates
- Basic tab components with some drag and drop functionality
- Container system supporting horizontal and vertical splitting
- Backend integration for components

## Implementation Plan

### Phase 1: Module Selector Component

**Files to create/modify:**
- Create: `src/components/workspace/ModuleSelector.tsx`
- Update: `src/pages/TerminalWorkspace.tsx` to include the selector

**Implementation details:**
- Create a modal/panel component that displays available modules
- Each module should have:
  - Title (e.g., "Chart", "Order Book")
  - Description (e.g., "Graphical representation of price movement")
  - Preview image
  - Usage count indicator (e.g., "0/2")
- Implement drag functionality to allow modules to be dragged from the selector
- Add a close button to dismiss the selector

**Key functionality:**
```typescript
// Module selector component
const ModuleSelector: React.FC = () => {
  // Available modules from component registry
  const availableModules = componentRegistry.getAvailableComponents();
  
  // Handle drag start for modules
  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'module',
      moduleId,
      // Include any necessary metadata
    }));
  };
  
  return (
    <div className="module-selector">
      <div className="header">
        <h2>Workspace modules</h2>
        <button className="close-button">×</button>
      </div>
      <div className="modules-list">
        {availableModules.map(module => (
          <div 
            key={module.id}
            className="module-item"
            draggable
            onDragStart={(e) => handleDragStart(e, module.id)}
          >
            <div className="module-info">
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <span className="usage-count">0/2</span>
            </div>
            <div className="module-preview">
              {/* Module preview image */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Phase 2: Enhanced Container Drop Handling

**Files to modify:**
- `src/components/terminal/core/TerminalContainer.tsx`

**Implementation details:**
- Enhance the container to accept drops from the Module Selector
- Implement logic to create appropriate layout items when modules are dropped
- Add visual feedback during drag operations to show where modules will be placed

**Key functionality:**
```typescript
// Update the handleContainerDrop function
function handleContainerDrop(e: React.DragEvent<HTMLDivElement>) {
  e.preventDefault();
  e.stopPropagation();

  try {
    // Get the drag data
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    // Handle module drops from the selector
    if (data.type === 'module') {
      const { moduleId } = data;
      const component = componentRegistry.getComponent(moduleId);
      
      if (component) {
        // Create a new component layout item
        const newComponent: ComponentLayoutItem = {
          id: `component-${Date.now()}`,
          type: LayoutItemType.COMPONENT,
          componentId: moduleId,
          title: component.name,
          componentState: component.defaultState || {}
        };
        
        // Create a new stack for the component
        const newStack: StackLayoutItem = {
          id: `stack-${Date.now()}`,
          type: LayoutItemType.STACK,
          children: [newComponent],
          activeItemIndex: 0
        };
        
        // Add to the container based on drop position
        addItemToContainer(container, newStack, dropPosition);
      }
    }
    
    // Existing tab drop handling...
  } catch (error) {
    console.error('Error handling container drop:', error);
  }
}
```

### Phase 3: Visual Drop Indicators

**Files to modify:**
- `src/components/terminal/core/TerminalContainer.tsx`
- Create: `src/components/workspace/DropIndicator.tsx`

**Implementation details:**
- Create visual indicators for different drop zones (top, bottom, left, right, center)
- Implement highlight zones that appear during drag operations
- Add transition animations for smoother UX

**Key functionality:**
```typescript
// Create a DropIndicator component
const DropIndicator: React.FC<{
  position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null;
  isVisible: boolean;
}> = ({ position, isVisible }) => {
  if (!isVisible || !position) return null;
  
  return (
    <div className={`drop-indicator ${position} ${isVisible ? 'visible' : ''}`}>
      <div className="indicator-line"></div>
    </div>
  );
};

// Update the container renderer to include drop indicators
const renderDropIndicators = (containerId: string) => {
  if (dropTarget !== containerId) return null;
  
  return (
    <>
      <DropIndicator position="left" isVisible={dropPosition === 'left'} />
      <DropIndicator position="right" isVisible={dropPosition === 'right'} />
      <DropIndicator position="top" isVisible={dropPosition === 'top'} />
      <DropIndicator position="bottom" isVisible={dropPosition === 'bottom'} />
      <DropIndicator position="center" isVisible={dropPosition === 'center'} />
    </>
  );
};
```

### Phase 4: Enhanced Tab Drag and Drop

**Files to modify:**
- `src/components/terminal/core/TerminalContainer.tsx`

**Implementation details:**
- Enhance tab drag and drop to support side-by-side placement
- Implement tab stacking when tabs are dragged to the center of another tab
- Add visual indicators for different drop zones within tab areas

**Key functionality:**
```typescript
// Update the handleDragOver function for tabs
const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  
  // Get the tab element being dragged over
  const tabElement = e.currentTarget;
  const tabRect = tabElement.getBoundingClientRect();
  
  // Calculate position within the tab
  const mouseX = e.clientX - tabRect.left;
  const tabWidth = tabRect.width;
  
  // Determine if we're on the left or right side of the tab
  const position = mouseX < tabWidth / 2 ? 'left' : 'right';
  
  // Set visual indicator
  setTabDropPosition(position);
  e.dataTransfer.dropEffect = 'move';
};

// Update the handleDrop function for tabs
const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  
  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    if (data.type === 'tab') {
      // Get the source and target tabs
      const sourceStack = findStackById(currentWorkspace.root, data.stackId);
      const sourceTabIndex = sourceStack?.children.findIndex(child => child.id === data.tabId) ?? -1;
      
      if (sourceStack && sourceTabIndex !== -1) {
        const sourceTab = sourceStack.children[sourceTabIndex];
        
        // Handle tab placement based on drop position
        if (tabDropPosition === 'left') {
          // Insert before the target tab
          const targetTabIndex = Array.from(e.currentTarget.parentElement.children)
            .indexOf(e.currentTarget);
          
          // Create new children array with tab inserted at the correct position
          const newChildren = [...stack.children];
          newChildren.splice(targetTabIndex, 0, sourceTab);
          
          // Update the stack
          updateStack(stack.id, {
            ...stack,
            children: newChildren
          });
        } else if (tabDropPosition === 'right') {
          // Similar logic for right side...
        }
      }
    }
  } catch (error) {
    console.error('Error handling tab drop:', error);
  }
};
```

### Phase 5: Container Splitting Logic

**Files to modify:**
- `src/components/terminal/core/TerminalContainer.tsx`
- `src/lib/workspace/workspace-manager.ts`

**Implementation details:**
- Implement logic to split containers based on drop position
- Support nested containers with different orientations
- Ensure proper sizing of containers after splitting

**Key functionality:**
```typescript
// Function to add an item to a container based on drop position
function addItemToContainer(
  container: ContainerLayoutItem,
  item: LayoutItem,
  position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null
) {
  if (!position || position === 'center') {
    // Add to the container directly
    container.children.push(item);
    return;
  }
  
  // Determine if we need to create a new split
  const isHorizontalSplit = position === 'left' || position === 'right';
  const newDirection = isHorizontalSplit ? SplitDirection.HORIZONTAL : SplitDirection.VERTICAL;
  
  // If container is empty or has the same direction, add directly
  if (container.children.length === 0 || container.direction === newDirection) {
    const index = position === 'left' || position === 'top' ? 0 : container.children.length;
    container.children.splice(index, 0, item);
    
    // Update sizes
    const size = 100 / container.children.length;
    container.sizes = container.children.map(() => size);
  } else {
    // Need to create a new nested container
    const newContainer: ContainerLayoutItem = {
      id: `container-${Date.now()}`,
      type: LayoutItemType.CONTAINER,
      direction: newDirection,
      children: [item],
      sizes: [100]
    };
    
    // Add the new container to the parent
    const index = position === 'left' || position === 'top' ? 0 : container.children.length;
    container.children.splice(index, 0, newContainer);
    
    // Update sizes
    const size = 100 / container.children.length;
    container.sizes = container.children.map(() => size);
  }
  
  // Update the workspace
  if (currentWorkspace) {
    updateWorkspace({
      ...currentWorkspace,
      updatedAt: new Date().toISOString()
    });
  }
}
```

### Phase 6: Default Layout Template

**Files to modify:**
- `src/lib/workspace/tabtrader-template.ts`
- `src/lib/workspace/init.ts`

**Implementation details:**
- Create a default workspace template that mimics TabTrader's preview layout
- Include components:
  - Watchlist with default cryptocurrencies (BTC, ETH, SOL)
  - Chart component (for BTC/USDT by default)
  - Order book component
  - Last trades component
- Configure components to use public API data or mock data

**Key functionality:**
```typescript
// Update the TabTrader template to include default components with mock data
export const tabTraderTemplate: WorkspaceTemplate = {
  id: 'tabtrader-inspired',
  name: 'TabTrader Layout',
  description: 'Trading layout matching TabTrader with watchlist, chart, order book, and trading panel',
  category: 'trading',
  tags: ['trading', 'tabtrader'],
  root: {
    id: 'root',
    type: LayoutItemType.CONTAINER,
    direction: SplitDirection.HORIZONTAL,
    children: [
      // Left panel with watchlist
      {
        id: 'left-panel',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.VERTICAL,
        children: [
          createTabStack(
            'watchlist-tabs',
            'Watchlist',
            [
              {
                id: 'watchlist',
                componentId: 'market-watchlist',
                title: 'Watchlist',
                componentState: {
                  favorites: true,
                  defaultSymbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
                }
              }
            ]
          )
        ],
        sizes: [100]
      },
      
      // Center panel with chart
      {
        id: 'center-panel',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.VERTICAL,
        children: [
          createTabStack(
            'chart-tabs',
            'Chart',
            [
              {
                id: 'chart',
                componentId: 'chart-section',
                title: 'BTC/USDT',
                componentState: {
                  symbol: 'BTC/USDT',
                  interval: '1h',
                  useMockData: true
                }
              }
            ]
          )
        ],
        sizes: [100]
      },
      
      // Right panel with order book and last trades
      {
        id: 'right-panel',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.VERTICAL,
        children: [
          createTabStack(
            'order-book-tabs',
            'Order Book',
            [
              {
                id: 'order-book',
                componentId: 'order-book',
                title: 'Order Book',
                componentState: {
                  symbol: 'BTC/USDT',
                  useMockData: true
                }
              }
            ]
          ),
          createTabStack(
            'trades-tabs',
            'Last Trades',
            [
              {
                id: 'last-trades',
                componentId: 'recent-trades',
                title: 'Last Trades',
                componentState: {
                  symbol: 'BTC/USDT',
                  useMockData: true
                }
              }
            ]
          )
        ],
        sizes: [50, 50]
      }
    ],
    sizes: [20, 50, 30]
  }
};
```

### Phase 7: Empty Workspace State

**Files to create/modify:**
- Create: `src/components/workspace/EmptyWorkspaceState.tsx`
- Update: `src/components/terminal/core/TerminalContainer.tsx`

**Implementation details:**
- Create a component for the empty workspace state with visual guidance
- Add an arrow/line indicator similar to TabTrader's UI
- Include a clear message like "Add the first module to the workspace"
- Add a button to open the Module Selector

**Key functionality:**
```typescript
// Create EmptyWorkspaceState component
const EmptyWorkspaceState: React.FC<{
  onOpenModuleSelector: () => void;
}> = ({ onOpenModuleSelector }) => {
  return (
    <div className="empty-workspace-state">
      <div className="guidance-container">
        <div className="guidance-arrow"></div>
        <div className="guidance-text">
          Add the first module to the workspace
        </div>
      </div>
      <button 
        className="module-selector-button"
        onClick={onOpenModuleSelector}
      >
        Open Module Selector
      </button>
    </div>
  );
};

// Update TerminalContainer to use EmptyWorkspaceState
// In the render function:
if (currentWorkspace && (!currentWorkspace.root.children || currentWorkspace.root.children.length === 0)) {
  return (
    <div className="h-full w-full">
      <EmptyWorkspaceState onOpenModuleSelector={() => setIsModuleSelectorOpen(true)} />
      {isModuleSelectorOpen && (
        <ModuleSelector onClose={() => setIsModuleSelectorOpen(false)} />
      )}
    </div>
  );
}
```

### Phase 8: Mock Data Service

**Files to create:**
- `src/services/mock-data-service.ts`

**Implementation details:**
- Create a service that provides mock data for unauthenticated users
- Implement mock data for:
  - Market prices
  - Order book entries
  - Recent trades
  - Watchlist items
- Ensure the mock data is realistic and updates periodically to simulate real-time data

**Key functionality:**
```typescript
// Mock data service for unauthenticated users
export class MockDataService {
  // Generate mock order book data
  static getOrderBookData(symbol: string) {
    return {
      bids: [
        { price: 40000.50, amount: 1.2 },
        { price: 40000.00, amount: 0.5 },
        { price: 39999.50, amount: 2.3 },
        // More entries...
      ],
      asks: [
        { price: 40001.00, amount: 0.8 },
        { price: 40001.50, amount: 1.5 },
        { price: 40002.00, amount: 0.7 },
        // More entries...
      ]
    };
  }
  
  // Generate mock recent trades
  static getRecentTrades(symbol: string) {
    return [
      { id: '1', price: 40001.50, amount: 0.1, side: 'buy', time: Date.now() - 5000 },
      { id: '2', price: 40000.80, amount: 0.05, side: 'sell', time: Date.now() - 10000 },
      // More entries...
    ];
  }
  
  // Generate mock watchlist data
  static getWatchlistData() {
    return [
      { symbol: 'BTC/USDT', price: 40001.50, change24h: 2.5 },
      { symbol: 'ETH/USDT', price: 2800.75, change24h: 1.8 },
      { symbol: 'SOL/USDT', price: 120.25, change24h: 3.2 },
      // More entries...
    ];
  }
}
```

## Implementation Strategy

The implementation will be carried out in phases, with each phase building on the previous one:

1. **Phase 1: Module Selector Component**
   - This is the entry point for adding components to the workspace
   - Critical for allowing users to add modules to their workspace

2. **Phase 2: Enhanced Container Drop Handling**
   - Improve how components are added to the workspace
   - Foundation for the drag and drop functionality

3. **Phase 3: Visual Drop Indicators**
   - Add clear visual feedback during drag operations
   - Improves user experience by making it clear where modules will be placed

4. **Phase 4: Enhanced Tab Drag and Drop**
   - Implement VS Code-like tab behavior
   - Allow tabs to be stacked or placed side by side

5. **Phase 5: Container Splitting Logic**
   - Enable intelligent container splitting based on drop position
   - Support for complex workspace layouts

6. **Phase 6: Default Layout Template**
   - Ensure new users see a preview similar to TabTrader
   - Provide a good starting point for users

7. **Phase 7: Empty Workspace State**
   - Create a clear interface for when users create a new workspace
   - Guide users on how to add modules

8. **Phase 8: Mock Data Service**
   - Provide realistic data for unauthenticated users
   - Enhance the preview experience

## Testing Strategy

Each phase should be tested thoroughly before moving to the next:

1. **Unit Tests**
   - Test individual components and functions
   - Ensure proper handling of edge cases

2. **Integration Tests**
   - Test interactions between components
   - Verify that drag and drop operations work as expected

3. **User Testing**
   - Get feedback on the usability of the interface
   - Identify any issues with the workflow

## Expected Outcome

At the end of this implementation, we will have a completely renewed Terminal page with:

- TabTrader-like drag and drop modular functionality
- VS Code-like tab behavior
- Intuitive workspace management
- Default layout for new users
- Support for custom layouts
- Backend integration preserved

This will replace the old Terminal page with a more flexible and user-friendly interface while maintaining compatibility with existing backend functionality.
