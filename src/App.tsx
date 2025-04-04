import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Terminal from './pages/Terminal';
import Bots from './pages/Bots';
import Markets from './pages/Markets';
import Earn from './pages/Earn';
import Community from './pages/Community';
import { TradingBotsLandingPage } from './pages/TradingBotsLanding';
import { ProtectedRoute } from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import UserProfilePage from './pages/UserProfilePage'; // Corrected import path and name
import MyAccounts from './pages/profile/MyAccounts';
import Preferences from './pages/profile/Preferences';
import Security from './pages/profile/Security';
import PlanSubscription from './pages/profile/PlanSubscription';
import { BlogPage } from './pages/Blog';
import { PricingPage } from './pages/Pricing';
import { OmniTokenPage } from './pages/OmniToken';
import { CodyAIPage } from './pages/CodyAI';
import AuthPage from './pages/auth/AuthPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedLayout } from './components/layout/ProtectedLayout'; // Import the layout

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth/*" element={<AuthPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/omni-token" element={<OmniTokenPage />} />
          <Route path="/trading-bots" element={<TradingBotsLandingPage />} />
          <Route path="/cody-ai" element={<CodyAIPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><ProtectedLayout><Dashboard /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/terminal" element={<ProtectedRoute><ProtectedLayout><Terminal /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/bots" element={<ProtectedRoute><ProtectedLayout><Bots /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/markets" element={<ProtectedRoute><ProtectedLayout><Markets /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/earn" element={<ProtectedRoute><ProtectedLayout><Earn /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><ProtectedLayout><Community /></ProtectedLayout></ProtectedRoute>} />
          
          {/* Profile routes */}
          {/* Profile routes also use the ProtectedLayout */}
          <Route path="/profile" element={<ProtectedRoute><ProtectedLayout><UserProfilePage /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/profile/accounts" element={<ProtectedRoute><ProtectedLayout><MyAccounts /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/profile/preferences" element={<ProtectedRoute><ProtectedLayout><Preferences /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/profile/security" element={<ProtectedRoute><ProtectedLayout><Security /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/profile/subscription" element={<ProtectedRoute><ProtectedLayout><PlanSubscription /></ProtectedLayout></ProtectedRoute>} />
          
          {/* 404 and fallback */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
