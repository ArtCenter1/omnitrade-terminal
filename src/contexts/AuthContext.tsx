
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
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

const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';

type AuthContextType = {
  session: SupabaseSession | null | undefined;
  user: SupabaseUser | FirebaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, userName: string) => Promise<{ error: any | null, success: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null, success: boolean }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for both providers
  const [session, setSession] = useState<SupabaseSession | null | undefined>(null);
  const [user, setUser] = useState<SupabaseUser | FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (AUTH_PROVIDER === 'firebase') {
      // Firebase Auth state listener
      const auth = getAuth(firebaseApp);
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setSession(undefined); // No session object in Firebase
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
    } else {
      // Supabase Auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          console.log('Auth state changed:', event, currentSession?.user?.email);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);

          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              toast.success(`Welcome back, ${currentSession?.user?.email}`);
            }, 0);
          } else if (event === 'SIGNED_OUT') {
            setTimeout(() => {
              toast.info('You have been signed out');
              navigate('/auth');
            }, 0);
          }
        }
      );

      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        console.log('Initial session check:', currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    if (AUTH_PROVIDER === 'firebase') {
      try {
        const auth = getAuth(firebaseApp);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { error: null };
      } catch (error: any) {
        console.error('Firebase sign in error:', error.message);
        return { error };
      }
    } else {
      try {
        console.log('Signing in with:', email);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error('Sign in error:', error.message);
          return { error };
        }
        console.log('Sign in successful:', data.user?.email);
        return { error: null };
      } catch (error) {
        console.error('Exception during sign in:', error);
        return { error };
      }
    }
  };

  const signUp = async (email: string, password: string, userName: string) => {
    if (AUTH_PROVIDER === 'firebase') {
      try {
        const auth = getAuth(firebaseApp);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Optionally update profile with userName here if needed
        // await updateProfile(userCredential.user, { displayName: userName });
        return { error: null, success: true };
      } catch (error: any) {
        console.error('Firebase sign up error:', error.message);
        return { error, success: false };
      }
    } else {
      try {
        console.log('Signing up with:', email, 'username:', userName);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_name: userName,
              role: 'user' // Default role for new users
            },
          },
        });
        if (error) {
          console.error('Sign up error:', error.message);
          return { error, success: false };
        }
        console.log('Sign up successful:', data);
        if (data.user && !data.user.confirmed_at) {
          return {
            error: null,
            success: true,
          };
        }
        return { error: null, success: true };
      } catch (error) {
        console.error('Exception during sign up:', error);
        return { error, success: false };
      }
    }
  };

  const signOut = async () => {
    if (AUTH_PROVIDER === 'firebase') {
      try {
        const auth = getAuth(firebaseApp);
        await firebaseSignOut(auth);
      } catch (error) {
        console.error('Firebase sign out error:', error);
      }
    } else {
      try {
        console.log('Signing out');
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  const resetPassword = async (email: string) => {
    if (AUTH_PROVIDER === 'firebase') {
      try {
        const auth = getAuth(firebaseApp);
        await sendPasswordResetEmail(auth, email);
        return { error: null, success: true };
      } catch (error: any) {
        console.error('Firebase password reset error:', error.message);
        return { error, success: false };
      }
    } else {
      try {
        console.log('Requesting password reset for:', email);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) {
          console.error('Password reset error:', error.message);
          return { error, success: false };
        }
        console.log('Password reset email sent successfully');
        return { error: null, success: true };
      } catch (error) {
        console.error('Exception during password reset:', error);
        return { error, success: false };
      }
    }
  };

  const value = {
    session,
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
