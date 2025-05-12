// src/config/featureFlags.tsx
import { ConnectionMode } from './exchangeConfig';
import React from 'react';

/**
 * Feature flags for the application
 * These can be toggled at runtime to enable/disable features
 */
export interface FeatureFlags {
  // Data source flags - these are derived from connectionMode
  // useMockData is true when connectionMode is 'mock'
  // useRealMarketData is true when connectionMode is 'sandbox' or 'live'
  readonly useMockData: boolean;
  readonly useRealMarketData: boolean;

  // Connection mode (mock, sandbox, live)
  connectionMode: ConnectionMode;

  // Feature toggles
  enableDemoAccount: boolean;
  enableDebugTools: boolean;
  useBinanceTestnet: boolean;
  enableBinanceTestnetBenchmark: boolean;
  disableCoinGeckoApi: boolean; // Kill switch for CoinGecko API calls

  // UI flags
  showPerformanceMetrics: boolean;
}

// Default connection mode based on environment
const defaultConnectionMode: ConnectionMode = import.meta.env.DEV
  ? 'mock'
  : 'sandbox';

// Default feature flags
const defaultFeatureFlags: Omit<
  FeatureFlags,
  'useMockData' | 'useRealMarketData'
> & {
  connectionMode: ConnectionMode;
} = {
  connectionMode: defaultConnectionMode, // Use mock in dev, sandbox in prod
  enableDemoAccount: true, // Always enable demo account
  enableDebugTools: import.meta.env.DEV, // Only enable debug tools in development
  useBinanceTestnet: import.meta.env.DEV, // Use Binance Testnet in development by default
  enableBinanceTestnetBenchmark: false, // Disable benchmark by default
  disableCoinGeckoApi: false, // CoinGecko API is enabled by default
  showPerformanceMetrics: false, // Don't show performance metrics by default
};

// Local storage key for feature flags
const FEATURE_FLAGS_STORAGE_KEY = 'omnitrade_feature_flags';

/**
 * Get the current feature flags
 * Combines default flags with any stored flags
 * Derives useMockData and useRealMarketData from connectionMode
 */
export function getFeatureFlags(): FeatureFlags {
  try {
    // Get stored flags from local storage
    const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);

    // Parse stored flags or use empty object if none exist
    const parsedFlags = storedFlags
      ? (JSON.parse(storedFlags) as Partial<FeatureFlags>)
      : {};

    // Merge with default flags, giving priority to stored values
    const mergedFlags = {
      ...defaultFeatureFlags,
      ...parsedFlags,
    };

    // Ensure connectionMode is valid
    const connectionMode = mergedFlags.connectionMode || defaultConnectionMode;

    // Create the complete flags object with derived values
    const completeFlags: FeatureFlags = {
      ...mergedFlags,
      connectionMode,
      // useMockData is true only in mock mode
      useMockData: connectionMode === 'mock',
      // useRealMarketData is true in sandbox or live mode
      useRealMarketData:
        connectionMode === 'sandbox' || connectionMode === 'live',
    };

    return completeFlags;
  } catch (error) {
    console.error('Error getting feature flags:', error);

    // Return default flags with derived values
    return {
      ...defaultFeatureFlags,
      useMockData: defaultConnectionMode === 'mock',
      useRealMarketData:
        defaultConnectionMode === 'sandbox' || defaultConnectionMode === 'live',
    };
  }
}

/**
 * Set a feature flag
 * @param flag The flag to set
 * @param value The value to set the flag to
 */
export function setFeatureFlag<K extends keyof FeatureFlags>(
  flag: K,
  value: FeatureFlags[K],
): void {
  try {
    // Get current flags from storage
    const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    const parsedFlags = storedFlags
      ? (JSON.parse(storedFlags) as Partial<FeatureFlags>)
      : {};

    // Special handling for useMockData and useRealMarketData
    // These are derived from connectionMode and cannot be set directly
    if (flag === 'useMockData' || flag === 'useRealMarketData') {
      console.warn(
        `Cannot directly set ${String(flag)}. This value is derived from connectionMode.`,
      );

      // Instead of recursively calling setFeatureFlag, we'll directly update connectionMode
      let newConnectionMode: ConnectionMode | null = null;

      // If trying to set useMockData to true, set connectionMode to 'mock'
      if (flag === 'useMockData' && value === true) {
        newConnectionMode = 'mock';
      }
      // If trying to set useRealMarketData to true, set connectionMode to 'sandbox'
      else if (flag === 'useRealMarketData' && value === true) {
        newConnectionMode = 'sandbox';
      }

      // If we determined a new connection mode, update it directly
      if (newConnectionMode) {
        const updatedFlags = {
          ...parsedFlags,
          connectionMode: newConnectionMode,
        };

        // Store updated flags
        localStorage.setItem(
          FEATURE_FLAGS_STORAGE_KEY,
          JSON.stringify(updatedFlags),
        );

        // Get the complete flags with derived values
        const completeFlags = getFeatureFlags();

        // Dispatch event to notify subscribers
        window.dispatchEvent(
          new CustomEvent('feature-flags-changed', {
            detail: {
              flag: 'connectionMode' as keyof FeatureFlags,
              value: newConnectionMode,
              flags: completeFlags,
            },
          }),
        );
      }

      return;
    }

    // For all other flags, update normally
    const updatedFlags = {
      ...parsedFlags,
      [flag]: value,
    };

    // Store updated flags
    localStorage.setItem(
      FEATURE_FLAGS_STORAGE_KEY,
      JSON.stringify(updatedFlags),
    );

    // Get the complete flags with derived values
    const completeFlags = getFeatureFlags();

    // Dispatch event to notify subscribers
    window.dispatchEvent(
      new CustomEvent('feature-flags-changed', {
        detail: {
          flag,
          value,
          flags: completeFlags,
        },
      }),
    );
  } catch (error) {
    console.error(`Error setting feature flag ${String(flag)}:`, error);
  }
}

/**
 * Reset feature flags to defaults
 */
export function resetFeatureFlags(): void {
  // Remove stored flags
  localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);

  // Create a complete default flags object with derived values
  const completeDefaultFlags: FeatureFlags = {
    ...defaultFeatureFlags,
    useMockData: defaultConnectionMode === 'mock',
    useRealMarketData:
      defaultConnectionMode === 'sandbox' || defaultConnectionMode === 'live',
  };

  // Dispatch event to notify subscribers
  window.dispatchEvent(
    new CustomEvent('feature-flags-changed', {
      detail: {
        flags: completeDefaultFlags,
      },
    }),
  );

  console.log('Feature flags reset to defaults:', completeDefaultFlags);
}

/**
 * Subscribe to feature flag changes
 * @param callback The callback to call when feature flags change
 * @returns A function to unsubscribe
 */
export function subscribeToFeatureFlags(
  callback: (flags: FeatureFlags) => void,
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
export const FeatureFlagsContext =
  React.createContext<FeatureFlags>(defaultFeatureFlags);

export function FeatureFlagsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
