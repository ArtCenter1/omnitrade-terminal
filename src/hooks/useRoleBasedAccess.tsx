
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the available roles in the system
export type UserRole = 'admin' | 'user' | 'premium';

export function useRoleBasedAccess() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('user'); // Default role
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole('user');
        setIsAdmin(false);
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // First, check if user has a custom claim with their role
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        // Check for role in app_metadata (this is where Supabase stores custom claims)
        const role = userData?.app_metadata?.role as UserRole;
        
        if (role) {
          setUserRole(role);
          setIsAdmin(role === 'admin');
          setIsPremium(role === 'premium' || role === 'admin');
        } else {
          // Default to 'user' role if not specified
          setUserRole('user');
          setIsAdmin(false);
          setIsPremium(false);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setError('Failed to fetch user role');
        toast.error('Failed to fetch user permissions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Helper functions to check role permissions
  const checkIsAdmin = () => isAdmin;
  const checkIsPremium = () => isPremium;
  
  // Function to check if user has a specific role
  const hasRole = (role: UserRole) => userRole === role;
  
  // Function to check if user has at least one of the specified roles
  const hasAnyRole = (roles: UserRole[]) => roles.includes(userRole);

  return {
    userRole,
    isAdmin,
    isPremium,
    isLoading,
    error,
    checkIsAdmin,
    checkIsPremium,
    hasRole,
    hasAnyRole
  };
}
