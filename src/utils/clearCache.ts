// Utility function to clear cache and force data refresh

/**
 * Clears React Query cache and relevant localStorage items to force data refresh
 */
export function clearDataCache() {
  console.log('Clearing data cache to force refresh...');

  // Clear localStorage items related to portfolio data
  try {
    // Remove the selected account from localStorage to force a reset
    localStorage.removeItem('selected-account-storage');

    // Clear any cached portfolio data
    const cacheKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes('portfolio') ||
          key.includes('exchange') ||
          key.includes('asset'))
      ) {
        cacheKeys.push(key);
      }
    }

    // Remove all identified cache keys
    cacheKeys.forEach((key) => {
      console.log(`Removing cached item: ${key}`);
      localStorage.removeItem(key);
    });

    // Add a cache-busting timestamp
    const timestamp = Date.now();
    localStorage.setItem('cache_bust_timestamp', timestamp.toString());
    console.log('Added cache-busting timestamp:', timestamp);

    console.log('Successfully cleared localStorage cache items');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }

  // The React Query cache will be invalidated when the page reloads

  // Force a page reload to apply all changes
  window.location.reload();
}
