import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Firebase imports
import { app as firebaseApp } from '@/integrations/firebase/client';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';

type AuthContextType = {
  user: FirebaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (
    email: string,
    password: string,
    userName: string,
  ) => Promise<{ error: any | null; success: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (
    email: string,
  ) => Promise<{ error: any | null; success: boolean }>;
  getAuthToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State for Firebase
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // For development, create a mock user if needed
    if (process.env.NODE_ENV === 'development') {
      // Check if we should use a mock user (you can toggle this in localStorage)
      const useMockUser = localStorage.getItem('useMockUser') === 'true';
      if (useMockUser) {
        console.log(
          '%c MOCK USER ACTIVE ',
          'background: #f59e0b; color: #000; font-weight: bold; padding: 4px;',
        );
        console.log(
          '%c API calls will be intercepted with mock data ',
          'background: #78350f; color: #fff; padding: 2px;',
        );

        // Get the stored email or use default
        const storedEmail =
          localStorage.getItem('userEmail') || 'dev@example.com';

        // Create a mock Firebase user
        const mockUser = {
          uid: 'mock-user-id',
          email: storedEmail,
          displayName: storedEmail.split('@')[0],
          emailVerified: true,
          isAnonymous: false,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
          },
          providerData: [],
          refreshToken: 'mock-refresh-token',
          tenantId: null,
          delete: () => Promise.resolve(),
          getIdToken: () => Promise.resolve('mock-id-token'),
          getIdTokenResult: () =>
            Promise.resolve({
              token: 'mock-id-token',
              signInProvider: 'password',
              expirationTime: new Date(Date.now() + 3600000).toISOString(),
              issuedAtTime: new Date().toISOString(),
              authTime: new Date().toISOString(),
              claims: {},
            }),
          reload: () => Promise.resolve(),
          toJSON: () => ({}),
        } as unknown as FirebaseUser;

        setUser(mockUser);
        setIsLoading(false);
        return () => {}; // No cleanup needed for mock user
      }
    }

    // Regular Firebase Auth state listener
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log(
        'Auth state changed:',
        firebaseUser ? 'User authenticated' : 'No user',
      );
      setUser(firebaseUser);
      setIsLoading(false);

      if (firebaseUser) {
        console.log('User is authenticated:', firebaseUser.email);
        // Removed welcome toast message
      } else {
        console.log('No authenticated user, redirecting to auth page');
        // Only redirect to auth if we're not already on an auth page
        const currentPath = window.location.pathname;
        const isAuthPage = [
          '/auth',
          '/login',
          '/register',
          '/forgot-password',
        ].some((path) => currentPath.startsWith(path));

        if (!isAuthPage) {
          // Redirect without toast message
          navigate('/auth');
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const auth = getAuth(firebaseApp);
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      console.error('Firebase sign in error:', error.message);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userName: string) => {
    try {
      const auth = getAuth(firebaseApp);
      await createUserWithEmailAndPassword(auth, email, password);
      // Optionally update profile with userName here if needed
      // await updateProfile(userCredential.user, { displayName: userName });
      return { error: null, success: true };
    } catch (error: any) {
      console.error('Firebase sign up error:', error.message);
      return { error, success: false };
    }
  };

  const signOut = async () => {
    try {
      // Check if we're using a mock user
      if (
        process.env.NODE_ENV === 'development' &&
        localStorage.getItem('useMockUser') === 'true'
      ) {
        console.log('Signing out mock user');
        // Remove all mock user related data from localStorage
        localStorage.removeItem('useMockUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('selected-account-storage');

        // Clear the user state
        setUser(null);

        // Redirect to auth page immediately without toast
        window.location.href = '/auth';

        return;
      }

      // Regular Firebase signout
      const auth = getAuth(firebaseApp);
      await firebaseSignOut(auth);
      console.log('Firebase user signed out successfully');

      // Clear any leftover mock data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('selected-account-storage');
    } catch (error) {
      console.error('Firebase sign out error:', error);
      // Removed error toast
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const auth = getAuth(firebaseApp);
      await sendPasswordResetEmail(auth, email);
      return { error: null, success: true };
    } catch (error: any) {
      console.error('Firebase password reset error:', error.message);
      return { error, success: false };
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      // Check if we're using a mock user
      if (
        process.env.NODE_ENV === 'development' &&
        localStorage.getItem('useMockUser') === 'true'
      ) {
        console.log('Returning mock auth token');
        return 'mock-auth-token';
      }

      // Get token from Firebase user
      if (!user) {
        console.warn('No authenticated user found when requesting token');
        return null;
      }

      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
