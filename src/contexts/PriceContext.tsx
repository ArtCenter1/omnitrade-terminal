import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';

interface PriceContextType {
  // Price selected by user (e.g., from clicking in the order book)
  selectedPrice: string;
  setSelectedPrice: (price: string) => void;

  // Current market price (from order book or API)
  currentMarketPrice: string;
  setCurrentMarketPrice: (price: string) => void;

  // Trading pair this price is for
  currentPairSymbol: string;
  setCurrentPairSymbol: (symbol: string) => void;

  // Helper function to get the best price to use
  getBestPrice: () => string;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export function PriceProvider({ children }: { children: ReactNode }) {
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const [currentMarketPrice, setCurrentMarketPrice] = useState<string>('');
  const [currentPairSymbol, setCurrentPairSymbol] =
    useState<string>('BTC/USDT');

  // Log price changes for debugging
  useEffect(() => {
    console.log(`PriceContext: selectedPrice changed to ${selectedPrice}`);
  }, [selectedPrice]);

  useEffect(() => {
    console.log(
      `PriceContext: currentMarketPrice changed to ${currentMarketPrice}`,
    );
  }, [currentMarketPrice]);

  // Helper function to get the best price to use
  const getBestPrice = (): string => {
    // If user selected a price, use that
    if (selectedPrice && selectedPrice !== '0' && selectedPrice !== '0.00') {
      return selectedPrice;
    }

    // Otherwise use current market price
    if (
      currentMarketPrice &&
      currentMarketPrice !== '0' &&
      currentMarketPrice !== '0.00'
    ) {
      return currentMarketPrice;
    }

    // Fallback to default prices based on the trading pair
    if (currentPairSymbol.startsWith('BTC')) {
      return '60000.00';
    } else if (currentPairSymbol.startsWith('ETH')) {
      return '3000.00';
    } else {
      return '10.00';
    }
  };

  return (
    <PriceContext.Provider
      value={{
        selectedPrice,
        setSelectedPrice,
        currentMarketPrice,
        setCurrentMarketPrice,
        currentPairSymbol,
        setCurrentPairSymbol,
        getBestPrice,
      }}
    >
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
