import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PerformanceChart } from '@/components/PerformanceChart';
import { AllocationChart } from '@/components/AllocationChart';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { DashboardOrdersTable } from '@/components/dashboard/DashboardOrdersTable';
import { TransfersTable } from '@/components/dashboard/TransfersTable';
import { Button } from '@/components/ui/button';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { clearDataCache, refreshPortfolioData } from '@/utils/clearCache';
import { useQueryClient } from '@tanstack/react-query';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import {
  generatePerformanceData,
  generateAllocationData,
  PortfolioTableAsset,
} from '@/utils/portfolioDataUtils';
import { combinePortfolioData } from '@/utils/portfolioUtils';
import {
  DEFAULT_MOCK_ACCOUNTS,
  ExchangeAccount,
} from '@/mocks/mockExchangeAccounts';
import { useQuery } from '@tanstack/react-query';
import { listExchangeApiKeys } from '@/services/exchangeApiKeyService';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';
import { generatePriceChartData } from '@/lib/utils';
import { generate7DayChartData } from '@/utils/chartUtils';
import { DashboardAssetChart } from '@/components/DashboardAssetChart';
// Exchange Adapter Example component removed

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

// Tab definitions - icons will be added dynamically based on state
const TABS = [
  { label: 'Balances', color: 'border-purple-500', icon: null },
  { label: 'Open Orders', color: '', icon: null },
  { label: 'Order History', color: '', icon: null },
  { label: 'Transfers', color: '', icon: null },
];

const TIME_RANGES = ['Day', 'Week', 'Month', 'Year', '5 Years'];

// Custom card background for TradingView style
const tradingViewBg = '#131722';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Balances');

  // One-time initialization to set the default to 'Day'
  useEffect(() => {
    // Check if we've already set our preference flag
    const hasSetDayDefault = localStorage.getItem('omnitrade_day_default_set');
    if (!hasSetDayDefault) {
      // Set the performance timeframe to 'Day' by default
      localStorage.setItem('omnitrade_performance_timeframe', 'Day');
      // Mark that we've set this default
      localStorage.setItem('omnitrade_day_default_set', 'true');
      console.log('Set default performance chart timeframe to Day');
    }
  }, []);

  // Get the saved timeframe from localStorage or default to 'Day'
  const [activeRange, setActiveRange] = useState(() => {
    const savedRange = localStorage.getItem('omnitrade_performance_timeframe');
    return savedRange && TIME_RANGES.includes(savedRange) ? savedRange : 'Day';
  });
  const [hasError, setHasError] = useState(false);
  const { selectedAccount } = useSelectedAccount();
  const [localAccounts, setLocalAccounts] = useState<ExchangeAccount[]>(
    DEFAULT_MOCK_ACCOUNTS,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasOpenOrders, setHasOpenOrders] = useState(false); // Indicator for existence of open orders

  // Generate dynamic chart data based on the selected account
  const [performanceData, setPerformanceData] = useState(mockPerformanceData);
  const [allocationData, setAllocationData] = useState(mockAllocationData);
  const [portfolioAssets, setPortfolioAssets] =
    useState<PortfolioTableAsset[]>(mockAssets);
  const [isPositive, setIsPositive] = useState(false); // Default to negative to match reference

  // Fetch the user's exchange API keys
  const { data: apiKeys } = useQuery({
    queryKey: ['exchangeApiKeys'],
    queryFn: listExchangeApiKeys,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        // Generate accounts based on API keys
        const accounts = data.map((key: any, index: number) => {
          // Generate a portfolio for this API key to get the total value
          const portfolio = getMockPortfolioData(key.api_key_id).data;

          // Format the portfolio value
          const value = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(portfolio.totalUsdValue);

          // Generate a random change percentage
          const changeValue = (Math.random() * 10 - 5).toFixed(2);
          const change = `${changeValue.startsWith('-') ? '' : '+'}${changeValue}%`;

          // Get the exchange logo
          const exchangeLogos: Record<string, string> = {
            binance: '/exchanges/binance.svg',
            coinbase: '/exchanges/coinbase.svg',
            kucoin: '/exchanges/kucoin.svg',
            kraken: '/exchanges/kraken.svg',
            bybit: '/exchanges/bybit.svg',
            okx: '/exchanges/okx.svg',
          };
          const logo =
            exchangeLogos[key.exchange_id.toLowerCase()] || '/placeholder.svg';

          return {
            id: key.api_key_id,
            name:
              key.key_nickname ||
              `${key.exchange_id.charAt(0).toUpperCase() + key.exchange_id.slice(1)} Account`,
            exchange:
              key.exchange_id.charAt(0).toUpperCase() +
              key.exchange_id.slice(1),
            exchangeId: key.exchange_id,
            value,
            change,
            logo,
            apiKeyId: key.api_key_id,
          };
        });

        setLocalAccounts(
          accounts.length > 0 ? accounts : DEFAULT_MOCK_ACCOUNTS,
        );
      }
    },
    onError: () => {
      // Fall back to default accounts
      setLocalAccounts(DEFAULT_MOCK_ACCOUNTS);
    },
  });

  // Log when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      console.log(
        'Selected account changed:',
        selectedAccount.name,
        'Exchange ID:',
        selectedAccount.exchangeId,
        'API Key ID:',
        selectedAccount.apiKeyId,
      );
    }
  }, [selectedAccount]);

  // Get portfolio data directly from the mock data service
  const [portfolioData, setPortfolioData] = useState<Portfolio | undefined>(
    undefined,
  );
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState<boolean>(false);
  const [portfolioError, setPortfolioError] = useState<Error | null>(null);

  // Update portfolio data when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      setIsLoadingPortfolio(true);
      try {
        // Get portfolio data directly from the mock data service
        const data = getMockPortfolioData(selectedAccount.apiKeyId).data;
        setPortfolioData(data);
        console.log(
          'Portfolio data loaded directly:',
          data?.assets.length,
          'assets,',
          'Total value:',
          data?.totalUsdValue.toFixed(2),
        );
      } catch (error) {
        console.error('Error loading portfolio data:', error);
        setPortfolioError(
          error instanceof Error ? error : new Error('Unknown error'),
        );
      } finally {
        setIsLoadingPortfolio(false);
      }
    }
  }, [selectedAccount]);

  // Track last check time to prevent too frequent checks
  const lastOpenOrdersCheckRef = useRef<number>(0);

  // Check for open orders periodically - optimized to reduce flickering
  useEffect(() => {
    // Function to check for open orders
    const checkForOpenOrders = async () => {
      try {
        // Skip if we've checked recently (within 3 seconds)
        const now = Date.now();
        if (now - lastOpenOrdersCheckRef.current < 3000) {
          return;
        }
        lastOpenOrdersCheckRef.current = now;

        if (!selectedAccount) {
          setHasOpenOrders(false);
          return;
        }

        // Get the exchange ID from the selected account
        const exchangeId =
          selectedAccount.exchangeId || selectedAccount.exchange || 'binance';

        // Get the orders from localStorage or API
        const storedOrders = localStorage.getItem('omnitrade_mock_orders');
        if (!storedOrders) {
          setHasOpenOrders(false);
          return;
        }

        const parsedOrders = JSON.parse(storedOrders);

        // Filter orders for the current exchange
        const filteredOrders = parsedOrders.filter(
          (order: any) =>
            order.exchangeId === exchangeId ||
            (exchangeId === 'binance' &&
              order.exchangeId === 'binance_testnet') ||
            (exchangeId === 'binance_testnet' &&
              order.exchangeId === 'binance'),
        );

        // Filter for open orders only (status 'new' or 'partially_filled')
        const hasOpen = filteredOrders.some(
          (order: any) =>
            order.status === 'new' || order.status === 'partially_filled',
        );

        // Update the indicator based on whether there are any open orders
        // Only update state if the value has changed to prevent unnecessary re-renders
        if (hasOpen !== hasOpenOrders) {
          setHasOpenOrders(hasOpen);
        }
      } catch (error) {
        console.error('Error checking for open orders:', error);
        setHasOpenOrders(false);
      }
    };

    // Check with a slight delay to avoid initial flickering
    const initialCheckTimeout = setTimeout(checkForOpenOrders, 500);

    // Set up interval to check periodically with reduced frequency
    const intervalId = setInterval(checkForOpenOrders, 15000); // Check every 15 seconds

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialCheckTimeout);
    };
  }, [selectedAccount, hasOpenOrders]);

  // Listen for the custom event from DashboardOrdersTable - optimized to reduce flickering
  useEffect(() => {
    // Debounced function to reduce state updates
    let updateTimeout: NodeJS.Timeout | null = null;

    const handleOrderCountChanged = (event: any) => {
      const { type, count } = event.detail;

      // Only update the indicator for Open Orders tab
      if (type === 'open') {
        // Clear any existing timeout
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        // Debounce the update to prevent rapid state changes
        updateTimeout = setTimeout(() => {
          // Only update if the value has changed to prevent unnecessary re-renders
          if (count > 0 !== hasOpenOrders) {
            // Update the indicator based on whether there are any open orders
            setHasOpenOrders(count > 0);
          }
        }, 300); // Debounce for 300ms
      }
    };

    // Add event listener
    window.addEventListener('orderCountChanged', handleOrderCountChanged);

    // Clean up
    return () => {
      window.removeEventListener('orderCountChanged', handleOrderCountChanged);
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [hasOpenOrders]);

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
          // Check if this is the Portfolio Overview option
          const isPortfolioOverview = selectedAccount.isPortfolioOverview;

          if (isPortfolioOverview) {
            // For Portfolio Overview, combine data from all accounts
            console.log(
              'Generating combined portfolio data for Portfolio Overview',
            );

            // Get all accounts - use all available accounts, not just the default ones
            // This ensures we include any accounts the user has added
            const allAccounts = localAccounts || DEFAULT_MOCK_ACCOUNTS;
            console.log(
              'Combining portfolio data from accounts:',
              allAccounts.length,
            );

            const combinedPortfolio = combinePortfolioData(allAccounts);

            // Generate performance data for the combined portfolio
            // Create a synthetic account object to pass to generatePerformanceData
            const syntheticAccount: ExchangeAccount = {
              id: 'portfolio-total',
              name: 'Portfolio Total',
              exchange: 'all',
              exchangeId: 'all',
              apiKeyId: 'portfolio-total',
              logo: '/placeholder.svg',
              value: `$${combinedPortfolio.totalUsdValue.toFixed(2)}`,
              change: selectedAccount.change, // Use the change from the Portfolio Total account
              isPortfolioOverview: true,
            };

            // Generate dynamic performance data using the same function as individual accounts
            const combinedPerformanceData = generatePerformanceData(
              syntheticAccount,
              activeRange,
            );

            // Only update if we got valid data
            if (combinedPerformanceData && combinedPerformanceData.length > 0) {
              setPerformanceData(combinedPerformanceData);
            } else {
              console.warn(
                'Falling back to default performance data for Portfolio Total',
              );
              // Use more dynamic fallback data
              const baseValue = combinedPortfolio.totalUsdValue;
              const fallbackData =
                TIME_RANGES[
                  TIME_RANGES.indexOf(activeRange) || 1
                ].toLowerCase() === 'day'
                  ? [
                      // Generate 24 hourly data points for the day view
                      ...Array.from({ length: 24 }, (_, i) => {
                        const hour = i;
                        // Use 24-hour format
                        // Add 15-minute intervals for more granular data
                        return [
                          {
                            date: `${hour.toString().padStart(2, '0')}:00`,
                            value: Math.round(
                              baseValue *
                                (0.97 + (i / 24) * 0.06 + Math.sin(i) * 0.015),
                            ),
                          },
                          {
                            date: `${hour.toString().padStart(2, '0')}:15`,
                            value: Math.round(
                              baseValue *
                                (0.97 +
                                  (i / 24) * 0.06 +
                                  Math.sin(i + 0.25) * 0.015),
                            ),
                          },
                          {
                            date: `${hour.toString().padStart(2, '0')}:30`,
                            value: Math.round(
                              baseValue *
                                (0.97 +
                                  (i / 24) * 0.06 +
                                  Math.sin(i + 0.5) * 0.015),
                            ),
                          },
                          {
                            date: `${hour.toString().padStart(2, '0')}:45`,
                            value: Math.round(
                              baseValue *
                                (0.97 +
                                  (i / 24) * 0.06 +
                                  Math.sin(i + 0.75) * 0.015),
                            ),
                          },
                        ];
                      }).flat(),
                    ]
                  : (() => {
                      // Generate more detailed data for a week (hourly intervals - 7 times more than day view)
                      const days = [
                        'Sun',
                        'Mon',
                        'Tue',
                        'Wed',
                        'Thu',
                        'Fri',
                        'Sat',
                      ];
                      const weekData = [];

                      // Generate 288 data points per day (every 5 minutes) for 7 days = 2016 data points
                      days.forEach((day, dayIndex) => {
                        // Generate a data point every 5 minutes (12 per hour × 24 hours = 288 per day)
                        for (let minute = 0; minute < 24 * 60; minute += 5) {
                          // Calculate hour and minute from the total minutes
                          const hour = Math.floor(minute / 60);
                          const min = minute % 60;

                          // Calculate a value that progresses through the week with more natural fluctuations
                          const progress =
                            (dayIndex * 1440 + minute) / (7 * 1440); // 1440 = minutes in a day

                          // Create a more dynamic trend with natural-looking fluctuations
                          // Use a non-linear function to create more interesting patterns
                          const trendValue =
                            0.95 + Math.pow(progress, 0.7) * 0.1;

                          // Add time-of-day pattern (higher during market hours, lower at night)
                          const timeOfDayFactor =
                            Math.sin(((hour - 9) * Math.PI) / 12) * 0.02;

                          // Add some randomness that's consistent within each day
                          const dailyRandomness =
                            Math.sin(dayIndex * 5 + minute / 240) * 0.025 +
                            Math.sin(dayIndex * 3 + minute / 120) * 0.015;

                          // Add smaller random fluctuations with more variation
                          const minuteIndex = dayIndex * 1440 + minute;
                          const hourlyRandomness =
                            Math.sin(minuteIndex * 0.01) * 0.01 +
                            Math.sin(minuteIndex * 0.02) * 0.008 +
                            Math.cos(minuteIndex * 0.03) * 0.005;

                          // Add occasional small jumps for realism
                          const jumpFactor =
                            Math.random() < 0.05
                              ? Math.random() * 0.03 - 0.015
                              : 0;

                          const value = Math.round(
                            baseValue *
                              (trendValue +
                                timeOfDayFactor +
                                dailyRandomness +
                                hourlyRandomness +
                                jumpFactor),
                          );

                          // For consistent labeling, mark the first point of each day (00:00) with just the day name
                          // This ensures the X-axis labels will show the day names at consistent positions
                          weekData.push({
                            date:
                              minute === 0
                                ? day
                                : `${day} ${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
                            value: value,
                          });
                        }
                      });

                      return weekData;
                    })();
              setPerformanceData(fallbackData);
            }

            // Generate allocation data from the combined portfolio
            if (combinedPortfolio && combinedPortfolio.assets.length > 0) {
              // Convert portfolio assets to allocation data format
              const newAllocationData = combinedPortfolio.assets.map(
                (asset, index) => {
                  // Calculate percentage of total portfolio with safety check
                  const totalValue = combinedPortfolio.totalUsdValue || 1; // Prevent division by zero
                  const percentage =
                    totalValue > 0 ? (asset.usdValue / totalValue) * 100 : 0;

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

                  // Ensure asset.total is not zero to prevent NaN in price calculation
                  const assetTotal = asset.total || 0.00001; // Small non-zero value to prevent division by zero
                  const assetPrice =
                    assetTotal > 0
                      ? (asset.usdValue / assetTotal).toFixed(2)
                      : '0.00';

                  return {
                    name: asset.asset,
                    value: Math.round(percentage) || 0, // Ensure value is a number, default to 0
                    color: color,
                    usdValue: formattedValue,
                    price: assetPrice,
                    amount: assetTotal.toFixed(8),
                    symbol: asset.asset,
                    displayName: asset.asset,
                    // Include exchange info for Portfolio Overview
                    exchangeInfo: asset.exchangeId,
                  };
                },
              );

              // Filter out any items with NaN or invalid values
              const validAllocationData = newAllocationData.filter(
                (item) =>
                  typeof item.value === 'number' &&
                  !isNaN(item.value) &&
                  isFinite(item.value),
              );

              // Sort by value (largest first)
              validAllocationData.sort((a, b) => b.value - a.value);

              // Add total portfolio value to the first item for display in the center
              if (validAllocationData.length > 0) {
                // Ensure the total value is valid
                const totalValue = combinedPortfolio.totalUsdValue;
                validAllocationData[0].totalPortfolioValue =
                  typeof totalValue === 'number' &&
                  !isNaN(totalValue) &&
                  isFinite(totalValue)
                    ? totalValue.toFixed(2)
                    : '0';
              }

              // Log the final allocation data for debugging
              console.log('Final allocation data:', validAllocationData);

              // Use the validated data instead of the original data
              setAllocationData(validAllocationData);

              // For Portfolio Total, we need to combine assets of the same type across exchanges
              // First, group assets by symbol (ignoring exchange)
              const assetsBySymbol: Record<string, PortfolioAsset[]> = {};

              combinedPortfolio.assets.forEach((asset) => {
                if (!assetsBySymbol[asset.asset]) {
                  assetsBySymbol[asset.asset] = [];
                }
                assetsBySymbol[asset.asset].push(asset);
              });

              // Then create combined assets
              const combinedAssets: PortfolioTableAsset[] = [];

              Object.entries(assetsBySymbol).forEach(([symbol, assets]) => {
                // If there's only one asset with this symbol, use it directly
                if (assets.length === 1) {
                  const asset = assets[0];
                  const changeValue = getRandomChange(asset.asset);
                  const assetIsPositive = !changeValue.includes('-');

                  combinedAssets.push({
                    name: asset.asset,
                    symbol: asset.asset,
                    amount: asset.total,
                    value: asset.usdValue,
                    price: asset.usdValue / asset.total,
                    change: changeValue,
                    chartData: generate7DayChartData(
                      asset.asset,
                      assetIsPositive,
                    ),
                    // Store the exchange sources for the trade function
                    exchangeSources: [
                      { exchangeId: asset.exchangeId, amount: asset.total },
                    ],
                  });
                } else {
                  // Combine multiple assets with the same symbol
                  const totalAmount = assets.reduce(
                    (sum, asset) => sum + asset.total,
                    0,
                  );
                  const totalValue = assets.reduce(
                    (sum, asset) => sum + asset.usdValue,
                    0,
                  );
                  const avgPrice = totalValue / totalAmount;
                  const changeValue = getRandomChange(symbol);
                  const assetIsPositive = !changeValue.includes('-');

                  // Create exchange sources for the trade function
                  const exchangeSources = assets.map((asset) => ({
                    exchangeId: asset.exchangeId,
                    amount: asset.total,
                  }));

                  combinedAssets.push({
                    name: symbol,
                    symbol: symbol,
                    amount: totalAmount,
                    value: totalValue,
                    price: avgPrice,
                    change: changeValue,
                    chartData: generate7DayChartData(symbol, assetIsPositive),
                    exchangeSources: exchangeSources,
                  });
                }
              });

              // Sort by value (largest first)
              combinedAssets.sort(
                (a, b) => (b.value as number) - (a.value as number),
              );

              const newPortfolioAssets = combinedAssets;

              setPortfolioAssets(newPortfolioAssets);
            }

            // Determine if the change is positive based on the Portfolio Total account's change value
            const totalIsPositive = !selectedAccount.change.includes('-');
            setIsPositive(totalIsPositive);
          } else {
            // Regular single account view
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
                  // Calculate percentage of total portfolio with safety check
                  const totalValue = portfolioData.totalUsdValue || 1; // Prevent division by zero
                  const percentage =
                    totalValue > 0 ? (asset.usdValue / totalValue) * 100 : 0;

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

                  // Ensure asset.total is not zero to prevent NaN in price calculation
                  const assetTotal = asset.total || 0.00001; // Small non-zero value to prevent division by zero
                  const assetPrice =
                    assetTotal > 0
                      ? (asset.usdValue / assetTotal).toFixed(2)
                      : '0.00';

                  return {
                    name: asset.asset,
                    value: Math.round(percentage) || 0, // Ensure value is a number, default to 0
                    color: color,
                    usdValue: formattedValue,
                    price: assetPrice,
                    amount: assetTotal.toFixed(8),
                    symbol: asset.asset,
                    displayName: asset.asset,
                  };
                },
              );

              // Filter out any items with NaN or invalid values
              const validAllocationData = newAllocationData.filter(
                (item) =>
                  typeof item.value === 'number' &&
                  !isNaN(item.value) &&
                  isFinite(item.value),
              );

              // Sort by value (largest first)
              validAllocationData.sort((a, b) => b.value - a.value);

              // Add total portfolio value to the first item for display in the center
              if (validAllocationData.length > 0) {
                // Ensure the total value is valid
                const totalValue = portfolioData.totalUsdValue;
                validAllocationData[0].totalPortfolioValue =
                  typeof totalValue === 'number' &&
                  !isNaN(totalValue) &&
                  isFinite(totalValue)
                    ? totalValue.toFixed(2)
                    : '0';
              }

              // Log the final allocation data for debugging
              console.log(
                'Final allocation data (regular account):',
                validAllocationData,
              );

              // Use the validated data
              setAllocationData(validAllocationData);
            } else {
              // Use generated allocation data as fallback
              const newAllocationData = generateAllocationData(selectedAccount);

              if (newAllocationData && newAllocationData.length > 0) {
                // Filter out any items with NaN or invalid values
                const validAllocationData = newAllocationData.filter(
                  (item) =>
                    typeof item.value === 'number' &&
                    !isNaN(item.value) &&
                    isFinite(item.value),
                );

                console.log('Fallback allocation data:', validAllocationData);

                // Use the validated data
                setAllocationData(validAllocationData);
              } else {
                console.warn(
                  'Using default allocation data for account:',
                  selectedAccount.name,
                );
                // Set a safe default if nothing else works
                setAllocationData([
                  { name: 'Default', value: 100, color: '#8884d8' },
                ]);
              }
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
          }
        } catch (error) {
          console.error('Error updating chart data:', error);
        }
      }
    };

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

    updateData();
  }, [
    selectedAccount,
    activeRange,
    portfolioData,
    isLoadingPortfolio,
    localAccounts,
  ]);

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
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-4">
          <div
            className="lg:col-span-6 dashboard-card p-0 overflow-hidden"
            style={{
              background: '#131722',
              height: '390px' /* 30% taller than original 300px */,
              border: '1px solid #2a2e39',
            }}
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
                    className={`text-xs px-3 py-1 rounded-sm ${activeRange === range ? 'bg-purple-600 text-gray-300' : 'bg-transparent text-gray-400 border-gray-700'}`}
                    onClick={() => {
                      setActiveRange(range);
                      // Save to localStorage
                      localStorage.setItem(
                        'omnitrade_performance_timeframe',
                        range,
                      );
                    }}
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
                {/* Log performance data for debugging */}
                {console.log(
                  'Rendering performance chart with data:',
                  performanceData,
                )}
                {performanceData && performanceData.length > 0 ? (
                  <PerformanceChart
                    data={performanceData}
                    isPositive={isPositive}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400">
                      No performance data available
                    </p>
                  </div>
                )}
              </ErrorBoundary>
            </div>
          </div>
          <div
            className="lg:col-span-4 dashboard-card p-0 flex flex-col items-center justify-center overflow-hidden"
            style={{
              background: '#131722',
              height: '390px' /* Match the performance chart height */,
              border: '1px solid #2a2e39',
            }}
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
                  {/* Debug allocation data */}
                  {console.log(
                    'Allocation data being passed to chart:',
                    JSON.stringify(allocationData),
                  )}
                  <AllocationChart
                    data={allocationData.map((item) => ({
                      ...item,
                      value:
                        typeof item.value === 'number' && !isNaN(item.value)
                          ? item.value
                          : 0,
                    }))}
                  />
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
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-theme-primary mr-2">
                Portfolio Overview
              </h2>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1"
                  onClick={() => {
                    setIsRefreshing(true);
                    refreshPortfolioData(queryClient);
                    // Set a timeout to reset the refreshing state
                    setTimeout(() => setIsRefreshing(false), 1000);
                  }}
                  title="Refresh portfolio data"
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 text-gray-400 hover:text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 ml-1"
                  onClick={() => clearDataCache()}
                  title="Full refresh (clears cache)"
                  disabled={isRefreshing}
                >
                  <span className="text-xs text-gray-400 hover:text-gray-300">
                    Full
                  </span>
                </Button>
              </div>
            </div>
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
                {/* Show purple dot indicator for Open Orders tab when there are open orders */}
                {tab.label === 'Open Orders' && hasOpenOrders && (
                  <span className="ml-1 w-2 h-2 bg-purple-500 rounded-full inline-block" />
                )}
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

        {/* Exchange Adapter Example removed */}
      </div>
    </div>
  );
};

export default Dashboard;
