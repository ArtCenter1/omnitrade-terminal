import {
  CircleDollarSign,
  Info,
  Search,
  Star,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { useCoingeckoMarkets } from '@/hooks/useCoingeckoMarkets';
import { useMarkets } from '@/services/marketDataApi';
import { MarketCoin } from '@/types/marketData';

// Fallback mock data for markets
const mockMarkets = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 63245.12,
    market_cap: 1245678901234,
    market_cap_rank: 1,
    fully_diluted_valuation: 1345678901234,
    total_volume: 32456789012,
    high_24h: 64100.23,
    low_24h: 62100.45,
    price_change_24h: 1145.67,
    price_change_percentage_24h: 1.82,
    market_cap_change_24h: 21456789012,
    market_cap_change_percentage_24h: 1.75,
    circulating_supply: 19568423,
    total_supply: 21000000,
    max_supply: 21000000,
    ath: 69000,
    ath_change_percentage: -8.34,
    ath_date: '2021-11-10T14:24:11.849Z',
    atl: 67.81,
    atl_change_percentage: 93190.36,
    atl_date: '2013-07-06T00:00:00.000Z',
    roi: null,
    last_updated: '2023-07-13T12:30:09.836Z',
    sparkline_in_7d: {
      price: [62100, 62400, 62800, 63100, 63400, 63200, 63245],
    },
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 3245.67,
    market_cap: 389012345678,
    market_cap_rank: 2,
    fully_diluted_valuation: 389012345678,
    total_volume: 12345678901,
    high_24h: 3300.12,
    low_24h: 3200.34,
    price_change_24h: 45.33,
    price_change_percentage_24h: 1.42,
    market_cap_change_24h: 5678901234,
    market_cap_change_percentage_24h: 1.48,
    circulating_supply: 120123456,
    total_supply: null,
    max_supply: null,
    ath: 4878.26,
    ath_change_percentage: -33.46,
    ath_date: '2021-11-10T14:24:19.604Z',
    atl: 0.432979,
    atl_change_percentage: 750551.24,
    atl_date: '2015-10-20T00:00:00.000Z',
    roi: {
      times: 83.84,
      currency: 'btc',
      percentage: 8384.48,
    },
    last_updated: '2023-07-13T12:30:22.128Z',
    sparkline_in_7d: {
      price: [3200, 3220, 3240, 3230, 3250, 3240, 3245],
    },
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    current_price: 145.23,
    market_cap: 62345678901,
    market_cap_rank: 5,
    fully_diluted_valuation: 78901234567,
    total_volume: 2345678901,
    high_24h: 148.12,
    low_24h: 142.34,
    price_change_24h: 2.89,
    price_change_percentage_24h: 2.03,
    market_cap_change_24h: 1234567890,
    market_cap_change_percentage_24h: 2.01,
    circulating_supply: 429123456,
    total_supply: 534123456,
    max_supply: null,
    ath: 259.96,
    ath_change_percentage: -44.13,
    ath_date: '2021-11-06T21:54:35.825Z',
    atl: 0.500801,
    atl_change_percentage: 28900.16,
    atl_date: '2020-05-11T19:35:23.449Z',
    roi: null,
    last_updated: '2023-07-13T12:30:14.458Z',
    sparkline_in_7d: {
      price: [142, 143, 144, 143.5, 144.5, 145, 145.23],
    },
  },
];

// Define the sort fields and directions
type SortField =
  | 'rank'
  | 'name'
  | 'price'
  | 'change_24h'
  | 'volume'
  | 'market_cap';
type SortDirection = 'asc' | 'desc';

export default function Markets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMarkets, setFilteredMarkets] = useState<MarketCoin[]>([]);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Try to use the backend API first
  const {
    data: apiMarkets,
    isLoading: isApiLoading,
    error: apiError,
  } = useMarkets(
    {
      vs_currency: 'usd',
      page: 1,
      per_page: 100,
      sparkline: true,
    },
    {
      // Don't retry too many times to avoid rate limits
      retry: 1,
      retryDelay: 5000,
      // Reduce stale time to quickly fall back to direct API
      staleTime: 30 * 1000, // 30 seconds
    },
  );

  // Fallback to direct CoinGecko API if backend fails
  const {
    markets: coingeckoMarkets,
    loading: isCoingeckoLoading,
    error: coingeckoError,
  } = useCoingeckoMarkets();

  // Log connection status for debugging
  useEffect(() => {
    if (apiError) {
      console.warn('Backend API connection failed:', apiError.message);
      console.info('Falling back to direct CoinGecko API access');
    }
    if (coingeckoError) {
      console.warn('Direct CoinGecko API access failed:', coingeckoError);
      console.info('Falling back to mock data');
    }
  }, [apiError, coingeckoError]);

  // Determine which data source to use
  const isLoading = isApiLoading && isCoingeckoLoading;
  const hasApiData =
    !isApiLoading && !apiError && apiMarkets && apiMarkets.length > 0;
  const hasCoingeckoData =
    !isCoingeckoLoading &&
    !coingeckoError &&
    coingeckoMarkets &&
    coingeckoMarkets.length > 0;

  // Convert CoinGecko markets to MarketCoin format if needed
  const convertedCoingeckoMarkets: MarketCoin[] =
    hasCoingeckoData && coingeckoMarkets
      ? coingeckoMarkets.map((market, index) => {
          // Parse price from string format (e.g. "$1,234.56")
          const priceString = market.price.replace('$', '').replace(/,/g, '');
          const price = parseFloat(priceString);

          // Parse market cap from string format (e.g. "$1.23B")
          let marketCap = 0;
          if (market.marketCap) {
            const mcString = market.marketCap.replace('$', '');
            if (mcString.endsWith('T')) {
              marketCap = parseFloat(mcString.replace('T', '')) * 1e12;
            } else if (mcString.endsWith('B')) {
              marketCap = parseFloat(mcString.replace('B', '')) * 1e9;
            } else if (mcString.endsWith('M')) {
              marketCap = parseFloat(mcString.replace('M', '')) * 1e6;
            } else if (mcString.endsWith('K')) {
              marketCap = parseFloat(mcString.replace('K', '')) * 1e3;
            } else {
              marketCap = parseFloat(mcString);
            }
          }

          // Parse volume from string format
          let volume = 0;
          if (market.volume) {
            const volString = market.volume.replace('$', '');
            if (volString.endsWith('T')) {
              volume = parseFloat(volString.replace('T', '')) * 1e12;
            } else if (volString.endsWith('B')) {
              volume = parseFloat(volString.replace('B', '')) * 1e9;
            } else if (volString.endsWith('M')) {
              volume = parseFloat(volString.replace('M', '')) * 1e6;
            } else if (volString.endsWith('K')) {
              volume = parseFloat(volString.replace('K', '')) * 1e3;
            } else {
              volume = parseFloat(volString);
            }
          }

          // Parse change percentage
          const changeString = market.change.replace('+', '').replace('%', '');
          const changePercentage = parseFloat(changeString);

          return {
            id: market.symbol.toLowerCase(),
            symbol: market.symbol.toLowerCase(),
            name: market.name,
            image: market.image,
            current_price: price,
            market_cap: marketCap,
            market_cap_rank: index + 1,
            fully_diluted_valuation: null,
            total_volume: volume,
            high_24h: price * 1.05, // Estimate
            low_24h: price * 0.95, // Estimate
            price_change_24h: price * (changePercentage / 100), // Estimate
            price_change_percentage_24h: changePercentage,
            market_cap_change_24h: marketCap * (changePercentage / 100), // Estimate
            market_cap_change_percentage_24h: changePercentage,
            circulating_supply: marketCap / price, // Estimate
            total_supply: null,
            max_supply: null,
            ath: price * 1.5, // Estimate
            ath_change_percentage: -33.33, // Estimate
            ath_date: new Date().toISOString(),
            atl: price * 0.5, // Estimate
            atl_change_percentage: 100, // Estimate
            atl_date: new Date(
              Date.now() - 365 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 1 year ago
            roi: null,
            last_updated: new Date().toISOString(),
            sparkline_in_7d: {
              price: market.sparkline,
            },
          };
        })
      : [];

  // Use API data if available, otherwise use CoinGecko data, finally fall back to mock data
  const marketsData: MarketCoin[] = hasApiData
    ? apiMarkets
    : hasCoingeckoData
      ? convertedCoingeckoMarkets
      : mockMarkets;

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending for rank, descending for others
      setSortField(field);
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;

    return sortDirection === 'asc' ? (
      <ChevronUp className="inline-block ml-1 w-4 h-4" />
    ) : (
      <ChevronDown className="inline-block ml-1 w-4 h-4" />
    );
  };

  // Filter and sort markets based on search query and sort settings
  const sortedAndFilteredMarkets = useMemo(() => {
    // First filter by search query
    let result = marketsData;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = marketsData.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query),
      );
    }

    // Then sort the filtered results
    return [...result].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'rank':
          aValue = a.market_cap_rank || Number.MAX_SAFE_INTEGER;
          bValue = b.market_cap_rank || Number.MAX_SAFE_INTEGER;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'price':
          aValue = a.current_price || 0;
          bValue = b.current_price || 0;
          break;
        case 'change_24h':
          aValue = a.price_change_percentage_24h || 0;
          bValue = b.price_change_percentage_24h || 0;
          break;
        case 'volume':
          aValue = a.total_volume || 0;
          bValue = b.total_volume || 0;
          break;
        case 'market_cap':
          aValue = a.market_cap || 0;
          bValue = b.market_cap || 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      // For string comparison we already returned above
      // For numeric comparison:
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [searchQuery, marketsData, sortField, sortDirection]);

  // Update filtered markets when sorted results change
  useEffect(() => {
    setFilteredMarkets(sortedAndFilteredMarkets);
  }, [sortedAndFilteredMarkets]);

  // Helper function for sparkline (can be moved to utils)
  function getSparklinePath(
    data: number[] | undefined,
    width: number,
    height: number,
  ): string | null {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero

    // Scale to fit the SVG viewBox
    const xScale = width / (data.length - 1);
    const yScale = height / range;

    // Generate path
    const points = data.map((value, index) => {
      const x = index * xScale;
      const y = height - (value - min) * yScale; // Invert Y axis
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  }

  // Determine connection status message
  const getConnectionStatus = () => {
    if (hasApiData) {
      return { message: 'Connected to backend API', type: 'success' };
    } else if (hasCoingeckoData) {
      return {
        message: 'Using direct CoinGecko API (backend unavailable)',
        type: 'warning',
      };
    } else if (!isLoading) {
      return { message: 'Using mock data (APIs unavailable)', type: 'error' };
    }
    return null;
  };

  const connectionStatus = getConnectionStatus();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-400 py-20">
          Loading market data...
        </div>
      </div>
    );
  }

  // Type definition for MarketCoin
  type MarketCoin = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number | null;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    roi: any;
    last_updated: string;
    sparkline_in_7d?: {
      price: number[];
    };
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Market Overview</h1>
            <div className="flex items-center text-sm text-gray-400 mt-1">
              {/* Display actual count */}
              <span className="text-crypto-green mr-1">
                {filteredMarkets?.length ?? 0}+
              </span>
              <span>Coins/Markets (Page 1)</span> {/* Indicate page */}
              {/* Connection status indicator */}
              {connectionStatus && (
                <div className="ml-4 flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      connectionStatus.type === 'success'
                        ? 'bg-crypto-green'
                        : connectionStatus.type === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-crypto-red'
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      connectionStatus.type === 'success'
                        ? 'text-crypto-green'
                        : connectionStatus.type === 'warning'
                          ? 'text-yellow-500'
                          : 'text-crypto-red'
                    }`}
                  >
                    {connectionStatus.message}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative mr-4">
              <Search
                className="text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2"
                size={16}
              />
              <Input
                placeholder="Search Coins"
                className="pl-10 bg-gray-800 border-gray-700 text-sm h-9 rounded-full w-60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                {/* Rank */}
                <th
                  className="text-left py-3 px-4 text-sm font-medium text-gray-400 w-10 cursor-pointer hover:text-gray-300"
                  onClick={() => handleSort('rank')}
                >
                  # {renderSortIndicator('rank')}
                </th>
                {/* Favorite (not sortable) */}
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 w-8"></th>
                {/* Name */}
                <th
                  className="text-left py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                  onClick={() => handleSort('name')}
                >
                  Name {renderSortIndicator('name')}
                </th>
                {/* Price */}
                <th
                  className="text-right py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                  onClick={() => handleSort('price')}
                >
                  Price {renderSortIndicator('price')}
                </th>
                {/* 24h Change % */}
                <th
                  className="text-right py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                  onClick={() => handleSort('change_24h')}
                >
                  24h % {renderSortIndicator('change_24h')}
                </th>
                {/* 24h Volume */}
                <th
                  className="text-right py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                  onClick={() => handleSort('volume')}
                >
                  24h Volume {renderSortIndicator('volume')}
                </th>
                {/* Market Cap */}
                <th
                  className="text-right py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                  onClick={() => handleSort('market_cap')}
                >
                  Market Cap {renderSortIndicator('market_cap')}
                </th>
                {/* 7d Change (not sortable) */}
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                  7d Change
                </th>
                {/* Action (not sortable) */}
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkets.map((coin: MarketCoin, index: number) => {
                const priceChange24h = coin.price_change_percentage_24h ?? 0;
                const isPositiveChange = priceChange24h >= 0;
                const sparklineData = coin.sparkline_in_7d?.price;
                const sparklinePath = getSparklinePath(sparklineData, 80, 20);

                return (
                  <tr
                    key={coin.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50"
                  >
                    {/* Rank */}
                    <td className="py-4 px-4 text-sm text-gray-300">
                      {coin.market_cap_rank ?? index + 1}
                    </td>
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
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {coin.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {coin.symbol.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Price */}
                    <td className="py-4 px-4 text-right text-white">
                      ${coin.current_price?.toLocaleString() ?? '-'}
                    </td>
                    {/* 24h Change % */}
                    <td
                      className={`py-4 px-4 text-right ${isPositiveChange ? 'text-crypto-green' : 'text-crypto-red'}`}
                    >
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
                      <Button
                        variant="outline"
                        className="border-gray-600 hover:bg-gray-800 text-xs rounded h-8"
                      >
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
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 h-8 w-8 p-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-gray-800 h-8 w-8 p-0"
            >
              1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 h-8 w-8 p-0"
            >
              2
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 h-8 w-8 p-0"
            >
              3
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 h-8 w-8 p-0"
            >
              ...
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 h-8 w-8 p-0"
            >
              24
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 h-8 w-8 p-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
