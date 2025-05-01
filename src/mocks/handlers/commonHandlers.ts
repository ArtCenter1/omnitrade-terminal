/**
 * Common handler functions shared across multiple endpoint handlers
 */

import { getFeatureFlags } from '@/config/featureFlags.tsx';
import {
  createJsonResponse,
  createErrorResponse,
  fetchWithTimeout,
  parseUrl,
} from '../utils/apiUtils';
import { getCachedData, cacheData } from '../utils/cacheUtils';

/**
 * Handle a request with caching and fallback to mock data
 * @param url The request URL
 * @param cacheKey The cache key
 * @param cacheDuration The cache duration in milliseconds
 * @param fetchRealData Function to fetch real data
 * @param createMockData Function to create mock data
 * @returns A Response object
 */
export async function handleRequestWithCache(
  url: string,
  cacheKey: string,
  cacheDuration: number,
  fetchRealData: () => Promise<Response>,
  createMockData: () => any,
): Promise<Response> {
  // Check for cached data
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return createJsonResponse(JSON.parse(cachedData));
  }

  try {
    // Try to fetch real data
    const response = await fetchRealData();

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`,
      );
    }

    // Get the response data
    const data = await response.text();

    // Cache the response
    cacheData(cacheKey, data, cacheDuration);

    return createJsonResponse(JSON.parse(data));
  } catch (error) {
    console.error(`Error fetching data: ${error}`);

    // Fall back to mock data
    console.warn('Falling back to mock data');
    const mockData = createMockData();

    return createJsonResponse(mockData);
  }
}

/**
 * Check if Binance Testnet is enabled
 * @returns True if Binance Testnet is enabled
 */
export function isBinanceTestnetEnabled(): boolean {
  const flags = getFeatureFlags();
  return flags.useBinanceTestnet;
}

/**
 * Check if mock data should be used
 * @param url The request URL
 * @returns True if mock data should be used
 */
export function shouldUseMockData(url: string): boolean {
  const flags = getFeatureFlags();

  // If mock data is explicitly enabled, use it
  if (flags.useMockData) {
    console.log(`Using mock data for API request: ${url}`);
    return true;
  }

  // Check if this is a Binance Testnet request and if Binance Testnet is disabled
  if (url.includes('/api/mock/binance_testnet') && !flags.useBinanceTestnet) {
    console.log(`Binance Testnet is disabled. Using mock data for: ${url}`);
    return true;
  }

  // Always use mock data for API key requests in development mode
  if (url.includes('/api/exchange-api-keys') && import.meta.env.DEV) {
    console.log(`Using mock data for API key request: ${url}`);
    return true;
  }

  return false;
}

/**
 * Format a symbol for Binance API (remove / if present)
 * @param symbol The symbol to format
 * @returns The formatted symbol
 */
export function formatSymbol(symbol: string | null): string {
  if (!symbol) return 'BTCUSDT';
  return symbol.includes('/') ? symbol.replace('/', '') : symbol;
}
