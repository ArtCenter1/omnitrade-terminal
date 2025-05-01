// src/components/connection/ConnectionStatusBar.tsx
import React from 'react';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';
import { ConnectionStatus } from '@/services/connection/connectionManager';
import { cn } from '@/lib/utils';

interface ConnectionStatusBarProps {
  className?: string;
}

/**
 * Component for displaying connection status for all exchanges
 * Mock data warnings are suppressed
 */
export function ConnectionStatusBar({ className }: ConnectionStatusBarProps) {
  const { statuses } = useConnectionStatus();

  // Filter out exchanges that are not connected or have no status
  const activeExchanges = Array.from(statuses.values()).filter(
    (status) => status.status !== ConnectionStatus.DISCONNECTED,
  );

  // If no active exchanges, show a message
  if (activeExchanges.length === 0) {
    return null;
  }

  // Only show the bar if there are actual errors (not mock data warnings)
  const anyError = activeExchanges.some(
    (status) => status.status === ConnectionStatus.ERROR,
  );

  // If there are no errors, don't show the bar at all
  if (!anyError) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 px-2 py-1 text-xs',
        'bg-red-500/10 border-b border-red-500/20',
        className,
      )}
    >
      {activeExchanges
        .filter((status) => status.status === ConnectionStatus.ERROR)
        .map((status) => (
          <ConnectionStatusIndicator
            key={status.exchangeId}
            exchangeId={status.exchangeId}
            size="sm"
            showRefresh={false}
            hideMockWarning={true}
          />
        ))}
    </div>
  );
}
