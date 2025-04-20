// src/pages/admin/DevSettings.tsx
import React from 'react';
import { DevTools } from '@/components/dev/DevTools';
import { useFeatureFlagsContext } from '@/config/featureFlags.tsx';

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
        <h1 className="text-2xl font-bold mb-4">Developer Settings</h1>
        <p>
          Developer settings are only available in development mode or when
          debug tools are enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Developer Settings</h1>
      <DevTools />
    </div>
  );
}
