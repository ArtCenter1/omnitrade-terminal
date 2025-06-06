/**
 * Workspace Templates
 *
 * This module provides default workspace templates for the terminal.
 */

import { LayoutItemType, SplitDirection, WorkspaceTemplate } from './types';

import { simplifiedTemplate } from './simplified-template';
import { tabTraderTemplate } from './tabtrader-template';
import { flexibleTabTemplate } from './flexible-tab-layout';
import { demoTabLayout } from './demo-tab-layout';
import { demoWorkspace } from './demo-workspace';
import { vsCodeTemplate } from './vscode-template';

/**
 * Default trading workspace template
 */
export const defaultTradingTemplate: WorkspaceTemplate = {
  id: 'default-trading',
  name: 'Default Trading Layout',
  description:
    'Standard trading layout with chart, order book, and trading panel',
  category: 'trading',
  tags: ['trading', 'default'],
  root: {
    id: 'root',
    type: LayoutItemType.CONTAINER,
    direction: SplitDirection.HORIZONTAL,
    children: [
      {
        id: 'left-panel',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.HORIZONTAL,
        children: [
          {
            id: 'trading-sidebar',
            type: LayoutItemType.COMPONENT,
            componentId: 'trading-sidebar',
            componentState: {
              symbol: 'BTC/USDT',
            },
            title: 'Trading',
          },
          {
            id: 'main-content',
            type: LayoutItemType.CONTAINER,
            direction: SplitDirection.VERTICAL,
            children: [
              {
                id: 'chart-section',
                type: LayoutItemType.COMPONENT,
                componentId: 'chart-section',
                componentState: {
                  symbol: 'BTC/USDT',
                },
                title: 'Chart',
              },
              {
                id: 'terminal-tabs',
                type: LayoutItemType.COMPONENT,
                componentId: 'terminal-tabs',
                componentState: {
                  symbol: 'BTC/USDT',
                },
                title: 'Trading Information',
              },
            ],
            sizes: [70, 30],
          },
        ],
        sizes: [20, 80],
      },
      {
        id: 'order-book',
        type: LayoutItemType.COMPONENT,
        componentId: 'order-book',
        componentState: {
          symbol: 'BTC/USDT',
        },
        title: 'Order Book',
      },
    ],
    sizes: [80, 20],
  },
};

/**
 * Default analysis workspace template
 */
export const defaultAnalysisTemplate: WorkspaceTemplate = {
  id: 'default-analysis',
  name: 'Market Analysis Layout',
  description: 'Layout focused on market analysis with multiple charts',
  category: 'analysis',
  tags: ['analysis', 'multi-chart'],
  root: {
    id: 'root',
    type: LayoutItemType.CONTAINER,
    direction: SplitDirection.VERTICAL,
    children: [
      {
        id: 'top-charts',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.HORIZONTAL,
        children: [
          {
            id: 'chart-1',
            type: LayoutItemType.COMPONENT,
            componentId: 'chart-section',
            componentState: {
              symbol: 'BTC/USDT',
            },
            title: 'BTC/USDT Chart',
          },
          {
            id: 'chart-2',
            type: LayoutItemType.COMPONENT,
            componentId: 'chart-section',
            componentState: {
              symbol: 'ETH/USDT',
            },
            title: 'ETH/USDT Chart',
          },
        ],
        sizes: [50, 50],
      },
      {
        id: 'bottom-section',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.HORIZONTAL,
        children: [
          {
            id: 'order-book-1',
            type: LayoutItemType.COMPONENT,
            componentId: 'order-book',
            componentState: {
              symbol: 'BTC/USDT',
            },
            title: 'BTC/USDT Order Book',
          },
          {
            id: 'order-book-2',
            type: LayoutItemType.COMPONENT,
            componentId: 'order-book',
            componentState: {
              symbol: 'ETH/USDT',
            },
            title: 'ETH/USDT Order Book',
          },
        ],
        sizes: [50, 50],
      },
    ],
    sizes: [70, 30],
  },
};

/**
 * TradingView Chart workspace template
 */
export const tradingViewChartTemplate: WorkspaceTemplate = {
  id: 'tradingview-chart',
  name: 'TradingView Chart Layout',
  description: 'Layout focused on TradingView charts with multiple timeframes',
  category: 'analysis',
  tags: ['analysis', 'tradingview', 'chart'],
  root: {
    id: 'root',
    type: LayoutItemType.CONTAINER,
    direction: SplitDirection.VERTICAL,
    children: [
      {
        id: 'top-charts',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.HORIZONTAL,
        children: [
          {
            id: 'chart-daily',
            type: LayoutItemType.COMPONENT,
            componentId: 'tradingview-chart',
            componentState: {
              symbol: 'BTC/USDT',
              interval: 'D',
            },
            title: 'BTC/USDT Daily',
          },
          {
            id: 'chart-hourly',
            type: LayoutItemType.COMPONENT,
            componentId: 'tradingview-chart',
            componentState: {
              symbol: 'BTC/USDT',
              interval: '1h',
            },
            title: 'BTC/USDT Hourly',
          },
        ],
        sizes: [50, 50],
      },
      {
        id: 'bottom-charts',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.HORIZONTAL,
        children: [
          {
            id: 'chart-eth',
            type: LayoutItemType.COMPONENT,
            componentId: 'tradingview-chart',
            componentState: {
              symbol: 'ETH/USDT',
              interval: 'D',
            },
            title: 'ETH/USDT Daily',
          },
          {
            id: 'chart-sol',
            type: LayoutItemType.COMPONENT,
            componentId: 'tradingview-chart',
            componentState: {
              symbol: 'SOL/USDT',
              interval: 'D',
            },
            title: 'SOL/USDT Daily',
          },
        ],
        sizes: [50, 50],
      },
    ],
    sizes: [50, 50],
  },
};

/**
 * Get all default workspace templates
 */
export function getDefaultTemplates(): WorkspaceTemplate[] {
  return [simplifiedTemplate];
}
