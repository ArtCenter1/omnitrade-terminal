import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PriceContextType {
  selectedPrice: string;
  setSelectedPrice: (price: string) => void;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export function PriceProvider({ children }: { children: ReactNode }) {
  const [selectedPrice, setSelectedPrice] = useState<string>('');

  return (
    <PriceContext.Provider value={{ selectedPrice, setSelectedPrice }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrice() {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
}
