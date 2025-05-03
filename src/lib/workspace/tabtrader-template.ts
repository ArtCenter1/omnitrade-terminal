/**
 * TabTrader-inspired Workspace Template
 * 
 * This template creates a layout similar to TabTrader's trading interface.
 */

import { 
  LayoutItemType, 
  SplitDirection, 
  WorkspaceTemplate 
} from './types';

/**
 * TabTrader-inspired trading workspace template
 */
export const tabTraderTemplate: WorkspaceTemplate = {
  id: 'tabtrader-inspired',
  name: 'TabTrader-Inspired Layout',
  description: 'Trading layout inspired by TabTrader with chart, order book, and trading panel',
  category: 'trading',
  tags: ['trading', 'tabtrader'],
  root: {
    id: 'root',
    type: LayoutItemType.CONTAINER,
    direction: SplitDirection.HORIZONTAL,
    children: [
      {
        id: 'main-content',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.VERTICAL,
        children: [
          {
            id: 'chart-area',
            type: LayoutItemType.COMPONENT,
            componentId: 'chart-section',
            componentState: {
              symbol: 'BTC/USDT'
            },
            title: 'BTC/USDT Chart'
          },
          {
            id: 'bottom-tabs',
            type: LayoutItemType.COMPONENT,
            componentId: 'terminal-tabs',
            componentState: {
              symbol: 'BTC/USDT'
            },
            title: 'Orders & Trades'
          }
        ],
        sizes: [75, 25]
      },
      {
        id: 'right-panel',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.VERTICAL,
        children: [
          {
            id: 'order-book',
            type: LayoutItemType.COMPONENT,
            componentId: 'order-book',
            componentState: {
              symbol: 'BTC/USDT'
            },
            title: 'Order Book'
          },
          {
            id: 'trading-form',
            type: LayoutItemType.COMPONENT,
            componentId: 'trading-sidebar',
            componentState: {
              symbol: 'BTC/USDT'
            },
            title: 'Place Order'
          }
        ],
        sizes: [60, 40]
      }
    ],
    sizes: [75, 25]
  }
};
