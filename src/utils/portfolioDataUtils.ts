// Utility functions for generating portfolio data based on selected account

import {
  generateMockPortfolio,
  getMockPortfolioData,
} from '@/mocks/mockPortfolio';
import { ExchangeAccount } from '@/mocks/mockExchangeAccounts';

import { ExchangeSource } from '@/types/exchange';

// Define the asset type for the portfolio table
export type PortfolioTableAsset = {
  icon?: string;
  name: string;
  symbol: string;
  amount: string | number;
  value: string | number;
  price: string | number;
  change: string;
  chart?: Array<{ value: number }>;
  chartData?: Array<{ value: number }>;
  exchangeInfo?: string; // For individual exchange info
  exchangeSources?: ExchangeSource[]; // For Portfolio Total view to track assets across exchanges
};

// Import the MockDataService for kline generation
import { MockDataService } from '@/services/mockData/mockDataService';

// Create a singleton instance of MockDataService
const mockDataService = new MockDataService();

// Generate performance chart data based on the selected account and time range
export function generatePerformanceData(
  selectedAccount: ExchangeAccount | null,
  timeRange: string = 'Week',
) {
  if (!selectedAccount) {
    return [];
  }

  // Get the portfolio data for this account
  const portfolioData = getMockPortfolioData(selectedAccount.apiKeyId);
  const portfolio = portfolioData.data;

  if (!portfolio) {
    console.error(
      'Failed to get portfolio data for account:',
      selectedAccount.name,
    );
    return [];
  }

  // Use the portfolio's total value as a base for the performance chart
  const baseValue = portfolio.totalUsdValue;

  // Determine if the change is positive based on the account's change value
  const isPositive = !selectedAccount.change.includes('-');

  try {
    // Map time range to kline interval
    let interval: string;
    let limit: number;

    switch (timeRange) {
      case 'Day':
        interval = '15m'; // 15 minute intervals for day view
        limit = 96; // 96 15-minute intervals in a day
        break;
      case 'Week':
        interval = '1d'; // 1 day intervals for week view
        limit = 7; // 7 days in a week
        break;
      case 'Month':
        interval = '1d'; // 1 day intervals for month view
        limit = 30; // ~30 days in a month
        break;
      case 'Year':
        interval = '1w'; // 1 week intervals for year view
        limit = 52; // 52 weeks in a year
        break;
      case '5 Years':
        interval = '1w'; // 1 week intervals for 5-year view
        limit = 260; // 52 weeks * 5 years
        break;
      default:
        interval = '1d'; // Default to daily
        limit = 7; // Default to a week
    }

    console.log(
      `Generating performance data for ${timeRange} view with interval ${interval} and limit ${limit}`,
    );

    // Calculate end time (now) and start time based on the time range
    const endTime = Date.now();
    let startTime: number;

    switch (timeRange) {
      case 'Day':
        startTime = endTime - 24 * 60 * 60 * 1000; // 1 day ago
        break;
      case 'Week':
        startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago
        break;
      case 'Month':
        startTime = endTime - 30 * 24 * 60 * 60 * 1000; // 30 days ago
        break;
      case 'Year':
        startTime = endTime - 365 * 24 * 60 * 60 * 1000; // 365 days ago
        break;
      case '5 Years':
        startTime = endTime - 5 * 365 * 24 * 60 * 60 * 1000; // 5 years ago
        break;
      default:
        startTime = endTime - 7 * 24 * 60 * 60 * 1000; // Default to 7 days ago
    }

    // Use the exchange ID from the selected account
    const exchangeId = selectedAccount.exchangeId;

    // Create a synthetic symbol for the portfolio performance
    // This ensures we get consistent data for the same account
    const symbol = `PORTFOLIO/${selectedAccount.apiKeyId}`;

    // Generate klines using the MockDataService
    const klines = mockDataService.generateKlines(
      exchangeId,
      symbol,
      interval,
      startTime,
      endTime,
      limit,
    );

    // Convert klines to performance chart data format
    console.log(`Converting ${klines.length} klines to performance data`);

    const performanceData = klines.map((kline) => {
      // Format date based on the time range
      let formattedDate: string;
      const date = new Date(kline.timestamp);

      switch (timeRange) {
        case 'Day':
          // Format as hour:minute in 24-hour format (e.g., "15:30")
          const hour = date.getHours();
          const minute = date.getMinutes();

          // For cleaner display, only show minutes if not zero
          if (minute === 0) {
            formattedDate = `${hour.toString().padStart(2, '0')}:00`;
          } else {
            formattedDate = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          }
          break;
        case 'Week':
          // Format as day of week (e.g., "Mon")
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          formattedDate = days[date.getDay()];
          break;
        case 'Month':
          // Format as day of month with month (e.g., "15 Jan")
          const monthsShort = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          formattedDate = `${date.getDate()} ${monthsShort[date.getMonth()]}`;
          break;
        case 'Year':
          // Format as month (e.g., "Jan")
          const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          formattedDate = months[date.getMonth()];
          break;
        case '5 Years':
          // Format as year (e.g., "2023")
          formattedDate = date.getFullYear().toString();
          break;
        default:
          // Default format as MM-DD
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${month}-${day}`;
      }

      // Scale the close price to match the portfolio value
      // We use the close price from klines and scale it to the portfolio's base value
      const scaleFactor = baseValue / klines[0].close;
      const scaledValue = Math.round(kline.close * scaleFactor);

      return {
        date: formattedDate,
        value: scaledValue,
      };
    });

    // The data is already sorted by timestamp from the klines generation
    // No need to sort again, and we can't reliably parse the formatted dates back to timestamps

    console.log(`Generated ${performanceData.length} performance data points`);
    if (performanceData.length > 0) {
      console.log(`First data point: ${JSON.stringify(performanceData[0])}`);
      console.log(
        `Last data point: ${JSON.stringify(performanceData[performanceData.length - 1])}`,
      );
    }

    return performanceData;
  } catch (error) {
    console.error('Error generating performance data:', error);

    // Fallback to simple data if there's an error
    console.log('Using fallback performance data generation');

    // Create more realistic fallback data based on the time range
    let fallbackData = [];

    switch (timeRange) {
      case 'Day':
        // Generate hourly data for a day
        fallbackData = Array.from({ length: 24 }, (_, i) => {
          const hour = i;
          // Use 24-hour format
          return {
            date: `${hour.toString().padStart(2, '0')}:00`,
            value: Math.round(
              baseValue * (0.97 + (i / 24) * 0.06 + Math.sin(i) * 0.015),
            ),
          };
        });
        break;
      case 'Week':
        // Generate more detailed data for a week (hourly intervals - 7 times more than day view)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        fallbackData = [];

        // Generate 288 data points per day (every 5 minutes) for 7 days = 2016 data points
        days.forEach((day, dayIndex) => {
          // Generate a data point every 5 minutes (12 per hour × 24 hours = 288 per day)
          for (let minute = 0; minute < 24 * 60; minute += 5) {
            // Calculate hour and minute from the total minutes
            const hour = Math.floor(minute / 60);
            const min = minute % 60;

            // Calculate a value that progresses through the week with extreme randomness
            const progress = (dayIndex * 1440 + minute) / (7 * 1440); // 1440 = minutes in a day
            const randomFactor = Math.sin(dayIndex * 3 + minute / 120) * 0.08;
            const volatility = Math.random() * 0.05 - 0.025; // Highly increased random fluctuations
            // Add frequent larger jumps for extreme jaggedness
            const jumpFactor =
              Math.random() < 0.15 ? Math.random() * 0.06 - 0.03 : 0;
            const value = Math.round(
              baseValue *
                (0.95 +
                  progress * 0.07 +
                  randomFactor +
                  volatility +
                  jumpFactor),
            );

            // For consistent labeling, mark the first point of each day (00:00) with just the day name
            // This ensures the X-axis labels will show the day names at consistent positions
            fallbackData.push({
              date:
                minute === 0
                  ? day
                  : `${day} ${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
              value: value,
            });
          }
        });
        break;
      case 'Month':
        // Generate data for a month
        fallbackData = Array.from({ length: 30 }, (_, i) => ({
          date: `${i + 1}`,
          value: Math.round(
            baseValue * (0.93 + (i / 30) * 0.1 + Math.sin(i / 3) * 0.03),
          ),
        }));
        break;
      case 'Year':
        // Generate monthly data for a year
        const months = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        fallbackData = months.map((month, index) => ({
          date: month,
          value: Math.round(
            baseValue * (0.9 + (index / 12) * 0.2 + Math.sin(index) * 0.05),
          ),
        }));
        break;
      case '5 Years':
        // Generate yearly data for 5 years
        const currentYear = new Date().getFullYear();
        fallbackData = Array.from({ length: 5 }, (_, i) => ({
          date: `${currentYear - 4 + i}`,
          value: Math.round(
            baseValue * (0.7 + (i / 5) * 0.6 + Math.random() * 0.1),
          ),
        }));
        break;
      default:
        // Default to weekly data
        fallbackData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
          (day, index) => ({
            date: day,
            value: Math.round(baseValue * (0.95 + index * 0.01)),
          }),
        );
    }

    console.log(`Generated ${fallbackData.length} fallback data points`);
    if (fallbackData.length > 0) {
      console.log(
        `First fallback data point: ${JSON.stringify(fallbackData[0])}`,
      );
      console.log(
        `Last fallback data point: ${JSON.stringify(fallbackData[fallbackData.length - 1])}`,
      );
    }

    return fallbackData;
  }
}

// Generate allocation chart data based on the selected account
export function generateAllocationData(
  selectedAccount: ExchangeAccount | null,
) {
  if (!selectedAccount) {
    return [];
  }

  // Get the portfolio data for this account
  const portfolioData = getMockPortfolioData(selectedAccount.apiKeyId);
  const portfolio = portfolioData.data;

  if (!portfolio) {
    console.error(
      'Failed to get portfolio data for account:',
      selectedAccount.name,
    );
    return [];
  }

  // Define colors for common assets to match reference image
  const assetColors: Record<string, string> = {
    BTC: '#ff9900', // Orange for Bitcoin
    ETH: '#627eea', // Blue for Ethereum
    SOL: '#00ffb9', // Teal for Solana
    AVAX: '#e84142', // Red for Avalanche
    LINK: '#2a5ada', // Blue for Chainlink
    DOT: '#e6007a', // Pink for Polkadot
    ADA: '#0033ad', // Blue for Cardano
    MATIC: '#8247e5', // Purple for Polygon
    USDT: '#26a17b', // Green for Tether
    USDC: '#2775ca', // Blue for USD Coin
    XMR: '#ff6600', // Orange for Monero
    DASH: '#008ce7', // Blue for Dash
    ZEC: '#ecb244', // Yellow for Zcash
    XTZ: '#2c7df7', // Blue for Tezos
    EOS: '#000000', // Black for EOS
  };

  try {
    // Make sure we have assets to work with
    if (!portfolio.assets || portfolio.assets.length === 0) {
      console.warn(
        'No assets found in portfolio for account:',
        selectedAccount.name,
      );
      return [];
    }

    // Get the top assets by USD value
    const topAssets = [...portfolio.assets]
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, 5);

    // Calculate the total value of these top assets
    const topAssetsTotal = topAssets.reduce(
      (sum, asset) => sum + asset.usdValue,
      0,
    );

    // Make sure we have a non-zero total
    if (topAssetsTotal <= 0) {
      console.warn(
        'Total asset value is zero for account:',
        selectedAccount.name,
      );
      return [];
    }

    // Convert to allocation data format
    const result = topAssets.map((asset) => {
      // Calculate the percentage of this asset in the portfolio
      const percentage = (asset.usdValue / topAssetsTotal) * 100;

      // Get the price from the asset data or use a default
      const price = asset.price || asset.usdValue / asset.total || 0;

      // Format the USD value with 2 decimal places
      const formattedValue = asset.usdValue.toFixed(2);

      return {
        name: asset.asset,
        value: Math.round(percentage),
        color: assetColors[asset.asset] || '#888888', // Use default color if not found
        // Additional data for the tooltip
        usdValue: formattedValue,
        price: price.toFixed(2),
        amount: asset.total.toFixed(8),
        symbol: asset.asset, // The ticker symbol
        displayName: getDisplayName(asset.asset), // Get a more readable name
      };
    });

    // Add total portfolio value to the result for display in the center
    if (result.length > 0) {
      // Add a property to the first item that will be accessible in the chart component
      result[0].totalPortfolioValue = portfolio.totalUsdValue.toFixed(2);
      console.log(
        'Added total portfolio value:',
        portfolio.totalUsdValue.toFixed(2),
      );
    }

    // Helper function to get a more readable display name
    function getDisplayName(symbol: string): string {
      const displayNames: Record<string, string> = {
        BTC: 'Bitcoin',
        ETH: 'Ethereum',
        SOL: 'Solana',
        AVAX: 'Avalanche',
        LINK: 'Chainlink',
        DOT: 'Polkadot',
        ADA: 'Cardano',
        MATIC: 'Polygon',
        USDT: 'Tether',
        USDC: 'USD Coin',
        XMR: 'Monero',
        DASH: 'Dash',
        ZEC: 'Zcash',
        XTZ: 'Tezos',
        EOS: 'EOS',
      };
      return displayNames[symbol] || symbol;
    }

    console.log(
      `Generated allocation data for ${selectedAccount.name}:`,
      JSON.stringify(result),
    );
    return result;
  } catch (error) {
    console.error('Error generating allocation data:', error);

    // Return empty array as fallback
    return [];
  }
}

// Import the CoinGecko service
import { getCoinsBySymbols, getTopCoins } from '@/services/coinGeckoService';

// Generate chart data for an asset
function generateAssetChartData(isPositive: boolean): Array<{ value: number }> {
  const trend = isPositive ? 1 : -1;
  const volatility = 1.2; // Increased volatility
  const startValue = 10;
  const numPoints = 50; // More data points for jagged appearance

  // Use random walk algorithm with higher volatility for jagged appearance
  let currentValue = startValue;
  const data = [];

  for (let i = 0; i < numPoints; i++) {
    // Random walk with increased volatility
    const volatilityFactor = volatility * (Math.random() * 0.5 + 0.75); // Variable volatility
    const randomWalk = (Math.random() - 0.5) * volatilityFactor * 2;

    // Add trend bias
    const trendBias = (trend / numPoints) * 5;

    // Update current value with random walk and trend
    currentValue += randomWalk + trendBias;

    // Add occasional larger moves (spikes and dips)
    if (Math.random() < 0.15) {
      const spikeDirection = Math.random() > 0.5 ? 1 : -1;
      const spikeMagnitude = volatilityFactor * 3 * Math.random();
      currentValue += spikeDirection * spikeMagnitude;
    }

    // Ensure we don't go too low
    currentValue = Math.max(currentValue, startValue * 0.5);

    data.push({
      value: currentValue,
    });
  }

  return data;
}

// Generate portfolio table data based on the selected account
export async function generatePortfolioTableData(
  selectedAccount: ExchangeAccount | null,
): Promise<PortfolioTableAsset[]> {
  if (!selectedAccount) {
    return [];
  }

  // Get the portfolio data for this account
  console.log(
    'Generating portfolio data for account:',
    selectedAccount.name,
    'with API key ID:',
    selectedAccount.apiKeyId,
  );
  const portfolioData = getMockPortfolioData(selectedAccount.apiKeyId);
  const portfolio = portfolioData.data;

  if (!portfolio) {
    console.error(
      'Failed to get portfolio data for account:',
      selectedAccount.name,
    );
    return [];
  }

  console.log('Portfolio data for', selectedAccount.name, ':', portfolio);

  try {
    // Make sure we have assets to work with
    if (!portfolio.assets || portfolio.assets.length === 0) {
      console.warn(
        'No assets found in portfolio for account:',
        selectedAccount.name,
      );
      return [];
    }

    // Fetch top coins from CoinGecko to get icons and price data
    const topCoins = await getTopCoins(100);

    // Create a map of symbol to coin data for quick lookup
    const coinMap: Record<string, any> = {};
    topCoins.forEach((coin) => {
      coinMap[coin.symbol.toUpperCase()] = coin;
    });

    console.log(
      'Using account:',
      selectedAccount.name,
      'with exchange:',
      selectedAccount.exchangeId,
    );

    // Log the portfolio assets for debugging
    console.log(
      'Portfolio assets for',
      selectedAccount.name,
      ':',
      portfolio.assets.map((a) => a.asset).join(', '),
    );

    // Convert portfolio assets to table format
    const result = portfolio.assets.map((asset) => {
      // Look up the coin data from CoinGecko
      const coin = coinMap[asset.asset];

      // Use CoinGecko data if available, otherwise use fallbacks
      let changeValue, changePrefix, iconUrl;

      if (coin) {
        // Use real price change data from CoinGecko
        changeValue = coin.price_change_percentage_24h.toFixed(2);
        changePrefix = coin.price_change_percentage_24h >= 0 ? '+' : '';
        iconUrl = coin.image;
      } else {
        // Fallback to random change if coin not found
        changeValue = (Math.random() * 10 - 5).toFixed(2);
        changePrefix = parseFloat(changeValue) >= 0 ? '+' : '';
        iconUrl = `/crypto-icons/${asset.asset.toLowerCase()}.svg`;
      }

      // Get the price from the asset data or calculate it
      const price = asset.price || asset.usdValue / asset.total || 0;

      // Generate chart data for this asset
      const isPositive = parseFloat(changeValue) >= 0;
      const chartData = generateAssetChartData(isPositive);

      // Format the asset data for the table
      return {
        icon: iconUrl || '/placeholder.svg', // Use CoinGecko icon or fallback
        name: coin?.name || getDisplayName(asset.asset), // Use CoinGecko name if available
        symbol: asset.asset,
        amount: `${asset.total.toFixed(4)} ${asset.asset}`,
        value: `$${asset.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        price: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${changePrefix}${changeValue}%`,
        chart: chartData,
      };
    });

    // Sort by USD value (descending)
    result.sort((a, b) => {
      const valueA = parseFloat(a.value.replace(/[^0-9.-]+/g, ''));
      const valueB = parseFloat(b.value.replace(/[^0-9.-]+/g, ''));
      return valueB - valueA;
    });

    console.log(
      `Generated portfolio table data for ${selectedAccount.name}:`,
      result.length,
      'assets',
    );
    return result;
  } catch (error) {
    console.error('Error generating portfolio table data:', error);
    return [];
  }

  // Helper function to get a more readable display name
  function getDisplayName(symbol: string): string {
    const displayNames: Record<string, string> = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      AVAX: 'Avalanche',
      LINK: 'Chainlink',
      DOT: 'Polkadot',
      ADA: 'Cardano',
      MATIC: 'Polygon',
      USDT: 'Tether',
      USDC: 'USD Coin',
      XMR: 'Monero',
      DASH: 'Dash',
      ZEC: 'Zcash',
      XTZ: 'Tezos',
      EOS: 'EOS',
    };
    return displayNames[symbol] || symbol;
  }
}
