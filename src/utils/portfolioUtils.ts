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
  const assetsByExchange: { [key: string]: PortfolioAsset } = {};
  let latestUpdate = new Date(0); // Start with oldest possible date

  // Log individual portfolio values for debugging
  console.log('Combining portfolios with the following values:');
  portfolios.forEach((portfolio, index) => {
    console.log(
      `Portfolio ${index + 1}: $${portfolio.totalUsdValue.toFixed(2)}`,
    );
  });

  // Process each portfolio
  portfolios.forEach((portfolio) => {
    // Track latest update time
    if (portfolio.lastUpdated > latestUpdate) {
      latestUpdate = portfolio.lastUpdated;
    }

    // Combine assets
    portfolio.assets.forEach((asset) => {
      // Use both asset symbol and exchange ID as the key to prevent combining assets across exchanges
      // This ensures each exchange's assets remain separate
      const assetKey = `${asset.asset}-${asset.exchangeId}`;

      // Store the asset by exchange for reference
      assetsByExchange[assetKey] = { ...asset };

      if (combinedAssets[assetKey]) {
        // Asset already exists, add values
        combinedAssets[assetKey].free += asset.free;
        combinedAssets[assetKey].locked += asset.locked;
        combinedAssets[assetKey].total += asset.total;
        combinedAssets[assetKey].usdValue += asset.usdValue;
      } else {
        // New asset, add to combined assets
        combinedAssets[assetKey] = { ...asset };

        // Add exchangeSources property for the trade function
        // This will be used by the Portfolio Total view
        if (!combinedAssets[assetKey].exchangeSources) {
          combinedAssets[assetKey].exchangeSources = [
            { exchangeId: asset.exchangeId, amount: asset.total },
          ];
        }
      }
    });
  });

  // Convert combined assets object to array and sort by USD value
  const sortedAssets = Object.values(combinedAssets).sort(
    (a, b) => b.usdValue - a.usdValue,
  );

  // Calculate total USD value from the combined assets
  const totalUsdValue = sortedAssets.reduce(
    (sum, asset) => sum + asset.usdValue,
    0,
  );

  console.log(`Combined portfolio total value: $${totalUsdValue.toFixed(2)}`);
  console.log(`Number of assets in combined portfolio: ${sortedAssets.length}`);

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
