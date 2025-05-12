# VS Code Layout

The VS Code layout is an H-shaped layout that mimics Visual Studio Code's interface structure. It provides a familiar and efficient workspace for traders and developers.

## Layout Structure

The VS Code layout consists of:

1. **Left Sidebar** - Contains the market watchlist for quick access to your favorite markets
2. **Center Area** - Split into two sections:
   - **Upper Section (70%)** - Main chart area for technical analysis
   - **Lower Section (30%)** - Terminal/output area for recent trades and other information
3. **Right Sidebar** - Contains the order book for the selected market

This H-shaped structure provides an optimal balance between information density and usability.

## How to Apply the VS Code Layout

There are several ways to apply the VS Code layout:

### Method 1: Using the Reset Button (Development Mode)

In development mode, you'll see buttons in the bottom-right corner of the screen:

- Click the "Apply VS Code Layout" button to switch to the VS Code layout

### Method 2: Using the Console

You can apply the VS Code layout by copying and pasting the following code into your browser's console:

```javascript
// Define the VS Code layout directly
const vsCodeLayout = {
  id: 'vscode-layout-' + Date.now(),
  name: 'VS Code Layout',
  root: {
    id: 'root',
    type: 'container',
    direction: 'row',
    children: [
      // Left sidebar - Watchlist
      {
        id: 'left-sidebar',
        type: 'component',
        componentId: 'market-watchlist',
        componentState: {
          favorites: true,
        },
        title: 'Watchlist',
      },

      // Center area - Split into upper and lower sections
      {
        id: 'center-area',
        type: 'container',
        direction: 'column',
        children: [
          // Upper section - Chart (70%)
          {
            id: 'chart',
            type: 'component',
            componentId: 'shared-tradingview',
            componentState: {
              symbol: 'BTC/USDT',
              interval: 'D',
            },
            title: 'BTC/USDT Chart',
          },

          // Lower section - Terminal/Output (30%)
          {
            id: 'terminal',
            type: 'component',
            componentId: 'recent-trades',
            componentState: {
              symbol: 'BTC/USDT',
            },
            title: 'Recent Trades',
          },
        ],
        // Distribute space: 70% chart, 30% terminal
        sizes: [70, 30],
      },

      // Right sidebar - Order Book
      {
        id: 'right-sidebar',
        type: 'component',
        componentId: 'order-book',
        componentState: {
          symbol: 'BTC/USDT',
        },
        title: 'Order Book',
      },
    ],
    // Distribute space: 25% left sidebar, 50% center area, 25% right sidebar (1:2:1 ratio)
    sizes: [25, 50, 25],
  },
};

// Clear workspace state from local storage
localStorage.removeItem('omnitrade-terminal-workspaces');

// Store the VS Code layout directly
const workspaces = {
  currentId: vsCodeLayout.id,
  workspaces: [vsCodeLayout],
};

localStorage.setItem(
  'omnitrade-terminal-workspaces',
  JSON.stringify(workspaces),
);
console.log('VS Code layout directly applied to localStorage');

// Force a page reload to apply the changes
window.location.reload();
```

For convenience, you can also find this script in the file `docs/vscode-layout-console-script.js`.

### Method 3: Using the Reset Script

You can also use the reset script by adding this to your HTML:

```html
<script src="/apply-vscode-layout.js"></script>
```

## Customizing the VS Code Layout

The VS Code layout can be customized by modifying the template in:
`src/lib/workspace/vscode-template.ts`

You can adjust:

- The size proportions (currently 25:50:25 for left:center:right)
- The vertical split in the center area (currently 70:30)
- The components used in each section

## Default Components

The VS Code layout uses these default components:

- **Left Sidebar**: Market Watchlist
- **Center Upper**: Trading Chart (BTC/USDT)
- **Center Lower**: Recent Trades
- **Right Sidebar**: Order Book

These components can be replaced with any other available components in the system.
