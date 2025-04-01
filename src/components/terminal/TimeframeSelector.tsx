
import React from "react";
import { Button } from "@/components/ui/button";

export function TimeframeSelector() {
  return (
    <div className="p-4 border-t border-gray-800">
      <div className="grid grid-cols-6 gap-4">
        <Button variant="outline" size="sm" className="border-gray-800 text-xs">5y</Button>
        <Button variant="outline" size="sm" className="border-gray-800 text-xs">1y</Button>
        <Button variant="outline" size="sm" className="border-gray-800 text-xs">6m</Button>
        <Button variant="outline" size="sm" className="border-gray-800 text-xs">3m</Button>
        <Button variant="outline" size="sm" className="border-gray-800 text-xs">1m</Button>
        <Button variant="outline" size="sm" className="border-gray-800 text-xs">5d</Button>
        <Button variant="outline" size="sm" className="border-gray-800 text-xs">1d</Button>
      </div>
    </div>
  );
}
