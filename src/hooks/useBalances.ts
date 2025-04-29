/**
 * Hook for accessing real-time balance data
 */

import { useState, useEffect, useMemo } from 'react';
import {
  balanceTrackingService,
  BalanceUpdate,
} from '@/services/balanceTracking/balanceTrackingService';
import { useSelectedAccount } from './useSelectedAccount';

// We'll initialize the service in the hook to ensure it's only done once
// and to handle any errors that might occur during initialization

/**
 * Hook to get real-time balance data for the selected account
 * @param assetFilter Optional filter for specific assets
 * @returns Object containing balances and utility functions
 */
export function useBalances(assetFilter?: string[]) {
  const { selectedAccount } = useSelectedAccount();
  const [balances, setBalances] = useState<{
    [asset: string]: {
      free: number;
      locked: number;
      total: number;
      available: number;
      lastUpdated: number;
    };
  }>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the balance tracking service
  useEffect(() => {
    try {
      if (!isInitialized) {
        balanceTrackingService.initialize();
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing balance tracking service:', error);
    }
  }, [isInitialized]);

  // Get the exchange ID and API key ID from the selected account
  const exchangeId = selectedAccount?.exchangeId;
  const apiKeyId = selectedAccount?.apiKeyId;

  // Effect to load initial balances and subscribe to updates
  useEffect(() => {
    if (!exchangeId || !apiKeyId || !isInitialized) {
      setBalances({});
      return;
    }

    try {
      // Load initial balances
      const initialBalances = balanceTrackingService.getBalances(
        exchangeId,
        apiKeyId,
      );
      setBalances(initialBalances);

      // Subscribe to balance updates
      const unsubscribe = balanceTrackingService.subscribe(
        (update: BalanceUpdate) => {
          // Only process updates for the selected account
          if (
            update.exchangeId === exchangeId &&
            update.apiKeyId === apiKeyId
          ) {
            setBalances((prev) => ({
              ...prev,
              [update.asset]: {
                ...update.balance,
                lastUpdated: update.timestamp,
              },
            }));
            setLastUpdate(new Date(update.timestamp));
          }
        },
      );

      // Cleanup subscription on unmount or when account changes
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up balance tracking:', error);
      return () => {}; // Return empty cleanup function
    }
  }, [exchangeId, apiKeyId, isInitialized]);

  // Filter balances if assetFilter is provided
  const filteredBalances = useMemo(() => {
    if (!assetFilter || assetFilter.length === 0) {
      return balances;
    }

    return Object.entries(balances).reduce(
      (filtered, [asset, balance]) => {
        if (assetFilter.includes(asset)) {
          filtered[asset] = balance;
        }
        return filtered;
      },
      {} as typeof balances,
    );
  }, [balances, assetFilter]);

  // Function to manually refresh balances
  const refreshBalances = async () => {
    if (!exchangeId || !apiKeyId || isRefreshing || !isInitialized) {
      return;
    }

    setIsRefreshing(true);
    try {
      await balanceTrackingService.refreshBalances(exchangeId, apiKeyId);
    } catch (error) {
      console.error('Error refreshing balances:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Convert balances to an array for easier rendering
  const balancesArray = useMemo(() => {
    return Object.entries(filteredBalances).map(([asset, balance]) => ({
      asset,
      ...balance,
    }));
  }, [filteredBalances]);

  return {
    balances: filteredBalances,
    balancesArray,
    lastUpdate,
    isRefreshing,
    refreshBalances,
  };
}
