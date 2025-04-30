import React, { useState, useEffect } from 'react';
import { Position, positionTrackingService } from '@/services/positionTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logger from '@/utils/logger';

interface PositionsListProps {
  exchangeId?: string;
  apiKeyId?: string;
  symbol?: string;
  showClosed?: boolean;
}

export function PositionsList({
  exchangeId,
  apiKeyId,
  symbol,
  showClosed = false,
}: PositionsListProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Initialize position tracking service
    const initializeService = async () => {
      setError(null);
      setIsLoading(true);

      try {
        logger.info('[PositionsList] Initializing position tracking service');
        const initialized = await positionTrackingService.initialize();

        if (initialized) {
          setIsInitialized(true);

          // Load positions
          const positions = loadPositions();

          // If no positions are found and we're in a demo/mock environment, create some mock positions
          if (
            positions.length === 0 &&
            (!exchangeId || exchangeId === 'demo' || exchangeId === 'sandbox')
          ) {
            logger.info(
              '[PositionsList] No positions found, creating mock positions',
            );
            try {
              positionTrackingService.createMockPositions(
                exchangeId || 'demo',
                3,
              );
              loadPositions(); // Reload positions after creating mocks
            } catch (mockError) {
              logger.warn(
                '[PositionsList] Error creating mock positions:',
                mockError,
              );
              // Continue even if mock creation fails
            }
          }
        } else {
          setError('Failed to initialize position tracking service');
          setIsLoading(false);
        }
      } catch (err) {
        logger.error(
          '[PositionsList] Error initializing position tracking service:',
          err,
        );
        setError('Error initializing position tracking service');
        setIsLoading(false);
      }
    };

    initializeService();

    // Subscribe to position updates
    let unsubscribe = () => {};
    try {
      unsubscribe = positionTrackingService.subscribe((event) => {
        if (isInitialized) {
          loadPositions();
        }
      });
    } catch (err) {
      logger.error(
        '[PositionsList] Error subscribing to position updates:',
        err,
      );
      setError('Error subscribing to position updates');
    }

    // Set up interval to refresh unrealized P&L
    let refreshInterval: NodeJS.Timeout | null = null;
    try {
      refreshInterval = setInterval(() => {
        if (isInitialized) {
          positionTrackingService.refreshUnrealizedPnl().catch((err) => {
            logger.error(
              '[PositionsList] Error refreshing unrealized P&L:',
              err,
            );
          });
        }
      }, 10000); // Refresh every 10 seconds
    } catch (err) {
      logger.error('[PositionsList] Error setting up refresh interval:', err);
    }

    return () => {
      try {
        unsubscribe();
      } catch (err) {
        logger.error(
          '[PositionsList] Error unsubscribing from position updates:',
          err,
        );
      }

      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [exchangeId, apiKeyId, symbol, showClosed, isInitialized]);

  const loadPositions = (): Position[] => {
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('[PositionsList] Loading positions', {
        exchangeId,
        apiKeyId,
        symbol,
        showClosed,
      });

      const status = showClosed ? undefined : 'open';
      const loadedPositions = positionTrackingService.getPositions(
        exchangeId,
        apiKeyId,
        symbol,
        status,
      );

      logger.debug(
        `[PositionsList] Loaded ${loadedPositions.length} positions`,
      );
      setPositions(loadedPositions);
      setIsLoading(false);
      return loadedPositions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[PositionsList] Error loading positions:', err);
      setError(`Error loading positions: ${errorMessage}`);
      setPositions([]); // Set empty array to avoid undefined errors
      setIsLoading(false);
      return [];
    }
  };

  // Function to manually refresh positions
  const handleRefresh = () => {
    if (isInitialized) {
      const positions = loadPositions();

      // If no positions are found, create some mock positions
      if (positions.length === 0) {
        try {
          logger.info(
            '[PositionsList] No positions found on refresh, creating mock positions',
          );
          positionTrackingService.createMockPositions(exchangeId || 'demo', 3);
          loadPositions(); // Reload positions after creating mocks
        } catch (mockError) {
          logger.warn(
            '[PositionsList] Error creating mock positions:',
            mockError,
          );
          // Continue even if mock creation fails
        }
      }
    } else {
      // Try to initialize again if not initialized
      setIsInitialized(false);
      positionTrackingService
        .initialize()
        .then((initialized) => {
          setIsInitialized(initialized);
          if (initialized) {
            const positions = loadPositions();

            // If no positions are found, create some mock positions
            if (positions.length === 0) {
              try {
                logger.info(
                  '[PositionsList] No positions found after initialization, creating mock positions',
                );
                positionTrackingService.createMockPositions(
                  exchangeId || 'demo',
                  3,
                );
                loadPositions(); // Reload positions after creating mocks
              } catch (mockError) {
                logger.warn(
                  '[PositionsList] Error creating mock positions:',
                  mockError,
                );
                // Continue even if mock creation fails
              }
            }
          } else {
            setError('Failed to initialize position tracking service');
          }
        })
        .catch((err) => {
          logger.error(
            '[PositionsList] Error re-initializing position tracking service:',
            err,
          );
          setError('Error initializing position tracking service');
        });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getSideBadgeColor = (side: string) => {
    switch (side) {
      case 'long':
        return 'bg-green-500';
      case 'short':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getPnlColor = (pnl?: number) => {
    if (!pnl) return '';
    return pnl >= 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Positions</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          title="Refresh positions"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex flex-col justify-center items-center h-32 gap-4">
            <div className="flex items-center text-red-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-32">
            <p>Loading positions...</p>
          </div>
        ) : positions.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <p>No positions found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Exit Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unrealized P&L</TableHead>
                <TableHead>Realized P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow
                  key={
                    position.id ||
                    `${position.symbol}-${position.side}-${position.entryPrice}`
                  }
                >
                  <TableCell>{position.symbol}</TableCell>
                  <TableCell>
                    <Badge className={getSideBadgeColor(position.side)}>
                      {position.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(position.status)}>
                      {position.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(position.entryPrice)}</TableCell>
                  <TableCell>
                    {position.exitPrice
                      ? formatCurrency(position.exitPrice)
                      : '-'}
                  </TableCell>
                  <TableCell>{formatNumber(position.quantity)}</TableCell>
                  <TableCell className={getPnlColor(position.unrealizedPnl)}>
                    {position.unrealizedPnl !== undefined
                      ? formatCurrency(position.unrealizedPnl)
                      : '-'}
                  </TableCell>
                  <TableCell className={getPnlColor(position.realizedPnl)}>
                    {position.realizedPnl !== undefined
                      ? formatCurrency(position.realizedPnl)
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
