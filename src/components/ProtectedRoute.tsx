import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '@/hooks/useAuth'; // Placeholder for actual auth hook

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * A component to wrap routes that require authentication.
 * Currently a placeholder - will check auth status in later phases.
 * If not authenticated, it should redirect to the login page.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Placeholder for authentication check
  // const { isAuthenticated } = useAuth(); // Example usage of an auth hook
  const isAuthenticated = true; // Assume user is authenticated for now

  // if (!isAuthenticated) {
  //   // Redirect them to the /login page, but save the current location they were
  //   // trying to go to when they were redirected. This allows us to send them
  //   // along to that page after they login, which is a nicer user experience
  //   // than dropping them off on the home page.
  //   return <Navigate to="/login" replace />;
  // }

  return <>{children}</>; // Render the children if authenticated (or for placeholder)
}