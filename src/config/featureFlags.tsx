// src/config/featureFlags.tsx
import { ConnectionMode } from './exchangeConfig';
import React from 'react';

/**
 * Feature flags for the application
 * These can be toggled at runtime to enable/disable features
 */
export interface FeatureFlags {
  // Data source flags
  useMockData: boolean;
  useRealMarketData: boolean;
  
  // Connection mode (mock, sandbox, live)
  connectionMode: ConnectionMode;
  
  // Feature toggles
  enableSandboxAccount: boolean;
  enableDebugTools: boolean;
  
  // UI flags
  showPerformanceMetrics: boolean;
}

// Default feature flags
const defaultFeatureFlags: FeatureFlags = {
  useMockData: import.meta.env.DEV, // Use mock data in development by default
  useRealMarketData: false, // Don't use real market data by default
  connectionMode: import.meta.env.DEV ? 'mock' : 'sandbox', // Use mock in dev, sandbox in prod
  enableSandboxAccount: true, // Always enable sandbox account
  enableDebugTools: import.meta.env.DEV, // Only enable debug tools in development
  showPerformanceMetrics: false, // Don't show performance metrics by default
};

// Local storage key for feature flags
const FEATURE_FLAGS_STORAGE_KEY = 'omnitrade_feature_flags';

/**
 * Get the current feature flags
 * Combines default flags with any stored flags
 */
export function getFeatureFlags(): FeatureFlags {
  try {
    // Get stored flags from local storage
    const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    if (!storedFlags) {
      return defaultFeatureFlags;
    }
    
    // Parse stored flags
    const parsedFlags = JSON.parse(storedFlags) as Partial<FeatureFlags>;
    
    // Combine default flags with stored flags
    return {
      ...defaultFeatureFlags,
      ...parsedFlags,
    };
  } catch (error) {
    console.error('Error getting feature flags:', error);
    return defaultFeatureFlags;
  }
}

/**
 * Set a feature flag
 * @param flag The flag to set
 * @param value The value to set the flag to
 */
export function setFeatureFlag<K extends keyof FeatureFlags>(
  flag: K,
  value: FeatureFlags[K]
): void {
  try {
    // Get current flags
    const currentFlags = getFeatureFlags();
    
    // Update flag
    const updatedFlags = {
      ...currentFlags,
      [flag]: value,
    };
    
    // Store updated flags
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(updatedFlags));
    
    // Dispatch event to notify subscribers
    window.dispatchEvent(new CustomEvent('feature-flags-changed', {
      detail: {
        flag,
        value,
        flags: updatedFlags,
      },
    }));
  } catch (error) {
    console.error(`Error setting feature flag ${String(flag)}:`, error);
  }
}

/**
 * Reset feature flags to defaults
 */
export function resetFeatureFlags(): void {
  localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);
  
  // Dispatch event to notify subscribers
  window.dispatchEvent(new CustomEvent('feature-flags-changed', {
    detail: {
      flags: defaultFeatureFlags,
    },
  }));
}

/**
 * Subscribe to feature flag changes
 * @param callback The callback to call when feature flags change
 * @returns A function to unsubscribe
 */
export function subscribeToFeatureFlags(
  callback: (flags: FeatureFlags) => void
): () => void {
  const handleFlagsChanged = (event: Event) => {
    const customEvent = event as CustomEvent<{
      flags: FeatureFlags;
    }>;
    callback(customEvent.detail.flags);
  };
  
  window.addEventListener('feature-flags-changed', handleFlagsChanged);
  
  return () => {
    window.removeEventListener('feature-flags-changed', handleFlagsChanged);
  };
}

/**
 * Hook to use feature flags in React components
 */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = React.useState<FeatureFlags>(getFeatureFlags());
  
  React.useEffect(() => {
    const handleFlagsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        flags: FeatureFlags;
      }>;
      setFlags(customEvent.detail.flags);
    };
    
    window.addEventListener('feature-flags-changed', handleFlagsChanged);
    
    return () => {
      window.removeEventListener('feature-flags-changed', handleFlagsChanged);
    };
  }, []);
  
  return flags;
}

// Export a React context for feature flags
export const FeatureFlagsContext = React.createContext<FeatureFlags>(defaultFeatureFlags);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = React.useState<FeatureFlags>(getFeatureFlags());
  
  React.useEffect(() => {
    const handleFlagsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        flags: FeatureFlags;
      }>;
      setFlags(customEvent.detail.flags);
    };
    
    window.addEventListener('feature-flags-changed', handleFlagsChanged);
    
    return () => {
      window.removeEventListener('feature-flags-changed', handleFlagsChanged);
    };
  }, []);
  
  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlagsContext() {
  return React.useContext(FeatureFlagsContext);
}
