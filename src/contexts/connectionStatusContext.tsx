// src/contexts/connectionStatusContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ConnectionManager,
  ConnectionStatus,
  ConnectionStatusInfo,
  ConnectionType,
} from '@/services/connection/connectionManager';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { useFeatureFlagsContext } from '@/config/featureFlags';

// Create the context
interface ConnectionStatusContextType {
  statuses: Map<string, ConnectionStatusInfo>;
  getStatus: (exchangeId: string) => ConnectionStatusInfo;
  checkConnection: (exchangeId: string) => Promise<void>;
  isConnected: (exchangeId: string) => boolean;
  isMockData: (exchangeId: string) => boolean;
}

const ConnectionStatusContext = createContext<ConnectionStatusContextType>({
  statuses: new Map(),
  getStatus: () => ({
    status: ConnectionStatus.DISCONNECTED,
    type: ConnectionType.MOCK,
    exchangeId: '',
    lastChecked: new Date(),
  }),
  checkConnection: async () => {},
  isConnected: () => false,
  isMockData: () => true,
});

/**
 * Provider component for connection status
 */
export const ConnectionStatusProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [statuses, setStatuses] = useState<Map<string, ConnectionStatusInfo>>(
    new Map(),
  );
  const connectionManager = ConnectionManager.getInstance();
  const flags = useFeatureFlagsContext();

  // Initialize connection status tracking
  useEffect(() => {
    // Function to check Binance Testnet connection
    const checkBinanceTestnet = async (): Promise<ConnectionStatusInfo> => {
      try {
        // If Binance Testnet is disabled, don't make any API calls
        if (!flags.useBinanceTestnet) {
          return {
            status: ConnectionStatus.DISCONNECTED,
            type: ConnectionType.MOCK,
            exchangeId: 'binance_testnet',
            lastChecked: new Date(),
            message: 'Binance Testnet is disabled',
          };
        }

        // Get the adapter
        const adapter = ExchangeFactory.getAdapter('binance_testnet');

        // Try to get exchange info
        const exchangeInfo = await adapter.getExchangeInfo();

        // Determine if we're using mock data
        const usingMock =
          exchangeInfo.name === 'Mock Exchange' ||
          exchangeInfo.name.includes('Mock');

        return {
          status: ConnectionStatus.CONNECTED,
          type: usingMock ? ConnectionType.MOCK : ConnectionType.TESTNET,
          exchangeId: 'binance_testnet',
          lastChecked: new Date(),
          message: usingMock
            ? 'Connected using mock data'
            : 'Connected to Binance Testnet',
        };
      } catch (error) {
        return {
          status: ConnectionStatus.ERROR,
          type: ConnectionType.MOCK,
          exchangeId: 'binance_testnet',
          lastChecked: new Date(),
          error: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to connect to Binance Testnet',
        };
      }
    };

    // Subscribe to connection status changes
    const unsubscribe = connectionManager.subscribe(
      'binance_testnet',
      (status) => {
        setStatuses((prev) => {
          const newStatuses = new Map(prev);
          newStatuses.set(status.exchangeId, status);
          return newStatuses;
        });
      },
    );

    // Always stop any existing checking first
    connectionManager.stopChecking('binance_testnet');

    // Start checking connection status if Binance Testnet is enabled
    if (flags.useBinanceTestnet) {
      connectionManager.startChecking(
        'binance_testnet',
        checkBinanceTestnet,
        60000,
      );
    } else {
      // Set status to disconnected if Binance Testnet is disabled
      connectionManager.setStatus('binance_testnet', {
        status: ConnectionStatus.DISCONNECTED,
        type: ConnectionType.MOCK,
        exchangeId: 'binance_testnet',
        lastChecked: new Date(),
        message: 'Binance Testnet is disabled',
      });
    }

    // Clean up on unmount
    return () => {
      unsubscribe();
      connectionManager.stopChecking('binance_testnet');
    };
  }, [flags.useBinanceTestnet]);

  // Get status for a specific exchange
  const getStatus = (exchangeId: string): ConnectionStatusInfo => {
    return connectionManager.getStatus(exchangeId);
  };

  // Check connection for a specific exchange
  const checkConnection = async (exchangeId: string): Promise<void> => {
    if (exchangeId === 'binance_testnet') {
      // If Binance Testnet is disabled, don't make any API calls
      if (!flags.useBinanceTestnet) {
        connectionManager.setStatus('binance_testnet', {
          status: ConnectionStatus.DISCONNECTED,
          type: ConnectionType.MOCK,
          exchangeId: 'binance_testnet',
          lastChecked: new Date(),
          message: 'Binance Testnet is disabled',
        });
        return;
      }

      // Get the adapter
      const adapter = ExchangeFactory.getAdapter('binance_testnet');

      try {
        // Try to get exchange info
        const exchangeInfo = await adapter.getExchangeInfo();

        // Determine if we're using mock data
        const usingMock =
          exchangeInfo.name === 'Mock Exchange' ||
          exchangeInfo.name.includes('Mock');

        connectionManager.setStatus('binance_testnet', {
          status: ConnectionStatus.CONNECTED,
          type: usingMock ? ConnectionType.MOCK : ConnectionType.TESTNET,
          exchangeId: 'binance_testnet',
          lastChecked: new Date(),
          message: usingMock
            ? 'Connected using mock data'
            : 'Connected to Binance Testnet',
        });
      } catch (error) {
        connectionManager.setStatus('binance_testnet', {
          status: ConnectionStatus.ERROR,
          type: ConnectionType.MOCK,
          exchangeId: 'binance_testnet',
          lastChecked: new Date(),
          error: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to connect to Binance Testnet',
        });
      }
    }
  };

  // Check if connected to a specific exchange
  const isConnected = (exchangeId: string): boolean => {
    const status = getStatus(exchangeId);
    return status.status === ConnectionStatus.CONNECTED;
  };

  // Check if using mock data for a specific exchange
  const isMockData = (exchangeId: string): boolean => {
    const status = getStatus(exchangeId);
    return status.type === ConnectionType.MOCK;
  };

  const value = {
    statuses,
    getStatus,
    checkConnection,
    isConnected,
    isMockData,
  };

  return (
    <ConnectionStatusContext.Provider value={value}>
      {children}
    </ConnectionStatusContext.Provider>
  );
};

/**
 * Hook to use connection status
 */
export const useConnectionStatus = () => {
  const context = useContext(ConnectionStatusContext);
  if (context === undefined) {
    throw new Error(
      'useConnectionStatus must be used within a ConnectionStatusProvider',
    );
  }
  return context;
};
