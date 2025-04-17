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
import { Suspense, useState } from 'react';
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

  // Handler for when a trading pair is selected
  const handlePairSelect = (pair: TradingPair) => {
    setSelectedPair(pair);
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
        <div className="flex flex-col h-screen">
          {/* Top Section - Larger */}
          <div className="flex h-[65%]">
            {/* Trading Sidebar */}
            <ErrorBoundary>
              <TradingSidebar selectedPair={selectedPair} />
            </ErrorBoundary>

            {/* Chart Section */}
            <ErrorBoundary
              fallback={
                <div className="flex-grow border-r border-gray-800 flex flex-col items-center justify-center p-8">
                  <AlertTriangle className="w-10 h-10 text-yellow-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-white">
                    Chart unavailable
                  </h3>
                  <p className="text-gray-400 text-sm text-center">
                    There was an error loading the chart. Please try again
                    later.
                  </p>
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="flex-grow h-full bg-gray-900 animate-pulse"></div>
                }
              >
                <div className="flex-grow border-r border-gray-800">
                  <ChartSection
                    selectedPair={selectedPair}
                    onPairSelect={handlePairSelect}
                  />
                </div>
              </Suspense>
            </ErrorBoundary>

            {/* Order Book */}
            <ErrorBoundary>
              <div className="w-[350px]">
                <OrderBook selectedPair={selectedPair} />
              </div>
            </ErrorBoundary>
          </div>

          {/* Bottom Section - Smaller */}
          <ErrorBoundary>
            <div className="h-[35%] border-t border-gray-800">
              <TerminalTabs selectedPair={selectedPair} />
            </div>
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  );
}
