import React, { useState, useEffect } from 'react';
import { TradingPair } from '@/types/trading';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { FallbackChart } from './FallbackChart';
import TradingViewWidget from './TradingViewWidget';

interface TradingViewContainerProps {
  selectedPair?: TradingPair;
}

export function TradingViewContainer({
  selectedPair,
}: TradingViewContainerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  // Reset loading state when pair changes
  useEffect(() => {
    setIsLoading(true);

    // Set a timeout to detect if the chart fails to load
    const loadTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Give it 3 seconds to load

    return () => clearTimeout(loadTimeout);
  }, [selectedPair]);

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

  // Handle errors from the TradingView widget
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Only catch TradingView related errors
      if (
        event.message &&
        (event.message.includes('TradingView') ||
          event.message.includes('tradingview') ||
          event.filename?.includes('tradingview') ||
          event.filename?.includes('embed-widget'))
      ) {
        console.error('TradingView error:', event);
        setError('Failed to load TradingView chart');
        setShowFallback(true);
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // If there's an error or we've decided to show the fallback, use our custom chart
  if (error || showFallback) {
    return (
      <div className="w-full h-full relative">
        {/* Render our custom fallback chart */}
        <FallbackChart selectedPair={selectedPair} />

        {/* Show error message as an overlay if there was an actual error */}
        {error && (
          <div className="absolute top-2 left-2 right-2 bg-error-color bg-opacity-90 text-white p-2 rounded text-sm z-20 theme-transition">
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
            className="p-1 rounded bg-theme-tertiary hover:bg-theme-hover text-theme-secondary hover:text-theme-primary theme-transition"
            title="Try TradingView chart"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    );
  }

  // If it's still loading, show a loading message
  if (isLoading) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-theme-tertiary theme-transition"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-button-primary mx-auto mb-4"></div>
          <p className="text-theme-secondary">Loading chart...</p>
        </div>
      </div>
    );
  }

  // Show the TradingView widget
  return (
    <div className="w-full h-full relative">
      <TradingViewWidget selectedPair={selectedPair} />
    </div>
  );
}
