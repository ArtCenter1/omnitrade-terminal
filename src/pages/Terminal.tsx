import {
  ArrowDown,
  BarChart3,
  ChevronDown,
  Clock,
  History,
  LayoutGrid,
  Menu,
  Search,
  Settings,
  Maximize,
  Save,
  BarChart,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAssets, generatePriceChartData } from '@/lib/utils';
import { TradingSidebar } from '@/components/terminal/TradingSidebar';
import { ChartHeader } from '@/components/terminal/ChartHeader';
import { ChartSection } from '@/components/terminal/ChartSection';
import { OrderBook } from '@/components/terminal/OrderBook';
import { TerminalTabs } from '@/components/terminal/TerminalTabs';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Suspense, useState, useRef } from 'react';
import { TradingPair } from '@/components/terminal/TradingPairSelector';

export default function Terminal() {
  // State for the selected trading pair
  const [selectedPair, setSelectedPair] = useState<TradingPair>({
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: '84,316.58',
    change24h: '+0.92%',
    volume24h: '1.62b',
    isFavorite: true,
  });

  // Refresh trigger for components that need to refresh when orders are placed
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handler for when a trading pair is selected
  const handlePairSelect = (pair: TradingPair) => {
    setSelectedPair(pair);
  };

  // Handler for when an order is placed
  const handleOrderPlaced = () => {
    // Increment the refresh trigger to cause a refresh of components that depend on it
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="bg-black min-h-screen">
      <ErrorBoundary
        fallback={
          <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-4">
              There was an error loading the terminal
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload page
            </button>
          </div>
        }
      >
        {/* Main Layout */}
        <div className="flex flex-col h-screen">
          {/* Top Section */}
          <div className="flex h-[65%]">
            {/* Left Trading Sidebar - Fixed Width */}
            <ErrorBoundary>
              <div className="w-[250px] border-r border-gray-800">
                <TradingSidebar
                  selectedPair={selectedPair}
                  onOrderPlaced={handleOrderPlaced}
                />
              </div>
            </ErrorBoundary>

            {/* Chart Section */}
            <div className="flex-1">
              <ErrorBoundary
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2 text-white">
                      Chart unavailable
                    </h3>
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="h-full bg-gray-900 animate-pulse"></div>
                  }
                >
                  <ChartSection
                    selectedPair={selectedPair}
                    onPairSelect={handlePairSelect}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* Right Order Book - Fixed Width */}
            <ErrorBoundary>
              <div className="w-[300px] border-l border-gray-800 h-screen">
                <OrderBook selectedPair={selectedPair} />
              </div>
            </ErrorBoundary>
          </div>

          {/* Bottom Section - Assets (Width limited to not overlap with order book) */}
          <div
            className="h-[35%] border-t border-gray-800"
            style={{ width: 'calc(100% - 300px)' }}
          >
            <ErrorBoundary>
              <TerminalTabs
                selectedPair={selectedPair}
                refreshTrigger={refreshTrigger}
              />
            </ErrorBoundary>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
