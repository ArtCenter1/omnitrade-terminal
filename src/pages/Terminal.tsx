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
import { Suspense, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { getTradingPair } from '@/services/tradingService';
import { ResizableSplitter } from '@/components/ui/resizable-splitter';
import { TradingPair } from '@/components/terminal/TradingPairSelector';
import { PriceProvider } from '@/contexts/PriceContext';

export default function Terminal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedAccount, setSelectedAccount } = useSelectedAccount();

  // Parse URL parameters
  const queryParams = new URLSearchParams(location.search);
  const symbolParam = queryParams.get('symbol');
  const exchangeParam = queryParams.get('exchange');

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

  // Initialize trading pair and exchange from URL parameters
  useEffect(() => {
    const initializeFromUrl = async () => {
      try {
        // If we have both symbol and exchange parameters
        if (symbolParam && exchangeParam) {
          console.log(
            `Initializing terminal with symbol=${symbolParam} and exchange=${exchangeParam}`,
          );

          // Find the account for this exchange
          const { DEFAULT_MOCK_ACCOUNTS } = await import(
            '@/mocks/mockExchangeAccounts'
          );
          const account = DEFAULT_MOCK_ACCOUNTS.find(
            (acc) => acc.exchangeId === exchangeParam,
          );

          if (account) {
            // Set the selected account
            setSelectedAccount(account);
            console.log(
              `Set selected account to ${account.name} (${account.exchangeId})`,
            );
          }

          // Parse the symbol parameter (format: BASE/QUOTE)
          const [baseAsset, quoteAsset] = symbolParam.split('/');

          if (baseAsset && quoteAsset) {
            // Get the trading pair data
            const pair = await getTradingPair(
              exchangeParam,
              `${baseAsset}/${quoteAsset}`,
            );

            if (pair) {
              // Set the selected pair
              const updatedPair = {
                symbol: `${baseAsset}/${quoteAsset}`,
                baseAsset: baseAsset,
                quoteAsset: quoteAsset,
                price: pair.price?.toString() || '0.00',
                change24h: '+0.00%',
                volume24h: '0',
                isFavorite: false,
                exchangeId: exchangeParam,
              };

              setSelectedPair(updatedPair);

              console.log(
                `Set selected pair to ${updatedPair.symbol} on ${exchangeParam}`,
              );
            } else {
              console.warn(
                `Trading pair ${symbolParam} not found for exchange ${exchangeParam}`,
              );
            }
          }
        }
      } catch (error) {
        console.error(
          'Error initializing terminal from URL parameters:',
          error,
        );
      }
    };

    initializeFromUrl();
  }, [symbolParam, exchangeParam, setSelectedAccount]);

  // Refresh trigger for components that need to refresh when orders are placed
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handler for when a trading pair is selected
  const handlePairSelect = (pair: TradingPair) => {
    console.log(`Terminal: Selected pair changed to ${pair.symbol}`);
    setSelectedPair(pair);

    // Update URL to reflect the new pair
    if (pair.exchangeId) {
      navigate(`/terminal?symbol=${pair.symbol}&exchange=${pair.exchangeId}`, {
        replace: true,
      });
    }
  };

  // Handler for when an order is placed
  const handleOrderPlaced = () => {
    console.log('Terminal: Order placed, refreshing components...');

    // Increment the refresh trigger to cause a refresh of components that depend on it
    setRefreshTrigger((prev) => prev + 1);

    // Set up multiple refreshes with increasing delays to ensure orders are properly updated
    // This helps catch both immediate updates and delayed updates (like market order fills)
    const refreshDelays = [500, 1500, 2500, 5000]; // Multiple refresh points

    refreshDelays.forEach((delay) => {
      setTimeout(() => {
        console.log(`Terminal: Delayed refresh after ${delay}ms...`);
        setRefreshTrigger((prev) => prev + 1);
      }, delay);
    });
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
        <PriceProvider>
          {/* Main Layout */}
          <div className="flex h-screen overflow-hidden">
            {/* Left Section - Trading Sidebar and Main Content */}
            <div className="flex flex-col flex-1">
              <ResizableSplitter
                direction="horizontal"
                initialSizes={[70, 30]}
                minSizes={[30, 15]}
                className="h-full"
              >
                {/* Top Section - Trading Sidebar and Chart */}
                <div className="flex h-full">
                  <ErrorBoundary>
                    <div className="w-[280px] border-r border-gray-800 h-full">
                      <TradingSidebar
                        selectedPair={selectedPair}
                        onOrderPlaced={handleOrderPlaced}
                      />
                    </div>
                  </ErrorBoundary>

                  {/* Chart Section */}
                  <div className="flex-1 h-full">
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
                </div>

                {/* Bottom Section - Assets */}
                <ErrorBoundary>
                  <TerminalTabs
                    selectedPair={selectedPair}
                    refreshTrigger={refreshTrigger}
                  />
                </ErrorBoundary>
              </ResizableSplitter>
            </div>

            {/* Right Order Book - Fixed Width */}
            <ErrorBoundary>
              <div className="w-[242px] border-l border-gray-800">
                <OrderBook selectedPair={selectedPair} />
              </div>
            </ErrorBoundary>
          </div>
        </PriceProvider>
      </ErrorBoundary>
    </div>
  );
}
