import React, { useState, useEffect, Suspense } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PerformanceChart } from '@/components/PerformanceChart';
import { AllocationChart } from '@/components/AllocationChart';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { DashboardOrdersTable } from '@/components/dashboard/DashboardOrdersTable';
import { TransfersTable } from '@/components/dashboard/TransfersTable';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import {
  generatePerformanceData,
  generateAllocationData,
  PortfolioTableAsset,
} from '@/utils/portfolioDataUtils';
import { generatePriceChartData } from '@/lib/utils';
import { generate7DayChartData } from '@/utils/chartUtils';
import { DashboardAssetChart } from '@/components/DashboardAssetChart';
// Import the ExchangeAdapterExample component with React.lazy for code splitting
const ExchangeAdapterExample = React.lazy(
  () => import('@/components/examples/ExchangeAdapterExample'),
);

const mockPerformanceData = [
  { date: 'Mon', value: 40000 },
  { date: 'Tue', value: 41000 },
  { date: 'Wed', value: 42000 },
  { date: 'Thu', value: 41500 },
  { date: 'Fri', value: 43000 },
  { date: 'Sat', value: 42500 },
  { date: 'Sun', value: 44000 },
];

const mockAllocationData = [
  { name: 'Bitcoin', value: 60, color: '#f7931a' },
  { name: 'Ethereum', value: 25, color: '#627eea' },
  { name: 'Solana', value: 15, color: '#00ffb9' },
];

const mockAssets = [
  {
    icon: '/placeholder.svg',
    name: 'Bitcoin',
    symbol: 'BTC',
    amount: '0.8945 BTC',
    value: '$24,897.70',
    price: '$27,834.21',
    change: '-2.34%',
  },
  {
    icon: '/placeholder.svg',
    name: 'Ethereum',
    symbol: 'ETH',
    amount: '5.2341 ETH',
    value: '$9,644.32',
    price: '$1,842.56',
    change: '-3.12%',
  },
  {
    icon: '/placeholder.svg',
    name: 'Solana',
    symbol: 'SOL',
    amount: '58.4321 SOL',
    value: '$5,770.53',
    price: '$98.76',
    change: '+1.24%',
  },
];

const TABS = [
  { label: 'Balances', color: 'border-purple-500', icon: null },
  { label: 'Open Orders', color: '', icon: null },
  {
    label: 'Order History',
    color: '',
    icon: (
      <span className="ml-1 w-2 h-2 bg-purple-500 rounded-full inline-block" />
    ),
  },
  { label: 'Transfers', color: '', icon: null },
];

const TIME_RANGES = ['Day', 'Week', 'Month', 'Year', '5 Years'];

// Custom card background for TradingView style
const tradingViewBg = '#131722';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Balances');
  const [activeRange, setActiveRange] = useState('Week');
  const [hasError, setHasError] = useState(false);
  const { selectedAccount } = useSelectedAccount();

  // Generate dynamic chart data based on the selected account
  const [performanceData, setPerformanceData] = useState(mockPerformanceData);
  const [allocationData, setAllocationData] = useState(mockAllocationData);
  const [portfolioAssets, setPortfolioAssets] =
    useState<PortfolioTableAsset[]>(mockAssets);
  const [isPositive, setIsPositive] = useState(false); // Default to negative to match reference

  // Fetch portfolio data from the backend
  const {
    data: portfolioData,
    isLoading: isLoadingPortfolio,
    error: portfolioError,
  } = usePortfolioData(selectedAccount?.exchangeId, selectedAccount?.apiKeyId);

  // Update chart data when selected account or time range changes
  useEffect(() => {
    const updateData = async () => {
      if (selectedAccount) {
        console.log(
          'Updating chart data for account:',
          selectedAccount.name,
          'with time range:',
          activeRange,
          'Exchange ID:',
          selectedAccount.exchangeId,
          'API Key ID:',
          selectedAccount.apiKeyId,
        );

        try {
          // Generate new performance data based on the selected account and time range
          const newPerformanceData = generatePerformanceData(
            selectedAccount,
            activeRange,
          );

          // Only update if we got valid data
          if (newPerformanceData && newPerformanceData.length > 0) {
            setPerformanceData(newPerformanceData);
          } else {
            console.warn(
              'Using default performance data for account:',
              selectedAccount.name,
            );
          }

          // Generate new allocation data based on the portfolio data if available
          if (portfolioData && portfolioData.assets.length > 0) {
            // Convert portfolio assets to allocation data format
            const newAllocationData = portfolioData.assets.map(
              (asset, index) => {
                // Calculate percentage of total portfolio
                const percentage =
                  (asset.usdValue / portfolioData.totalUsdValue) * 100;
                // Format USD value for display
                const formattedValue = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(asset.usdValue);

                // Get a color based on the asset symbol
                const colors = [
                  '#8884d8',
                  '#82ca9d',
                  '#ffc658',
                  '#ff8042',
                  '#a4de6c',
                  '#d0ed57',
                ];
                const color = colors[index % colors.length];

                return {
                  name: asset.asset,
                  value: Math.round(percentage),
                  color: color,
                  usdValue: formattedValue,
                  price: (asset.usdValue / asset.total).toFixed(2),
                  amount: asset.total.toFixed(8),
                  symbol: asset.asset,
                  displayName: asset.asset,
                };
              },
            );

            // Sort by value (largest first)
            newAllocationData.sort((a, b) => b.value - a.value);

            // Add total portfolio value to the first item for display in the center
            if (newAllocationData.length > 0) {
              newAllocationData[0].totalPortfolioValue =
                portfolioData.totalUsdValue.toFixed(2);
            }

            setAllocationData(newAllocationData);
          } else {
            // Use generated allocation data as fallback
            const newAllocationData = generateAllocationData(selectedAccount);

            if (newAllocationData && newAllocationData.length > 0) {
              setAllocationData(newAllocationData);
            } else {
              console.warn(
                'Using default allocation data for account:',
                selectedAccount.name,
              );
            }
          }

          // Helper function to generate random change percentage based on symbol
          function getRandomChange(symbol: string): string {
            // Use the symbol to generate a consistent random value
            const hash = symbol
              .split('')
              .reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const random = Math.sin(hash) * 10;
            const change = random.toFixed(2);
            return parseFloat(change) >= 0 ? `+${change}%` : `${change}%`;
          }

          // Use portfolio data from the backend if available
          if (portfolioData && portfolioData.assets.length > 0) {
            // Convert portfolio assets to the format expected by the table
            const newPortfolioAssets: PortfolioTableAsset[] =
              portfolioData.assets.map((asset) => {
                // Generate a unique change value for each asset based on its symbol
                const changeValue = getRandomChange(asset.asset);
                // Determine if this asset has a positive change
                const assetIsPositive = !changeValue.includes('-');

                return {
                  name: asset.asset,
                  symbol: asset.asset,
                  amount: asset.total,
                  value: asset.usdValue,
                  price: asset.usdValue / asset.total,
                  change: changeValue, // Use unique change for each asset
                  chartData: generate7DayChartData(
                    asset.asset,
                    assetIsPositive,
                  ), // Match chart direction with change
                };
              });

            setPortfolioAssets(newPortfolioAssets);
          } else if (!isLoadingPortfolio) {
            console.warn(
              'Using default portfolio assets for account:',
              selectedAccount.name,
            );
          }

          // Determine if the change is positive based on the account's change value
          const accountIsPositive = !selectedAccount.change.includes('-');
          setIsPositive(accountIsPositive);
        } catch (error) {
          console.error('Error updating chart data:', error);
        }
      }
    };

    updateData();
  }, [selectedAccount, activeRange, portfolioData, isLoadingPortfolio]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Dashboard error:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // If there's an error, show a simple error message
  if (hasError) {
    return (
      <div className="container mx-auto p-4 theme-transition">
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-4">
            Dashboard Error
          </h2>
          <p className="text-gray-400 mb-6">
            There was a problem loading the dashboard components.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Reload Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 theme-transition">
      <div className="grid grid-cols-1 gap-4">
        {/* Portfolio Overview - DashboardHeader */}
        <ErrorBoundary
          fallback={
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-900 rounded-lg">
              <h3 className="text-xl font-medium text-red-500">
                Dashboard Header Error
              </h3>
              <p className="text-gray-400">
                There was an error loading the dashboard header.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                Reload
              </button>
            </div>
          }
        >
          <div className="mb-4">
            <DashboardHeader />
          </div>
        </ErrorBoundary>

        {/* Performance Chart and Allocation Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div
            className="lg:col-span-2 dashboard-card p-0 overflow-hidden"
            style={{ background: tradingViewBg, height: '300px' }}
          >
            <div className="flex items-center justify-between p-4 pb-0">
              <h2 className="text-lg font-semibold text-theme-primary">
                Performance
              </h2>
              <div className="flex gap-2">
                {TIME_RANGES.map((range) => (
                  <Button
                    key={range}
                    variant={activeRange === range ? 'default' : 'outline'}
                    className={`text-xs px-3 py-1 rounded-full ${activeRange === range ? 'bg-purple-600 text-gray-300' : 'bg-transparent text-gray-400 border-gray-700'}`}
                    onClick={() => setActiveRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
            <div className="h-[calc(100%-60px)] w-full relative">
              <ErrorBoundary
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400">
                      Unable to load performance chart
                    </p>
                  </div>
                }
              >
                <PerformanceChart
                  data={performanceData}
                  isPositive={isPositive}
                />
              </ErrorBoundary>
            </div>
          </div>
          <div
            className="dashboard-card p-0 flex flex-col items-center justify-center overflow-hidden"
            style={{ background: tradingViewBg, height: '300px' }}
          >
            <h2 className="text-lg font-semibold text-theme-primary mb-1 mt-2 text-center w-full">
              Current Allocations
            </h2>
            <div className="flex items-center justify-center w-full h-[calc(100%-40px)]">
              <ErrorBoundary
                fallback={
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-gray-400">
                      Unable to load allocation chart
                    </p>
                  </div>
                }
              >
                <div className="w-full h-full">
                  <AllocationChart data={allocationData} />
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </div>

        {/* Assets Table with Tabs */}
        <div
          className="dashboard-card p-5 mb-4"
          style={{ background: tradingViewBg }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary">
              Portfolio Overview
            </h2>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Search Assets"
                  className="search-input rounded-full bg-gray-900 border border-gray-700 text-gray-300 px-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  style={{ minWidth: 180 }}
                />
              </div>
              <Button className="bg-green-600 hover:bg-green-700 text-gray-300 px-4 py-2 rounded-lg text-xs">
                DEPOSIT
              </Button>
              <Button className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-xs">
                WITHDRAW
              </Button>
            </div>
          </div>
          {/* Tab Bar */}
          <div className="flex gap-4 mb-4 border-b border-gray-800">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                className={`pb-2 px-2 text-sm font-medium focus:outline-none border-b-2 transition-colors ${
                  activeTab === tab.label
                    ? `border-purple-500 text-gray-300`
                    : `border-transparent text-gray-400 hover:text-gray-300`
                }`}
                onClick={() => setActiveTab(tab.label)}
              >
                {tab.label}
                {tab.icon}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          <ErrorBoundary
            fallback={
              <div className="text-center py-8">
                <p className="text-red-500 mb-2">
                  Error loading portfolio data
                </p>
                <p className="text-gray-400">
                  There was a problem displaying your assets.
                </p>
              </div>
            }
          >
            {activeTab === 'Balances' && (
              <PortfolioTable
                assets={portfolioAssets}
                isLoading={isLoadingPortfolio}
                error={portfolioError}
              />
            )}
            {activeTab === 'Open Orders' && (
              <DashboardOrdersTable type="open" />
            )}
            {activeTab === 'Order History' && (
              <DashboardOrdersTable type="history" />
            )}
            {activeTab === 'Transfers' && <TransfersTable />}
          </ErrorBoundary>
        </div>

        {/* Exchange Adapter Example */}
        <div
          className="dashboard-card p-5 mb-4"
          style={{ background: tradingViewBg }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary">
              Exchange Integration Demo
            </h2>
            <div className="text-xs text-gray-400">Mock Data System Demo</div>
          </div>
          <Suspense
            fallback={
              <div className="p-4 bg-gray-800 rounded-lg text-center">
                <p className="text-gray-400">Loading exchange adapter...</p>
              </div>
            }
          >
            <ErrorBoundary>
              <ExchangeAdapterExample />
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
