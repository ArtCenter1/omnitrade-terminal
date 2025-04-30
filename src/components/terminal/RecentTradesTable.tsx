import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useTrades } from '@/hooks/useTrades';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { formatDate } from '@/lib/utils';
import { Trade } from '@/types/exchange';

interface RecentTradesTableProps {
  selectedSymbol?: string;
  refreshTrigger?: number;
  limit?: number;
}

export function RecentTradesTable({
  selectedSymbol,
  refreshTrigger = 0,
  limit = 50,
}: RecentTradesTableProps) {
  const { selectedAccount } = useSelectedAccount();
  const { trades, isLoading, isError, error, refetch } = useTrades(
    selectedSymbol || '',
    limit,
  );

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Format the side (buy/sell) with appropriate styling
  const formatSide = (isBuyerMaker: boolean | undefined) => {
    // If isBuyerMaker is undefined, default to a buy
    const side = isBuyerMaker ? 'SELL' : 'BUY';
    const colorClass = isBuyerMaker ? 'text-crypto-red' : 'text-crypto-green';
    return <span className={colorClass}>{side}</span>;
  };

  // Format price and quantity to handle both string and number types
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  const formatQuantity = (quantity: string | number) => {
    const numQuantity =
      typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    return numQuantity.toFixed(6);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-400">Loading recent trades...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-red-500 mb-2">Error loading trades</p>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No recent trades for {selectedSymbol || 'selected pair'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-900">
          <tr className="text-xs text-gray-400">
            <th className="text-left py-2 px-4 font-medium">Time</th>
            <th className="text-left py-2 px-4 font-medium">Price</th>
            <th className="text-right py-2 px-4 font-medium">Quantity</th>
            <th className="text-right py-2 px-4 font-medium">Side</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr
              key={trade.id || `trade-${index}`}
              className="border-b border-gray-800"
            >
              <td className="py-2 px-4 text-sm text-gray-300">
                {formatDate(trade.timestamp)}
              </td>
              <td className="py-2 px-4 text-sm text-gray-300">
                {formatPrice(trade.price)}
              </td>
              <td className="py-2 px-4 text-sm text-gray-300 text-right">
                {formatQuantity(trade.quantity)}
              </td>
              <td className="py-2 px-4 text-sm text-right">
                {formatSide(trade.isBuyerMaker)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
