/**
 * VS Code Tabs Demo Component
 *
 * This component demonstrates the VS Code-like tab functionality
 * with multiple tab groups and drag-and-drop capabilities.
 */

import React, { useState } from 'react';
import { TabModule } from './TabModule';
import { TabData } from './VSCodeTabs';
import { ResizableSplitter } from '@/components/ui/resizable-splitter';
import {
  BarChart,
  LineChart,
  PieChart,
  Activity,
  List,
  Settings,
} from 'lucide-react';
import '@/styles/vscode-tabs.css';
import '@/styles/component-tabs.css';

// Sample content components
const ChartContent = () => (
  <div className="p-4 h-full flex items-center justify-center">
    <div className="text-center">
      <BarChart size={48} className="mx-auto mb-4 text-blue-500" />
      <h3 className="text-lg font-medium">Chart Component</h3>
      <p className="text-sm text-gray-400">
        This would display a trading chart
      </p>
    </div>
  </div>
);

const OrderBookContent = () => (
  <div className="p-4 h-full flex items-center justify-center">
    <div className="text-center">
      <List size={48} className="mx-auto mb-4 text-green-500" />
      <h3 className="text-lg font-medium">Order Book Component</h3>
      <p className="text-sm text-gray-400">This would display the order book</p>
    </div>
  </div>
);

const TradesContent = () => (
  <div className="p-4 h-full flex items-center justify-center">
    <div className="text-center">
      <Activity size={48} className="mx-auto mb-4 text-purple-500" />
      <h3 className="text-lg font-medium">Recent Trades Component</h3>
      <p className="text-sm text-gray-400">This would display recent trades</p>
    </div>
  </div>
);

const SettingsContent = () => (
  <div className="p-4 h-full flex items-center justify-center">
    <div className="text-center">
      <Settings size={48} className="mx-auto mb-4 text-yellow-500" />
      <h3 className="text-lg font-medium">Settings Component</h3>
      <p className="text-sm text-gray-400">
        This would display trading settings
      </p>
    </div>
  </div>
);

// Sample initial tabs for each module
const chartTabs: TabData[] = [
  {
    id: 'chart-1',
    title: 'BTC/USDT Chart',
    icon: <BarChart size={16} />,
    content: <ChartContent />,
    closable: true,
  },
  {
    id: 'chart-2',
    title: 'ETH/USDT Chart',
    icon: <LineChart size={16} />,
    content: <ChartContent />,
    closable: true,
  },
];

const orderBookTabs: TabData[] = [
  {
    id: 'orderbook-1',
    title: 'Order Book',
    icon: <List size={16} />,
    content: <OrderBookContent />,
    closable: true,
  },
];

const tradesTabs: TabData[] = [
  {
    id: 'trades-1',
    title: 'Recent Trades',
    icon: <Activity size={16} />,
    content: <TradesContent />,
    closable: true,
  },
  {
    id: 'settings-1',
    title: 'Settings',
    icon: <Settings size={16} />,
    content: <SettingsContent />,
    closable: true,
  },
];

export const VSCodeTabsDemo: React.FC = () => {
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [sizes, setSizes] = useState<number[]>([50, 50]);

  const toggleLayout = () => {
    setLayout(layout === 'horizontal' ? 'vertical' : 'horizontal');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-2 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium">VS Code-like Tab Demo</h2>
        <button
          onClick={toggleLayout}
          className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Toggle {layout === 'horizontal' ? 'Vertical' : 'Horizontal'} Layout
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {layout === 'horizontal' ? (
          <div className="flex h-full">
            <div className="w-1/2 h-full">
              <TabModule moduleId="charts" initialTabs={chartTabs} />
            </div>
            <ResizableSplitter direction="horizontal">
              {[<React.Fragment key="left" />, <React.Fragment key="right" />]}
            </ResizableSplitter>
            <div className="w-1/2 h-full">
              <div className="flex flex-col h-full">
                <div className="h-1/2">
                  <TabModule moduleId="orderbook" initialTabs={orderBookTabs} />
                </div>
                <ResizableSplitter direction="vertical">
                  {[
                    <React.Fragment key="top" />,
                    <React.Fragment key="bottom" />,
                  ]}
                </ResizableSplitter>
                <div className="h-1/2">
                  <TabModule moduleId="trades" initialTabs={tradesTabs} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="h-1/2">
              <TabModule moduleId="charts" initialTabs={chartTabs} />
            </div>
            <ResizableSplitter direction="vertical">
              {[<React.Fragment key="top" />, <React.Fragment key="bottom" />]}
            </ResizableSplitter>
            <div className="h-1/2">
              <div className="flex h-full">
                <div className="w-1/2 h-full">
                  <TabModule moduleId="orderbook" initialTabs={orderBookTabs} />
                </div>
                <ResizableSplitter direction="horizontal">
                  {[
                    <React.Fragment key="left" />,
                    <React.Fragment key="right" />,
                  ]}
                </ResizableSplitter>
                <div className="w-1/2 h-full">
                  <TabModule moduleId="trades" initialTabs={tradesTabs} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-700 text-sm text-gray-400">
        <p>
          Try dragging tabs within a group or to the edges of other tab groups
          to create splits
        </p>
      </div>
    </div>
  );
};
