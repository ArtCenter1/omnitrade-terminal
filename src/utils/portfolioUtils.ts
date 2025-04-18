// Utility functions for portfolio data

import { Portfolio, PortfolioAsset } from '@/types/exchange';
import { ExchangeAccount } from '@/mocks/mockExchangeAccounts';
import { getMockPortfolioData } from '@/mocks/mockPortfolio';

/**
 * Combines portfolio data from multiple accounts into a single portfolio
 * @param accounts Array of exchange accounts
 * @returns Combined portfolio data
 */
export function combinePortfolioData(accounts: ExchangeAccount[]): Portfolio {
  if (!accounts || accounts.length === 0) {
    return {
      totalUsdValue: 0,
      assets: [],
      lastUpdated: new Date(),
    };
  }

  // Get portfolio data for each account
  const portfolios = accounts
    .map((account) => {
      const portfolioData = getMockPortfolioData(account.apiKeyId);
      return portfolioData.data;
    })
    .filter(Boolean) as Portfolio[];

  // If no valid portfolios, return empty portfolio
  if (portfolios.length === 0) {
    return {
      totalUsdValue: 0,
      assets: [],
      lastUpdated: new Date(),
    };
  }

  // Combine the portfolios
  const combinedAssets: { [key: string]: PortfolioAsset } = {};
  let totalUsdValue = 0;
  let latestUpdate = new Date(0); // Start with oldest possible date

  // Process each portfolio
  portfolios.forEach((portfolio) => {
    // Update total value
    totalUsdValue += portfolio.totalUsdValue;

    // Track latest update time
    if (portfolio.lastUpdated > latestUpdate) {
      latestUpdate = portfolio.lastUpdated;
    }

    // Combine assets
    portfolio.assets.forEach((asset) => {
      const assetKey = asset.asset;

      if (combinedAssets[assetKey]) {
        // Asset already exists, add values
        combinedAssets[assetKey].free += asset.free;
        combinedAssets[assetKey].locked += asset.locked;
        combinedAssets[assetKey].total += asset.total;
        combinedAssets[assetKey].usdValue += asset.usdValue;
        // Keep track of exchanges where this asset is held
        if (!combinedAssets[assetKey].exchangeId.includes(asset.exchangeId)) {
          combinedAssets[assetKey].exchangeId += `, ${asset.exchangeId}`;
        }
      } else {
        // New asset, add to combined assets
        combinedAssets[assetKey] = { ...asset };
      }
    });
  });

  // Convert combined assets object to array and sort by USD value
  const sortedAssets = Object.values(combinedAssets).sort(
    (a, b) => b.usdValue - a.usdValue,
  );

  return {
    totalUsdValue,
    assets: sortedAssets,
    lastUpdated: latestUpdate,
  };
}

/**
 * Calculates the percentage change in portfolio value
 * @param currentValue Current portfolio value
 * @param previousValue Previous portfolio value
 * @returns Percentage change as a string with % sign
 */
export function calculatePercentageChange(
  currentValue: number,
  previousValue: number,
): string {
  if (previousValue === 0) return '0.00%';

  const change = ((currentValue - previousValue) / previousValue) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
}

/**
 * Formats a USD value as a string with $ sign and commas
 * @param value USD value to format
 * @returns Formatted string
 */
export function formatUsdValue(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
