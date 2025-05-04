/**
 * TabTrader-inspired Workspace Template
 *
 * This template creates a layout similar to TabTrader's trading interface.
 * Based on the actual TabTrader layout (https://app.tabtrader.com/trading).
 */

import {
  LayoutItemType,
  SplitDirection,
  WorkspaceTemplate,
  StackLayoutItem,
  ComponentLayoutItem
} from './types';

/**
 * Helper function to create a tab stack
 */
function createTabStack(
  id: string,
  title: string,
  tabs: Array<{id: string, componentId: string, title: string, componentState: any}>,
  activeItemIndex: number = 0
): StackLayoutItem {
  return {
    id,
    type: LayoutItemType.STACK,
    title,
    children: tabs.map(tab => ({
      id: tab.id,
      type: LayoutItemType.COMPONENT,
      componentId: tab.componentId,
      componentState: tab.componentState || {},
      title: tab.title
    })),
    activeItemIndex
  };
}

/**
 * TabTrader-inspired trading workspace template
 * Based on the actual TabTrader layout
 */
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
                  favorites: true
                }
              }
            ]
          ),
          createTabStack(
            'alerts-tabs',
            'Alerts',
            [
              {
                id: 'alerts',
                componentId: 'alerts-panel',
                title: 'Alerts',
                componentState: {}
              }
            ]
          )
        ],
        sizes: [70, 30]
      },
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
                id: 'chart-btc',
                componentId: 'chart-section',
                title: 'BTC/USDT Chart',
                componentState: {
                  symbol: 'BTC/USDT'
                }
              }
            ]
          )
        ]
      },
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
                  symbol: 'BTC/USDT'
                }
              }
            ]
          ),
          createTabStack(
            'new-order-tabs',
            'New Order',
            [
              {
                id: 'new-order',
                componentId: 'trading-sidebar',
                title: 'New Order',
                componentState: {
                  symbol: 'BTC/USDT'
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
                  symbol: 'BTC/USDT'
                }
              }
            ]
          )
        ],
        sizes: [40, 30, 30]
      }
    ],
    sizes: [20, 50, 30]
  }
};
