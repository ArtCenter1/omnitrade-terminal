// src/pages/admin/DevSettings.tsx
import React from 'react';
import { DevTools } from '@/components/dev/DevTools';
import { useFeatureFlagsContext } from '@/config/featureFlags.tsx';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Developer settings page
 * Only accessible to admin users
 */
export default function DevSettings() {
  const flags = useFeatureFlagsContext();

  // Only show in development mode or when debug tools are enabled
  if (import.meta.env.PROD && !flags.enableDebugTools) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Developer Settings</h1>
          <Link
            to="/admin"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
        </div>
        <p>
          Developer settings are only available in development mode or when
          debug tools are enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Developer Settings</h1>
        <Link
          to="/admin"
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Link>
      </div>
      <DevTools />
    </div>
  );
}
