import React, { useEffect, useRef, useState } from 'react'; // Added useState
import { PriceOverview } from './PriceOverview';
import { TimeframeSelector } from './TimeframeSelector';
import { TradingPairSelector, TradingPair } from './TradingPairSelector';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';

// Define an interface for the TradingView widget options
interface TradingViewWidgetOptions {
  autosize?: boolean;
  symbol: string;
  interval: string; // This will be dynamic now
  timezone?: string;
  theme?: string;
  style?: string;
  locale?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  container_id: string;
  hide_side_toolbar?: boolean; // Added for drawing tools
  // Add other potential options here if needed
}

// Extend the Window interface to include TradingView with more specific types
declare global {
  interface Window {
    TradingView?: {
      widget: new (options: TradingViewWidgetOptions) => unknown;
    };
  }
}

interface ChartSectionProps {
  selectedPair?: TradingPair;
  onPairSelect?: (pair: TradingPair) => void;
  className?: string;
}

export function ChartSection({
  selectedPair,
  onPairSelect,
  className,
}: ChartSectionProps = {}) {
  const container = useRef<HTMLDivElement>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<string>('D'); // Default to Daily
  const { selectedAccount } = useSelectedAccount();

  // Use the provided selectedPair or a default
  const [currentPair, setCurrentPair] = useState<TradingPair>(
    selectedPair || {
      symbol: 'BTC/USDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      price: '84,316.58',
      change24h: '+0.92%',
      volume24h: '1.62b',
      isFavorite: true,
    },
  );
  const widgetInstanceRef = useRef<unknown | null>(null); // To potentially hold widget instance if needed, though direct update is tricky here

  useEffect(() => {
    const currentContainer = container.current;
    if (!currentContainer) {
      return;
    }

    // Function to create the widget
    const createWidget = () => {
      if (
        typeof window.TradingView !== 'undefined' &&
        window.TradingView.widget
      ) {
        // Clear previous widget before creating a new one
        currentContainer.innerHTML = '';
        widgetInstanceRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: `${selectedAccount?.exchange?.toUpperCase() || 'BINANCE'}:${currentPair.baseAsset}${currentPair.quoteAsset}`,
          interval: currentTimeframe, // Use state variable
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          enable_publishing: false,
          allow_symbol_change: true, // Keep symbol change enabled
          container_id: currentContainer.id, // Use the container's actual ID
          hide_side_toolbar: false, // Ensure drawing toolbar is visible
        });
      }
    };

    // Check if the TradingView script is loaded
    const scriptId = 'tradingview-widget-script';
    const existingScript = document.getElementById(
      scriptId,
    ) as HTMLScriptElement | null;

    if (!existingScript) {
      // Create and append the TradingView script if it doesn't exist
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = createWidget; // Create widget once script is loaded
      document.body.appendChild(script);
    } else if (existingScript && typeof window.TradingView !== 'undefined') {
      // If script exists and TradingView is loaded, create the widget immediately
      createWidget();
    } else {
      // If script exists but TradingView is not loaded yet, wait for onload
      existingScript.addEventListener('load', createWidget);
    }

    // Cleanup function
    return () => {
      // Remove the event listener if added
      if (existingScript) {
        existingScript.removeEventListener('load', createWidget);
      }
      // Optional: Clean up widget instance if TradingView provides an API for it
      // if (widgetInstanceRef.current && typeof widgetInstanceRef.current.remove === 'function') {
      //   widgetInstanceRef.current.remove();
      // }
      if (currentContainer) {
        // currentContainer.innerHTML = ''; // Clear container on unmount/re-render
      }
    };
    // Re-run effect when currentTimeframe, currentPair, or selectedAccount changes
  }, [currentTimeframe, currentPair, selectedAccount]);

  // Update currentPair when selectedPair changes
  useEffect(() => {
    if (selectedPair) {
      setCurrentPair(selectedPair);
    }
  }, [selectedPair]);

  const handleTimeframeSelect = (timeframe: string) => {
    setCurrentTimeframe(timeframe);
  };

  const handlePairSelect = (pair: TradingPair) => {
    setCurrentPair(pair);
    // Call the parent's onPairSelect if provided
    if (onPairSelect) {
      onPairSelect(pair);
    }
  };

  return (
    <div className={`${className || ''} flex flex-col h-full w-full`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <TradingPairSelector onPairSelect={handlePairSelect} />
        <PriceOverview selectedPair={currentPair} />
      </div>

      {/* TradingView Widget Container - Ensure it has the ID used in options */}
      <div
        id="tradingview-widget-container-div"
        ref={container}
        className="flex-grow p-0"
      >
        {/* The TradingView widget will be rendered here */}
      </div>

      {/* Pass state and handler to TimeframeSelector */}
      <TimeframeSelector
        currentTimeframe={currentTimeframe}
        onTimeframeSelect={handleTimeframeSelect}
      />
    </div>
  );
}
