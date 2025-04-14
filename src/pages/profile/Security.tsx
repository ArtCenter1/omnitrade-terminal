import React from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { Button } from "@/components/ui/button";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";
import { Badge } from "@/components/ui/badge";

export default function Security() {
  const { userRole } = useRoleBasedAccess();

  return (
    <ProfileLayout title="Account Security">
      <div className="space-y-8">
        {/* Role Information */}
        <div>
          <h2 className="text-xl font-medium mb-4">Account Role</h2>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 mb-2">Your current account role:</p>
                <Badge
                  className={`
                  text-sm px-3 py-1
                  ${userRole === "admin" ? "bg-purple-900/40 text-purple-300 border-purple-700" : ""}
                  ${userRole === "premium" ? "bg-green-900/40 text-green-300 border-green-700" : ""}
                  ${userRole === "user" ? "bg-gray-800 text-gray-300 border-gray-700" : ""}
                `}
                >
                  {userRole?.toUpperCase()}
                </Badge>
              </div>
              {userRole === "user" && (
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  UPGRADE TO PREMIUM
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 2FA Section */}
        <div>
          <h2 className="text-xl font-medium mb-4">2 Factor Authentication</h2>

          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-300 text-sm">
              Enabling 2FA (2 Factor Authentication) is highly recommended. This
              adds an extra layer of security to your account in addition to
              your password.
            </p>

            <div className="mt-6 flex justify-end">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                ENABLE
              </Button>
            </div>
          </div>
        </div>

        {/* Password Change Link */}
        <div>
          <h2 className="text-xl font-medium mb-4">Password</h2>

          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-300 text-sm mb-6">
              We recommend changing your password regularly to keep your account
              secure. Your password should be at least 12 characters long and
              include a mix of letters, numbers, and symbols.
            </p>

            <div className="flex justify-end">
              <Button
                className="bg-gray-700 hover:bg-gray-600 text-white"
                onClick={() =>
                  (window.location.href = "/profile/change-password")
                }
              >
                CHANGE PASSWORD
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
