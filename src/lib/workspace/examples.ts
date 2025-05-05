/**
 * Workspace Layout Examples
 *
 * This module provides example workspace layouts that demonstrate how to use
 * the component registry and workspace layout system.
 */

import {
  LayoutItemType,
  SplitDirection,
  WorkspaceLayout
} from './types';

/**
 * Create a custom workspace layout
 *
 * @param name The name of the workspace
 * @param description The description of the workspace
 * @returns A new workspace layout
 */
export function createCustomWorkspace(name: string, description?: string): WorkspaceLayout {
  const now = new Date().toISOString();

  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    name,
    description,
    createdAt: now,
    updatedAt: now,
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
            {
              id: 'chart-section',
              type: LayoutItemType.COMPONENT,
              componentId: 'chart-section',
              componentState: {
                symbol: 'BTC/USDT'
              },
              title: 'BTC/USDT Chart'
            },
            {
              id: 'terminal-tabs',
              type: LayoutItemType.COMPONENT,
              componentId: 'terminal-tabs',
              componentState: {
                symbol: 'BTC/USDT'
              },
              title: 'Trading Information'
            }
          ],
          sizes: [70, 30]
        },
        {
          id: 'right-panel',
          type: LayoutItemType.CONTAINER,
          direction: SplitDirection.VERTICAL,
          children: [
            {
              id: 'trading-sidebar',
              type: LayoutItemType.COMPONENT,
              componentId: 'trading-sidebar',
              componentState: {
                symbol: 'BTC/USDT'
              },
              title: 'Trading'
            },
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
          sizes: [50, 50]
        }
      ],
      sizes: [70, 30]
    }
  };
}

/**
 * Create a multi-chart workspace layout
 *
 * @param name The name of the workspace
 * @param description The description of the workspace
 * @returns A new workspace layout
 */
export function createMultiChartWorkspace(name: string, description?: string): WorkspaceLayout {
  const now = new Date().toISOString();

  return {
    id: `multi-chart-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    root: {
      id: 'root',
      type: LayoutItemType.CONTAINER,
      direction: SplitDirection.VERTICAL,
      children: [
        {
          id: 'charts',
          type: LayoutItemType.CONTAINER,
          direction: SplitDirection.HORIZONTAL,
          children: [
            {
              id: 'chart-btc',
              type: LayoutItemType.COMPONENT,
              componentId: 'chart-section',
              componentState: {
                symbol: 'BTC/USDT'
              },
              title: 'BTC/USDT'
            },
            {
              id: 'chart-eth',
              type: LayoutItemType.COMPONENT,
              componentId: 'chart-section',
              componentState: {
                symbol: 'ETH/USDT'
              },
              title: 'ETH/USDT'
            }
          ],
          sizes: [50, 50]
        },
        {
          id: 'bottom-panel',
          type: LayoutItemType.CONTAINER,
          direction: SplitDirection.HORIZONTAL,
          children: [
            {
              id: 'terminal-tabs',
              type: LayoutItemType.COMPONENT,
              componentId: 'terminal-tabs',
              componentState: {
                symbol: 'BTC/USDT'
              },
              title: 'Trading Information'
            },
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
          sizes: [70, 30]
        }
      ],
      sizes: [70, 30]
    }
  };
}
