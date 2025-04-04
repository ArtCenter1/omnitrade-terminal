
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Terminal from './pages/Terminal';
import Bots from './pages/Bots';
import Markets from './pages/Markets';
import Earn from './pages/Earn';
import Community from './pages/Community';
import TradingBotsLanding from './pages/TradingBotsLanding';
import { ProtectedRoute } from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import UserProfile from './pages/profile/UserProfile';
import MyAccounts from './pages/profile/MyAccounts';
import Preferences from './pages/profile/Preferences';
import Security from './pages/profile/Security';
import PlanSubscription from './pages/profile/PlanSubscription';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import OmniToken from './pages/OmniToken';
import CodyAI from './pages/CodyAI';
import AuthPage from './pages/auth/AuthPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/omni-token" element={<OmniToken />} />
          <Route path="/trading-bots" element={<TradingBotsLanding />} />
          <Route path="/cody-ai" element={<CodyAI />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/terminal" element={<ProtectedRoute><Terminal /></ProtectedRoute>} />
          <Route path="/bots" element={<ProtectedRoute><Bots /></ProtectedRoute>} />
          <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
          <Route path="/earn" element={<ProtectedRoute><Earn /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          
          {/* Profile routes */}
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/profile/accounts" element={<ProtectedRoute><MyAccounts /></ProtectedRoute>} />
          <Route path="/profile/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
          <Route path="/profile/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
          <Route path="/profile/subscription" element={<ProtectedRoute><PlanSubscription /></ProtectedRoute>} />
          
          {/* 404 and fallback */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
