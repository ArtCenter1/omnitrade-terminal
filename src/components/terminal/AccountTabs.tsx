import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AccountTabs() {
  return (
    <div className="mt-6">
      <Tabs defaultValue="balances">
        <TabsList className="grid grid-cols-4 bg-gray-900">
          <TabsTrigger value="balances" className="text-xs">
            Balances
          </TabsTrigger>
          <TabsTrigger value="openOrders" className="text-xs">
            Open Orders
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            Order History
          </TabsTrigger>
          <TabsTrigger value="transfers" className="text-xs">
            Transfers
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
