
import { useState } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, Settings, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminDashboard() {
  const { userRole, isAdmin } = useRoleBasedAccess();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

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

        {/* Debug Panel - Collapsible */}
        <div className="bg-gray-800 rounded-lg mb-6 border border-gray-700 overflow-hidden">
          <button
            className="w-full p-4 flex justify-between items-center text-left focus:outline-none"
            onClick={() => setShowDebug(!showDebug)}
          >
            <h3 className="text-lg font-medium">Debug Information</h3>
            {showDebug ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {showDebug && (
            <div className="p-4 pt-0 border-t border-gray-700">
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
          )}
        </div>

        <div className="bg-theme-card rounded-lg p-6 shadow-theme-md theme-transition">
          <h2 className="text-xl font-medium mb-4 text-theme-primary">Admin Dashboard</h2>
          <p className="text-theme-secondary mb-6">
            Welcome to the administration center. Here you can manage users, roles, and system settings.
          </p>

          {/* Quick Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-theme-tertiary p-4 rounded-lg border-l-4 border-blue-500 shadow-theme-sm theme-transition">
              <h4 className="text-theme-tertiary text-sm">Total Users</h4>
              <p className="text-2xl font-bold text-theme-primary">247</p>
              <p className="text-xs text-green-400">↑ 12% from last month</p>
            </div>

            <div className="bg-theme-tertiary p-4 rounded-lg border-l-4 border-green-500 shadow-theme-sm theme-transition">
              <h4 className="text-theme-tertiary text-sm">Active Roles</h4>
              <p className="text-2xl font-bold text-theme-primary">5</p>
              <p className="text-xs text-blue-400">3 with custom permissions</p>
            </div>

            <div className="bg-theme-tertiary p-4 rounded-lg border-l-4 border-purple-500 shadow-theme-sm theme-transition">
              <h4 className="text-theme-tertiary text-sm">System Status</h4>
              <p className="text-2xl font-bold text-theme-primary">Healthy</p>
              <p className="text-xs text-green-400">All services operational</p>
            </div>

            <div className="bg-theme-tertiary p-4 rounded-lg border-l-4 border-yellow-500 shadow-theme-sm theme-transition">
              <h4 className="text-theme-tertiary text-sm">Pending Actions</h4>
              <p className="text-2xl font-bold text-theme-primary">2</p>
              <p className="text-xs text-yellow-400">Requires attention</p>
            </div>
          </div>

          {/* Admin Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium mb-4 border-b border-gray-700 pb-2">Recent Activity</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="bg-blue-500 rounded-full h-2 w-2 mt-2 mr-2"></div>
                  <div>
                    <p className="text-sm">New user registered: <span className="text-blue-400">john.doe@example.com</span></p>
                    <p className="text-xs text-gray-500">Today, 10:23 AM</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-500 rounded-full h-2 w-2 mt-2 mr-2"></div>
                  <div>
                    <p className="text-sm">Role <span className="text-green-400">Editor</span> modified</p>
                    <p className="text-xs text-gray-500">Yesterday, 4:45 PM</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-yellow-500 rounded-full h-2 w-2 mt-2 mr-2"></div>
                  <div>
                    <p className="text-sm">System update scheduled</p>
                    <p className="text-xs text-gray-500">Yesterday, 2:30 PM</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-purple-500 rounded-full h-2 w-2 mt-2 mr-2"></div>
                  <div>
                    <p className="text-sm">New permission added: <span className="text-purple-400">manage_reports</span></p>
                    <p className="text-xs text-gray-500">Aug 15, 2023</p>
                  </div>
                </li>
              </ul>
              <button className="text-sm text-blue-400 mt-3 hover:text-blue-300">View all activity →</button>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium mb-4 border-b border-gray-700 pb-2">Pending Tasks</h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-sm">Review new user registrations</span>
                  </div>
                  <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded">High</span>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-sm">Update system permissions</span>
                  </div>
                  <span className="text-xs bg-blue-500 text-blue-900 px-2 py-1 rounded">Medium</span>
                </li>
                <li className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-sm">Review security logs</span>
                  </div>
                  <span className="text-xs bg-green-500 text-green-900 px-2 py-1 rounded">Low</span>
                </li>
              </ul>
              <button className="text-sm text-blue-400 mt-3 hover:text-blue-300">Manage tasks →</button>
            </div>
          </div>

          {/* Admin Navigation */}
          <h3 className="font-medium mb-4 border-b border-gray-700 pb-2">Admin Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/admin/users-roles" className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                <h3 className="font-medium">User & Role Management</h3>
              </div>
              <p className="text-sm text-gray-400">Manage user accounts, roles and permissions</p>
            </Link>

            <Link to="/admin/settings" className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors relative">
              <div className="absolute -top-2 -right-2 bg-yellow-600 text-xs px-2 py-1 rounded-full text-white">Coming Soon</div>
              <div className="flex items-center mb-2">
                <Settings className="h-5 w-5 mr-2 text-green-500" />
                <h3 className="font-medium">System Settings</h3>
              </div>
              <p className="text-sm text-gray-400">Configure platform settings</p>
            </Link>

            <Link to="/admin/analytics" className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors relative">
              <div className="absolute -top-2 -right-2 bg-yellow-600 text-xs px-2 py-1 rounded-full text-white">Coming Soon</div>
              <div className="flex items-center mb-2">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                <h3 className="font-medium">Analytics</h3>
              </div>
              <p className="text-sm text-gray-400">View system-wide analytics and reports</p>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
