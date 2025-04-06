import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar'; // Assuming main Navbar is here
import { useAuth } from '@/hooks/useAuth';

export function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // You might want a better loading indicator here
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect them to the /auth page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar /> {/* Render the main navbar */}
      <main className="flex-grow"> {/* Ensure content area grows */}
        <Outlet /> {/* Render the nested route's component */}
      </main>
      {/* You could add a shared Footer here if needed */}
    </div>
  );
}

export default ProtectedLayout;
