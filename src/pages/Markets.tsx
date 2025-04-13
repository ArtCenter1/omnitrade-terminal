
import { CircleDollarSign, Info, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useMarkets } from "@/services/marketDataApi"; // Import the new hook
import { MarketCoin } from "@/types/marketData"; // Import the type
// Removed unused SymbolRow import
// Removed unused getSparklinePath function
export default function Markets() {
  // Use the new useMarkets hook
  const { data: markets, isLoading, isError, error } = useMarkets({
    vs_currency: 'usd',
    page: 1,
    per_page: 100, // Fetch 100 coins per page
    sparkline: true, // Request sparkline data
  });

  // --- Roo Debug Logging ---
  console.log('[Markets Page] Hook State:', { isLoading, isError, error, markets });
  // --- End Debug Logging ---

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-400 py-20">Loading market data...</div>
      </div>
    );
  }

  if (isError) {
    // Log the specific error from the backend or network failure
    console.error('[Markets Page] Error loading markets:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500 py-20">
          Error: {error?.message || "Failed to load market data."}
        </div>
      </div>
    );
  }

  // Check if markets array is empty or undefined
  if (!markets || markets.length === 0) {
    console.log('[Markets Page] No market data received.');
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-400 py-20">No market data available.</div>
      </div>
    );
  }

  // Helper function for sparkline (can be moved to utils)
  function getSparklinePath(data: number[] | undefined, width = 100, height = 30): string {
    if (!data || data.length === 0) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero if all values are the same
    const step = width / (data.length - 1 || 1); // Avoid division by zero if only one point

    // Ensure y calculation doesn't produce NaN or Infinity
    const scale = (val: number) => height - ((val - min) / range) * (height - 4) - 2;

    return data
      .map((d, i) => {
        const x = i * step;
        const y = scale(d);
        // Ensure y is a valid number
        const yCoord = isFinite(y) ? y.toFixed(2) : (height / 2).toFixed(2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${yCoord}`;
      })
      .join(" ");
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Market Overview</h1>
            <div className="flex items-center text-sm text-gray-400 mt-1">
              {/* Display actual count */}
              <span className="text-crypto-green mr-1">{markets?.length ?? 0}+</span>
              <span>Coins/Markets (Page 1)</span> {/* Indicate page */}
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
                {/* Update table headers */}
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 w-10">#</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 w-8"></th> {/* Fav */}
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">24h %</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">24h Volume</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Market Cap</th>
                {/* <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Circulating Supply</th> */}
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">7d Change</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((coin: MarketCoin, index: number) => {
                const priceChange24h = coin.price_change_percentage_24h ?? 0;
                const isPositiveChange = priceChange24h >= 0;
                const sparklineData = coin.sparkline_in_7d?.price;
                const sparklinePath = getSparklinePath(sparklineData, 80, 20);

                return (
                  <tr key={coin.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    {/* Rank */}
                    <td className="py-4 px-4 text-sm text-gray-300">{coin.market_cap_rank ?? index + 1}</td>
                    {/* Favorite */}
                    <td className="py-4 px-4">
                      <Button variant="ghost" className="h-6 w-6 p-0">
                        <Star size={16} className="text-gray-500" />
                      </Button>
                    </td>
                    {/* Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0">
                          <img src={coin.image} alt={coin.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{coin.name}</div>
                          <div className="text-xs text-gray-400">{coin.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    {/* Price */}
                    <td className="py-4 px-4 text-right text-white">
                      ${coin.current_price?.toLocaleString() ?? '-'}
                    </td>
                    {/* 24h Change % */}
                    <td className={`py-4 px-4 text-right ${isPositiveChange ? 'text-crypto-green' : 'text-crypto-red'}`}>
                      {priceChange24h?.toFixed(2) ?? '-'}%
                    </td>
                    {/* 24h Volume */}
                    <td className="py-4 px-4 text-right text-gray-300">
                      ${coin.total_volume?.toLocaleString() ?? '-'}
                    </td>
                    {/* Market Cap */}
                    <td className="py-4 px-4 text-right text-gray-300">
                      ${coin.market_cap?.toLocaleString() ?? '-'}
                    </td>
                    {/* Circulating Supply (Optional) */}
                    {/* <td className="py-4 px-4 text-right text-gray-300">
                      {coin.circulating_supply?.toLocaleString() ?? '-'} {coin.symbol.toUpperCase()}
                    </td> */}
                    {/* 7d Sparkline */}
                    <td className="py-4 px-4 text-right">
                      <div className="h-10 w-20 ml-auto">
                        {sparklinePath ? (
                          <svg viewBox="0 0 80 20" className="h-full w-full">
                            <path
                              d={sparklinePath}
                              stroke={isPositiveChange ? '#05c48a' : '#ea3943'}
                              fill="none"
                              strokeWidth="1.5"
                            />
                          </svg>
                        ) : (
                          <span className="text-xs text-gray-500">N/A</span>
                        )}
                      </div>
                    </td>
                    {/* Action */}
                    <td className="py-4 px-4 text-center">
                      <Button variant="outline" className="border-gray-600 hover:bg-gray-800 text-xs rounded h-8">
                        TRADE
                      </Button>
                    </td>
                  </tr>
                );
              })}
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
