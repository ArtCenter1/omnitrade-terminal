// src/components/connection/ConnectionStatusIndicator.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  WifiOff,
  Loader2,
  Database,
} from 'lucide-react';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';
import {
  ConnectionStatus,
  ConnectionType,
} from '@/services/connection/connectionManager';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  exchangeId: string;
  showRefresh?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  hideMockWarning?: boolean;
}

/**
 * Component for displaying connection status
 */
export function ConnectionStatusIndicator({
  exchangeId,
  showRefresh = true,
  showLabel = true,
  size = 'md',
  className,
}: ConnectionStatusIndicatorProps) {
  const { getStatus, checkConnection } = useConnectionStatus();
  const status = getStatus(exchangeId);

  // Handle refresh button click
  const handleRefresh = async () => {
    await checkConnection(exchangeId);
  };

  // Determine icon based on status
  const getIcon = () => {
    switch (status.status) {
      case ConnectionStatus.CONNECTED:
        return status.type === ConnectionType.MOCK ? (
          <Database className={getIconSize()} />
        ) : (
          <CheckCircle className={getIconSize()} />
        );
      case ConnectionStatus.DISCONNECTED:
        return <WifiOff className={getIconSize()} />;
      case ConnectionStatus.CONNECTING:
        return <Loader2 className={`${getIconSize()} animate-spin`} />;
      case ConnectionStatus.ERROR:
        return <AlertCircle className={getIconSize()} />;
      default:
        return <WifiOff className={getIconSize()} />;
    }
  };

  // Determine badge variant based on status
  const getBadgeVariant = () => {
    switch (status.status) {
      case ConnectionStatus.CONNECTED:
        return status.type === ConnectionType.MOCK ? 'outline' : 'default';
      case ConnectionStatus.DISCONNECTED:
        return 'secondary';
      case ConnectionStatus.CONNECTING:
        return 'outline';
      case ConnectionStatus.ERROR:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Determine badge text based on status
  const getBadgeText = () => {
    switch (status.status) {
      case ConnectionStatus.CONNECTED:
        return status.type === ConnectionType.MOCK
          ? 'Using Mock Data'
          : status.type === ConnectionType.TESTNET
            ? 'Testnet Connected'
            : 'Connected';
      case ConnectionStatus.DISCONNECTED:
        return 'Disconnected';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.ERROR:
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  // Determine tooltip text based on status
  const getTooltipText = () => {
    let baseText = '';

    switch (status.status) {
      case ConnectionStatus.CONNECTED:
        baseText =
          status.type === ConnectionType.MOCK
            ? 'Using mock data instead of real exchange data'
            : status.type === ConnectionType.TESTNET
              ? 'Connected to Binance Testnet'
              : 'Connected to exchange';
        break;
      case ConnectionStatus.DISCONNECTED:
        baseText = 'Not connected to exchange';
        break;
      case ConnectionStatus.CONNECTING:
        baseText = 'Attempting to connect to exchange';
        break;
      case ConnectionStatus.ERROR:
        baseText = `Connection error: ${status.message || status.error?.message || 'Unknown error'}`;
        break;
      default:
        baseText = 'Unknown connection status';
    }

    // Add latency if available
    if (status.latency) {
      baseText += ` (${status.latency}ms)`;
    }

    // Add rate limit information if available
    if (status.rateLimit) {
      baseText += `\n\nRate Limits:`;
      baseText += `\nAPI Weight: ${status.rateLimit.usedWeight}/${status.rateLimit.weightLimit} (${Math.round((status.rateLimit.usedWeight / status.rateLimit.weightLimit) * 100)}%)`;
      baseText += `\nOrder Count: ${status.rateLimit.orderCount}/${status.rateLimit.orderLimit} (${Math.round((status.rateLimit.orderCount / status.rateLimit.orderLimit) * 100)}%)`;

      if (status.rateLimit.isRateLimited && status.rateLimit.retryAfter) {
        baseText += `\nRate Limited! Retry after: ${status.rateLimit.retryAfter}s`;
      }

      baseText += `\nReset Time: ${status.rateLimit.resetTime.toLocaleTimeString()}`;
    }

    // Add last checked time
    if (status.lastChecked) {
      baseText += `\n\nLast checked: ${status.lastChecked.toLocaleTimeString()}`;
    }

    return baseText;
  };

  // Get icon size based on size prop
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'md':
        return 'h-4 w-4';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  // Get badge class based on size prop
  const getBadgeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-0 px-1.5 h-5';
      case 'md':
        return 'text-xs py-0.5 px-2 h-6';
      case 'lg':
        return 'text-sm py-1 px-2.5 h-7';
      default:
        return 'text-xs py-0.5 px-2 h-6';
    }
  };

  // Get button class based on size prop
  const getButtonClass = () => {
    switch (size) {
      case 'sm':
        return 'h-5 w-5 p-0';
      case 'md':
        return 'h-6 w-6 p-0';
      case 'lg':
        return 'h-7 w-7 p-0';
      default:
        return 'h-6 w-6 p-0';
    }
  };

  // Get custom styles based on status
  const getCustomStyles = () => {
    switch (status.status) {
      case ConnectionStatus.CONNECTED:
        return status.type === ConnectionType.MOCK
          ? 'border-yellow-500 text-yellow-500'
          : 'bg-green-500';
      case ConnectionStatus.ERROR:
        return 'bg-red-500';
      default:
        return '';
    }
  };

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={getBadgeVariant()}
              className={cn(
                'flex items-center gap-1 cursor-help',
                getBadgeClass(),
                getCustomStyles(),
              )}
            >
              {getIcon()}
              {showLabel && <span className="ml-1">{getBadgeText()}</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs whitespace-pre-line">{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>

        {showRefresh && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={getButtonClass()}
                onClick={handleRefresh}
                disabled={status.status === ConnectionStatus.CONNECTING}
              >
                <RefreshCw
                  className={cn(
                    getIconSize(),
                    status.status === ConnectionStatus.CONNECTING &&
                      'animate-spin',
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh connection status</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
