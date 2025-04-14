import React from "react";

export function PriceOverview() {
  return (
    <div className="p-4 border-b border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">BTC/USDT 1h</div>
          <div className="flex items-baseline space-x-4">
            <div className="text-xl font-bold text-white">$83,055.34</div>
            <div className="text-crypto-green text-sm">+0.84%</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-gray-400">24h Change</div>
            <div className="text-crypto-green">+0.84%</div>
          </div>
          <div>
            <div className="text-gray-400">High</div>
            <div className="text-white">$3,534.64</div>
          </div>
          <div>
            <div className="text-gray-400">Low</div>
            <div className="text-white">$1,644.81</div>
          </div>
          <div>
            <div className="text-gray-400">24h Volume (USDT)</div>
            <div className="text-white">817.06m</div>
          </div>
        </div>
      </div>
    </div>
  );
}
