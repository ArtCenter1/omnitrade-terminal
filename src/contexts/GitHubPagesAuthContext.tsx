import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUser } from '../lib/mock-api';

// Define the auth context type
interface AuthContextType {
  user: any | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

// Create the context with a default value
const GitHubPagesAuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
});

// Custom hook to use the auth context
export const useGitHubPagesAuth = () => useContext(GitHubPagesAuthContext);

// Provider component
export const GitHubPagesAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for saved user in localStorage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('github-pages-demo-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Auto-login with demo user for GitHub Pages
      setUser(mockUser);
      localStorage.setItem('github-pages-demo-user', JSON.stringify(mockUser));
    }
    setLoading(false);
  }, []);

  // Mock login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Always succeed with mock user
      setUser(mockUser);
      localStorage.setItem('github-pages-demo-user', JSON.stringify(mockUser));
      setError(null);
    } catch (err) {
      setError('Login failed');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock register function
  const register = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a custom user based on input but with mock data structure
      const newUser = {
        ...mockUser,
        email,
        username,
      };
      
      setUser(newUser);
      localStorage.setItem('github-pages-demo-user', JSON.stringify(newUser));
      setError(null);
    } catch (err) {
      setError('Registration failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock logout function
  const logout = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(null);
      localStorage.removeItem('github-pages-demo-user');
      setError(null);
    } catch (err) {
      setError('Logout failed');
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock reset password function
  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Always succeed
      setError(null);
      // Show success message through alert for demo
      alert(`Password reset email would be sent to ${email} in a real app`);
    } catch (err) {
      setError('Password reset failed');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock update profile function
  const updateProfile = async (data: any) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the user with new data
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('github-pages-demo-user', JSON.stringify(updatedUser));
      setError(null);
    } catch (err) {
      setError('Profile update failed');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create the context value object
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
  };

  return (
    <GitHubPagesAuthContext.Provider value={contextValue}>
      {children}
    </GitHubPagesAuthContext.Provider>
  );
};

// Export a wrapper component that conditionally uses this provider for GitHub Pages
export const ConditionalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if we're on GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io') || 
                        import.meta.env.VITE_USE_MOCK_API === 'true';
  
  // If on GitHub Pages, use the GitHub Pages auth provider
  if (isGitHubPages) {
    return <GitHubPagesAuthProvider>{children}</GitHubPagesAuthProvider>;
  }
  
  // Otherwise, just render children (the real AuthProvider will be used in main.tsx)
  return <>{children}</>;
};
