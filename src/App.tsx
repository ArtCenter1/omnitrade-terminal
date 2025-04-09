import React, { useState, useEffect } from 'react';
import {
  Route,
  Routes,
  useLocation,
  Navigate
} from 'react-router-dom';
import { ThemeProvider as ShadcnThemeProvider } from "@/components/ThemeProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "@/styles/themes.css";
import "@/styles/components.css";
import UserRoleManagement from './pages/admin/UserRoleManagement';
import ComingSoon from './pages/admin/ComingSoon';
import { ScrollToTop } from './components/ScrollToTop';
import Index from './pages/Index';
import AuthPage from './pages/auth/AuthPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
// ResetPasswordPage is imported below
import Pricing from './pages/Pricing';
import OmniToken from './pages/OmniToken';
import TradingBotsLanding from './pages/TradingBotsLanding';
import Blog from './pages/Blog';
import NotFound from './pages/NotFound';
import Dashboard from './pages/dashboard/Dashboard';
import Terminal from './pages/Terminal';
import Bots from './pages/Bots';
import Markets from './pages/Markets';
import Earn from './pages/Earn';
import Community from './pages/Community';
import AIDrivenPage from './pages/AIDriven';
import UserProfile from './pages/profile/UserProfile';
import MyAccounts from './pages/profile/MyAccounts';
import Security from './pages/profile/Security';
import ChangePassword from './pages/profile/ChangePassword';
import Preferences from './pages/profile/Preferences';
import PlanSubscription from './pages/profile/PlanSubscription';
import { useAuth } from './hooks/useAuth';

// Add import for our new components
import { RoleProtectedRoute } from './components/layout/RoleProtectedRoute';
import ProtectedRoute from './components/layout/ProtectedRoute.tsx';
// Import Navbar for protected routes
import Navbar from './components/Navbar';
import AdminDashboard from './pages/admin/AdminDashboard';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

function App() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation(); // Add location hook here
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [])

  // ProtectedRoute component with Navbar
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    if (loading) {
      return <div>Loading...</div>; // Replace with your loading component
    }
    if (!user) {
      return <Navigate to="/auth" replace state={{ from: location }} />;
    }
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  };

  return (
    <ShadcnThemeProvider defaultTheme="dark" storageKey="omnitrade-theme">
      <ThemeProvider>
        <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/omni-token" element={<OmniToken />} />
          <Route path="/trading-bots" element={<TradingBotsLanding />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="*" element={<NotFound />} />

          {/* Protected routes (reverted to individual wrappers) */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/terminal" element={<ProtectedRoute><Terminal /></ProtectedRoute>} />
          <Route path="/bots" element={<ProtectedRoute><Bots /></ProtectedRoute>} />
          <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
          <Route path="/earn" element={<ProtectedRoute><Earn /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/ai-driven" element={<AIDrivenPage />} />

          {/* Profile routes (reverted to individual wrappers) */}
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/profile/accounts" element={<ProtectedRoute><MyAccounts /></ProtectedRoute>} />
          <Route path="/profile/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
          <Route path="/profile/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/profile/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
          <Route path="/profile/subscription" element={<ProtectedRoute><PlanSubscription /></ProtectedRoute>} />

          {/* Admin routes - protected by role */}
          <Route path="/admin" element={
            <RoleProtectedRoute allowedRoles={['admin']} redirectTo="/dashboard">
              <AdminDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/users-roles" element={
            <RoleProtectedRoute allowedRoles={['admin']} redirectTo="/dashboard">
              <UserRoleManagement />
            </RoleProtectedRoute>
          } />
          {/* Keep old routes for backward compatibility, but redirect to the new combined page */}
          <Route path="/admin/users" element={<Navigate to="/admin/users-roles" replace />} />
          <Route path="/admin/roles" element={<Navigate to="/admin/users-roles?tab=roles" replace />} />

          {/* Coming Soon pages for features under development */}
          <Route path="/admin/:feature" element={
            <RoleProtectedRoute allowedRoles={['admin']} redirectTo="/dashboard">
              <ComingSoon />
            </RoleProtectedRoute>
          } />
        </Routes>
      </ThemeProvider>
    </ShadcnThemeProvider>
  );
}

export default App;
