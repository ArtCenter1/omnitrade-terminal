/**
 * Configuration for exchange adapters.
 * This allows switching between mock and real exchange APIs.
 */

// Environment modes
export type EnvironmentMode = 'development' | 'test' | 'production';

// Exchange connection modes
export type ConnectionMode = 'mock' | 'sandbox' | 'live';

// Default environment based on Vite's import.meta.env
export const DEFAULT_ENVIRONMENT: EnvironmentMode = import.meta.env.PROD
  ? 'production'
  : import.meta.env.DEV
    ? 'development'
    : 'test';

// Configuration object
interface ExchangeConfig {
  // The current environment mode
  environment: EnvironmentMode;

  // The connection mode to use for each environment
  connectionModes: Record<EnvironmentMode, ConnectionMode>;

  // Whether to validate API keys with the exchange
  validateApiKeys: boolean;

  // Whether to use real exchange data (even in mock mode)
  useRealMarketData: boolean;

  // API endpoints for different connection modes
  endpoints: Record<ConnectionMode, Record<string, string>>;
}

// Default configuration
const defaultConfig: ExchangeConfig = {
  environment: DEFAULT_ENVIRONMENT,

  connectionModes: {
    development: 'mock',
    test: 'sandbox',
    production: 'live',
  },

  validateApiKeys: true,
  useRealMarketData: false,

  endpoints: {
    mock: {
      binance: '/api/mock/binance',
      coinbase: '/api/mock/coinbase',
    },
    sandbox: {
      binance: 'https://testnet.binance.vision/api',
      coinbase: 'https://api-public.sandbox.exchange.coinbase.com',
    },
    live: {
      binance: 'https://api.binance.com',
      coinbase: 'https://api.exchange.coinbase.com',
    },
  },
};

// Current configuration (can be modified at runtime)
let currentConfig: ExchangeConfig = { ...defaultConfig };

/**
 * Get the current exchange configuration.
 */
export function getExchangeConfig(): ExchangeConfig {
  return { ...currentConfig };
}

/**
 * Update the exchange configuration.
 * @param config Partial configuration to update
 */
export function updateExchangeConfig(config: Partial<ExchangeConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get the current connection mode.
 */
export function getConnectionMode(): ConnectionMode {
  return currentConfig.connectionModes[currentConfig.environment];
}

/**
 * Set the connection mode for the current environment.
 * @param mode The connection mode to use
 */
export function setConnectionMode(mode: ConnectionMode): void {
  currentConfig.connectionModes[currentConfig.environment] = mode;
}

/**
 * Get the API endpoint for an exchange.
 * @param exchangeId The exchange ID
 */
export function getExchangeEndpoint(exchangeId: string): string {
  const mode = getConnectionMode();
  return currentConfig.endpoints[mode][exchangeId] || '';
}

/**
 * Check if we're using mock mode.
 */
export function isMockMode(): boolean {
  return getConnectionMode() === 'mock';
}

/**
 * Check if we're using sandbox mode.
 */
export function isSandboxMode(): boolean {
  return getConnectionMode() === 'sandbox';
}

/**
 * Check if we're using live mode.
 */
export function isLiveMode(): boolean {
  return getConnectionMode() === 'live';
}
