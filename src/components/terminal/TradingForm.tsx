import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TradingForm() {
  return (
    <div className="border-t border-gray-800 pt-6">
      <div className="flex justify-center mb-4">
        <Tabs defaultValue="market" className="w-full">
          <TabsList className="grid grid-cols-3 bg-gray-900">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
            <TabsTrigger value="stop">Stop</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button className="flex-1 bg-crypto-green hover:bg-crypto-green/90 text-white">
          BUY BTC
        </Button>
        <Button className="flex-1 bg-crypto-red hover:bg-crypto-red/90 text-white">
          SELL BTC
        </Button>
      </div>

      <div className="mb-4">
        <div className="text-gray-400 mb-2 text-xs">Amount</div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs">BTC</div>
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
          <div className="text-gray-400 text-xs">USDT</div>
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
          <div className="text-xs text-white">= 0.00 USDT</div>
        </div>
        <div className="flex justify-between">
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-xs text-white">= 0.00 USDT</div>
        </div>
      </div>

      <Button className="w-full bg-crypto-green hover:bg-crypto-green/90 text-white">
        BUY BTC
      </Button>
    </div>
  );
}
