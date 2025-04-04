
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Display a loading indicator while checking authentication
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    // Redirect to /auth if not authenticated, saving the current location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>; // Render the children if authenticated
}
