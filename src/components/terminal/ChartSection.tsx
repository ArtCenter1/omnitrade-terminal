import { PriceOverview } from './PriceOverview';
import { TradingPairSelector } from './TradingPairSelector';
import { TradingPair } from '@/types/trading';
import { TradingViewContainer } from '@/components/shared/TradingViewContainer';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface ChartSectionProps {
  selectedPair?: TradingPair;
  onPairSelect?: (pair: TradingPair) => void;
}

// Define standard TradingView intervals and their display labels
const timeframes = [
  { label: '1D', value: 'D' }, // 1 day
  { label: '1W', value: 'W' }, // 1 week
  { label: '1M', value: 'M' }, // 1 month
  { label: '4H', value: '240' }, // 4 hours
  { label: '1H', value: '60' }, // 1 hour
  { label: '15m', value: '15' }, // 15 minutes
];

export function ChartSection({
  selectedPair,
  onPairSelect,
}: ChartSectionProps) {
  // Get the saved timeframe from localStorage or default to 'D' (daily)
  const [currentTimeframe, setCurrentTimeframe] = useState<string>(() => {
    const savedTimeframe = localStorage.getItem('omnitrade_chart_timeframe');
    return savedTimeframe || 'D';
  });

  // Save the timeframe to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('omnitrade_chart_timeframe', currentTimeframe);
  }, [currentTimeframe]);

  // Handle timeframe selection
  const handleTimeframeSelect = (timeframe: string) => {
    setCurrentTimeframe(timeframe);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-theme-border bg-[var(--bg-navbar)] theme-transition">
        {/* Left Side: Pair Selector and Minimal Price */}
        <div className="flex items-center">
          {/* Pass props directly to TradingPairSelector */}
          <TradingPairSelector
            onPairSelect={onPairSelect} // Pass down the handler from Terminal.tsx
            currentPair={selectedPair} // Pass down the selected pair from Terminal.tsx
          />
          {/* PriceOverview uses the selectedPair prop */}
          {selectedPair && (
            <PriceOverview selectedPair={selectedPair} showPriceOnly={true} />
          )}
        </div>
        {/* Right Side: Full Price Overview and Controls */}
        <div className="flex items-center gap-4">
          {/* PriceOverview uses the selectedPair prop */}
          {selectedPair && <PriceOverview selectedPair={selectedPair} />}

          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={currentTimeframe === tf.value ? 'default' : 'ghost'}
                size="sm"
                className={`px-2 py-1 h-7 text-xs ${
                  currentTimeframe === tf.value
                    ? 'bg-button-primary text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => handleTimeframeSelect(tf.value)}
              >
                {tf.label}
              </Button>
            ))}
          </div>

          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Bell size={16} />
          </Button>
        </div>
      </div>

      {/* TradingView Chart Container */}
      <div className="flex-grow p-0">
        <TradingViewContainer
          selectedPair={selectedPair}
          interval={currentTimeframe}
        />
      </div>
    </div>
  );
}
