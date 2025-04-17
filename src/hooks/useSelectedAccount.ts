// src/hooks/useSelectedAccount.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ExchangeAccount } from '@/mocks/mockExchangeAccounts';

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
      selectedAccount: null,
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
      partialize: (state) => ({ selectedAccount: state.selectedAccount }), // only persist selectedAccount
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

  return {
    selectedAccount,
    setSelectedAccount,
    clearSelectedAccount,
  };
}
