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
import { AssetsTable } from '@/components/terminal/AssetsTable';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Suspense } from 'react';

export default function Terminal() {
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
        <div className="grid grid-cols-12 gap-0">
          <ErrorBoundary>
            <TradingSidebar />
          </ErrorBoundary>

          <div className="col-span-9">
            <div className="grid grid-cols-12 gap-0">
              <ErrorBoundary
                fallback={
                  <div className="col-span-9 border-r border-gray-800 flex flex-col items-center justify-center p-8">
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
                    <div className="col-span-9 h-96 bg-gray-900 animate-pulse"></div>
                  }
                >
                  <ChartSection />
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary>
                <OrderBook />
              </ErrorBoundary>
            </div>

            <ErrorBoundary>
              <AssetsTable />
            </ErrorBoundary>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
