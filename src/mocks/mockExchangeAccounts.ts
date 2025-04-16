// src/mocks/mockExchangeAccounts.ts
import { generateMockPortfolio } from './mockPortfolio';

export interface ExchangeAccount {
  id: string;
  name: string;
  exchange: string;
  exchangeId: string;
  value: string;
  change: string;
  logo: string;
  apiKeyId: string;
}

// Generate mock exchange accounts based on the API keys
export function generateMockExchangeAccounts(
  apiKeys: any[],
): ExchangeAccount[] {
  if (!apiKeys || apiKeys.length === 0) {
    return [];
  }

  // Map of exchange IDs to their logos
  const exchangeLogos: Record<string, string> = {
    binance: '/exchanges/binance.svg',
    coinbase: '/exchanges/coinbase.svg',
    kucoin: '/exchanges/kucoin.svg',
    kraken: '/exchanges/kraken.svg',
    bybit: '/exchanges/bybit.svg',
    okx: '/exchanges/okx.svg',
  };

  // Default logo if exchange not found
  const defaultLogo = '/placeholder.svg';

  return apiKeys.map((key, index) => {
    // Generate a portfolio for this API key to get the total value
    const portfolio = generateMockPortfolio(
      key.exchange_id,
      parseInt(key.api_key_id.replace(/[^0-9]/g, '')) || index,
    );

    // Format the portfolio value
    const value = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(portfolio.totalUsdValue);

    // Generate a random change percentage between -5% and +5%
    const changeValue = (Math.random() * 10 - 5).toFixed(2);
    const change = `${changeValue.startsWith('-') ? '' : '+'}${changeValue}%`;

    // Get the exchange logo or use default
    const logo = exchangeLogos[key.exchange_id.toLowerCase()] || defaultLogo;

    // Use the exact nickname provided by the user
    const name =
      key.key_nickname ||
      `${key.exchange_id.charAt(0).toUpperCase() + key.exchange_id.slice(1)} Account`;

    return {
      id: key.api_key_id,
      name,
      exchange:
        key.exchange_id.charAt(0).toUpperCase() + key.exchange_id.slice(1),
      exchangeId: key.exchange_id,
      value,
      change,
      logo,
      apiKeyId: key.api_key_id,
    };
  });
}

// Default mock accounts to use if no API keys are available
export const DEFAULT_MOCK_ACCOUNTS: ExchangeAccount[] = [
  {
    id: 'mock-key-1',
    name: 'Binance Account',
    exchange: 'Binance',
    exchangeId: 'binance',
    value: '$23,579.83',
    change: '-3.06%',
    logo: '/exchanges/binance.svg',
    apiKeyId: 'mock-key-1',
  },
  {
    id: 'mock-key-2',
    name: 'Coinbase Pro',
    exchange: 'Coinbase',
    exchangeId: 'coinbase',
    value: '$8,784.14',
    change: '+1.94%',
    logo: '/exchanges/coinbase.svg',
    apiKeyId: 'mock-key-2',
  },
];
