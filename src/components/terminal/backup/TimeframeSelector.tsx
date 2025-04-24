import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Assuming you have a utility for class names

interface TimeframeSelectorProps {
  currentTimeframe: string;
  onTimeframeSelect: (timeframe: string) => void;
}

// Define standard TradingView intervals and their display labels
const timeframes = [
  { label: "1m", value: "1" }, // 1 minute
  { label: "5m", value: "5" }, // 5 minutes
  { label: "15m", value: "15" }, // 15 minutes
  { label: "1H", value: "60" }, // 1 hour
  { label: "4H", value: "240" }, // 4 hours
  { label: "1D", value: "D" }, // 1 day
  { label: "1W", value: "W" }, // 1 week
  { label: "1M", value: "M" }, // 1 month
];

export function TimeframeSelector({
  currentTimeframe,
  onTimeframeSelect,
}: TimeframeSelectorProps) {
  return (
    <div className="p-2 border-t border-gray-800">
      {" "}
      {/* Reduced padding */}
      <div className="flex flex-wrap gap-2">
        {" "}
        {/* Use flex-wrap and smaller gap */}
        {timeframes.map((tf) => (
          <Button
            key={tf.value}
            variant="outline"
            size="sm"
            className={cn(
              "border-gray-700 text-xs px-2", // Adjusted styling
              currentTimeframe === tf.value
                ? "bg-gray-700 text-white" // Active style
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200" // Inactive style
            )}
            onClick={() => onTimeframeSelect(tf.value)}
          >
            {tf.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
