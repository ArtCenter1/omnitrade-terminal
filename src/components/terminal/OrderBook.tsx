import React from "react";

export function OrderBook() {
  return (
    <div className="col-span-3">
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-white font-medium">Order Book</h3>
      </div>

      <div className="px-3 py-2 flex justify-between text-xs text-gray-400">
        <div>Amount (BTC)</div>
        <div>Price (USDT)</div>
        <div>Total</div>
      </div>

      <div className="px-3 py-2 h-80 overflow-y-auto">
        <div className="space-y-1">
          {[...Array(10)].map((_, i) => (
            <div key={`sell-${i}`} className="flex justify-between text-xs">
              <div className="text-white">0.00076000</div>
              <div className="text-crypto-red">83860.01000000</div>
              <div className="text-white">5.81412</div>
            </div>
          ))}
        </div>

        <div className="my-2 py-2 border-y border-gray-800">
          <div className="flex justify-between text-sm">
            <div className="font-medium text-white">83,055.34</div>
            <div className="font-medium text-white">$83,055.34</div>
          </div>
        </div>

        <div className="space-y-1">
          {[...Array(10)].map((_, i) => (
            <div key={`buy-${i}`} className="flex justify-between text-xs">
              <div className="text-white">0.00072000</div>
              <div className="text-crypto-green">83854.30000000</div>
              <div className="text-white">5.81413</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-gray-800">
        <h3 className="text-white font-medium mb-2">Recent Trades</h3>

        <div className="grid grid-cols-3 text-xs text-gray-400 mb-2">
          <div>Amount (BTC)</div>
          <div>Price (USDT)</div>
          <div>Time</div>
        </div>

        <div className="space-y-2 h-60 overflow-y-auto">
          {[...Array(10)].map((_, i) => (
            <div key={`trade-${i}`} className="grid grid-cols-3 text-xs">
              <div className="text-white">0.00240000</div>
              <div className="text-crypto-green">83855.34000000</div>
              <div className="text-gray-400">19:34:56</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
