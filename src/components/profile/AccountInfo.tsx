
import React from "react";
import { useAuth } from "@/hooks/useAuth";

export function AccountInfo() {
  const { user } = useAuth();
  
  // Get user metadata from Supabase
  const userName = user?.user_metadata?.user_name || '';
  const displayName = userName || user?.email?.split('@')[0] || 'User';
  
  // Format current date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric'
    }).format(date);
  };
  
  const currentDate = new Date();
  
  return (
    <div className="bg-gray-900 rounded-lg p-4 w-full mb-6">
      <h3 className="text-lg font-medium text-white mb-4">My Account</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Name:</span>
          <span className="text-white text-sm">{displayName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Registered:</span>
          <span className="text-white text-sm">{user?.created_at ? formatDate(new Date(user.created_at)) : 'Jun, 2019'}</span>
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
