// Direct script to apply the VS Code H-shaped layout
// This can be run from the browser console

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
