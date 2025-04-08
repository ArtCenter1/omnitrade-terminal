
import React, { useState } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { userRole, isAdmin } = useRoleBasedAccess();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to temporarily grant admin role for testing
  const grantAdminRole = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('');

    try {
      // Update the user's metadata to include the admin role
      const { error } = await supabase.auth.updateUser({
        data: { role: 'admin' }
      });

      if (error) {
        throw error;
      }

      // Also update localStorage for immediate effect
      localStorage.setItem('userRole', 'admin');

      setMessage('Admin role granted! Please refresh the page.');
    } catch (error) {
      console.error('Error granting admin role:', error);
      setMessage(`Error: ${error.message || 'Failed to grant admin role'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {/* Debug Panel */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <h3 className="text-lg font-medium mb-2">Debug Information</h3>
          <p className="text-sm text-gray-300 mb-2">User Email: {user?.email}</p>
          <p className="text-sm text-gray-300 mb-2">Current Role: <span className="font-bold text-green-500">{userRole}</span></p>
          <p className="text-sm text-gray-300 mb-2">Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
          <p className="text-sm text-gray-300 mb-4">User Metadata: {JSON.stringify(user?.user_metadata || {})}</p>

          <Button
            onClick={grantAdminRole}
            disabled={loading || isAdmin}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
          >
            {loading ? 'Processing...' : isAdmin ? 'Already Admin' : 'Grant Admin Role (Testing)'}
          </Button>

          {message && <p className="mt-2 text-sm text-yellow-400">{message}</p>}
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">Welcome Admin</h2>
          <p className="text-gray-300 mb-4">
            This page is only accessible to users with the 'admin' role.
            Your current role is: <span className="font-bold text-green-500">{userRole}</span>
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">User Management</h3>
              <p className="text-sm text-gray-400">Manage user accounts and permissions</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">System Settings</h3>
              <p className="text-sm text-gray-400">Configure platform settings</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Analytics</h3>
              <p className="text-sm text-gray-400">View system-wide analytics and reports</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
