/**
 * VS Code-like workspace template
 *
 * This template creates a layout that mimics Visual Studio Code's interface
 * with a primary sidebar, editor area, and panel.
 */

import {
  LayoutItemType,
  SplitDirection,
  WorkspaceTemplate,
  StackLayoutItem,
  ComponentLayoutItem,
} from './types';

/**
 * Helper function to create a tab stack
 */
function createTabStack(
  id: string,
  title: string,
  tabs: Array<{
    id: string;
    componentId: string;
    title: string;
    componentState: any;
  }>,
  activeItemIndex: number = 0,
): StackLayoutItem {
  return {
    id,
    type: LayoutItemType.STACK,
    title,
    children: tabs.map((tab) => ({
      id: tab.id,
      type: LayoutItemType.COMPONENT,
      componentId: tab.componentId,
      componentState: tab.componentState || {},
      title: tab.title,
    })),
    activeItemIndex,
  };
}

/**
 * Helper function to create a VS Code-like editor tab stack
 */
const createEditorTabStack = (
  id: string,
  title: string,
  files: Array<{ id: string; title: string; type: string }>,
) => {
  return createTabStack(
    id,
    title,
    files.map((file) => ({
      id: file.id,
      componentId: 'vscode-editor',
      title: file.title,
      componentState: {
        fileType: file.type,
        fileName: file.title,
      },
    })),
  );
};

/**
 * VS Code-like workspace template with H-shaped layout
 */
export const vsCodeTemplate: WorkspaceTemplate = {
  id: 'vscode-layout',
  name: 'VS Code Layout',
  description:
    'An H-shaped layout that mimics Visual Studio Code with sidebars and split center area',
  category: 'hidden',
  tags: ['development', 'vscode', 'coding'],
  root: {
    id: 'root',
    type: LayoutItemType.CONTAINER,
    direction: SplitDirection.HORIZONTAL,
    children: [
      // Left sidebar - Watchlist
      createTabStack('left-sidebar-tabs', 'Explorer', [
        {
          id: 'watchlist',
          componentId: 'market-watchlist',
          title: 'Watchlist',
          componentState: {
            favorites: true,
          },
        },
        {
          id: 'market-overview',
          componentId: 'market-overview',
          title: 'Market Overview',
          componentState: {},
        },
      ]),

      // Center area - Split into upper and lower sections
      {
        id: 'center-area',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.VERTICAL,
        children: [
          // Upper section - Chart (70%)
          createTabStack('chart-tabs', 'Charts', [
            {
              id: 'chart-btc',
              componentId: 'shared-tradingview',
              title: 'BTC/USDT Chart',
              componentState: {
                symbol: 'BTC/USDT',
                interval: 'D',
              },
            },
            {
              id: 'chart-eth',
              componentId: 'shared-tradingview',
              title: 'ETH/USDT Chart',
              componentState: {
                symbol: 'ETH/USDT',
                interval: 'D',
              },
            },
          ]),

          // Lower section - Terminal/Output (30%)
          createTabStack('terminal-tabs', 'Terminal', [
            {
              id: 'recent-trades',
              componentId: 'recent-trades',
              title: 'Recent Trades',
              componentState: {
                symbol: 'BTC/USDT',
              },
            },
            {
              id: 'terminal-output',
              componentId: 'terminal-tabs',
              title: 'Output',
              componentState: {},
            },
          ]),
        ],
        // Distribute space: 70% chart, 30% terminal
        sizes: [70, 30],
      },

      // Right sidebar - Order Book and other panels
      createTabStack('right-sidebar-tabs', 'Market Data', [
        {
          id: 'order-book',
          componentId: 'order-book',
          title: 'Order Book',
          componentState: {
            symbol: 'BTC/USDT',
          },
        },
        {
          id: 'trading-panel',
          componentId: 'trading-sidebar',
          title: 'Trading',
          componentState: {
            symbol: 'BTC/USDT',
          },
        },
      ]),
    ],
    // Distribute space: 25% left sidebar, 50% center area, 25% right sidebar (1:2:1 ratio)
    sizes: [25, 50, 25],
  },
};
