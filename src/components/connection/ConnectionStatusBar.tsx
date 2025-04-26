// src/components/connection/ConnectionStatusBar.tsx
import React from 'react';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';
import { ConnectionStatus, ConnectionType } from '@/services/connection/connectionManager';
import { cn } from '@/lib/utils';

interface ConnectionStatusBarProps {
  className?: string;
}

/**
 * Component for displaying connection status for all exchanges
 */
export function ConnectionStatusBar({ className }: ConnectionStatusBarProps) {
  const { statuses } = useConnectionStatus();
  
  // Filter out exchanges that are not connected or have no status
  const activeExchanges = Array.from(statuses.values()).filter(
    (status) => status.status !== ConnectionStatus.DISCONNECTED
  );
  
  // If no active exchanges, show a message
  if (activeExchanges.length === 0) {
    return null;
  }
  
  // Check if any exchange is using mock data
  const anyMockData = activeExchanges.some(
    (status) => status.type === ConnectionType.MOCK
  );
  
  // Check if any exchange has an error
  const anyError = activeExchanges.some(
    (status) => status.status === ConnectionStatus.ERROR
  );
  
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 px-2 py-1 text-xs',
        anyError
          ? 'bg-red-500/10 border-b border-red-500/20'
          : anyMockData
          ? 'bg-yellow-500/10 border-b border-yellow-500/20'
          : 'bg-green-500/10 border-b border-green-500/20',
        className
      )}
    >
      {activeExchanges.map((status) => (
        <ConnectionStatusIndicator
          key={status.exchangeId}
          exchangeId={status.exchangeId}
          size="sm"
          showRefresh={false}
        />
      ))}
    </div>
  );
}
