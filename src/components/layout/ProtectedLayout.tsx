import React, { ReactNode } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar"; // Assuming main Navbar is here
import { useAuth } from "@/hooks/useAuth";

interface ProtectedLayoutProps {
  children?: ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Loading indicator with theme support
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-primary text-theme-primary theme-transition">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-link"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect them to the /auth page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-theme-primary theme-transition">
      <Navbar /> {/* Render the main navbar */}
      <main className="flex-grow bg-theme-primary text-theme-primary theme-transition">
        {" "}
        {/* Ensure content area grows */}
        {children || <Outlet />}{" "}
        {/* Render children if provided, otherwise render the Outlet */}
      </main>
      {/* You could add a shared Footer here if needed */}
    </div>
  );
}

export default ProtectedLayout;
