import React, { useState, useEffect } from 'react';
import { ExchangeSelector } from './ExchangeSelector';
import { AccountSelector } from './AccountSelector';
import { AvailableBalances } from './AvailableBalances';
import { TradingTabs } from './TradingTabs';
import { TradingPair } from './TradingPairSelector';
import logger from '@/utils/logger';

interface TradingSidebarProps {
  selectedPair?: TradingPair;
  onOrderPlaced?: () => void;
}

export function TradingSidebar({
  selectedPair,
  onOrderPlaced,
}: TradingSidebarProps = {}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Log when refreshTrigger changes
  useEffect(() => {
    logger.info('TradingSidebar refreshTrigger updated', {
      component: 'TradingSidebar',
      data: { refreshTrigger },
    });

    // Debug localStorage content when refreshTrigger changes
    try {
      const rawOrders = localStorage.getItem('omnitrade_mock_orders');
      logger.debug('Current localStorage content in TradingSidebar', {
        component: 'TradingSidebar',
        data: {
          rawOrders,
          hasOrders: !!rawOrders,
          ordersLength: rawOrders ? rawOrders.length : 0,
        },
      });
    } catch (error) {
      logger.error('Error accessing localStorage in TradingSidebar', {
        component: 'TradingSidebar',
        data: { error },
      });
    }
  }, [refreshTrigger]);

  // Handler for when an order is placed
  const handleOrderPlaced = () => {
    logger.info('Order placed, incrementing refreshTrigger', {
      component: 'TradingSidebar',
      method: 'handleOrderPlaced',
      data: { currentRefreshTrigger: refreshTrigger },
    });

    // Increment the refresh trigger to cause a refresh of components that depend on it
    setRefreshTrigger((prev) => prev + 1);

    // Call the parent handler if provided
    if (onOrderPlaced) {
      logger.info('Calling parent onOrderPlaced handler', {
        component: 'TradingSidebar',
        method: 'handleOrderPlaced',
      });
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
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
