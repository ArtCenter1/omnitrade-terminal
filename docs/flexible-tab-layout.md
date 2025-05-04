# Flexible Tab-Based Layout

This document describes the flexible tab-based layout system implemented in the OmniTrade Terminal.

## Overview

The flexible tab-based layout system allows each component to be contained in a draggable tab that can be rearranged, stacked, and cascaded. This provides a highly customizable trading interface similar to professional trading platforms like TradingView Pro, ThinkOrSwim, or advanced IDE interfaces.

## Key Features

1. **Tab-Based Components**: Each component is contained in a tab that can be selected, moved, and rearranged.

2. **Tab Stacking**: Multiple tabs can be stacked together in a single container, allowing users to switch between them.

3. **Drag and Drop**: Tabs can be dragged and dropped to rearrange the layout.

4. **Resizable Panels**: Panels can be resized by dragging the dividers between them.

5. **Flexible Layout**: The layout can be customized to suit individual trading preferences.

## Default Layout Structure

The default flexible tab layout is organized as follows:

1. **Left Panel (75% width)**
   - **Chart Tabs (70% height)**
     - BTC/USDT Chart tab
     - ETH/USDT Chart tab
   - **Trading Tabs (30% height)**
     - Orders & Trades tab
     - Trading Form tab

2. **Right Panel (25% width)**
   - **Market Tabs (50% height)**
     - Order Book tab
     - ETH Order Book tab
   - **Information Tabs (50% height)**
     - Account tab
     - History tab

## Components

### Chart Tabs

The chart tabs contain chart components for different trading pairs. Each tab displays:

- Trading pair selector
- Price overview
- Timeframe selector
- TradingView chart

### Trading Tabs

The trading tabs contain components for managing trades and orders:

- **Orders & Trades Tab**: Displays open orders, order history, and trade history
- **Trading Form Tab**: Provides a form for placing orders

### Market Tabs

The market tabs contain components for market data:

- **Order Book Tab**: Displays the order book for BTC/USDT
- **ETH Order Book Tab**: Displays the order book for ETH/USDT

### Information Tabs

The information tabs contain components for account information and history:

- **Account Tab**: Displays account information and balances
- **History Tab**: Displays trading history

## Usage

### Selecting Tabs

Click on a tab to select it and bring its content to the front.

### Moving Tabs

To move a tab:

1. Click and hold on the tab header
2. Drag the tab to a new location
3. Release the mouse button to drop the tab

### Stacking Tabs

To stack tabs together:

1. Drag a tab over another tab
2. When the drop indicator appears, release the mouse button
3. The tabs will be stacked together, and you can switch between them by clicking on the tab headers

### Resizing Panels

To resize panels:

1. Hover over the divider between panels
2. When the cursor changes to a resize cursor, click and drag
3. Release the mouse button to set the new size

## Implementation Details

The flexible tab-based layout is implemented using the workspace layout system and component registry. The key components are:

- `StackLayoutItem`: Represents a stack of tabs
- `ComponentLayoutItem`: Represents a component in a tab
- `ContainerLayoutItem`: Represents a container that can hold multiple stacks or other containers

The layout is defined in `src/lib/workspace/flexible-tab-layout.ts` and registered in `src/lib/workspace/templates.ts`.

## Customization

Users can customize the layout by:

- Rearranging tabs through drag and drop
- Resizing panels using the drag handles between sections
- Adding new tabs through the workspace editor
- Removing tabs by closing them
- Creating new tab stacks by dragging a tab to an empty area

## Future Enhancements

Planned enhancements to the flexible tab-based layout include:

1. **Tab Persistence**: Saving the tab arrangement between sessions
2. **Tab Cloning**: Allowing users to clone tabs
3. **Tab Detaching**: Allowing tabs to be detached into separate windows
4. **Tab Groups**: Allowing users to group related tabs together
5. **Tab Templates**: Providing predefined tab arrangements for common trading scenarios
6. **Tab Search**: Adding a search function to quickly find and switch to specific tabs
7. **Tab Notifications**: Adding notifications to tabs (e.g., for order fills or price alerts)
8. **Tab Customization**: Allowing users to customize the appearance of tabs
