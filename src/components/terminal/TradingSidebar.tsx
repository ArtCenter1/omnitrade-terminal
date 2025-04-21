import React, { useState } from 'react';
import { ExchangeSelector } from './ExchangeSelector';
import { AccountSelector } from './AccountSelector';
import { AvailableBalances } from './AvailableBalances';
import { TradingTabs } from './TradingTabs';
import { TradingPair } from './TradingPairSelector';

interface TradingSidebarProps {
  selectedPair?: TradingPair;
  onOrderPlaced?: () => void;
}

export function TradingSidebar({
  selectedPair,
  onOrderPlaced,
}: TradingSidebarProps = {}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handler for when an order is placed
  const handleOrderPlaced = () => {
    // Increment the refresh trigger to cause a refresh of components that depend on it
    setRefreshTrigger((prev) => prev + 1);

    // Call the parent handler if provided
    if (onOrderPlaced) {
      onOrderPlaced();
    }
  };

  return (
    <div className="h-full px-1 overflow-y-auto">
      <ExchangeSelector />
      <AccountSelector />
      <AvailableBalances
        selectedPair={selectedPair}
        refreshTrigger={refreshTrigger}
      />
      <TradingTabs
        selectedPair={selectedPair}
        onOrderPlaced={handleOrderPlaced}
      />
    </div>
  );
}
