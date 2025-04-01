
import { ArrowDown, BarChart3, ChevronDown, Clock, History, LayoutGrid, Menu, Search, Settings, Maximize, Save, BarChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssetRow } from "@/components/AssetRow";
import { PerformanceChart } from "@/components/PerformanceChart";
import { mockAssets, generatePriceChartData } from "@/lib/utils";
import { Info } from "lucide-react";

export default function Terminal() {
  const chartData = generatePriceChartData(false);

  return (
    <div className="bg-black min-h-screen">
      <div className="grid grid-cols-12 gap-0">
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
        
        <div className="col-span-9">
          <div className="flex justify-between items-center border-b border-gray-800 p-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-900 rounded p-1">
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <img src="/placeholder.svg" alt="BTC" className="w-full h-full object-cover" />
                </div>
                <span className="text-white mx-2">BTC/USDT</span>
                <ChevronDown size={16} className="text-gray-500" />
              </div>
              
              <div className="text-xs text-gray-400">1h</div>
              
              <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
                <BarChart3 size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
                <BarChart size={16} />
              </Button>
              
              <Button variant="ghost" size="sm" className="h-7 text-gray-400 text-xs">
                Indicators
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
                <Save size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
                <Settings size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
                <Maximize size={16} />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-0">
            <div className="col-span-9 border-r border-gray-800">
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
              
              <div className="p-4 h-96 flex items-center justify-center">
                <PerformanceChart data={chartData} isPositive={false} className="h-full w-full" />
              </div>
              
              <div className="p-4 border-t border-gray-800">
                <div className="grid grid-cols-6 gap-4">
                  <Button variant="outline" size="sm" className="border-gray-800 text-xs">5y</Button>
                  <Button variant="outline" size="sm" className="border-gray-800 text-xs">1y</Button>
                  <Button variant="outline" size="sm" className="border-gray-800 text-xs">6m</Button>
                  <Button variant="outline" size="sm" className="border-gray-800 text-xs">3m</Button>
                  <Button variant="outline" size="sm" className="border-gray-800 text-xs">1m</Button>
                  <Button variant="outline" size="sm" className="border-gray-800 text-xs">5d</Button>
                  <Button variant="outline" size="sm" className="border-gray-800 text-xs">1d</Button>
                </div>
              </div>
            </div>
            
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
          </div>
          
          <div className="p-4 border-t border-gray-800">
            <h3 className="text-white font-medium mb-4">Assets</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Asset</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Available</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Amount</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                      <div className="flex items-center">
                        Value (USD)
                        <Info size={14} className="ml-1 text-gray-500" />
                      </div>
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                      <div className="flex items-center">
                        Last Price
                        <Info size={14} className="ml-1 text-gray-500" />
                      </div>
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">24h Change</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">7d Chart</th>
                    <th className="text-center py-2 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAssets.slice(0, 5).map((asset, index) => (
                    <AssetRow key={index} asset={asset} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
