import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/crypto-colors.css';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a QueryClient instance with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Query error:', error);
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
import { BrowserRouter } from 'react-router-dom';

// Import mock API setup for development
import { setupMockAdminApi } from './mocks/mockAdminApi';
import { setupMockFetch } from './mocks/mockFetch';

// Import development helpers
import './utils/devHelpers';

// Set up mock API for development
if (import.meta.env.DEV) {
  setupMockAdminApi();
  setupMockFetch();
  console.log('Mock APIs enabled for development');

  // Enable mock user by default in development
  if (localStorage.getItem('useMockUser') === null) {
    localStorage.setItem('useMockUser', 'true');
    console.log('Mock user enabled by default for development');
  }
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>,
);
