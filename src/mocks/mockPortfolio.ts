// src/mocks/mockPortfolio.ts
import { Portfolio, PortfolioAsset } from '@/types/exchange';

// Generate a mock portfolio with realistic data
export function generateMockPortfolio(
  exchangeId: string = 'binance',
  seed?: number,
): Portfolio {
  // Use different portfolio compositions based on the exchange
  const exchangeType = exchangeId.toLowerCase();
  const isBinance = exchangeType === 'binance';
  const isCoinbase = exchangeType === 'coinbase';
  const isKraken = exchangeType === 'kraken';

  console.log(`Creating portfolio for exchange type: ${exchangeType}`);
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
    XMR: 160.25, // Monero
    DASH: 28.45, // Dash
    ZEC: 35.67, // Zcash
    XTZ: 0.78, // Tezos
    EOS: 0.64, // EOS
  };

  // Different portfolio compositions based on exchange
  if (isKraken) {
    // Kraken portfolio - more focused on privacy coins and staking assets

    // Add stablecoins with larger balances
    assets.push({
      asset: 'USDT',
      free: 9876.54,
      locked: 123.46,
      total: 10000.0,
      usdValue: 10000.0,
      exchangeId,
    });
    totalUsdValue += 10000.0;

    // Add BTC with significant balance
    const btcAmount = 0.4231;
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
    const ethAmount = 3.1415;
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

    // Add DOT (Polkadot) - popular on Kraken for staking
    const dotAmount = 350.75;
    const dotValue = dotAmount * assetPrices['DOT'];
    assets.push({
      asset: 'DOT',
      free: dotAmount - 100,
      locked: 100, // Some DOT is staked
      total: dotAmount,
      usdValue: dotValue,
      exchangeId,
    });
    totalUsdValue += dotValue;

    // Add privacy coins (Monero) - Kraken is known for privacy coins
    assets.push({
      asset: 'XMR',
      free: 15.5,
      locked: 0,
      total: 15.5,
      usdValue: 15.5 * 160.25, // Monero price
      exchangeId,
    });
    totalUsdValue += 15.5 * 160.25;
  } else if (isCoinbase) {
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

  // Add a few more assets with smaller balances based on the exchange
  let smallerAssets: string[] = [];

  if (isKraken) {
    smallerAssets = ['DASH', 'ZEC', 'EOS', 'XTZ', 'ADA'];
  } else if (isCoinbase) {
    smallerAssets = ['AVAX', 'DOT', 'ADA'];
  } else {
    // Binance and others
    smallerAssets = ['AVAX', 'LINK', 'DOT', 'ADA', 'MATIC'];
  }

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

  // We've already added the stablecoin values to the total, so no need to add them again
  // totalUsdValue += 16000.0 + 8750.45;

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
    console.warn('No API key provided to getMockPortfolioData');
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    };
  }

  console.log('Getting mock portfolio data for API key ID:', apiKeyId);

  // Try to determine the exchange from the API key ID
  // In a real app, you'd look this up from the API key data
  let exchangeId = 'binance'; // Default

  try {
    // First try to get the exchange API keys from the mock data in handlers.ts
    // This is stored in memory and is the most up-to-date
    const mockApiKeys = [
      {
        api_key_id: 'mock-key-1',
        exchange_id: 'kraken',
        key_nickname: 'kraken',
      },
      {
        api_key_id: 'mock-key-2',
        exchange_id: 'binance',
        key_nickname: 'binance artcenter1',
      },
      {
        api_key_id: 'mock-key-3',
        exchange_id: 'coinbase',
        key_nickname: 'Coinbase 123',
      },
    ];

    const mockApiKey = mockApiKeys.find((key) => key.api_key_id === apiKeyId);
    if (mockApiKey) {
      exchangeId = mockApiKey.exchange_id;
      console.log(
        `Found exchange ID ${exchangeId} for API key ${apiKeyId} in mock data`,
      );
    } else {
      // If not found in mock data, try localStorage as a fallback
      const savedKeys = localStorage.getItem('exchange_api_keys');
      if (savedKeys) {
        const apiKeys = JSON.parse(savedKeys);
        const apiKey = apiKeys.find((key: any) => key.api_key_id === apiKeyId);
        if (apiKey) {
          exchangeId = apiKey.exchange_id;
          console.log(
            `Found exchange ID ${exchangeId} for API key ${apiKeyId} in localStorage`,
          );
        }
      }
    }
  } catch (error) {
    console.error('Error getting exchange ID from API key:', error);
  }

  console.log(
    `Generating portfolio for exchange: ${exchangeId} with API key: ${apiKeyId}`,
  );

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
