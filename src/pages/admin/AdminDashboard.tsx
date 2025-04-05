
import React from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';

export default function AdminDashboard() {
  const { userRole } = useRoleBasedAccess();
  
  return (
    <ProtectedLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
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
