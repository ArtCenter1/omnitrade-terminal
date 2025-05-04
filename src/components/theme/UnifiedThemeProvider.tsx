import React, { createContext, useContext, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';

// Define the theme context type
type UnifiedThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
};

// Create the context
const UnifiedThemeContext = createContext<UnifiedThemeContextType | undefined>(undefined);

/**
 * UnifiedThemeProvider component that combines next-themes with our custom theme system
 * This provides a single source of truth for theme management throughout the application
 */
export function UnifiedThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  // Default props if not provided
  const defaultProps: Partial<ThemeProviderProps> = {
    attribute: 'class',
    defaultTheme: 'dark',
    storageKey: 'omnitrade-theme',
    enableSystem: false,
    disableTransitionOnChange: false
  };

  // Merge default props with provided props
  const mergedProps = { ...defaultProps, ...props };

  return (
    <NextThemesProvider {...mergedProps}>
      <UnifiedThemeProviderInner>{children}</UnifiedThemeProviderInner>
    </NextThemesProvider>
  );
}

/**
 * Inner provider that accesses next-themes context and provides our unified interface
 */
function UnifiedThemeProviderInner({ children }: { children: React.ReactNode }) {
  // Use the next-themes hook directly
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // We no longer need to apply theme classes here as ThemeClassApplier handles this
  // This prevents duplicate class application and potential race conditions
  useEffect(() => {
    // We still want to log theme changes for debugging
    console.log(`Theme changed to: ${resolvedTheme || theme || 'dark'}`);

    // Any theme-specific logic that isn't related to DOM classes can go here
  }, [theme, resolvedTheme]);

  // Provide the unified theme context
  return (
    <UnifiedThemeContext.Provider
      value={{
        theme: resolvedTheme || theme || 'dark',
        setTheme,
        toggleTheme
      }}
    >
      {children}
    </UnifiedThemeContext.Provider>
  );
}

/**
 * Hook to use the unified theme context
 */
export function useUnifiedTheme() {
  const context = useContext(UnifiedThemeContext);
  if (context === undefined) {
    throw new Error('useUnifiedTheme must be used within a UnifiedThemeProvider');
  }
  return context;
}
