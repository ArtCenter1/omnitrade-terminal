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
    <div
      className="border-r border-gray-800 p-2"
      style={{
        width: '220px',
        minWidth: '220px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <ExchangeSelector />
      <AccountSelector />
      <AvailableBalances selectedPair={selectedPair} />
      <TradingForm selectedPair={selectedPair} />
      <AccountTabs />
    </div>
  );
}
