import React, { useState } from 'react';
import { OrderTypeSelector } from './OrderTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradingPair } from './TradingPairSelector';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';

interface TradingFormProps {
  selectedPair?: TradingPair;
}

export function TradingForm({ selectedPair }: TradingFormProps = {}) {
  const { selectedAccount } = useSelectedAccount();
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>(
    'market',
  );
  const [amount, setAmount] = useState<string>('0');
  const [total, setTotal] = useState<string>('0');

  // Use the selected pair or default to BTC/USDT
  const baseAsset = selectedPair?.baseAsset || 'BTC';
  const quoteAsset = selectedPair?.quoteAsset || 'USDT';

  const handleOrderTypeChange = (type: 'market' | 'limit' | 'stop') => {
    setOrderType(type);
  };

  const handlePercentageClick = (percentage: number) => {
    // Mock quote asset balance (what we're paying with)
    const quoteBalance =
      quoteAsset === 'USDT' ? 16000 : quoteAsset === 'BTC' ? 0.38 : 10;

    // Mock base asset balance (what we're selling)
    const baseBalance =
      baseAsset === 'BTC'
        ? 0.28
        : baseAsset === 'ETH'
          ? 2.5
          : baseAsset === 'DOT'
            ? 43.41
            : 10;

    // Get the current price
    const currentPrice = selectedPair?.price
      ? parseFloat(selectedPair.price.replace(/,/g, ''))
      : 20000;

    // For buy orders, use the quote asset (e.g., USDT) directly
    if (currentPrice > 0) {
      // Calculate the percentage of the quote asset
      const quoteAmount = (quoteBalance * percentage) / 100;
      console.log(
        `${percentage}% of ${quoteBalance} ${quoteAsset} = ${quoteAmount} ${quoteAsset}`,
      );

      // Convert to the equivalent base asset amount
      const baseAmount = quoteAmount / currentPrice;
      console.log(
        `${quoteAmount} ${quoteAsset} = ${baseAmount} ${baseAsset} at price ${currentPrice}`,
      );

      // Set the amount to the calculated base asset amount
      setAmount(baseAmount.toFixed(8));

      // Set the total to the calculated quote asset amount
      setTotal(quoteAmount.toFixed(2));
    } else {
      // If we don't have a valid price, use default values
      const baseAmount = (baseBalance * percentage) / 100;
      setAmount(baseAmount.toFixed(8));
      setTotal('0.00');
    }
  };
  return (
    <div className="border-t border-gray-800 pt-6">
      <div className="mb-4">
        <OrderTypeSelector
          activeOrderType={orderType}
          onOrderTypeChange={handleOrderTypeChange}
        />
      </div>

      <div className="flex space-x-2 mb-4">
        <Button className="flex-1 bg-crypto-green hover:bg-crypto-green/90 text-white">
          BUY {baseAsset}
        </Button>
        <Button className="flex-1 bg-crypto-red hover:bg-crypto-red/90 text-white">
          SELL {baseAsset}
        </Button>
      </div>

      <div className="mb-4">
        <div className="text-gray-400 mb-2 text-xs">Amount</div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs">{baseAsset}</div>
          <div className="flex items-center">
            <Input
              className="h-8 bg-gray-900 border-gray-800 text-right text-white w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-gray-400 mb-2 text-xs">Total</div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs">{quoteAsset}</div>
          <div className="flex items-center">
            <Input
              className="h-8 bg-gray-900 border-gray-800 text-right text-white w-full"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 mb-4">
        <Button
          variant="outline"
          className="text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(25)}
        >
          25%
        </Button>
        <Button
          variant="outline"
          className="text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(50)}
        >
          50%
        </Button>
        <Button
          variant="outline"
          className="text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(75)}
        >
          75%
        </Button>
        <Button
          variant="outline"
          className="text-xs py-0 h-6 min-w-0 px-1"
          onClick={() => handlePercentageClick(100)}
        >
          100%
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <div className="text-xs text-gray-400">Binance Fee</div>
          <div className="text-xs text-white">= 0.00 {quoteAsset}</div>
        </div>
        <div className="flex justify-between">
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-xs text-white">
            = {total} {quoteAsset}
          </div>
        </div>
      </div>

      <Button className="w-full bg-crypto-green hover:bg-crypto-green/90 text-white">
        BUY {baseAsset}
      </Button>
    </div>
  );
}
