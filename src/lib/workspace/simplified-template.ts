/**
 * Simplified Workspace Template
 *
 * This template provides a clean, simple layout with just the essential components:
 * - Watchlist on the left
 * - Chart in the center
 * - Order book on the right
 */

import {
  LayoutItemType,
  SplitDirection,
  WorkspaceTemplate
} from './types';

/**
 * Simplified workspace template with essential trading components
 */
export const simplifiedTemplate: WorkspaceTemplate = {
  id: 'simplified-default',
  name: 'Default Workspace',
  description: 'Simple layout with watchlist, chart, and order book',
  category: 'trading',
  tags: ['trading', 'default', 'simple'],
  root: {
    id: 'root',
    type: LayoutItemType.CONTAINER,
    direction: SplitDirection.HORIZONTAL,
    children: [
      // Left panel - Watchlist
      {
        id: 'watchlist',
        type: LayoutItemType.COMPONENT,
        componentId: 'market-watchlist',
        componentState: {
          favorites: true
        },
        title: 'Watchlist'
      },
      // Center panel - Chart (using shared TradingView component)
      {
        id: 'chart',
        type: LayoutItemType.COMPONENT,
        componentId: 'shared-tradingview',
        componentState: {
          symbol: 'BTC/USDT',
          interval: 'D'
        },
        title: 'BTC/USDT Chart'
      },
      // Right panel - Order Book
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
    // Distribute space: 20% watchlist, 60% chart, 20% order book
    sizes: [20, 60, 20]
  }
};
