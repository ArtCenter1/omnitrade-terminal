import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAccess, UserRole } from '@/hooks/useRoleBasedAccess';
import { Loader2 } from 'lucide-react';
import { UnifiedDebugPanel } from '@/components/debug/UnifiedDebugPanel';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { userRole, isLoading: roleLoading } = useRoleBasedAccess();

  const isLoading = authLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-950">
        <Loader2 className="animate-spin h-8 w-8 text-green-500" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Environment check - only show debug in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  // If authenticated but doesn't have the required role
  if (!allowedRoles.includes(userRole)) {
    return (
      <>
        {isDevelopment && <UnifiedDebugPanel allowedRoles={allowedRoles} />}
        <Navigate to={redirectTo} replace />
      </>
    );
  }

  // User is authenticated and has the required role
  return (
    <>
      {isDevelopment && <UnifiedDebugPanel allowedRoles={allowedRoles} />}
      {children}
    </>
  );
};
