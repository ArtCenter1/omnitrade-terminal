import React, { createContext, useContext, useEffect } from 'react';
import { mockApiClient } from '@/lib/mock-api';

// Create a context for mock data
export const MockDataContext = createContext<{
  useMockData: boolean;
  mockApiClient: typeof mockApiClient;
}>({
  useMockData: false,
  mockApiClient,
});

// Hook to use mock data
export const useMockData = () => useContext(MockDataContext);

// Mock data provider component
export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if we should use mock data
  const useMockData = 
    import.meta.env.VITE_USE_MOCK_API === 'true' || 
    window.location.hostname.includes('github.io');

  useEffect(() => {
    if (useMockData) {
      console.log('Using mock data for showcase');
      
      // Store in localStorage for persistence
      localStorage.setItem('useMockData', 'true');
      
      // Enable mock user
      localStorage.setItem('useMockUser', 'true');
      
      // Set feature flags for mock data
      const FEATURE_FLAGS_STORAGE_KEY = 'omnitrade_feature_flags';
      try {
        // Get current flags
        let currentFlags = {};
        const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
        if (storedFlags) {
          currentFlags = JSON.parse(storedFlags);
        }
        
        // Enable mock data flag
        const updatedFlags = {
          ...currentFlags,
          useMockData: true
        };
        
        // Store updated flags
        localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(updatedFlags));
      } catch (error) {
        console.error('Error setting feature flags:', error);
      }
    }
  }, [useMockData]);

  return (
    <MockDataContext.Provider value={{ useMockData, mockApiClient }}>
      {children}
    </MockDataContext.Provider>
  );
};

export default MockDataProvider;
