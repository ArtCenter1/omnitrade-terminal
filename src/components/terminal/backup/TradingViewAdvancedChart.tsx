import { useEffect, useRef, useState } from 'react';
import { TradingPair } from '@/types/trading';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { useFeatureFlags } from '@/config/featureFlags';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { FallbackChart } from './FallbackChart';

// Extend the Window interface to include TradingView
declare global {
  interface Window {
    TradingView?: any;
  }
}

interface TradingViewAdvancedChartProps {
  selectedPair?: TradingPair;
  timeframe: string;
}

export function TradingViewAdvancedChart({
  selectedPair,
  timeframe,
}: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedAccount } = useSelectedAccount();
  const { useMockData } = useFeatureFlags();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  
  // Map timeframe to TradingView interval
  const getInterval = (): string => {
    switch (timeframe) {
      case '1': return '1';
      case '5': return '5';
      case '15': return '15';
      case '30': return '30';
      case '60': return '60';
      case '240': return '240';
      case 'D': return 'D';
      case 'W': return 'W';
      default: return 'D'; // Default to daily
    }
  };

  // Get the correct symbol format for TradingView
  const getSymbol = (): string => {
    // Default to a common symbol that's guaranteed to work
    if (!selectedPair) return 'BINANCE:BTCUSDT';

    let baseAsset = selectedPair.baseAsset.toUpperCase();
    const quoteAsset = selectedPair.quoteAsset.toUpperCase();

    // Get exchange ID from pair or account
    const exchangeId = (
      selectedPair.exchangeId ||
      (selectedAccount ? selectedAccount.exchangeId : 'binance')
    ).toLowerCase();

    console.log(
      `Creating TradingView symbol for ${baseAsset}/${quoteAsset} on ${exchangeId}`,
    );

    // Map exchange IDs to TradingView exchange symbols
    const exchangeMap: Record<string, string> = {
      binance: 'BINANCE',
      coinbase: 'COINBASE',
      kraken: 'KRAKEN',
      kucoin: 'KUCOIN',
      bybit: 'BYBIT',
      okx: 'OKX',
    };

    // If we're using mock data, always use BINANCE for better compatibility
    const exchange = useMockData
      ? 'BINANCE'
      : exchangeMap[exchangeId] || 'BINANCE';

    // Special case for Kraken BTC pairs (Kraken uses XBT instead of BTC)
    if (!useMockData && exchangeId === 'kraken' && baseAsset === 'BTC') {
      console.log('Using XBT instead of BTC for Kraken');
      baseAsset = 'XBT';
    }

    // Create the explicit symbol format
    const symbol = `${exchange}:${baseAsset}${quoteAsset}`;
    console.log(`Generated TradingView symbol: ${symbol}`);
    return symbol;
  };

  // Load the TradingView Advanced Chart widget
  useEffect(() => {
    if (!containerRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    // Clear the container
    containerRef.current.innerHTML = '';
    
    // Create a unique container ID
    const containerId = `tradingview_advanced_chart_${Date.now()}`;
    containerRef.current.id = containerId;
    
    // Get the symbol and interval
    const symbol = getSymbol();
    const interval = getInterval();
    
    console.log(`Loading Advanced Chart with symbol: ${symbol}, interval: ${interval}`);
    
    // Function to load the TradingView Advanced Chart widget
    const loadAdvancedChart = () => {
      try {
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
          if (typeof window.TradingView !== 'undefined' && containerRef.current) {
            try {
              // Create the Advanced Chart widget
              new window.TradingView.widget({
                autosize: true,
                symbol: symbol,
                interval: interval,
                timezone: 'Etc/UTC',
                theme: 'dark',
                style: '1',
                locale: 'en',
                toolbar_bg: '#131722',
                enable_publishing: false,
                allow_symbol_change: true,
                container_id: containerId,
                studies: ['Volume@tv-basicstudies'],
                hide_side_toolbar: false,
                withdateranges: true,
                save_image: false,
                hide_volume: false,
                support_host: 'https://www.tradingview.com',
                library_path: 'https://s3.tradingview.com/charting_library/',
                fullscreen: false,
                disabled_features: [
                  'header_symbol_search',
                  'header_compare',
                  'header_undo_redo',
                  'header_screenshot',
                  'use_localstorage_for_settings',
                ],
                enabled_features: [
                  'side_toolbar_in_fullscreen_mode',
                  'disable_resolution_rebuild',
                ],
                loading_screen: { backgroundColor: "#131722", foregroundColor: "#667" },
                overrides: {
                  "mainSeriesProperties.style": 1,
                  "symbolWatermarkProperties.color": "#667",
                  "volumePaneSize": "medium",
                },
                time_frames: [
                  { text: "1d", resolution: "1" },
                  { text: "5d", resolution: "5" },
                  { text: "1m", resolution: "30" },
                  { text: "3m", resolution: "60" },
                  { text: "6m", resolution: "120" },
                  { text: "YTD", resolution: "D" },
                  { text: "1y", resolution: "D" },
                  { text: "5y", resolution: "W" },
                ],
                client_id: 'tradingview.com',
                user_id: 'public_user',
                charts_storage_api_version: '1.1',
                charts_storage_url: 'https://saveload.tradingview.com',
                custom_css_url: '',
                debug: false,
                // Add an onChartReady callback to know when the chart is loaded
                onChartReady: () => {
                  console.log('TradingView Advanced Chart is ready');
                  setIsLoading(false);
                },
              });
              
              // Set a timeout to detect if the chart fails to load
              const loadTimeout = setTimeout(() => {
                if (isLoading) {
                  console.log('Chart load timeout reached, showing fallback');
                  setShowFallback(true);
                }
              }, 10000); // 10 seconds timeout
              
              return () => clearTimeout(loadTimeout);
            } catch (e) {
              console.error('Error creating TradingView Advanced Chart widget:', e);
              setError('Error initializing chart');
              setShowFallback(true);
              setIsLoading(false);
            }
          } else {
            console.error('TradingView is not defined after script load');
            setError('Failed to load TradingView library');
            setShowFallback(true);
            setIsLoading(false);
          }
        };
        
        script.onerror = () => {
          console.error('Failed to load TradingView script');
          setError('Failed to load chart library');
          setShowFallback(true);
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
      } catch (e) {
        console.error('Error setting up TradingView script:', e);
        setError('Error initializing chart');
        setShowFallback(true);
        setIsLoading(false);
      }
    };
    
    // Load the Advanced Chart
    loadAdvancedChart();
    
    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedPair, timeframe, selectedAccount, isLoading, useMockData]);
  
  // If loading takes more than 5 seconds, show the fallback chart
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        console.log('Loading timeout reached, showing fallback chart');
        setShowFallback(true);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // If there's an error or we've decided to show the fallback, use our custom chart
  if (error || showFallback) {
    return (
      <div className="w-full h-full relative">
        {/* Render our custom fallback chart */}
        <FallbackChart selectedPair={selectedPair} timeframe={timeframe} />
        
        {/* Show error message as an overlay if there was an actual error */}
        {error && (
          <div className="absolute top-2 left-2 right-2 bg-red-900 bg-opacity-90 text-white p-2 rounded text-sm z-20">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>TradingView chart unavailable: {error}</span>
            </div>
          </div>
        )}
        
        {/* Add a retry button */}
        <div className="absolute bottom-2 right-2 z-10">
          <button
            onClick={() => {
              console.log('Attempting to reload TradingView chart');
              setError(null);
              setIsLoading(true);
              setShowFallback(false);
              
              // Force reload the page to get a fresh start
              window.location.reload();
            }}
            className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
            title="Try TradingView chart"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    );
  }
  
  // If it's still loading and we haven't timed out yet, show a loading message
  if (isLoading && !showFallback) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: '#131722' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chart...</p>
        </div>
      </div>
    );
  }
  
  // Show the TradingView chart container
  return (
    <div
      className="w-full h-full relative"
      style={{ backgroundColor: '#131722' }}
    >
      <div ref={containerRef} className="w-full h-full" />
      {useMockData && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black bg-opacity-50 px-2 py-1 rounded text-xs z-10">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-yellow-500">Using mock data</span>
        </div>
      )}

      {/* Add buttons for chart options */}
      <div className="absolute bottom-2 right-2 z-10 flex gap-1">
        {/* Button to switch to fallback chart */}
        <button
          onClick={() => {
            console.log('Switching to fallback chart');
            setShowFallback(true);
          }}
          className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
          title="Use fallback chart"
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
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </button>
        
        {/* Button to refresh TradingView chart */}
        <button
          onClick={() => {
            console.log('Manual chart refresh requested');
            setIsLoading(true);
            setError(null);
            
            // Force reload the page to get a fresh start
            window.location.reload();
          }}
          className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
          title="Refresh chart"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
