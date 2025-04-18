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
  isPortfolioOverview?: boolean; // Flag to identify the Portfolio Overview option
}

// Generate mock exchange accounts based on the API keys
export function generateMockExchangeAccounts(
  apiKeys: any[],
): ExchangeAccount[] {
  console.log(
    'Generating mock exchange accounts from API keys:',
    JSON.stringify(apiKeys),
  );

  if (!apiKeys || apiKeys.length === 0) {
    console.log('No API keys provided, returning empty array');
    return [];
  }

  // Try to get the latest API keys from localStorage
  let latestApiKeys = [...apiKeys];
  try {
    const savedKeys = localStorage.getItem('exchange_api_keys');
    if (savedKeys) {
      const parsedKeys = JSON.parse(savedKeys);
      if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
        console.log('Using API keys from localStorage for account generation');
        // Update the nicknames in our apiKeys array
        latestApiKeys = apiKeys.map((key) => {
          const savedKey = parsedKeys.find(
            (k) => k.api_key_id === key.api_key_id,
          );
          if (savedKey && savedKey.key_nickname) {
            console.log(
              `Using saved nickname for ${key.api_key_id}: ${savedKey.key_nickname}`,
            );
            return { ...key, key_nickname: savedKey.key_nickname };
          }
          return key;
        });
      }
    }
  } catch (error) {
    console.error('Error loading API keys from localStorage:', error);
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

  return latestApiKeys.map((key, index) => {
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
    // Make sure to properly format the name
    const name = key.key_nickname
      ? key.key_nickname // Use the exact nickname if provided
      : `${key.exchange_id.charAt(0).toUpperCase() + key.exchange_id.slice(1)} Account`;

    console.log('Creating account with name:', name, 'from key:', key);

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
    name: 'Kraken Main', // Match the exact label from the account list
    exchange: 'Kraken',
    exchangeId: 'kraken',
    value: '$23,579.83',
    change: '-3.06%',
    logo: '/exchanges/kraken.svg',
    apiKeyId: 'mock-key-1',
  },
  {
    id: 'mock-key-2',
    name: 'Binance Artcenter1', // Match the exact label from the account list
    exchange: 'Binance',
    exchangeId: 'binance',
    value: '$8,784.14',
    change: '+1.94%',
    logo: '/exchanges/binance.svg',
    apiKeyId: 'mock-key-2',
  },
  {
    id: 'mock-key-3',
    name: 'Coinbase Pro', // Match the exact label from the account list
    exchange: 'Coinbase',
    exchangeId: 'coinbase',
    value: '$12,345.67',
    change: '+2.15%',
    logo: '/exchanges/coinbase.svg',
    apiKeyId: 'mock-key-3',
  },
];

// Additional accounts for the same exchanges to demonstrate account switching
// This is a function to ensure we always get the latest DEFAULT_MOCK_ACCOUNTS
export function getExchangeAccounts(): ExchangeAccount[] {
  // Always update from localStorage first to ensure we have the latest data
  updateDefaultMockAccounts();

  return [
    ...DEFAULT_MOCK_ACCOUNTS,
    {
      id: 'mock-key-4',
      name: 'Kraken Trading', // Second Kraken account
      exchange: 'Kraken',
      exchangeId: 'kraken',
      value: '$5,432.10',
      change: '+1.23%',
      logo: '/exchanges/kraken.svg',
      apiKeyId: 'mock-key-4',
    },
    {
      id: 'mock-key-5',
      name: 'Binance Spot', // Second Binance account
      exchange: 'Binance',
      exchangeId: 'binance',
      value: '$3,456.78',
      change: '-0.45%',
      logo: '/exchanges/binance.svg',
      apiKeyId: 'mock-key-5',
    },
    {
      id: 'mock-key-6',
      name: 'Coinbase Personal', // Second Coinbase account
      exchange: 'Coinbase',
      exchangeId: 'coinbase',
      value: '$7,890.12',
      change: '+3.21%',
      logo: '/exchanges/coinbase.svg',
      apiKeyId: 'mock-key-6',
    },
  ];
}

// Function to update the default mock accounts with the latest nicknames
export function updateDefaultMockAccounts() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return; // Skip if not in browser
  }

  try {
    const savedKeys = localStorage.getItem('exchange_api_keys');
    if (savedKeys) {
      const parsedKeys = JSON.parse(savedKeys);
      if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
        // Update the DEFAULT_MOCK_ACCOUNTS with the latest nicknames
        DEFAULT_MOCK_ACCOUNTS.forEach((account) => {
          const savedKey = parsedKeys.find(
            (k) => k.api_key_id === account.apiKeyId,
          );
          if (savedKey && savedKey.key_nickname) {
            console.log(
              `Updating DEFAULT_MOCK_ACCOUNTS nickname for ${account.apiKeyId}: ${savedKey.key_nickname}`,
            );
            account.name = savedKey.key_nickname;
          }
        });
      }
    }
  } catch (error) {
    console.error('Error updating DEFAULT_MOCK_ACCOUNTS:', error);
  }
}

// Browser-specific code wrapped in a function that's called conditionally
export function initBrowserEvents() {
  if (typeof window !== 'undefined') {
    window.addEventListener('apiKeyUpdated', (event: CustomEvent) => {
      console.log(
        'API key updated event received, updating DEFAULT_MOCK_ACCOUNTS',
      );

      // Check if we have specific apiKeyId and nickname in the event
      const { apiKeyId, nickname } = event.detail || {};
      if (apiKeyId && nickname) {
        // Update the specific account directly for immediate effect
        const account = DEFAULT_MOCK_ACCOUNTS.find(
          (acc) => acc.apiKeyId === apiKeyId,
        );
        if (account) {
          console.log(
            `Directly updating DEFAULT_MOCK_ACCOUNTS nickname for ${apiKeyId}: ${nickname}`,
          );
          account.name = nickname;
        }
      } else {
        // Fall back to updating all accounts from localStorage
        updateDefaultMockAccounts();
      }

      // Dispatch a storage event to force components using localStorage to update
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'selected-account-storage',
        }),
      );
    });

    // Also listen for storage events
    window.addEventListener('storage', (event) => {
      if (event.key === 'exchange_api_keys') {
        console.log(
          'exchange_api_keys changed in localStorage, updating DEFAULT_MOCK_ACCOUNTS',
        );
        updateDefaultMockAccounts();
      }
    });

    // Also update on page load
    updateDefaultMockAccounts();
  }
}

// Initialize browser events if we're in a browser environment
if (typeof window !== 'undefined') {
  initBrowserEvents();
}

// For backward compatibility
export const _DEFAULT_MOCK_ACCOUNTS: ExchangeAccount[] = [
  {
    id: 'mock-key-1',
    name: 'Kraken Main',
    exchange: 'Kraken',
    exchangeId: 'kraken',
    value: '$23,579.83',
    change: '-3.06%',
    logo: '/exchanges/kraken.svg',
    apiKeyId: 'mock-key-1',
  },
  {
    id: 'mock-key-2',
    name: 'Binance Artcenter1',
    exchange: 'Binance',
    exchangeId: 'binance',
    value: '$8,784.14',
    change: '+1.94%',
    logo: '/exchanges/binance.svg',
    apiKeyId: 'mock-key-2',
  },
  {
    id: 'mock-key-3',
    name: 'Coinbase Pro',
    exchange: 'Coinbase',
    exchangeId: 'coinbase',
    value: '$12,345.67',
    change: '+2.15%',
    logo: '/exchanges/coinbase.svg',
    apiKeyId: 'mock-key-3',
  },
];
