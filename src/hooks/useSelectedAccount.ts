// src/hooks/useSelectedAccount.ts
import { create } from 'zustand';
import { ExchangeAccount } from '@/mocks/mockExchangeAccounts';

interface SelectedAccountState {
  selectedAccount: ExchangeAccount | null;
  setSelectedAccount: (account: ExchangeAccount | null) => void;
}

// Create a store to share the selected account across components
export const useSelectedAccountStore = create<SelectedAccountState>((set) => ({
  selectedAccount: null,
  setSelectedAccount: (account) => set({ selectedAccount: account }),
}));

// Hook to access the selected account
export function useSelectedAccount() {
  return useSelectedAccountStore((state) => ({
    selectedAccount: state.selectedAccount,
    setSelectedAccount: state.setSelectedAccount,
  }));
}
