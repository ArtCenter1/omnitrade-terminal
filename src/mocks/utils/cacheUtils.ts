/**
 * Utility functions for caching API responses
 */

/**
 * Get cached data if available and not expired
 * @param cacheKey The key to look up in the cache
 * @returns The cached data or null if not found or expired
 */
export function getCachedData(cacheKey: string): string | null {
  const cachedData = sessionStorage.getItem(cacheKey);
  const cacheExpiry = sessionStorage.getItem(`${cacheKey}_expiry`);

  if (cachedData && cacheExpiry && parseInt(cacheExpiry) > Date.now()) {
    console.log(`Using cached data for ${cacheKey}`);
    return cachedData;
  }

  return null;
}

/**
 * Cache data with an expiry time
 * @param cacheKey The key to store the data under
 * @param data The data to cache
 * @param expiryMs The time in milliseconds until the cache expires
 */
export function cacheData(cacheKey: string, data: string, expiryMs: number): void {
  try {
    sessionStorage.setItem(cacheKey, data);
    sessionStorage.setItem(
      `${cacheKey}_expiry`,
      (Date.now() + expiryMs).toString()
    );
  } catch (e) {
    console.warn(`Failed to cache data for ${cacheKey}:`, e);
  }
}

/**
 * Cache expiry times in milliseconds
 */
export const CACHE_TIMES = {
  EXCHANGE_INFO: 5 * 60 * 1000, // 5 minutes
  DEPTH: 10 * 1000,            // 10 seconds
  TICKER: 30 * 1000,           // 30 seconds
  KLINES: 60 * 1000,           // 1 minute
  TRADES: 30 * 1000,           // 30 seconds
};
