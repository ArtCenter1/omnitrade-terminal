import React from 'react';
import { TradingPair } from './TradingPairSelector';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';

interface PriceOverviewProps {
  selectedPair?: TradingPair;
}

export function PriceOverview({ selectedPair }: PriceOverviewProps = {}) {
  const { selectedAccount } = useSelectedAccount();

  // Default values if no pair is selected
  const defaultPair: TradingPair = {
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: '83,055.34',
    change24h: '+0.84%',
    volume24h: '817.06m',
  };

  // Use selected pair or default
  const pair = selectedPair || defaultPair;

  // Determine if change is positive for styling
  const isPositiveChange = !pair.change24h.includes('-');
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">{pair.symbol}</div>
          <div className="flex items-baseline space-x-4">
            <div
              className={`text-xl font-bold ${isPositiveChange ? 'text-crypto-green' : 'text-crypto-red'}`}
            >
              ${pair.price}
            </div>
            <div
              className={`text-sm ${isPositiveChange ? 'text-crypto-green' : 'text-crypto-red'}`}
            >
              {pair.change24h}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-gray-400">24h Change</div>
            <div
              className={
                isPositiveChange ? 'text-crypto-green' : 'text-crypto-red'
              }
            >
              {pair.change24h}
            </div>
          </div>
          <div>
            <div className="text-gray-400">High</div>
            <div className="text-white">
              $
              {Number(pair.price.replace(/,/g, '')) * 1.02 > 1
                ? (Number(pair.price.replace(/,/g, '')) * 1.02).toLocaleString()
                : (Number(pair.price.replace(/,/g, '')) * 1.02).toFixed(8)}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Low</div>
            <div className="text-white">
              $
              {Number(pair.price.replace(/,/g, '')) * 0.98 > 1
                ? (Number(pair.price.replace(/,/g, '')) * 0.98).toLocaleString()
                : (Number(pair.price.replace(/,/g, '')) * 0.98).toFixed(8)}
            </div>
          </div>
          <div>
            <div className="text-gray-400">24h Volume ({pair.quoteAsset})</div>
            <div className="text-white">{pair.volume24h}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
