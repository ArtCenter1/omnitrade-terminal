
import { CircleDollarSign, Info, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Markets() {
  const markets = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      price: "$85,138.00",
      change: "+1.5%",
      volume: "18.9bn BTC",
      marketCap: "$1.65T",
      supply: "19.5M BTC",
      isPositive: true,
      isFavorite: true
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      price: "$3,448.21",
      change: "-4.6%",
      volume: "19.4bn ETH",
      marketCap: "$414.18B",
      supply: "120.4M ETH",
      isPositive: false,
      isFavorite: true
    },
    {
      name: "Tether",
      symbol: "USDT",
      price: "$1.00",
      change: "+0.01%",
      volume: "$90.35B",
      marketCap: "$114.13B",
      supply: "114.1B USDT",
      isPositive: true,
      isFavorite: false
    },
    {
      name: "BNB",
      symbol: "BNB",
      price: "$606.25",
      change: "-3.28%",
      volume: "$1.41B",
      marketCap: "$91.08B",
      supply: "150.2M BNB",
      isPositive: false,
      isFavorite: true
    },
    {
      name: "Solana",
      symbol: "SOL",
      price: "$131.83",
      change: "-1.7%",
      volume: "$2.17B",
      marketCap: "$57.17B",
      supply: "433.8M SOL",
      isPositive: false,
      isFavorite: true
    },
    {
      name: "USDC",
      symbol: "USDC",
      price: "$1.00",
      change: "+0.001%",
      volume: "$28.10B",
      marketCap: "$33.10B",
      supply: "33.1B USDC",
      isPositive: true,
      isFavorite: false
    },
    {
      name: "XRP",
      symbol: "XRP",
      price: "$0.5881",
      change: "-1.45%",
      volume: "$2.12B",
      marketCap: "$32.31B",
      supply: "55.0B XRP",
      isPositive: false,
      isFavorite: false
    },
    {
      name: "Cardano",
      symbol: "ADA",
      price: "$0.45",
      change: "-1.20%",
      volume: "$391.9M",
      marketCap: "$16.17B",
      supply: "36.0B ADA",
      isPositive: false,
      isFavorite: false
    },
    {
      name: "Dogecoin",
      symbol: "DOGE",
      price: "$0.1127",
      change: "-2.32%",
      volume: "$1.19B",
      marketCap: "$16.02B",
      supply: "142.4B DOGE",
      isPositive: false,
      isFavorite: false
    },
    {
      name: "TRON",
      symbol: "TRX",
      price: "$0.14",
      change: "-1.54%",
      volume: "$300.2M",
      marketCap: "$12.91B",
      supply: "88.7B TRX",
      isPositive: false,
      isFavorite: false
    }
  ];

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
                        <img src="/placeholder.svg" alt={market.name} className="w-full h-full object-cover" />
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
                  <td className="py-4 px-4 text-right text-gray-300">{market.supply}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-10 w-20 ml-auto">
                      <svg viewBox="0 0 100 30" className="h-full w-full">
                        <path 
                          d={market.isPositive ? 
                            "M0,15 Q10,5 20,10 T40,5 T60,15 T80,5 T100,10" : 
                            "M0,10 Q10,15 20,20 T40,15 T60,25 T80,20 T100,25"
                          } 
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
