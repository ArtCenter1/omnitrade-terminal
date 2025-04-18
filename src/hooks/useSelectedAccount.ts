// src/hooks/useSelectedAccount.ts
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ExchangeAccount } from '@/mocks/mockExchangeAccounts';
import { DEFAULT_MOCK_ACCOUNTS } from '@/mocks/mockExchangeAccounts';

// Default Portfolio Overview account
const DEFAULT_PORTFOLIO_OVERVIEW: ExchangeAccount = {
  id: 'portfolio-overview',
  name: 'Portfolio Overview',
  exchange: 'all',
  exchangeId: 'all',
  apiKeyId: 'portfolio-overview',
  logo: '/placeholder.svg',
  value: '$56,019.96', // Default value
  change: '+1.96%', // Default change
  isPortfolioOverview: true,
};

interface SelectedAccountState {
  selectedAccount: ExchangeAccount | null;
  setSelectedAccount: (account: ExchangeAccount | null) => void;
  clearSelectedAccount: () => void;
}

// Create a store to share the selected account across components
// Use persist middleware to save the selected account in localStorage
export const useSelectedAccountStore = create<SelectedAccountState>(
  persist(
    (set) => ({
      selectedAccount: DEFAULT_PORTFOLIO_OVERVIEW, // Default to Portfolio Overview
      setSelectedAccount: (account) => {
        console.log('Setting selected account:', account?.name || 'null');
        console.log(
          'Account details:',
          account ? JSON.stringify(account) : 'null',
        );
        set({ selectedAccount: account });
      },
      clearSelectedAccount: () => {
        console.log('Clearing selected account');
        set({ selectedAccount: null });
      },
    }),
    {
      name: 'selected-account-storage', // unique name for localStorage
      storage: createJSONStorage(() => localStorage), // Use JSON storage
      partialize: (state) => ({ selectedAccount: state.selectedAccount }), // only persist selectedAccount
      version: 1, // Add version for migrations
      onRehydrateStorage: (state) => {
        // Handle rehydration and validate the state
        return (rehydratedState, error) => {
          if (error || !rehydratedState?.selectedAccount) {
            console.warn('Error rehydrating selected account state:', error);
            // Set default account if there's an error or no selected account
            set({ selectedAccount: DEFAULT_PORTFOLIO_OVERVIEW });
          } else {
            console.log('Successfully rehydrated selected account state');
          }
        };
      },
    },
  ),
);

// Hook to access the selected account
export function useSelectedAccount() {
  // Use separate selectors for each property to avoid unnecessary re-renders
  const selectedAccount = useSelectedAccountStore(
    (state) => state.selectedAccount,
  );
  const setSelectedAccount = useSelectedAccountStore(
    (state) => state.setSelectedAccount,
  );
  const clearSelectedAccount = useSelectedAccountStore(
    (state) => state.clearSelectedAccount,
  );

  // Add a useEffect to check for localStorage changes and API key updates
  useEffect(() => {
    // This will run when the component mounts
    const handleStorageChange = (e: StorageEvent) => {
      // If the selected account storage was changed in another tab/window
      // or if the exchange_api_keys were updated
      if (
        e.key === 'selected-account-storage' ||
        e.key === 'exchange_api_keys' ||
        e.key === null
      ) {
        console.log(
          `Storage changed (${e.key}), refreshing selected account...`,
        );
        // Force a refresh of the selected account
        clearSelectedAccount();
        // Wait a bit and then set it back to the default
        setTimeout(() => {
          // This will trigger a re-fetch of the account data
          setSelectedAccount(DEFAULT_PORTFOLIO_OVERVIEW);
        }, 100);
      }
    };

    // Handle API key updates
    const handleApiKeyUpdated = (e: CustomEvent) => {
      console.log(
        'API key updated event received, refreshing selected account...',
      );
      const { apiKeyId, nickname } = e.detail || {};

      // If this is the currently selected account, update it
      if (selectedAccount && selectedAccount.apiKeyId === apiKeyId) {
        console.log(
          `Updating selected account nickname from ${selectedAccount.name} to ${nickname}`,
        );
        // Create a new account object with the updated nickname
        const updatedAccount = {
          ...selectedAccount,
          name: nickname,
        };

        // Update the selected account
        setSelectedAccount(updatedAccount);
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    // Listen for API key update events
    window.addEventListener(
      'apiKeyUpdated',
      handleApiKeyUpdated as EventListener,
    );

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'apiKeyUpdated',
        handleApiKeyUpdated as EventListener,
      );
    };
  }, [clearSelectedAccount, setSelectedAccount, selectedAccount]);

  return {
    selectedAccount,
    setSelectedAccount,
    clearSelectedAccount,
  };
}
