
import { CircleDollarSign, Info, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useCoingeckoMarkets } from "../hooks/useCoingeckoMarkets";

function getSparklinePath(data: number[], width = 100, height = 30): string {
  if (!data || data.length === 0) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  return data
    .map((d, i) => {
      const x = i * step;
      // Invert y so higher prices are higher in SVG
      const y = height - ((d - min) / range) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function Markets() {
  const { markets, loading, error } = useCoingeckoMarkets();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-400 py-20">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500 py-20">Error: {error}</div>
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-400 py-20">No market data available.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Market Overview</h1>
            <div className="flex items-center text-sm text-gray-400 mt-1">
              <span className="text-crypto-green mr-1">80+</span>
              <span>Coins/Markets</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="relative mr-4">
              <Search className="text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
              <Input 
                placeholder="Search Coins" 
                className="pl-10 bg-gray-800 border-gray-700 text-sm h-9 rounded-full w-60"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 w-10">#</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 w-8"></th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">24h Change</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">24h Volume</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Market Cap</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Circulating Supply</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">7d Change</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-4 px-4 text-sm text-gray-300">{index + 1}</td>
                  <td className="py-4 px-4">
                    <Button variant="ghost" className="h-6 w-6 p-0">
                      <Star size={16} className={market.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-500"} />
                    </Button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                        <img src={market.image} alt={market.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{market.name}</div>
                        <div className="text-xs text-gray-400">{market.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-white">{market.price}</td>
                  <td className={`py-4 px-4 text-right ${market.isPositive ? 'text-crypto-green' : 'text-crypto-red'}`}>
                    {market.change}
                  </td>
                  <td className="py-4 px-4 text-right text-gray-300">{market.volume}</td>
                  <td className="py-4 px-4 text-right text-gray-300">{market.marketCap}</td>
                  <td className="py-4 px-4 text-right text-gray-300">
                    {(() => {
                      // Remove symbol from supply if present (case-insensitive, with or without space)
                      const symbol = market.symbol.toUpperCase();
                      let supply = String(market.supply);
                      const regex = new RegExp(`\\s*${symbol}$`, "i");
                      supply = supply.replace(regex, "");
                      return `${supply} ${symbol}`;
                    })()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-10 w-20 ml-auto">
                      <svg viewBox="0 0 100 30" className="h-full w-full">
                        <path
                          d={getSparklinePath(market.sparkline)}
                          stroke={market.isPositive ? "#05c48a" : "#ea384d"}
                          fill="none"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Button variant="outline" className="border-gray-600 hover:bg-gray-800 text-xs rounded h-8">
                      TRADE
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 flex justify-center">
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="border-gray-700 h-8 w-8 p-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Button>
            <Button variant="outline" size="sm" className="border-gray-700 bg-gray-800 h-8 w-8 p-0">1</Button>
            <Button variant="outline" size="sm" className="border-gray-700 h-8 w-8 p-0">2</Button>
            <Button variant="outline" size="sm" className="border-gray-700 h-8 w-8 p-0">3</Button>
            <Button variant="outline" size="sm" className="border-gray-700 h-8 w-8 p-0">...</Button>
            <Button variant="outline" size="sm" className="border-gray-700 h-8 w-8 p-0">24</Button>
            <Button variant="outline" size="sm" className="border-gray-700 h-8 w-8 p-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
