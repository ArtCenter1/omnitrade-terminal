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

  // Use the selected pair or default to BTC/USDT
  const baseAsset = selectedPair?.baseAsset || 'BTC';
  const quoteAsset = selectedPair?.quoteAsset || 'USDT';

  const handleOrderTypeChange = (type: 'market' | 'limit' | 'stop') => {
    setOrderType(type);
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
              defaultValue="0"
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
              defaultValue="0"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        <div className="text-xs text-gray-400">25%</div>
        <div className="text-xs text-gray-400">50%</div>
        <div className="text-xs text-gray-400">75%</div>
        <div className="text-xs text-gray-400">100%</div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <div className="text-xs text-gray-400">Binance Fee</div>
          <div className="text-xs text-white">= 0.00 {quoteAsset}</div>
        </div>
        <div className="flex justify-between">
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-xs text-white">= 0.00 {quoteAsset}</div>
        </div>
      </div>

      <Button className="w-full bg-crypto-green hover:bg-crypto-green/90 text-white">
        BUY {baseAsset}
      </Button>
    </div>
  );
}
