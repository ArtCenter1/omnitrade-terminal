import React, { useEffect, useState } from 'react';
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  updateRole,
  deleteRole,
  createPermission,
  updatePermission,
  deletePermission,
  Role,
  Permission,
} from '../../services/adminApi';

interface RoleManagementProps {
  hideHeader?: boolean;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ hideHeader = false }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newPermissionAction, setNewPermissionAction] = useState('');
  const [newPermissionResource, setNewPermissionResource] = useState('');
  const [newPermissionDescription, setNewPermissionDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([fetchRoles(), fetchPermissions()]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setError('Role name is required');
      return;
    }
    try {
      console.log('Creating role:', { name: newRoleName, description: newRoleDescription });
      const newRole = await createRole({ name: newRoleName, description: newRoleDescription });
      console.log('Role created successfully:', newRole);

      setMessage('Role created successfully');
      setNewRoleName('');
      setNewRoleDescription('');

      // Force a delay before reloading data to ensure localStorage is updated
      setTimeout(() => {
        loadData();
      }, 100);
    } catch (err: any) {
      console.error('Error creating role:', err);
      setError(err.message);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      setMessage('Role deleted successfully');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermissionAction.trim() || !newPermissionResource.trim()) {
      setError('Permission action and resource are required');
      return;
    }
    try {
      await createPermission({
        action: newPermissionAction,
        resource: newPermissionResource,
        description: newPermissionDescription,
      });
      setMessage('Permission created successfully');
      setNewPermissionAction('');
      setNewPermissionResource('');
      setNewPermissionDescription('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      await deletePermission(permissionId);
      setMessage('Permission deleted successfully');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4">
      {!hideHeader && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Role & Permission Management</h2>
          <a
            href="/dashboard"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Dashboard
          </a>
        </div>
      )}
      {loading && <p>Loading...</p>}
      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Create New Role</h3>
        <input
          data-testid="role-name-input"
          placeholder="Role name"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          className="border p-1 mr-2"
        />
        <input
          data-testid="role-description-input"
          placeholder="Description"
          value={newRoleDescription}
          onChange={(e) => setNewRoleDescription(e.target.value)}
          className="border p-1 mr-2"
        />
        <button data-testid="add-role-button" onClick={handleCreateRole} className="bg-blue-500 text-white px-3 py-1 rounded">
          Add Role
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Create New Permission</h3>
        <input
          placeholder="Action (e.g., create)"
          value={newPermissionAction}
          onChange={(e) => setNewPermissionAction(e.target.value)}
          className="border p-1 mr-2"
        />
        <input
          placeholder="Resource (e.g., user)"
          value={newPermissionResource}
          onChange={(e) => setNewPermissionResource(e.target.value)}
          className="border p-1 mr-2"
        />
        <input
          placeholder="Description"
          value={newPermissionDescription}
          onChange={(e) => setNewPermissionDescription(e.target.value)}
          className="border p-1 mr-2"
        />
        <button onClick={handleCreatePermission} className="bg-blue-500 text-white px-3 py-1 rounded">
          Add Permission
        </button>
      </div>

      <h3 className="font-semibold mb-2">Roles</h3>
      <ul className="mb-6">
        {roles.map((role) => (
          <li key={role.role_id} className="border p-2 mb-2">
            <div className="flex justify-between items-center">
              <div>
                <strong>{role.name}</strong> - {role.description}
              </div>
              <button
                onClick={() => handleDeleteRole(role.role_id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
            <div className="mt-2">
              <strong>Permissions:</strong>
              <ul className="ml-4 list-disc">
                {role.permissions.map((perm) => (
                  <li key={perm.permission_id}>
                    {perm.resource}:{perm.action}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="font-semibold mb-2">Permissions</h3>
      <ul>
        {permissions.map((perm) => (
          <li key={perm.permission_id} className="border p-2 mb-2 flex justify-between items-center">
            <span>
              <strong>{perm.resource}:{perm.action}</strong> - {perm.description}
            </span>
            <button
              onClick={() => handleDeletePermission(perm.permission_id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoleManagement;