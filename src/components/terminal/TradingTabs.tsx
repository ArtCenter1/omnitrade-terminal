import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradingPair } from './TradingPairSelector';

interface TradingTabsProps {
  selectedPair?: TradingPair;
  onOrderPlaced?: () => void;
}

export function TradingTabs({ selectedPair, onOrderPlaced }: TradingTabsProps) {
  const [activeTab, setActiveTab] = useState('Market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState('');

  // Use the selected pair or default to BTC/USDT
  const baseAsset = selectedPair?.baseAsset || 'BTC';
  const quoteAsset = selectedPair?.quoteAsset || 'USDT';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotal(e.target.value);
  };

  const handlePlaceOrder = () => {
    // Implement order placement logic
    if (onOrderPlaced) {
      onOrderPlaced();
    }
  };

  return (
    <div className="px-1 py-2">
      <Tabs defaultValue="Market" className="w-full mb-2">
        <TabsList className="grid grid-cols-3 w-full h-8">
          <TabsTrigger value="Market" className="text-xs px-1 py-0">
            Market
          </TabsTrigger>
          <TabsTrigger value="Limit" className="text-xs px-1 py-0">
            Limit
          </TabsTrigger>
          <TabsTrigger value="Stop" className="text-xs px-1 py-0">
            Stop
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-1 mb-2">
        <Button
          className={`${side === 'buy' ? 'bg-crypto-green' : 'bg-gray-800'} text-white h-8 px-2 py-0`}
          onClick={() => setSide('buy')}
        >
          Buy
        </Button>
        <Button
          className={`${side === 'sell' ? 'bg-crypto-red' : 'bg-gray-800'} text-white h-8 px-2 py-0`}
          onClick={() => setSide('sell')}
        >
          Sell
        </Button>
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-gray-400">Amount</span>
          <span className="text-xs text-gray-400">{baseAsset}</span>
        </div>
        <Input
          value={amount}
          onChange={handleAmountChange}
          className="bg-gray-900 border-gray-800 h-7 text-sm py-0"
        />
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-gray-400">Total</span>
          <span className="text-xs text-gray-400">{quoteAsset}</span>
        </div>
        <Input
          value={total}
          onChange={handleTotalChange}
          className="bg-gray-900 border-gray-800 h-7 text-sm py-0"
        />
      </div>

      <div className="grid grid-cols-4 gap-1 mb-2">
        <Button variant="outline" className="text-xs py-0 h-6 min-w-0 px-1">
          25%
        </Button>
        <Button variant="outline" className="text-xs py-0 h-6 min-w-0 px-1">
          50%
        </Button>
        <Button variant="outline" className="text-xs py-0 h-6 min-w-0 px-1">
          75%
        </Button>
        <Button variant="outline" className="text-xs py-0 h-6 min-w-0 px-1">
          100%
        </Button>
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-gray-400">Total</span>
          <span className="text-xs text-white">
            ≈ {total || '0.00'} {quoteAsset}
          </span>
        </div>
      </div>

      <Button
        className={`w-full ${side === 'buy' ? 'bg-crypto-green hover:bg-crypto-green/90' : 'bg-crypto-red hover:bg-crypto-red/90'} h-8 py-0`}
        onClick={handlePlaceOrder}
      >
        Place Order
      </Button>
    </div>
  );
}
