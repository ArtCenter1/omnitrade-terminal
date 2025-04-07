
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, userName: string) => Promise<{ error: any | null, success: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null, success: boolean }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          // Use setTimeout to avoid calling Supabase inside the callback
          setTimeout(() => {
            toast.success(`Welcome back, ${currentSession?.user?.email}`);
            // Removed automatic redirect to dashboard on sign-in to allow landing page default
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          // Use setTimeout to avoid calling Supabase inside the callback
          setTimeout(() => {
            toast.info('You have been signed out');
            navigate('/auth');
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Initial session check:', currentSession?.user?.email);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
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
  };

  const signUp = async (email: string, password: string, userName: string) => {
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
      
      // Email confirmation is usually enabled in Supabase by default
      if (data.user && !data.user.confirmed_at) {
        return {
          error: null,
          success: true,
          // Email confirmation message is handled by the component
        };
      }
      
      // If email confirmation is disabled, the user is signed in immediately
      return { error: null, success: true };
    } catch (error) {
      console.error('Exception during sign up:', error);
      return { error, success: false };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
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
