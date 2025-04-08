
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAccess, UserRole } from '@/hooks/useRoleBasedAccess';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/dashboard'
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

  // Debug component to show role information
  const DebugInfo = () => (
    <div className="fixed bottom-0 left-0 bg-black bg-opacity-80 text-white p-2 m-2 rounded-lg z-50 text-xs max-w-[200px]">
      <h3 className="font-bold mb-1">Role Debug</h3>
      <p className="truncate">User: {user?.email}</p>
      <p>Role: {userRole}</p>
      <p>Allowed: {allowedRoles.join(', ')}</p>
      <p>Access: {allowedRoles.includes(userRole) ? 'Yes' : 'No'}</p>
      <button
        className="mt-1 bg-blue-600 text-white px-2 py-1 rounded text-xs w-full"
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </div>
  );

  // If authenticated but doesn't have the required role
  if (!allowedRoles.includes(userRole)) {
    return (
      <>
        <DebugInfo />
        <Navigate to={redirectTo} replace />
      </>
    );
  }

  // User is authenticated and has the required role
  return (
    <>
      <DebugInfo />
      {children}
    </>
  );
};
