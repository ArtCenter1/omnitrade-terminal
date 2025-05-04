// src/pages/admin/DevSettings.tsx
import React from 'react';
import { DevTools } from '@/components/dev/DevTools';
import { useFeatureFlagsContext } from '@/config/featureFlags.tsx';
import { BackButton } from '@/components/ui/back-button';

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
          <BackButton to="/admin" label="Back to Admin Dashboard" />
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Developer Settings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure feature flags and development tools
          </p>
        </div>
        <BackButton to="/admin" label="Back to Admin Dashboard" />
      </div>
      <DevTools />
    </div>
  );
}
