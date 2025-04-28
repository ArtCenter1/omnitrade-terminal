import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/crypto-colors.css';
import './styles/protected-theme-override.css';
import { AuthProvider } from './contexts/AuthContext';
import { FeatureFlagsProvider } from './config/featureFlags.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Debug panel toggle function removed

// Create a QueryClient instance with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Query error:', error);
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
import { BrowserRouter } from 'react-router-dom';

// Import mock API setup for development
import { setupMockApis } from './mocks/mockSetup';
import { setupMockAdminApi } from './mocks/mockAdminApi';
import { setupMockFetch } from './mocks/mockFetch';
import { setupApiMiddleware } from './mocks/apiMiddleware';

// Import development helpers
import './utils/devHelpers';
import { migrateSandboxToDemoAccount } from './utils/demoAccountMigration';

// Migrate Sandbox Account to Demo Account in localStorage
migrateSandboxToDemoAccount();

// Set up mock API for development
if (import.meta.env.DEV) {
  // Define originalFetch on window to avoid reference errors
  window.originalFetch = window.fetch;

  // Initialize API middleware first
  setupApiMiddleware();

  // Then set up the specific mock implementations
  setupMockFetch();
  setupMockAdminApi();

  // Initialize the MSW worker with all handlers
  setupMockApis();

  console.log('Mock APIs enabled for development');

  // Setup mock APIs but don't enable mock user by default
  // This allows real authentication to work properly
  console.log('Mock APIs ready but not automatically enabled');

  // Check if we have any leftover mock user data and clean it up
  if (localStorage.getItem('useMockUser') === 'true') {
    console.log('Found existing mock user setting, keeping it enabled');
  }
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <FeatureFlagsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FeatureFlagsProvider>
    </BrowserRouter>
  </QueryClientProvider>,
);
