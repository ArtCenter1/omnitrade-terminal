
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { BrowserRouter } from 'react-router-dom'

// Import mock API setup for development
import { setupMockAdminApi } from './mocks/mockAdminApi'

// Set up mock API for development
if (import.meta.env.DEV) {
  setupMockAdminApi()
  console.log('Mock API enabled for development')
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
