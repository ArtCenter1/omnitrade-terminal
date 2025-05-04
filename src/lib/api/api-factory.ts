/**
 * API Factory
 * 
 * This module determines whether to use the real API client or the mock API client
 * based on the environment. For GitHub Pages deployments, it will always use the mock API.
 */

import mockApiClient from '../mock-api';

// Check if we're running on GitHub Pages
const isGitHubPages = () => {
  // Check if the base path matches GitHub Pages pattern or if we're in a specific environment
  return window.location.hostname.includes('github.io') || 
         import.meta.env.VITE_USE_MOCK_API === 'true';
};

// Dynamically import the real API client only if we're not on GitHub Pages
const getApiClient = async () => {
  if (isGitHubPages()) {
    console.log('Using mock API client for GitHub Pages');
    return mockApiClient;
  }
  
  try {
    // Try to import the real API client
    // Note: This should be replaced with your actual API client path
    const { default: realApiClient } = await import('./real-api-client');
    console.log('Using real API client');
    return realApiClient;
  } catch (error) {
    // If import fails, fall back to mock API
    console.warn('Failed to load real API client, falling back to mock:', error);
    return mockApiClient;
  }
};

export default getApiClient;
