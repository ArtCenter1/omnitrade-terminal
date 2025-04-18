import { useState, useEffect } from 'react';
import { ChevronDown, Star, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  getTradingPairs,
  subscribeToPriceUpdates,
  TradingPair as BackendTradingPair,
} from '../../services/tradingPairsService';

// Define the trading pair interface
export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  change24h: string;
  volume24h: string;
  isFavorite?: boolean;
  exchangeId?: string;
}

interface TradingPairSelectorProps {
  onPairSelect: (pair: TradingPair) => void;
}

export function TradingPairSelector({
  onPairSelect,
}: TradingPairSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState<TradingPair>({
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: '84,316.58',
    change24h: '+0.92%',
    volume24h: '1.62b',
    isFavorite: true,
  });
  const [activeQuoteAsset, setActiveQuoteAsset] = useState('USDT');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPairs, setFilteredPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedAccount } = useSelectedAccount();

  // Available quote assets
  const [availableQuoteAssets, setAvailableQuoteAssets] = useState<string[]>([
    'USDT',
    'USD',
    'BTC',
    'ETH',
  ]);

  // Update available quote assets when the selected account changes
  useEffect(() => {
    // For now, we'll use a static list of quote assets
    // In the future, we could fetch this from the backend
    const assets = ['USDT', 'USD', 'BTC', 'ETH'];
    setAvailableQuoteAssets(assets);

    // If the current active quote asset is not available,
    // switch to the first available one
    if (!assets.includes(activeQuoteAsset)) {
      setActiveQuoteAsset(assets[0] || 'USDT');
    }
  }, [selectedAccount, activeQuoteAsset]);

  // Fetch trading pairs when the component mounts or when the active quote asset changes
  useEffect(() => {
    const fetchTradingPairs = async () => {
      setIsLoading(true);
      try {
        const exchangeId = selectedAccount?.exchange || 'binance';
        const backendPairs = await getTradingPairs(exchangeId);

        // Filter pairs by the active quote asset
        const filteredByQuote = backendPairs.filter(
          (pair) => pair.quoteAsset === activeQuoteAsset,
        );

        // Convert backend pairs to frontend format
        const frontendPairs: TradingPair[] = filteredByQuote.map((pair) => ({
          symbol: pair.symbol,
          baseAsset: pair.baseAsset,
          quoteAsset: pair.quoteAsset,
          price: pair.price?.toString() || '0.00',
          change24h: '+0.00%', // We'll update this with real data later
          volume24h: '0', // We'll update this with real data later
          isFavorite: false,
          exchangeId: pair.exchangeId,
        }));

        setFilteredPairs(frontendPairs);
      } catch (error) {
        console.error('Error fetching trading pairs:', error);
        setFilteredPairs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradingPairs();
  }, [activeQuoteAsset, selectedAccount]);

  // Filter pairs based on search query
  useEffect(() => {
    if (!searchQuery) return; // Skip if no search query

    setIsLoading(true);
    try {
      const query = searchQuery.toLowerCase();
      const filtered = filteredPairs.filter(
        (pair) =>
          pair.symbol.toLowerCase().includes(query) ||
          pair.baseAsset.toLowerCase().includes(query),
      );
      setFilteredPairs(filtered);
    } catch (error) {
      console.error('Error filtering trading pairs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Handle pair selection
  const handlePairSelect = (pair: TradingPair) => {
    setSelectedPair(pair);
    onPairSelect(pair);
    setIsOpen(false);
  };

  // Toggle favorite status
  const handleToggleFavorite = async (
    pair: TradingPair,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    try {
      // Toggle the favorite status locally
      const isFavorite = !pair.isFavorite;

      // Update the pair in the filtered list
      setFilteredPairs((prevPairs) =>
        prevPairs.map((p) =>
          p.symbol === pair.symbol ? { ...p, isFavorite } : p,
        ),
      );

      // Update selected pair if it's the one being toggled
      if (selectedPair.symbol === pair.symbol) {
        setSelectedPair((prev) => ({ ...prev, isFavorite }));
      }

      // In a real implementation, we would save this to the backend
      // For now, we'll just update the local state
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Format price change with color
  const formatPriceChange = (change: string) => {
    const isPositive = !change.includes('-');
    return (
      <span className={isPositive ? 'text-crypto-green' : 'text-crypto-red'}>
        {change}
      </span>
    );
  };

  // Format price with color based on change direction
  const formatPrice = (price: string, change: string) => {
    const isPositive = !change.includes('-');
    return (
      <span className={isPositive ? 'text-crypto-green' : 'text-crypto-red'}>
        {price}
      </span>
    );
  };

  return (
    <div className="relative">
      <ErrorBoundary>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-white hover:bg-gray-800 px-3 py-2 h-auto"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center mr-2">
                  <span className="text-xs font-bold text-white">
                    {selectedPair.baseAsset.substring(0, 1)}
                  </span>
                </div>
                <span className="font-bold">{selectedPair.symbol}</span>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              className="w-[600px] bg-[#1a1a1c] border border-gray-800 p-0"
              sideOffset={5}
            >
              <div className="p-3 border-b border-gray-800">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search markets"
                    className="pl-8 bg-gray-900 border-gray-800 text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-b border-gray-800">
                <Tabs
                  defaultValue="USDT"
                  value={activeQuoteAsset}
                  onValueChange={setActiveQuoteAsset}
                >
                  <TabsList className="bg-transparent border-b border-gray-800 p-0">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-gray-800 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 px-4 py-2"
                      onClick={() => setActiveQuoteAsset('USDT')}
                    >
                      All
                    </TabsTrigger>
                    {availableQuoteAssets.map((asset) => (
                      <TabsTrigger
                        key={asset}
                        value={asset}
                        className="data-[state=active]:bg-gray-800 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 px-4 py-2"
                      >
                        {asset}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    <span className="ml-2 text-gray-400">Loading pairs...</span>
                  </div>
                ) : filteredPairs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                    <p>No trading pairs found</p>
                    {searchQuery && (
                      <p className="text-sm mt-2">
                        Try a different search term
                      </p>
                    )}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr className="text-xs text-gray-400">
                        <th className="text-left py-2 px-4 font-medium">
                          Symbol
                        </th>
                        <th className="text-right py-2 px-4 font-medium">
                          Last Price
                        </th>
                        <th className="text-right py-2 px-4 font-medium">
                          24h Change
                        </th>
                        <th className="text-right py-2 px-4 font-medium">
                          24h Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPairs.map((pair) => (
                        <tr
                          key={pair.symbol}
                          className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
                          onClick={() => handlePairSelect(pair)}
                        >
                          <td className="py-2 px-4">
                            <div className="flex items-center">
                              <Star
                                size={16}
                                className={`mr-2 cursor-pointer ${
                                  pair.isFavorite
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-500'
                                }`}
                                onClick={(e) => handleToggleFavorite(pair, e)}
                              />
                              <span className="text-white">{pair.symbol}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4 text-right">
                            {formatPrice(pair.price, pair.change24h)}
                          </td>
                          <td className="py-2 px-4 text-right">
                            {formatPriceChange(pair.change24h)}
                          </td>
                          <td className="py-2 px-4 text-right text-gray-400">
                            {pair.volume24h}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </ErrorBoundary>
    </div>
  );
}
