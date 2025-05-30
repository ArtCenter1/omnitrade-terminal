import React from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Construction } from "lucide-react";
import { useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";

export default function ComingSoon() {
  const { feature } = useParams();

  // Format the feature name for display
  const getFeatureName = () => {
    if (!feature) return "This Feature";

    // Convert kebab-case to Title Case (e.g., "system-settings" to "System Settings")
    return feature
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <ProtectedLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{getFeatureName()}</h1>
          <BackButton to="/admin" label="Back to Admin Dashboard" />
        </div>

        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <Construction className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            We're working hard to build this feature. It will be available in a
            future update.
          </p>
          <div className="inline-block bg-gray-800 px-4 py-2 rounded-lg text-sm text-gray-300">
            Check back later for updates
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
