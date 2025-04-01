
import React from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { Button } from "@/components/ui/button";

export default function Security() {
  return (
    <ProfileLayout title="Account Security">
      <div className="space-y-6">
        <h2 className="text-xl font-medium mb-6">2 Factor Authentication</h2>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-300 text-sm">
            Enabling 2FA (2 Factor Authentication) is highly recommended. This adds an extra layer of security to your account in
            addition to your password.
          </p>
          
          <div className="mt-6 flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              ENABLE
            </Button>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
