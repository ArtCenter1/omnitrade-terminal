import React, { useState, useEffect } from 'react';
import { Position, positionTrackingService } from '@/services/positionTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface PositionsListProps {
  exchangeId?: string;
  apiKeyId?: string;
  symbol?: string;
  showClosed?: boolean;
}

export function PositionsList({ exchangeId, apiKeyId, symbol, showClosed = false }: PositionsListProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize position tracking service
    const initializeService = async () => {
      await positionTrackingService.initialize();
      loadPositions();
    };

    initializeService();

    // Subscribe to position updates
    const unsubscribe = positionTrackingService.subscribe((event) => {
      loadPositions();
    });

    // Set up interval to refresh unrealized P&L
    const refreshInterval = setInterval(() => {
      positionTrackingService.refreshUnrealizedPnl();
    }, 10000); // Refresh every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [exchangeId, apiKeyId, symbol, showClosed]);

  const loadPositions = () => {
    setIsLoading(true);
    try {
      const status = showClosed ? undefined : 'open';
      const loadedPositions = positionTrackingService.getPositions(exchangeId, apiKeyId, symbol, status);
      setPositions(loadedPositions);
    } catch (error) {
      console.error('Error loading positions:', error);
    } finally {
      setIsLoading(false);
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
      <CardHeader>
        <CardTitle>Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
                <TableRow key={position.id}>
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
                  <TableCell>{position.exitPrice ? formatCurrency(position.exitPrice) : '-'}</TableCell>
                  <TableCell>{formatNumber(position.quantity)}</TableCell>
                  <TableCell className={getPnlColor(position.unrealizedPnl)}>
                    {position.unrealizedPnl !== undefined ? formatCurrency(position.unrealizedPnl) : '-'}
                  </TableCell>
                  <TableCell className={getPnlColor(position.realizedPnl)}>
                    {position.realizedPnl !== undefined ? formatCurrency(position.realizedPnl) : '-'}
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
