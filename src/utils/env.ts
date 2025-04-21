/**
 * Environment variable utilities
 * 
 * This file provides helper functions for accessing environment variables
 * in a type-safe and clear manner, making it obvious which .env file
 * is being used.
 */

/**
 * Get a frontend environment variable
 * These variables come from the root .env file and are prefixed with VITE_
 * 
 * @param key The environment variable key (without the VITE_ prefix)
 * @param defaultValue Optional default value if the variable is not defined
 * @returns The environment variable value or the default value
 */
export function getFrontendEnv(key: string, defaultValue: string = ''): string {
  const fullKey = `VITE_${key}`;
  return import.meta.env[fullKey] || defaultValue;
}

/**
 * Check if a frontend feature flag is enabled
 * 
 * @param flagName The feature flag name (without the VITE_ prefix)
 * @returns True if the feature flag is enabled, false otherwise
 */
export function isFeatureEnabled(flagName: string): boolean {
  const value = getFrontendEnv(flagName);
  return value === 'true' || value === '1';
}

/**
 * Get the CoinGecko API key from the frontend environment
 * 
 * @returns The CoinGecko API key
 */
export function getCoinGeckoApiKey(): string {
  return getFrontendEnv('COINGECKO_API_KEY');
}

/**
 * Get the authentication provider from the frontend environment
 * 
 * @returns The authentication provider (e.g., 'firebase')
 */
export function getAuthProvider(): string {
  return getFrontendEnv('AUTH_PROVIDER', 'firebase');
}

/**
 * Get the market data API URL from the frontend environment
 * 
 * @returns The market data API URL
 */
export function getMarketDataApiUrl(): string {
  return getFrontendEnv('MARKET_DATA_API_URL', 'http://localhost:3000/api/v1/market-data');
}

/**
 * Get the market data WebSocket URL from the frontend environment
 * 
 * @returns The market data WebSocket URL
 */
export function getMarketDataWsUrl(): string {
  return getFrontendEnv('MARKET_DATA_WS_URL', 'ws://localhost:3001');
}
