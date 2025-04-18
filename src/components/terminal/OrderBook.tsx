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

  // Determine price trend based on recent trades (simplified for demo)
  // In a real app, this would be based on actual price history
  const isPriceUp = selectedPair
    ? !selectedPair.change24h.includes('-')
    : Math.random() > 0.5;

  // Calculate maximum volume for scaling the volume bars
  const askVolumes =
    orderbook.asks?.slice(0, 10).map((ask) => parseFloat(ask[1])) || [];
  const bidVolumes =
    orderbook.bids?.slice(0, 10).map((bid) => parseFloat(bid[1])) || [];
  const maxAskVolume = Math.max(...askVolumes, 0.1); // Prevent division by zero
  const maxBidVolume = Math.max(...bidVolumes, 0.1); // Prevent division by zero

  return (
    <div className="h-screen flex flex-col">
      {/* Order Book Header */}
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-white font-medium">
          Order Book{' '}
          <span className="text-xs text-gray-400">({exchangeName})</span>
        </h3>
      </div>

      {/* Order Book Column Headers */}
      <div className="px-2 py-2 grid grid-cols-3 gap-x-0 text-xs text-gray-400">
        <div>Amount ({baseAsset})</div>
        <div className="text-center">Price ({quoteAsset})</div>
        <div className="text-right">Total</div>
      </div>

      {/* Order Book Content - Scrollable */}
      <div className="px-2 py-2 flex-1 overflow-hidden flex flex-col">
        {/* Asks (Sell Orders) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="space-y-1">
            {orderbook.asks
              ?.slice(0, 10)
              .reverse()
              .map((ask, i) => {
                // Calculate volume percentage for the bar width
                const volume = parseFloat(ask[1]);
                const volumePercentage = (volume / maxAskVolume) * 100;

                return (
                  <div
                    key={`sell-${i}`}
                    className="grid grid-cols-3 gap-x-0 text-xs relative py-0.5"
                  >
                    {/* Volume bar - positioned absolutely behind the text */}
                    <div
                      className="absolute top-0 right-0 h-full bg-crypto-red opacity-30"
                      style={{ width: `${volumePercentage}%`, maxWidth: '95%' }}
                    />
                    {/* Content - positioned on top of the volume bar */}
                    <div className="text-white relative z-10">
                      {formatQuantity(ask[1])}
                    </div>
                    <div className="text-crypto-red text-center relative z-10">
                      {formatPrice(ask[0])}
                    </div>
                    <div className="text-white text-right relative z-10">
                      {calculateTotal(ask[0], ask[1])}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Current Price */}
        <div className="py-2 border-y border-gray-800">
          <div className="grid grid-cols-2 gap-x-0 text-sm">
            <div
              className={`font-medium ${isPriceUp ? 'text-crypto-green' : 'text-crypto-red'}`}
            >
              {currentPrice.toFixed(2)}
            </div>
            <div
              className={`font-medium ${isPriceUp ? 'text-crypto-green' : 'text-crypto-red'} text-right`}
            >
              ${currentPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="space-y-1">
            {orderbook.bids?.slice(0, 10).map((bid, i) => {
              // Calculate volume percentage for the bar width
              const volume = parseFloat(bid[1]);
              const volumePercentage = (volume / maxBidVolume) * 100;

              return (
                <div
                  key={`buy-${i}`}
                  className="grid grid-cols-3 gap-x-0 text-xs relative py-0.5"
                >
                  {/* Volume bar - positioned absolutely behind the text */}
                  <div
                    className="absolute top-0 left-0 h-full bg-crypto-green opacity-30"
                    style={{ width: `${volumePercentage}%`, maxWidth: '95%' }}
                  />
                  {/* Content - positioned on top of the volume bar */}
                  <div className="text-white relative z-10">
                    {formatQuantity(bid[1])}
                  </div>
                  <div className="text-crypto-green text-center relative z-10">
                    {formatPrice(bid[0])}
                  </div>
                  <div className="text-white text-right relative z-10">
                    {calculateTotal(bid[0], bid[1])}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Trades Section */}
      <div className="p-2 border-t border-gray-800 h-[35%] overflow-hidden flex flex-col">
        <h3 className="text-white font-medium mb-2">Recent Trades</h3>

        <div className="grid grid-cols-3 gap-x-0 text-xs text-gray-400 mb-2">
          <div>Amount ({baseAsset})</div>
          <div className="text-center">Price ({quoteAsset})</div>
          <div className="text-right">Time</div>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 scrollbar-thin">
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
              <div
                key={`trade-${i}`}
                className="grid grid-cols-3 gap-x-0 text-xs"
              >
                <div className="text-white">{quantity}</div>
                <div
                  className={`${isBuy ? 'text-crypto-green' : 'text-crypto-red'} text-center`}
                >
                  {priceWithVariation}
                </div>
                <div className="text-gray-400 text-right">{timeString}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
