import React from "react";
import { ChevronDown } from "lucide-react";

export function ExchangeSelector() {
  return (
    <div className="mb-6">
      <div className="text-gray-400 mb-2 text-xs">Exchange</div>
      <div className="bg-gray-900 border border-gray-800 rounded p-2 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
            <img
              src="/placeholder.svg"
              alt="Binance"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white">Binance</span>
        </div>
        <ChevronDown size={16} className="text-gray-500" />
      </div>
    </div>
  );
}
