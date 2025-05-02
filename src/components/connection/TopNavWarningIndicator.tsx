// src/components/connection/TopNavWarningIndicator.tsx
import React from 'react';
import { AlertTriangle, AlertCircle, WifiOff } from 'lucide-react';
import { useFeatureFlagsContext } from '@/config/featureFlags';
import { useConnectionStatus } from '@/contexts/connectionStatusContext';
import {
  ConnectionStatus,
  ConnectionType,
} from '@/services/connection/connectionManager';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type WarningType =
  | 'mockData'
  | 'apiError'
  | 'connectionIssue'
  | 'rateLimit';

interface TopNavWarningIndicatorProps {
  className?: string;
}

/**
 * Component to display warning indicators in the top navigation bar
 * Shows different warnings based on system status
 */
export function TopNavWarningIndicator({
  className,
}: TopNavWarningIndicatorProps) {
  const flags = useFeatureFlagsContext();
  const { statuses } = useConnectionStatus();

  // Check for different warning conditions
  const usingMockData = flags.useMockData;

  // Check for API connection issues
  const activeExchanges = Array.from(statuses.values()).filter(
    (status) => status.status !== ConnectionStatus.DISCONNECTED,
  );

  const anyApiError = activeExchanges.some(
    (status) => status.status === ConnectionStatus.ERROR,
  );

  const anyConnectionIssue = activeExchanges.some(
    (status) =>
      status.status === ConnectionStatus.ERROR ||
      (status.status === ConnectionStatus.CONNECTED &&
        status.type === ConnectionType.MOCK &&
        !flags.useMockData),
  );

  // If no warnings to show, return null
  if (!usingMockData && !anyApiError && !anyConnectionIssue) {
    return null;
  }

  // Determine which warning to show (prioritize more severe warnings)
  let warningType: WarningType = 'mockData';
  if (anyApiError) {
    warningType = 'apiError';
  } else if (anyConnectionIssue) {
    warningType = 'connectionIssue';
  } else if (usingMockData) {
    warningType = 'mockData';
  }

  // Get icon and message based on warning type
  const getWarningContent = (type: WarningType) => {
    switch (type) {
      case 'apiError':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          title: 'API Error',
          description: 'There was an error connecting to the exchange API',
        };
      case 'connectionIssue':
        return {
          icon: <WifiOff className="h-5 w-5 text-orange-500" />,
          title: 'Connection Issue',
          description: 'Some exchange connections are unavailable',
        };
      case 'rateLimit':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          title: 'Rate Limit Warning',
          description: 'API rate limit threshold reached',
        };
      case 'mockData':
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          title: 'Using Mock Data',
          description: 'Some features may be limited',
        };
    }
  };

  const { icon, title, description } = getWarningContent(warningType);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center cursor-help ${className}`}>
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
