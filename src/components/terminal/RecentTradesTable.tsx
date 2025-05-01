import { useRef, useCallback } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Trade } from '@/types/exchange';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';

interface RecentTradesTableProps {
  selectedSymbol?: string;
  refreshTrigger?: number;
  limit?: number;
}

// Mock data for when real data fails
const MOCK_TRADES: Trade[] = [
  {
    id: '1',
    price: 50000,
    quantity: 0.5,
    timestamp: Date.now() - 60000,
    isBuyerMaker: false,
  },
  {
    id: '2',
    price: 49950,
    quantity: 0.2,
    timestamp: Date.now() - 120000,
    isBuyerMaker: true,
  },
  {
    id: '3',
    price: 50100,
    quantity: 0.3,
    timestamp: Date.now() - 180000,
    isBuyerMaker: false,
  },
  {
    id: '4',
    price: 50050,
    quantity: 0.1,
    timestamp: Date.now() - 240000,
    isBuyerMaker: true,
  },
  {
    id: '5',
    price: 50200,
    quantity: 0.4,
    timestamp: Date.now() - 300000,
    isBuyerMaker: false,
  },
];

export function RecentTradesTable({
  selectedSymbol,
  refreshTrigger = 0,
  limit = 50,
}: RecentTradesTableProps) {
  // Use refs to avoid state updates that could cause infinite loops
  const refreshButtonRef = useRef<HTMLButtonElement>(null);
  const tryRealDataButtonRef = useRef<HTMLButtonElement>(null);

  // Format the side (buy/sell) with appropriate styling
  const formatSide = useCallback((isBuyerMaker: boolean | undefined) => {
    // If isBuyerMaker is undefined, default to a buy
    const side = isBuyerMaker ? 'SELL' : 'BUY';
    const colorClass = isBuyerMaker ? 'text-crypto-red' : 'text-crypto-green';
    return <span className={colorClass}>{side}</span>;
  }, []);

  // Format price and quantity to handle both string and number types
  const formatPrice = useCallback((price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  }, []);

  const formatQuantity = useCallback((quantity: string | number) => {
    const numQuantity =
      typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    return numQuantity.toFixed(6);
  }, []);

  // Always show mock data for now
  const trades = MOCK_TRADES;
  const isMockData = true;

  return (
    <div>
      {isMockData && (
        <div className="flex items-center mb-4 bg-yellow-900/20 p-2 rounded border border-yellow-900/50">
          <AlertTriangle className="text-yellow-500 mr-2" size={16} />
          <span className="text-xs text-yellow-500">
            Using mock data for recent trades
          </span>
          <button
            ref={tryRealDataButtonRef}
            onClick={(e) => {
              e.preventDefault();
              // Disable the button to prevent multiple clicks
              if (tryRealDataButtonRef.current) {
                tryRealDataButtonRef.current.disabled = true;
                setTimeout(() => {
                  if (tryRealDataButtonRef.current) {
                    tryRealDataButtonRef.current.disabled = false;
                  }
                }, 2000);
              }
            }}
            className="ml-auto px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            Try Real Data
          </button>
        </div>
      )}

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
    </div>
  );
}
