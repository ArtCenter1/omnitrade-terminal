
import React from "react";
import { Info } from "lucide-react";
import { AssetRow } from "@/components/AssetRow";
import { mockAssets } from "@/lib/utils";

export function AssetsTable() {
  return (
    <div className="p-4 border-t border-gray-800">
      <h3 className="text-white font-medium mb-4">Assets</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Asset</th>
              <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Available</th>
              <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Amount</th>
              <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                <div className="flex items-center">
                  Value (USD)
                  <Info size={14} className="ml-1 text-gray-500" />
                </div>
              </th>
              <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">
                <div className="flex items-center">
                  Last Price
                  <Info size={14} className="ml-1 text-gray-500" />
                </div>
              </th>
              <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">24h Change</th>
              <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">7d Chart</th>
              <th className="text-center py-2 px-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockAssets.slice(0, 5).map((asset, index) => (
              <AssetRow key={index} asset={asset} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
