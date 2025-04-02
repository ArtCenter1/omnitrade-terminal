
import React from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UserProfile() {
  return (
    <ProfileLayout title="User Profile">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-medium mb-4">General</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm text-gray-400 mb-2">
                Name
              </label>
              <Input
                id="name"
                type="text"
                defaultValue="Vincent"
                className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 w-full"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                defaultValue="artcenter1@gmail.com"
                className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            SAVE CHANGES
          </Button>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <h2 className="text-xl font-medium mb-4">Activity Log</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400 border-b border-gray-800">
              <tr>
                <th className="pb-2">Activity</th>
                <th className="pb-2">Date/Time</th>
                <th className="pb-2">IP Address</th>
                <th className="pb-2">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[
                { time: "08:36 PM", ip: "124.218.205.2" },
                { time: "08:33 PM", ip: "124.218.205.2" },
                { time: "08:32 PM", ip: "124.218.205.2" },
                { time: "08:16 PM", ip: "124.218.205.2" },
                { time: "08:13 PM", ip: "124.218.205.2" },
              ].map((log, index) => (
                <tr key={index}>
                  <td className="py-4">Login</td>
                  <td className="py-4">30 Mar 2025, {log.time}</td>
                  <td className="py-4">{log.ip}</td>
                  <td className="py-4">Xinzhuang District, TW</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <h2 className="text-xl font-medium mb-4 text-red-500">Danger Zone</h2>
        
        <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-300 mb-4">
            Permanently delete your OmniTrade user account and remove any associated exchange and wallet
            accounts and their data. This action cannot be undone.
          </p>
          
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
            DELETE ACCOUNT
          </Button>
        </div>
      </div>
    </ProfileLayout>
  );
}
