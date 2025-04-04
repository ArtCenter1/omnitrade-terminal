import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// Simple Top Navigation Bar Component
const TopNavBar = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // AuthContext listener should handle navigation and toast message
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-800 sticky top-0 z-50">
      <div className="flex items-center space-x-6">
        <Link to="/" className="font-bold text-xl text-green-500">OmniTrade</Link>
        <Link to="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Dashboard</Link>
        <Link to="/terminal" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Terminal</Link>
        <Link to="/bots" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Bots</Link>
        <Link to="/markets" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Markets</Link>
        <Link to="/earn" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Earn</Link>
        <Link to="/community" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Community</Link>
      </div>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {/* Placeholder for user menu/avatar */}
            <Link to="/profile" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              {user.email}
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Sign Out
            </Button>
          </>
        ) : (
          // Should not happen in ProtectedLayout, but good fallback
          <Link to="/auth">
            <Button variant="outline" size="sm" className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

// Main Layout Component for Protected Routes
export const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <TopNavBar />
      {/* Main content area */}
      <main className="flex-grow">
        {children}
      </main>
      {/* Optional: Add a footer here if needed */}
      {/* <footer className="bg-gray-900 p-4 text-center text-xs text-gray-500 border-t border-gray-800">
        © {new Date().getFullYear()} OmniTrade. All rights reserved.
      </footer> */}
    </div>
  );
};