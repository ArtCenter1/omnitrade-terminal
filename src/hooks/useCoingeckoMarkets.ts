import { useEffect, useState, useRef } from 'react';
import * as enhancedCoinGeckoService from '@/services/enhancedCoinGeckoService';

export interface Market {
  name: string;
  symbol: string;
  image: string;
  price: string;
  change: string;
  volume: string;
  marketCap: string;
  supply: string;
  isPositive: boolean;
  isFavorite: boolean;
  sparkline: number[]; // 7d sparkline data from Coingecko
}

interface UseCoingeckoMarketsResult {
  markets: Market[] | null;
  loading: boolean;
  error: string | null;
}

// Fallback URL if environment variable is not set
const COINGECKO_URL =
  import.meta.env.VITE_COINGECKO_API_URL ||
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true';

const FAVORITES = ['BTC', 'ETH', 'BNB', 'SOL']; // Example favorites

function formatNumber(num: number, digits = 2) {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(digits) + 'T';
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(digits) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(digits) + 'M';
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(digits) + 'K';
  return '$' + num.toFixed(digits);
}

function formatSupply(supply: number, symbol: string) {
  if (supply >= 1e9) return (supply / 1e9).toFixed(1) + 'B ' + symbol;
  if (supply >= 1e6) return (supply / 1e6).toFixed(1) + 'M ' + symbol;
  if (supply >= 1e3) return (supply / 1e3).toFixed(1) + 'K ' + symbol;
  return supply.toFixed(2) + ' ' + symbol;
}

export function useCoingeckoMarkets(
  refreshInterval = 60000,
): UseCoingeckoMarketsResult {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMarkets = async () => {
    setLoading(true);
    setError(null);
    try {
      // First try using the enhanced CoinGecko service which handles both public and pro API
      console.log('Fetching market data using enhanced CoinGecko service');
      const coinData = await enhancedCoinGeckoService.getTopCoins(100);

      if (coinData && coinData.length > 0) {
        console.log(
          `Successfully fetched ${coinData.length} coins from enhanced CoinGecko service`,
        );
        const mapped: Market[] = coinData.map((item) => ({
          name: item.name,
          symbol: item.symbol,
          image: item.image,
          price:
            '$' +
            item.current_price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          change:
            (item.price_change_percentage_24h >= 0 ? '+' : '') +
            item.price_change_percentage_24h.toFixed(2) +
            '%',
          volume: formatNumber(item.market_cap || 0), // Using market cap as fallback for volume
          marketCap: formatNumber(item.market_cap || 0),
          supply: item.symbol
            ? formatSupply(
                item.market_cap / item.current_price || 0, // Estimate supply if not available
                item.symbol.toUpperCase(),
              )
            : 'N/A',
          isPositive: item.price_change_percentage_24h >= 0,
          isFavorite: FAVORITES.includes(item.symbol.toUpperCase()),
          sparkline: item.sparkline_in_7d?.price ?? [],
        }));
        setMarkets(mapped);
        return;
      }

      // If enhanced service fails, fall back to direct API call
      console.log(
        'Enhanced service returned no data, falling back to direct API call',
      );
      const res = await fetch(COINGECKO_URL);
      if (!res.ok) throw new Error('Failed to fetch market data');
      const data = await res.json();
      const mapped: Market[] = data.map((item: any) => ({
        name: item.name,
        symbol: item.symbol,
        image: item.image,
        price:
          '$' +
          item.current_price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        change:
          (item.price_change_percentage_24h >= 0 ? '+' : '') +
          item.price_change_percentage_24h.toFixed(2) +
          '%',
        volume: formatNumber(item.total_volume),
        marketCap: formatNumber(item.market_cap),
        supply: formatSupply(
          item.circulating_supply,
          item.symbol.toUpperCase(),
        ),
        isPositive: item.price_change_percentage_24h >= 0,
        isFavorite: FAVORITES.includes(item.symbol.toUpperCase()),
        sparkline: item.sparkline_in_7d?.price ?? [],
      }));
      setMarkets(mapped);
    } catch (e: any) {
      console.error('Error fetching market data:', e);
      setError(e.message || 'Unknown error');
      setMarkets(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchMarkets, refreshInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [refreshInterval]);

  return { markets, loading, error };
}
