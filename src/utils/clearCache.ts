// Utility functions to clear cache and force data refresh
import { QueryClient } from '@tanstack/react-query';

/**
 * Clears React Query cache and relevant localStorage items to force data refresh
 * while preserving the currently selected account
 */
export function clearDataCache() {
  console.log('Clearing data cache to force refresh...');

  // Clear localStorage items related to portfolio data
  try {
    // Save the current selected account before clearing cache
    let selectedAccount = null;
    const selectedAccountData = localStorage.getItem(
      'selected-account-storage',
    );
    if (selectedAccountData) {
      try {
        const parsedData = JSON.parse(selectedAccountData);
        if (
          parsedData &&
          parsedData.state &&
          parsedData.state.selectedAccount
        ) {
          selectedAccount = parsedData.state.selectedAccount;
          console.log('Saved current selected account:', selectedAccount.name);
        }
      } catch (parseError) {
        console.error('Error parsing selected account data:', parseError);
      }
    }

    // Clear any cached portfolio data
    const cacheKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key !== 'selected-account-storage' && // Don't include the selected account in keys to remove
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

    // If we had a selected account, restore it
    if (selectedAccount) {
      // Update the timestamp on the selected account to force a refresh
      selectedAccount.lastUpdated = new Date().toISOString();

      // Save the updated selected account back to localStorage
      const updatedData = {
        state: { selectedAccount },
        version: 1,
      };
      localStorage.setItem(
        'selected-account-storage',
        JSON.stringify(updatedData),
      );
      console.log('Restored selected account with updated timestamp');
    }

    console.log('Successfully cleared localStorage cache items');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }

  // The React Query cache will be invalidated when the page reloads

  // Force a page reload to apply all changes
  window.location.reload();
}

/**
 * Refreshes portfolio data by invalidating React Query cache without a page reload
 * @param queryClient The React Query client instance
 */
export function refreshPortfolioData(queryClient: QueryClient) {
  console.log('Refreshing portfolio data...');

  try {
    // Invalidate all portfolio-related queries
    queryClient.invalidateQueries({ queryKey: ['portfolio'] });

    // Add a cache-busting timestamp
    const timestamp = Date.now();
    localStorage.setItem('cache_bust_timestamp', timestamp.toString());
    console.log('Added cache-busting timestamp:', timestamp);

    console.log('Successfully refreshed portfolio data');
  } catch (error) {
    console.error('Error refreshing portfolio data:', error);
  }
}
