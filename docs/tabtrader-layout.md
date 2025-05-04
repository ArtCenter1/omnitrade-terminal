# TabTrader-Inspired Layout

This document describes the TabTrader-inspired layout implemented in the OmniTrade Terminal.

## Overview

TabTrader is a popular mobile and web trading platform known for its clean, efficient interface. Our TabTrader-inspired layout aims to provide a similar user experience with a focus on the most important trading elements.

## Layout Structure

The layout is divided into two main sections:

1. **Main Content Area (75% width)**
   - Chart Section (75% height)
   - Orders & Trades Tabs (25% height)

2. **Right Panel (25% width)**
   - Order Book (60% height)
   - Trading Form (40% height)

## Components

### Chart Section

The chart section displays price charts for the selected trading pair using TradingView integration. It includes:

- Trading pair selector
- Price overview
- Timeframe selector
- TradingView chart

### Order Book

The order book displays real-time bid and ask orders for the selected trading pair. It includes:

- Bid orders (buy orders)
- Ask orders (sell orders)
- Current market price
- Volume visualization

### Trading Form

The trading form allows users to place orders for the selected trading pair. It includes:

- Order type selection (market, limit, stop)
- Buy/sell tabs
- Amount and price inputs
- Total calculation
- Place order button

### Orders & Trades Tabs

The bottom tabs section displays information about orders, trades, and positions. It includes:

- Open Orders tab
- Order History tab
- Trade History tab
- Positions tab

## Usage

The TabTrader-inspired layout is available as a workspace template in the OmniTrade Terminal. To use it:

1. Navigate to the Terminal Workspace page
2. Select "TabTrader-Inspired Layout" from the workspace dropdown
3. The layout will be loaded with the default trading pair (BTC/USDT)

## Customization

Users can customize the layout by:

- Resizing panels using the drag handles between sections
- Changing the trading pair using the pair selector
- Adding or removing components through the workspace editor

## Implementation Details

The layout is implemented using the workspace layout system and component registry. The main components are:

- `ChartSectionComponent` - Wraps the existing ChartSection component
- `OrderBookComponent` - Wraps the existing OrderBook component
- `TradingSidebarComponent` - Wraps the existing TradingSidebar component
- `TerminalTabsComponent` - Wraps the existing TerminalTabs component

The layout is defined in `src/lib/workspace/tabtrader-template.ts` and registered in `src/lib/workspace/templates.ts`.

## Comparison with TabTrader

Our implementation aims to capture the essence of TabTrader's layout while adapting it to our component system. Key similarities include:

- Focus on the chart as the main element
- Order book positioned on the right side
- Trading form easily accessible
- Orders and trades information at the bottom

The main differences are:

- Our implementation is more customizable
- We use our own component system rather than TabTrader's proprietary components
- Our layout is designed for desktop first, while TabTrader is mobile-first

## Future Enhancements

Planned enhancements to make the layout even more similar to TabTrader include:

- Adding a market/pair selector on the left side
- Implementing a more compact trading form
- Adding quick order buttons for common order sizes
- Implementing a more detailed order book with depth visualization
- Adding price alerts functionality
