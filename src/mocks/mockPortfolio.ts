// src/mocks/mockPortfolio.ts
import { Portfolio, PortfolioAsset } from '@/types/exchange';

// Generate a mock portfolio with realistic data
export function generateMockPortfolio(
  exchangeId: string = 'binance',
  seed?: number,
): Portfolio {
  // Use different portfolio compositions based on the exchange
  const isBinance = exchangeId.toLowerCase() === 'binance';
  const isCoinbase = exchangeId.toLowerCase() === 'coinbase';
  const assets: PortfolioAsset[] = [];
  let totalUsdValue = 0;

  // Common crypto assets with realistic price ranges
  const assetPrices: Record<string, number> = {
    BTC: 83055.34,
    ETH: 3534.64,
    SOL: 164.81,
    AVAX: 41.23,
    LINK: 18.75,
    DOT: 7.92,
    ADA: 0.59,
    MATIC: 0.89,
    USDT: 1.0,
    USDC: 1.0,
  };

  // Different portfolio compositions based on exchange
  if (isCoinbase) {
    // Coinbase portfolio - more BTC and ETH focused

    // Add stablecoins with larger balances
    assets.push({
      asset: 'USDC',
      free: 12750.45,
      locked: 0,
      total: 12750.45,
      usdValue: 12750.45,
      exchangeId,
    });
    totalUsdValue += 12750.45;

    // Add BTC with significant balance
    const btcAmount = 0.3843;
    const btcValue = btcAmount * assetPrices['BTC'];
    assets.push({
      asset: 'BTC',
      free: btcAmount,
      locked: 0,
      total: btcAmount,
      usdValue: btcValue,
      exchangeId,
    });
    totalUsdValue += btcValue;

    // Add ETH
    const ethAmount = 2.5532;
    const ethValue = ethAmount * assetPrices['ETH'];
    assets.push({
      asset: 'ETH',
      free: ethAmount,
      locked: 0,
      total: ethAmount,
      usdValue: ethValue,
      exchangeId,
    });
    totalUsdValue += ethValue;

    // Add LINK
    const linkAmount = 125.75;
    const linkValue = linkAmount * assetPrices['LINK'];
    assets.push({
      asset: 'LINK',
      free: linkAmount,
      locked: 0,
      total: linkAmount,
      usdValue: linkValue,
      exchangeId,
    });
    totalUsdValue += linkValue;
  } else {
    // Binance portfolio - more diversified

    // Add stablecoins with larger balances
    assets.push({
      asset: 'USDT',
      free: 15432.67,
      locked: 567.33,
      total: 16000.0,
      usdValue: 16000.0,
      exchangeId,
    });
    totalUsdValue += 16000.0;

    assets.push({
      asset: 'USDC',
      free: 8750.45,
      locked: 0,
      total: 8750.45,
      usdValue: 8750.45,
      exchangeId,
    });
    totalUsdValue += 8750.45;

    // Add BTC with significant balance
    const btcAmount = 0.2843;
    const btcValue = btcAmount * assetPrices['BTC'];
    assets.push({
      asset: 'BTC',
      free: btcAmount - 0.0143,
      locked: 0.0143,
      total: btcAmount,
      usdValue: btcValue,
      exchangeId,
    });
    totalUsdValue += btcValue;

    // Add ETH
    const ethAmount = 1.7532;
    const ethValue = ethAmount * assetPrices['ETH'];
    assets.push({
      asset: 'ETH',
      free: ethAmount,
      locked: 0,
      total: ethAmount,
      usdValue: ethValue,
      exchangeId,
    });
    totalUsdValue += ethValue;

    // Add SOL
    const solAmount = 25.4321;
    const solValue = solAmount * assetPrices['SOL'];
    assets.push({
      asset: 'SOL',
      free: solAmount - 5.4321,
      locked: 5.4321,
      total: solAmount,
      usdValue: solValue,
      exchangeId,
    });
    totalUsdValue += solValue;
  }

  // Add a few more assets with smaller balances
  const smallerAssets = isCoinbase
    ? ['AVAX', 'DOT', 'ADA']
    : ['AVAX', 'LINK', 'DOT', 'ADA', 'MATIC'];

  smallerAssets.forEach((asset) => {
    const amount = parseFloat((Math.random() * 50).toFixed(4));
    const value = amount * assetPrices[asset];
    assets.push({
      asset,
      free: amount,
      locked: 0,
      total: amount,
      usdValue: value,
      exchangeId,
    });
    totalUsdValue += value;
  });

  // Add stablecoin values to total
  totalUsdValue += 16000.0 + 8750.45;

  // Sort assets by USD value (descending)
  assets.sort((a, b) => b.usdValue - a.usdValue);

  return {
    totalUsdValue,
    assets,
    lastUpdated: new Date(),
  };
}

// Mock implementation of the usePortfolio hook result
export function getMockPortfolioData(apiKeyId?: string): {
  data: Portfolio | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  // If no API key is provided, return undefined data
  if (!apiKeyId) {
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    };
  }

  // Try to determine the exchange from the API key ID
  // In a real app, you'd look this up from the API key data
  let exchangeId = 'binance'; // Default

  try {
    // Try to get the exchange API keys from localStorage
    const savedKeys = localStorage.getItem('exchange_api_keys');
    if (savedKeys) {
      const apiKeys = JSON.parse(savedKeys);
      const apiKey = apiKeys.find((key: any) => key.api_key_id === apiKeyId);
      if (apiKey) {
        exchangeId = apiKey.exchange_id;
      }
    }
  } catch (error) {
    console.error('Error getting exchange ID from API key:', error);
  }

  // Generate a mock portfolio
  const portfolio = generateMockPortfolio(
    exchangeId,
    parseInt(apiKeyId.replace(/[^0-9]/g, '')) || undefined,
  );

  return {
    data: portfolio,
    isLoading: false,
    isError: false,
    error: null,
  };
}
