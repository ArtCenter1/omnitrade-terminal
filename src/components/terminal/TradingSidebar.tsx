
import React from "react";
import { ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TradingSidebar() {
  return (
    <div className="col-span-3 border-r border-gray-800 p-4">
      <div className="mb-6">
        <div className="text-gray-400 mb-2 text-xs">Exchange</div>
        <div className="bg-gray-900 border border-gray-800 rounded p-2 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
              <img src="/placeholder.svg" alt="Binance" className="w-full h-full object-cover" />
            </div>
            <span className="text-white">Binance</span>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
      
      <div className="mb-6">
        <div className="text-gray-400 mb-2 text-xs">Account</div>
        <div className="bg-gray-900 border border-gray-800 rounded p-2 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"/>
                <polygon points="12 15 17 21 7 21 12 15"/>
              </svg>
            </div>
            <span className="text-white">Binance Artcenter1</span>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
      
      <div className="mb-6">
        <div className="text-gray-400 mb-2 text-xs">Available Balances</div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                <img src="/placeholder.svg" alt="BTC" className="w-full h-full object-cover" />
              </div>
              <span className="text-white">BTC</span>
            </div>
            <div className="text-white">0.01797199</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                <img src="/placeholder.svg" alt="USDT" className="w-full h-full object-cover" />
              </div>
              <span className="text-white">USDT</span>
            </div>
            <div className="text-white">0.00</div>
          </div>
        </div>
      </div>
      
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
              <Input className="h-8 bg-gray-900 border-gray-800 text-right text-white w-full" defaultValue="0" />
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-gray-400 mb-2 text-xs">Total</div>
          <div className="flex justify-between items-center mb-2">
            <div className="text-gray-400 text-xs">USDT</div>
            <div className="flex items-center">
              <Input className="h-8 bg-gray-900 border-gray-800 text-right text-white w-full" defaultValue="0" />
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
      
      <div className="mt-6">
        <Tabs defaultValue="balances">
          <TabsList className="grid grid-cols-4 bg-gray-900">
            <TabsTrigger value="balances" className="text-xs">Balances</TabsTrigger>
            <TabsTrigger value="openOrders" className="text-xs">Open Orders</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Order History</TabsTrigger>
            <TabsTrigger value="transfers" className="text-xs">Transfers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
