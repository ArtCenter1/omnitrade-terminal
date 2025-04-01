
import React from "react";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PriceOverview } from "./PriceOverview";
import { TimeframeSelector } from "./TimeframeSelector";

interface ChartSectionProps {
  chartData: any[];
}

export function ChartSection({ chartData }: ChartSectionProps) {
  return (
    <div className="col-span-9 border-r border-gray-800">
      <PriceOverview />
      
      <div className="p-4 h-96 flex items-center justify-center">
        <PerformanceChart data={chartData} isPositive={false} className="h-full w-full" />
      </div>
      
      <TimeframeSelector />
    </div>
  );
}
