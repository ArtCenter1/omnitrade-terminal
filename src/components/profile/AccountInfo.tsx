
import React from "react";

export function AccountInfo() {
  return (
    <div className="bg-gray-900 rounded-lg p-4 w-full mb-6">
      <h3 className="text-lg font-medium text-white mb-4">My Account</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Registered:</span>
          <span className="text-white text-sm">Jun, 2019</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Current Plan:</span>
          <span className="text-white text-sm">PRO</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Expires/Renews:</span>
          <span className="text-white text-sm">Apr 1, 2025 8:00 AM</span>
        </div>
      </div>

      <h3 className="text-lg font-medium text-white mb-4">Last Login</h3>
      
      <div className="space-y-2 mb-2">
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Date/Time:</span>
          <span className="text-white text-sm">30 Mar 2025, 08:36 PM</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">IP Address:</span>
          <span className="text-white text-sm">124.218.205.2</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Location:</span>
          <span className="text-white text-sm">Xinzhuang District, TW</span>
        </div>
      </div>
    </div>
  );
}
