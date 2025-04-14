import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

export function LeaderboardFilters() {
  return (
    <div className="bg-theme-card rounded-lg p-4 mb-6 shadow-theme-sm theme-transition">
      <div className="flex flex-wrap items-center gap-4">
        {/* Filter Trigger Button (Optional, for mobile or complex filters) */}
        {/* <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          <SlidersHorizontal size={16} className="mr-2" />
          Filters
        </Button> */}

        {/* Timeframe Select */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="timeframe" className="text-sm text-gray-400">
            Timeframe:
          </Label>
          <Select defaultValue="30d">
            <SelectTrigger
              id="timeframe"
              className="w-[100px] h-8 text-xs bg-gray-800 border-gray-700 text-white"
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Market Type Select */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="market" className="text-sm text-gray-400">
            Market:
          </Label>
          <Select defaultValue="all">
            <SelectTrigger
              id="market"
              className="w-[120px] h-8 text-xs bg-gray-800 border-gray-700 text-white"
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="spot">Spot</SelectItem>
              <SelectItem value="futures">Futures</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Verified Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="verified"
            className="border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label htmlFor="verified" className="text-sm text-gray-300">
            Verified Traders
          </Label>
        </div>

        {/* Following Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="following"
            className="border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label htmlFor="following" className="text-sm text-gray-300">
            Following
          </Label>
        </div>

        {/* Reset Button (Optional) */}
        {/* <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white">Reset Filters</Button> */}
      </div>
    </div>
  );
}
