import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Define the available roles in the system
export type UserRole = 'admin' | 'user' | 'premium';

// List of admin emails - for temporary use during development
const ADMIN_EMAILS = [
  // Add your email here to grant yourself admin access
  'artcenter1@gmail.com', // Your email
];

// Simple direct role storage - this is the source of truth for the current session
let CURRENT_ROLE: UserRole = (localStorage.getItem('userRole') as UserRole) || 'user';


// Function to switch roles - this can be called from anywhere
export function switchRole(role: UserRole, userEmail?: string) {
  // Get the current user's email
  const email = userEmail;
  console.log('Switching role to:', role, 'for user:', email);

  // Store the email for future use
  localStorage.setItem('userEmail', email);

  // Update the global role variable
  CURRENT_ROLE = role;

  // Update localStorage
  localStorage.setItem('userRole', role);

  // Update mock data
  try {
    const mockDataStr = localStorage.getItem('mockAdminData');
    if (mockDataStr) {
      const mockData = JSON.parse(mockDataStr);
      if (mockData.users) {
        // Find current user by email
        const currentUser = mockData.users.find((u: any) => u.email === email);

        if (currentUser) {
          console.log('Found user in mock data:', currentUser.email);

          // Clear existing roles
          currentUser.roles = [];

          // Add roles based on selected role
          if (role === 'admin') {
            // For admin, add Admin role
            const adminRole = mockData.roles.find((r: any) => r.name === 'Admin');
            if (adminRole) currentUser.roles.push({ ...adminRole, permissions: [] });
          } else if (role === 'premium') {
            // For premium, add Premium role
            const premiumRole = mockData.roles.find((r: any) => r.name === 'Premium');
            if (premiumRole) currentUser.roles.push({ ...premiumRole, permissions: [] });
          } else {
            // For user, add User role
            const userRole = mockData.roles.find((r: any) => r.name === 'User');
            if (userRole) currentUser.roles.push({ ...userRole, permissions: [] });
          }

          // Save updated mock data
          localStorage.setItem('mockAdminData', JSON.stringify(mockData));
          console.log('Updated mock data with new roles for user:', email);
        } else {
          console.warn('User not found in mock data:', email);

          // Create a new user if not found
          const newUser = {
            user_id: `u${mockData.users.length + 1}`,
            email: email,
            full_name: email.split('@')[0],
            roles: []
          };

          // Add roles based on selected role
          if (role === 'admin') {
            const adminRole = mockData.roles.find((r: any) => r.name === 'Admin');
            if (adminRole) newUser.roles.push({ ...adminRole, permissions: [] });
          } else if (role === 'premium') {
            const premiumRole = mockData.roles.find((r: any) => r.name === 'Premium');
            if (premiumRole) newUser.roles.push({ ...premiumRole, permissions: [] });
          } else {
            const userRole = mockData.roles.find((r: any) => r.name === 'User');
            if (userRole) newUser.roles.push({ ...userRole, permissions: [] });
          }

          // Add the new user to the mock data
          mockData.users.push(newUser);
          localStorage.setItem('mockAdminData', JSON.stringify(mockData));
          console.log('Created new user in mock data:', email);
        }
      }
    }
  } catch (error) {
    console.error('Error updating mock data:', error);
  }

  // Show a toast notification
  toast.success(`Switched to ${role.toUpperCase()} role. Reloading...`);

  // Reload the page to apply changes
  // Dynamically update the role state and trigger UI updates
  setTimeout(() => {
    const event = new CustomEvent('roleChanged', { detail: { role } });
    window.dispatchEvent(event);
  }, 500);
}

// The main hook for role-based access control
export function useRoleBasedAccess() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(CURRENT_ROLE);
  const [isAdmin, setIsAdmin] = useState(CURRENT_ROLE === 'admin');
  const [isPremium, setIsPremium] = useState(CURRENT_ROLE === 'admin' || CURRENT_ROLE === 'premium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to update role in state and localStorage
  const updateRole = (role: UserRole) => {
    // Use the global switchRole function with the current user's email
    const userEmail = user?.email || localStorage.getItem('userEmail') || '';
    switchRole(role, userEmail);
  };

  useEffect(() => {
    // Check if user's email is in the admin list
    if (user) {
      const userEmail = user.email?.toLowerCase();

      // Store the current user's email for future use
      localStorage.setItem('userEmail', userEmail || '');

      const isAdminByEmail = userEmail && ADMIN_EMAILS.includes(userEmail);

      if (isAdminByEmail && CURRENT_ROLE !== 'admin') {
        // If user is in admin list but doesn't have admin role, grant it
        console.log('User is in admin list, granting admin role');
        switchRole('admin', userEmail);
      }
    }

    // Add an event listener for role changes
    const handleRoleChange = (event: CustomEvent) => {
      const { role } = event.detail;
      setUserRole(role);
      setIsAdmin(role === 'admin');
      setIsPremium(role === 'admin' || role === 'premium');
    };

    window.addEventListener('roleChanged', handleRoleChange as EventListener);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener('roleChanged', handleRoleChange as EventListener);
    };
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
    hasAnyRole,
    updateRole
  };
}
