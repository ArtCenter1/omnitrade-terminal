import React from 'react';
import { ExchangeSelector } from './ExchangeSelector';
import { AccountSelector } from './AccountSelector';
import { AvailableBalances } from './AvailableBalances';
import { TradingForm } from './TradingForm';
import { AccountTabs } from './AccountTabs';
import { TradingPair } from './TradingPairSelector';

interface TradingSidebarProps {
  selectedPair?: TradingPair;
}

export function TradingSidebar({ selectedPair }: TradingSidebarProps = {}) {
  return (
    <div className="col-span-3 border-r border-gray-800 p-4">
      <ExchangeSelector />
      <AccountSelector />
      <AvailableBalances selectedPair={selectedPair} />
      <TradingForm selectedPair={selectedPair} />
      <AccountTabs />
    </div>
  );
}
