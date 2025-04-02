
import React from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PlanSubscription() {
  return (
    <ProfileLayout title="Plan & Subscription">
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-medium mb-4">Change Plan</h2>
          
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-300 text-xs uppercase font-semibold mb-1">ADVANCED</div>
                <div className="text-sm text-gray-300">
                  For professional traders with limitless trading + automation needs.
                </div>
              </div>
              <div>
                <Select defaultValue="omni"> {/* Updated default value */}
                  <SelectTrigger className="w-64 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="omni">$50/month - Pay with OMNI (50% off)</SelectItem> {/* Updated value and text */}
                    <SelectItem value="usd">$100/month - Pay with USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="border border-green-600 rounded-lg p-4 relative">
            <span className="absolute top-0 right-4 text-green-500">Current Plan</span>
            <div className="flex items-start mt-4">
              <div className="bg-green-500 rounded-full p-1 mr-3 mt-1">
                <CheckCircle2 size={18} className="text-black" />
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <h3 className="text-lg font-bold">PRO</h3>
                  <div className="bg-green-600 text-xs px-2 py-1 rounded text-white ml-2">
                    CURRENT
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  For advanced traders with higher trading volume + automation needs.
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <Select defaultValue="trial">
                      <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="trial">Free Trial - 30 Days</SelectItem>
                        <SelectItem value="monthly">Monthly - $29.99</SelectItem>
                        <SelectItem value="annual">Annual - $289.99</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-red-400">
                    Trial Expires: Apr 1, 2025 8:00 AM (in 2 days)
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <div className="bg-gray-700 rounded-full p-1 mr-3 mt-1">
                <CheckCircle2 size={18} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-1">FREE</h3>
                <p className="text-sm text-gray-300 mb-4">
                  For beginners with basic monitoring, and limited trading + automation needs.
                </p>
                <Button variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  DOWNGRADE
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <p className="text-sm text-gray-400">Need more information?</p>
          </div>
          
          <div className="flex justify-center mt-2">
            <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              VIEW FULL PLAN DETAILS
            </Button>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
