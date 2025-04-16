import React from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChangePassword() {
  return (
    <ProfileLayout title="Password">
      <div className="space-y-6">
        <h2 className="text-xl font-medium mb-6">Change Password</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="block text-sm text-gray-400 mb-2"
            >
              Current Password
            </label>
            <Input
              id="current-password"
              type="password"
              className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 w-full"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm text-gray-400 mb-2"
            >
              New Password
            </label>
            <Input
              id="new-password"
              type="password"
              className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 w-full"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm text-gray-400 mb-2"
            >
              Confirm Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 w-full"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            SAVE CHANGES
          </Button>
        </div>
      </div>
    </ProfileLayout>
  );
}
