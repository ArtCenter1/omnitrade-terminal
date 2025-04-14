import React from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MyAccounts() {
  return (
    <ProfileLayout title="My Accounts">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Exchange Accounts</h2>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-4">
            You haven't connected any exchanges yet.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Connect your first exchange to start trading, tracking balances, and
            creating automated strategies.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus size={16} className="mr-1" />
            Add Exchange
          </Button>
        </div>

        <div className="flex justify-between items-center mt-10">
          <h2 className="text-xl font-medium">Wallet Accounts</h2>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-4">
            You haven't connected any wallets yet.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Connect your wallet to track your assets and make
            deposits/withdrawals.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus size={16} className="mr-1" />
            Add Wallet
          </Button>
        </div>
      </div>
    </ProfileLayout>
  );
}
