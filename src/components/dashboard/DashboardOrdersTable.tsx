import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OrdersTable } from '@/components/terminal/OrdersTable';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';

interface DashboardOrdersTableProps {
  type: 'open' | 'history';
}

export function DashboardOrdersTable({ type }: DashboardOrdersTableProps) {
  const { selectedAccount } = useSelectedAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const lastRefreshTime = useRef<number | null>(null);

  // Set up a refresh interval for orders - reduced frequency to prevent flickering
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      if (!lastRefreshTime.current || now - lastRefreshTime.current > 5000) {
        setRefreshTrigger((prev) => prev + 1);
        lastRefreshTime.current = now;
      }
    }, 15000); // Reduced frequency to every 15 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Check for new orders and update the notification state - optimized to reduce flickering
  useEffect(() => {
    // Debounced function to reduce state updates
    let updateTimeout: NodeJS.Timeout | null = null;

    const checkForNewOrders = () => {
      try {
        // Get orders from localStorage
        const storedOrders = localStorage.getItem('omnitrade_mock_orders');
        if (!storedOrders) return;

        const parsedOrders = JSON.parse(storedOrders);

        // Filter orders based on the selected account and tab type
        const exchangeId =
          selectedAccount?.exchangeId || selectedAccount?.exchange || 'binance';

        // Filter by exchange - memoize this calculation
        const filteredByExchange = parsedOrders.filter((order: any) => {
          return (
            order.exchangeId === exchangeId ||
            (exchangeId === 'binance' &&
              order.exchangeId === 'binance_testnet') ||
            (exchangeId === 'binance_testnet' && order.exchangeId === 'binance')
          );
        });

        // Filter by status based on tab type
        let filteredOrders;
        if (type === 'open') {
          filteredOrders = filteredByExchange.filter(
            (order: any) =>
              order.status === 'new' || order.status === 'partially_filled',
          );
        } else {
          filteredOrders = filteredByExchange.filter(
            (order: any) =>
              order.status !== 'new' && order.status !== 'partially_filled',
          );
        }

        // If the order count has changed, trigger a refresh - with debouncing
        if (filteredOrders.length !== lastOrderCount) {
          // Clear any existing timeout
          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }

          // Debounce the update to prevent rapid state changes
          updateTimeout = setTimeout(() => {
            // Only update if we haven't refreshed recently
            const now = Date.now();
            if (
              !lastRefreshTime.current ||
              now - lastRefreshTime.current > 3000
            ) {
              setLastOrderCount(filteredOrders.length);
              setRefreshTrigger((prev) => prev + 1);
              lastRefreshTime.current = now;

              // Dispatch a custom event to notify the Dashboard component
              const event = new CustomEvent('orderCountChanged', {
                detail: {
                  type,
                  count: filteredOrders.length,
                  hasNewOrders: filteredOrders.length > lastOrderCount,
                },
              });
              window.dispatchEvent(event);
            }
          }, 300); // Debounce for 300ms
        }
      } catch (error) {
        console.error('Error checking for new orders:', error);
      }
    };

    // Check immediately but with a slight delay to avoid initial flickering
    const initialCheckTimeout = setTimeout(checkForNewOrders, 500);

    // Set up interval to check periodically - increased interval to reduce flickering
    const intervalId = setInterval(checkForNewOrders, 10000); // Check every 10 seconds

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialCheckTimeout);
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [selectedAccount, type]);

  return (
    <div className="overflow-x-auto">
      <OrdersTable
        initialTab={type === 'open' ? 'open' : 'history'}
        showTabs={false}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
