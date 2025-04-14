
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
  signUp: (email: string, password: string, userName: string) => Promise<{ error: any | null, success: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null, success: boolean }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for Firebase
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Firebase Auth state listener
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);

      if (firebaseUser) {
        setTimeout(() => {
          toast.success(`Welcome back, ${firebaseUser.email}`);
        }, 0);
      } else {
        setTimeout(() => {
          toast.info('You have been signed out');
          navigate('/auth');
        }, 0);
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
      const auth = getAuth(firebaseApp);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Firebase sign out error:', error);
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

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
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
