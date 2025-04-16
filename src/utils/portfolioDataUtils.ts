// Utility functions for generating portfolio data based on selected account

import {
  generateMockPortfolio,
  getMockPortfolioData,
} from '@/mocks/mockPortfolio';
import { ExchangeAccount } from '@/mocks/mockExchangeAccounts';

// Generate performance chart data based on the selected account
export function generatePerformanceData(
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

  // Use the portfolio's total value as a base for the performance chart
  const baseValue = portfolio.totalUsdValue;

  // Determine if the change is positive based on the account's change value
  const isPositive = !selectedAccount.change.includes('-');

  // Generate 7 days of data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Extract a seed from the API key ID for consistent random values
  const seed = parseInt(selectedAccount.apiKeyId.replace(/[^0-9]/g, '')) || 0;
  console.log('Using seed for performance data:', seed);

  // Use the seed to generate consistent random values
  const generateSeededRandom = (day: number) => {
    const daySeed = (seed + day * 13) % 10000;
    return (daySeed / 10000) * 0.1; // 0-10% variation
  };

  try {
    // Create a simple trend based on the portfolio value
    const startValue = baseValue * 0.95; // Start 5% below current value
    const endValue = isPositive ? baseValue * 1.05 : baseValue * 0.9; // End 5% above or 10% below

    return days.map((day, index) => {
      // Linear interpolation between start and end values
      const progress = index / (days.length - 1);
      const baseVal = startValue + (endValue - startValue) * progress;

      // Add a small random variation
      const variation = baseValue * 0.01; // 1% variation
      const randomOffset = Math.sin(seed + index) * variation;

      const value = baseVal + randomOffset;

      return {
        date: day,
        value: Math.round(value),
      };
    });
  } catch (error) {
    console.error('Error generating performance data:', error);

    // Fallback to simple data if there's an error
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
