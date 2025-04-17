// Utility functions for generating portfolio data based on selected account

import {
  generateMockPortfolio,
  getMockPortfolioData,
} from '@/mocks/mockPortfolio';
import { ExchangeAccount } from '@/mocks/mockExchangeAccounts';

// Define the asset type for the portfolio table
export type PortfolioTableAsset = {
  icon: string;
  name: string;
  symbol: string;
  amount: string;
  value: string;
  price: string;
  change: string;
};

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

  // Extract a seed from the API key ID for consistent random values
  const seed = parseInt(selectedAccount.apiKeyId.replace(/[^0-9]/g, '')) || 0;
  console.log('Using seed for performance data:', seed);

  // Use the seed to generate consistent random values
  const generateSeededRandom = (day: number) => {
    const daySeed = (seed + day * 13) % 10000;
    return (daySeed / 10000) * 0.1; // 0-10% variation
  };

  try {
    // Define data points based on time range
    let dataPoints: { labels: string[]; volatility: number; trend: number };

    switch (timeRange) {
      case 'Day':
        // 24 hours of data with hourly points
        dataPoints = {
          labels: [
            '12am',
            '2am',
            '4am',
            '6am',
            '8am',
            '10am',
            '12pm',
            '2pm',
            '4pm',
            '6pm',
            '8pm',
            '10pm',
          ],
          volatility: 0.04, // 4% volatility for day view
          trend: isPositive ? 0.02 : -0.01, // 2% up or 1% down over the day
        };
        break;

      case 'Week':
        // 7 days of data
        dataPoints = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          volatility: 0.06, // 6% volatility for week view
          trend: isPositive ? 0.05 : -0.03, // 5% up or 3% down over the week
        };
        break;

      case 'Month':
        // 30 days of data (showing weekly points)
        dataPoints = {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          volatility: 0.08, // 8% volatility for month view
          trend: isPositive ? 0.08 : -0.05, // 8% up or 5% down over the month
        };
        break;

      case 'Year':
        // 12 months of data
        dataPoints = {
          labels: [
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
          ],
          volatility: 0.12, // 12% volatility for year view
          trend: isPositive ? 0.15 : -0.1, // 15% up or 10% down over the year
        };
        break;

      case '5 Years':
        // 5 years of data (showing yearly points)
        dataPoints = {
          labels: ['2019', '2020', '2021', '2022', '2023'],
          volatility: 0.18, // 18% volatility for 5-year view
          trend: isPositive ? 0.4 : -0.25, // 40% up or 25% down over 5 years
        };
        break;

      default:
        // Default to week view
        dataPoints = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          volatility: 0.06,
          trend: isPositive ? 0.05 : -0.03,
        };
    }

    // Create a more realistic price chart with random walks
    const startValue = baseValue * 0.95; // Start 5% below current value
    const endValue = baseValue * (1 + dataPoints.trend); // End with the trend percentage

    // Generate many more data points to match the reference image
    const numPoints = 300; // Use a very high number of points for detailed chart
    const priceData = [];

    // Use random walk algorithm with higher volatility for jagged appearance
    let currentValue = startValue;

    // Create an array of price points with high volatility
    const rawPricePoints = [];

    for (let i = 0; i < numPoints; i++) {
      // Random walk with increased volatility for jagged appearance
      const volatilityFactor = dataPoints.volatility * baseValue * 2.5; // Increase volatility by 150%
      const randomWalk = (Math.random() - 0.5) * volatilityFactor * 4; // More extreme moves

      // Add trend bias
      const trendBias = (dataPoints.trend / numPoints) * baseValue;

      // Update current value with random walk and trend
      currentValue += randomWalk + trendBias;

      // Add frequent larger moves (spikes and dips) to simulate market events
      if (Math.random() < 0.15) {
        // 15% chance of a larger move for more natural jaggedness
        const spikeDirection = Math.random() > 0.5 ? 1 : -1;
        const spikeMagnitude = volatilityFactor * 5 * Math.random(); // Up to 5x normal volatility
        currentValue += spikeDirection * spikeMagnitude;
      }

      // Ensure we don't go too low (no negative prices)
      currentValue = Math.max(currentValue, baseValue * 0.5);

      rawPricePoints.push(currentValue);
    }

    // Generate date labels for each data point to match reference image format
    const today = new Date();
    const startDate = new Date(today);

    // Set start date based on time range
    switch (timeRange) {
      case 'Day':
        startDate.setDate(today.getDate() - 1);
        break;
      case 'Week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'Month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'Year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case '5 Years':
        startDate.setFullYear(today.getFullYear() - 5);
        break;
      default:
        startDate.setDate(today.getDate() - 7); // Default to week
    }

    // Map all raw price points to the chart with proper dates
    for (let i = 0; i < rawPricePoints.length; i++) {
      // Calculate date for this point
      const pointDate = new Date(startDate);
      const timeIncrement =
        (today.getTime() - startDate.getTime()) / (rawPricePoints.length - 1);
      pointDate.setTime(startDate.getTime() + timeIncrement * i);

      // Format date as MM-DD YYYY to match reference image
      const month = String(pointDate.getMonth() + 1).padStart(2, '0');
      const day = String(pointDate.getDate()).padStart(2, '0');
      const year = pointDate.getFullYear();
      const formattedDate = `${month}-${day}\n${year}`;

      priceData.push({
        date: formattedDate,
        value: Math.round(rawPricePoints[i]),
      });
    }

    // Ensure the last point is close to our target end value
    if (priceData.length > 0) {
      priceData[priceData.length - 1].value = Math.round(endValue);
    }

    return priceData;
  } catch (error) {
    console.error('Error generating performance data:', error);

    // Fallback to simple data if there's an error
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      date: day,
      value: Math.round(baseValue * (0.95 + index * 0.01)),
    }));
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

  // Define colors for common assets
  const assetColors: Record<string, string> = {
    BTC: '#f7931a',
    ETH: '#627eea',
    SOL: '#00ffb9',
    AVAX: '#e84142',
    LINK: '#2a5ada',
    DOT: '#e6007a',
    ADA: '#0033ad',
    MATIC: '#8247e5',
    USDT: '#26a17b',
    USDC: '#2775ca',
    XMR: '#ff6600', // Monero orange
    DASH: '#008ce7', // Dash blue
    ZEC: '#ecb244', // Zcash yellow
    XTZ: '#2c7df7', // Tezos blue
    EOS: '#000000', // EOS black
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

// Generate portfolio table data based on the selected account
export function generatePortfolioTableData(
  selectedAccount: ExchangeAccount | null,
): PortfolioTableAsset[] {
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

  try {
    // Make sure we have assets to work with
    if (!portfolio.assets || portfolio.assets.length === 0) {
      console.warn(
        'No assets found in portfolio for account:',
        selectedAccount.name,
      );
      return [];
    }

    // Convert portfolio assets to table format
    const result = portfolio.assets.map((asset) => {
      // Calculate a random 24h change between -5% and +5%
      const randomChange = (Math.random() * 10 - 5).toFixed(2);
      const changePrefix = parseFloat(randomChange) >= 0 ? '+' : '';

      // Get the price from the asset data or calculate it
      const price = asset.price || asset.usdValue / asset.total || 0;

      // Format the asset data for the table
      return {
        icon: '/placeholder.svg', // Placeholder icon
        name: getDisplayName(asset.asset),
        symbol: asset.asset,
        amount: `${asset.total.toFixed(4)} ${asset.asset}`,
        value: `$${asset.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        price: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${changePrefix}${randomChange}%`,
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
