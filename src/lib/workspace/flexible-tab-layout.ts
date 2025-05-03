/**
 * Flexible Tab-Based Layout System
 * 
 * This module provides a flexible tab-based layout system where each component
 * is contained in a draggable tab that can be rearranged, stacked, and cascaded.
 */

import { 
  LayoutItemType, 
  SplitDirection, 
  WorkspaceTemplate,
  StackLayoutItem,
  ComponentLayoutItem
} from './types';

/**
 * Create a stack layout item with multiple component tabs
 * 
 * @param id The ID of the stack
 * @param title The title of the stack
 * @param components Array of component configurations
 * @param activeItemIndex The index of the active component
 * @returns A stack layout item
 */
function createTabStack(
  id: string,
  title: string,
  components: Array<{
    id: string;
    componentId: string;
    title: string;
    componentState?: Record<string, any>;
  }>,
  activeItemIndex: number = 0
): StackLayoutItem {
  return {
    id,
    type: LayoutItemType.STACK,
    title,
    children: components.map(comp => ({
      id: comp.id,
      type: LayoutItemType.COMPONENT,
      componentId: comp.componentId,
      title: comp.title,
      componentState: comp.componentState || {}
    })),
    activeItemIndex
  };
}

/**
 * Flexible tab-based workspace template
 */
export const flexibleTabTemplate: WorkspaceTemplate = {
  id: 'flexible-tab-layout',
  name: 'Flexible Tab Layout',
  description: 'A flexible tab-based layout where components can be rearranged, stacked, and cascaded',
  category: 'trading',
  tags: ['trading', 'flexible', 'tabs'],
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
            'chart-tabs',
            'Charts',
            [
              {
                id: 'chart-btc',
                componentId: 'chart-section',
                title: 'BTC/USDT Chart',
                componentState: { symbol: 'BTC/USDT' }
              },
              {
                id: 'chart-eth',
                componentId: 'chart-section',
                title: 'ETH/USDT Chart',
                componentState: { symbol: 'ETH/USDT' }
              }
            ]
          ),
          createTabStack(
            'trading-tabs',
            'Trading',
            [
              {
                id: 'terminal-tabs',
                componentId: 'terminal-tabs',
                title: 'Orders & Trades',
                componentState: { symbol: 'BTC/USDT' }
              },
              {
                id: 'trading-sidebar',
                componentId: 'trading-sidebar',
                title: 'Trading Form',
                componentState: { symbol: 'BTC/USDT' }
              }
            ]
          )
        ],
        sizes: [70, 30]
      },
      {
        id: 'right-panel',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.VERTICAL,
        children: [
          createTabStack(
            'market-tabs',
            'Markets',
            [
              {
                id: 'order-book',
                componentId: 'order-book',
                title: 'Order Book',
                componentState: { symbol: 'BTC/USDT' }
              },
              {
                id: 'order-book-eth',
                componentId: 'order-book',
                title: 'ETH Order Book',
                componentState: { symbol: 'ETH/USDT' }
              }
            ]
          ),
          createTabStack(
            'info-tabs',
            'Information',
            [
              {
                id: 'trading-sidebar-alt',
                componentId: 'trading-sidebar',
                title: 'Account',
                componentState: { symbol: 'BTC/USDT' }
              },
              {
                id: 'terminal-tabs-alt',
                componentId: 'terminal-tabs',
                title: 'History',
                componentState: { symbol: 'BTC/USDT' }
              }
            ]
          )
        ],
        sizes: [50, 50]
      }
    ],
    sizes: [75, 25]
  }
};
