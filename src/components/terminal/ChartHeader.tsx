import React from "react";
import {
  BarChart3,
  BarChart,
  Save,
  Settings,
  Maximize,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketSelector } from "./MarketSelector";

export function ChartHeader() {
  return (
    <div className="flex justify-between items-center border-b border-gray-800 p-3">
      <div className="flex items-center space-x-2">
        <MarketSelector image="/placeholder.svg" name="BTC/USDT" />

        <div className="text-xs text-gray-400">1h</div>

        <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
          <BarChart3 size={16} />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
          <BarChart size={16} />
        </Button>

        <Button variant="ghost" size="sm" className="h-7 text-gray-400 text-xs">
          Indicators
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
          <Save size={16} />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
          <Settings size={16} />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 h-7 text-gray-400">
          <Maximize size={16} />
        </Button>
      </div>
    </div>
  );
}
