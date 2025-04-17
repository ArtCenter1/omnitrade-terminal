import { Loader2 } from 'lucide-react';
import { getMockOrderbookData } from '@/mocks/mockOrderbook';
import { TradingPair } from './TradingPairSelector';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';

interface OrderBookProps {
  selectedPair?: TradingPair;
  className?: string;
}

export function OrderBook({ selectedPair, className }: OrderBookProps = {}) {
  // Get selected account for exchange-specific data
  const { selectedAccount } = useSelectedAccount();
  const exchangeName = selectedAccount?.exchange || 'Binance';

  // Use the selected pair or default to BTC/USDT
  const symbol = selectedPair?.symbol || 'BTC/USDT';
  const baseAsset = selectedPair?.baseAsset || 'BTC';
  const quoteAsset = selectedPair?.quoteAsset || 'USDT';

  // Get mock orderbook data for the selected pair
  const { orderbook, isLoading, isError } = getMockOrderbookData(symbol);

  // Format price with appropriate precision
  const formatPrice = (price: string | number) => {
    return typeof price === 'number'
      ? price.toFixed(2)
      : parseFloat(price).toFixed(2);
  };

  // Format quantity with appropriate precision
  const formatQuantity = (quantity: string | number) => {
    return typeof quantity === 'number'
      ? quantity.toFixed(8)
      : parseFloat(quantity).toFixed(8);
  };

  // Calculate total (price * quantity)
  const calculateTotal = (
    price: string | number,
    quantity: string | number,
  ) => {
    const priceNum = typeof price === 'number' ? price : parseFloat(price);
    const quantityNum =
      typeof quantity === 'number' ? quantity : parseFloat(quantity);
    return (priceNum * quantityNum).toFixed(5);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`${className || ''} w-full h-full`}>
        <div className="p-3 border-b border-gray-800">
          <h3 className="text-white font-medium">Order Book</h3>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError || !orderbook) {
    return (
      <div className={`${className || ''} w-full h-full`}>
        <div className="p-3 border-b border-gray-800">
          <h3 className="text-white font-medium">Order Book</h3>
        </div>
        <div className="flex justify-center items-center py-12 text-red-500">
          Error loading order book
        </div>
      </div>
    );
  }

  // Get the current price (middle of the book)
  const currentPrice =
    orderbook.bids &&
    orderbook.asks &&
    orderbook.bids.length > 0 &&
    orderbook.asks.length > 0
      ? (parseFloat(orderbook.bids[0][0]) + parseFloat(orderbook.asks[0][0])) /
        2
      : 0;

  return (
    <div className={`${className || ''} w-full h-full`}>
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-white font-medium">
          Order Book{' '}
          <span className="text-xs text-gray-400">({exchangeName})</span>
        </h3>
      </div>

      <div className="px-3 py-2 flex justify-between text-xs text-gray-400">
        <div>Amount ({baseAsset})</div>
        <div>Price ({quoteAsset})</div>
        <div>Total</div>
      </div>

      <div className="px-3 py-2 h-80 overflow-y-auto">
        <div className="space-y-1">
          {orderbook.asks
            ?.slice(0, 10)
            .reverse()
            .map((ask, i) => (
              <div key={`sell-${i}`} className="flex justify-between text-xs">
                <div className="text-white">{formatQuantity(ask[1])}</div>
                <div className="text-crypto-red">{formatPrice(ask[0])}</div>
                <div className="text-white">
                  {calculateTotal(ask[0], ask[1])}
                </div>
              </div>
            ))}
        </div>

        <div className="my-2 py-2 border-y border-gray-800">
          <div className="flex justify-between text-sm">
            <div className="font-medium text-white">
              {currentPrice.toFixed(2)}
            </div>
            <div className="font-medium text-white">
              ${currentPrice.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {orderbook.bids?.slice(0, 10).map((bid, i) => (
            <div key={`buy-${i}`} className="flex justify-between text-xs">
              <div className="text-white">{formatQuantity(bid[1])}</div>
              <div className="text-crypto-green">{formatPrice(bid[0])}</div>
              <div className="text-white">{calculateTotal(bid[0], bid[1])}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-gray-800">
        <h3 className="text-white font-medium mb-2">Recent Trades</h3>

        <div className="grid grid-cols-3 text-xs text-gray-400 mb-2">
          <div>Amount ({baseAsset})</div>
          <div>Price ({quoteAsset})</div>
          <div>Time</div>
        </div>

        <div className="space-y-2 h-60 overflow-y-auto">
          {[...Array(10)].map((_, i) => {
            // Generate random trade data based on the current pair
            const quantity = (Math.random() * 0.01).toFixed(8);
            const price = parseFloat(orderbook.bids[0]?.[0] || '0');
            const priceWithVariation = (
              price *
              (1 + (Math.random() * 0.002 - 0.001))
            ).toFixed(2);
            const now = new Date();
            const minutes = now.getMinutes() - i;
            const seconds = Math.floor(Math.random() * 60);
            const timeString = `${now.getHours()}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;

            // Randomly determine if it's a buy or sell
            const isBuy = Math.random() > 0.5;

            return (
              <div key={`trade-${i}`} className="grid grid-cols-3 text-xs">
                <div className="text-white">{quantity}</div>
                <div
                  className={isBuy ? 'text-crypto-green' : 'text-crypto-red'}
                >
                  {priceWithVariation}
                </div>
                <div className="text-gray-400">{timeString}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
