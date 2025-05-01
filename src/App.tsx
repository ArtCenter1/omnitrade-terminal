import React, { useState, useEffect } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider as ShadcnThemeProvider } from '@/components/ThemeProvider';
import '@/styles/themes.css';
import '@/styles/components.css';
import { Toaster } from '@/components/ui/sonner';
// Debug panel imports removed
// Debug panel removed
import UserRoleManagement from './pages/admin/UserRoleManagement';
import ComingSoon from './pages/admin/ComingSoon';
import DevSettings from './pages/admin/DevSettings';
import BinanceTestnetBenchmarkPage from './pages/admin/BinanceTestnetBenchmarkPage';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
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
// Exchange Demo page removed
import { useAuth } from './hooks/useAuth';

// Add import for our new components
import { RoleProtectedRoute } from './components/layout/RoleProtectedRoute';
// ProtectedRoute is now defined inline
// Import Navbar for protected routes
import Navbar from './components/Navbar';
import AdminDashboard from './pages/admin/AdminDashboard';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ConnectionStatusProvider } from './contexts/connectionStatusContext';
import { ConnectionStatusBar } from './components/connection/ConnectionStatusBar';

function App() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation(); // Add location hook here
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // ProtectedRoute component with Navbar
  const ProtectedRouteWrapper = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    const location = useLocation();

    console.log(
      'ProtectedRoute - User:',
      user ? 'Authenticated' : 'Not authenticated',
    );

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      ); // Replace with your loading component
    }

    if (!user) {
      console.log('ProtectedRoute - Redirecting to auth page');
      return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    console.log('ProtectedRoute - Rendering protected content');
    return (
      <>
        <Navbar />
        <ConnectionStatusBar />
        {children}
      </>
    );
  };

  // Debug panel functions and variables removed

  return (
    <ShadcnThemeProvider
      attribute="class"
      defaultTheme="dark"
      storageKey="omnitrade-theme"
      enableSystem={false}
    >
      <ConnectionStatusProvider>
        <Toaster />
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
          <Route
            path="/dashboard"
            element={
              <ProtectedRouteWrapper>
                <Dashboard />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/terminal"
            element={
              <ProtectedRouteWrapper>
                <Terminal />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/bots"
            element={
              <ProtectedRouteWrapper>
                <Bots />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/markets"
            element={
              <ProtectedRouteWrapper>
                <Markets />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/earn"
            element={
              <ProtectedRouteWrapper>
                <Earn />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRouteWrapper>
                <Community />
              </ProtectedRouteWrapper>
            }
          />
          <Route path="/ai-driven" element={<AIDrivenPage />} />

          {/* Demo routes removed */}

          {/* Profile routes (reverted to individual wrappers) */}
          <Route
            path="/profile"
            element={
              <ProtectedRouteWrapper>
                <UserProfile />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/profile/accounts"
            element={
              <ProtectedRouteWrapper>
                <MyAccounts />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/profile/security"
            element={
              <ProtectedRouteWrapper>
                <Security />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/profile/change-password"
            element={
              <ProtectedRouteWrapper>
                <ChangePassword />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/profile/preferences"
            element={
              <ProtectedRouteWrapper>
                <Preferences />
              </ProtectedRouteWrapper>
            }
          />
          <Route
            path="/profile/subscription"
            element={
              <ProtectedRouteWrapper>
                <PlanSubscription />
              </ProtectedRouteWrapper>
            }
          />

          {/* Admin routes - protected by role */}
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute
                allowedRoles={['admin']}
                redirectTo="/dashboard"
              >
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/users-roles"
            element={
              <RoleProtectedRoute
                allowedRoles={['admin']}
                redirectTo="/dashboard"
              >
                <UserRoleManagement />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/dev-settings"
            element={
              <RoleProtectedRoute
                allowedRoles={['admin']}
                redirectTo="/dashboard"
              >
                <DevSettings />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RoleProtectedRoute
                allowedRoles={['admin']}
                redirectTo="/dashboard"
              >
                <AnalyticsDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics/binance-benchmark"
            element={
              <RoleProtectedRoute
                allowedRoles={['admin']}
                redirectTo="/dashboard"
              >
                <BinanceTestnetBenchmarkPage />
              </RoleProtectedRoute>
            }
          />
          {/* Keep old routes for backward compatibility, but redirect to the new combined page */}
          <Route
            path="/admin/users"
            element={<Navigate to="/admin/users-roles" replace />}
          />
          <Route
            path="/admin/roles"
            element={<Navigate to="/admin/users-roles?tab=roles" replace />}
          />

          {/* Coming Soon pages for features under development */}
          <Route
            path="/admin/:feature"
            element={
              <RoleProtectedRoute
                allowedRoles={['admin']}
                redirectTo="/dashboard"
              >
                <ComingSoon />
              </RoleProtectedRoute>
            }
          />
        </Routes>
      </ConnectionStatusProvider>
    </ShadcnThemeProvider>
  );
}

export default App;
