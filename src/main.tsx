import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a QueryClient instance
const queryClient = new QueryClient();
import { BrowserRouter } from 'react-router-dom'

// Import mock API setup for development
import { setupMockAdminApi } from './mocks/mockAdminApi'

// Set up mock API for development
if (import.meta.env.DEV) {
  setupMockAdminApi()
  console.log('Mock API enabled for development')
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
