import React, { useEffect, useState } from "react";
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  deleteRole,
  createPermission,
  deletePermission,
  assignPermissionToRole,
  removePermissionFromRole,
  Role,
  Permission,
} from "../../services/adminApi";

interface RoleManagementProps {
  hideHeader?: boolean;
}

const RoleManagement: React.FC<RoleManagementProps> = ({
  hideHeader = false,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newPermissionAction, setNewPermissionAction] = useState("");
  const [newPermissionResource, setNewPermissionResource] = useState("");
  const [newPermissionDescription, setNewPermissionDescription] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
      ]);
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
      setError("Role name is required");
      return;
    }
    try {
      console.log("Creating role:", {
        name: newRoleName,
        description: newRoleDescription,
      });
      const newRole = await createRole({
        name: newRoleName,
        description: newRoleDescription,
      });
      console.log("Role created successfully:", newRole);

      setMessage("Role created successfully");
      setNewRoleName("");
      setNewRoleDescription("");

      // Force a delay before reloading data to ensure localStorage is updated
      setTimeout(() => {
        loadData();
      }, 100);
    } catch (err: any) {
      console.error("Error creating role:", err);
      setError(err.message);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      setMessage("Role deleted successfully");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermissionAction.trim() || !newPermissionResource.trim()) {
      setError("Permission action and resource are required");
      return;
    }
    try {
      await createPermission({
        action: newPermissionAction,
        resource: newPermissionResource,
        description: newPermissionDescription,
      });
      setMessage("Permission created successfully");
      setNewPermissionAction("");
      setNewPermissionResource("");
      setNewPermissionDescription("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      await deletePermission(permissionId);
      setMessage("Permission deleted successfully");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssignPermission = async (
    roleId: string,
    permissionId: string
  ) => {
    try {
      await assignPermissionToRole(roleId, permissionId);
      setMessage("Permission assigned to role successfully");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemovePermission = async (
    roleId: string,
    permissionId: string
  ) => {
    try {
      await removePermissionFromRole(roleId, permissionId);
      setMessage("Permission removed from role successfully");
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Return to Dashboard
          </a>
        </div>
      )}
      {loading && <p>Loading...</p>}
      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="font-semibold mb-3 text-lg">Create New Role</h3>
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">
              Role Name
            </label>
            <input
              data-testid="role-name-input"
              placeholder="e.g., Content Manager"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 p-2 rounded text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">
              Description
            </label>
            <input
              data-testid="role-description-input"
              placeholder="e.g., Manages content and publications"
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 p-2 rounded text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              data-testid="add-role-button"
              onClick={handleCreateRole}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Add Role
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="font-semibold mb-3 text-lg">Create New Permission</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Action</label>
            <input
              placeholder="e.g., read, write, delete"
              value={newPermissionAction}
              onChange={(e) => setNewPermissionAction(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 p-2 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Resource</label>
            <input
              placeholder="e.g., users, content, settings"
              value={newPermissionResource}
              onChange={(e) => setNewPermissionResource(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 p-2 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Description
            </label>
            <input
              placeholder="e.g., Can read user data"
              value={newPermissionDescription}
              onChange={(e) => setNewPermissionDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 p-2 rounded text-white"
            />
          </div>
        </div>
        <button
          onClick={handleCreatePermission}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
        >
          Add Permission
        </button>
      </div>

      <h3 className="font-semibold mb-3 text-lg border-b border-gray-700 pb-2">
        Roles
      </h3>
      <ul className="mb-6 grid grid-cols-1 gap-4">
        {roles.map((role) => (
          <li
            key={role.role_id}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <strong>{role.name}</strong> - {role.description}
              </div>
              <div>
                <button
                  onClick={() =>
                    setSelectedRoleId(
                      selectedRoleId === role.role_id ? null : role.role_id
                    )
                  }
                  className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                >
                  {selectedRoleId === role.role_id
                    ? "Close"
                    : "Manage Permissions"}
                </button>
                <button
                  onClick={() => handleDeleteRole(role.role_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2">
              <strong>Current Permissions:</strong>
              {role.permissions.length > 0 ? (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {role.permissions.map((perm) => (
                    <div
                      key={perm.permission_id}
                      className="flex items-center justify-between bg-gray-700 text-gray-200 p-2 rounded"
                    >
                      <span className="font-mono text-sm">
                        {perm.resource}:{perm.action}
                      </span>
                      <button
                        onClick={() =>
                          handleRemovePermission(
                            role.role_id,
                            perm.permission_id
                          )
                        }
                        className="text-red-400 hover:text-red-300 text-xs ml-2 bg-gray-800 px-2 py-1 rounded"
                        title="Remove Permission"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic mt-2">
                  No permissions assigned to this role.
                </p>
              )}
            </div>

            {selectedRoleId === role.role_id && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-gray-800">
                <h4 className="font-medium mb-2">
                  Assign Permissions to {role.name}
                </h4>
                <div className="max-h-40 overflow-y-auto">
                  {permissions
                    .filter(
                      (p) =>
                        !role.permissions.some(
                          (rp) => rp.permission_id === p.permission_id
                        )
                    )
                    .map((perm) => (
                      <div
                        key={perm.permission_id}
                        className="flex justify-between items-center mb-1 p-1 hover:bg-gray-200 border border-gray-200 rounded"
                      >
                        <div>
                          <strong className="text-gray-800">
                            {perm.resource}:{perm.action}
                          </strong>
                          {perm.description && (
                            <p className="text-xs text-gray-600">
                              {perm.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            handleAssignPermission(
                              role.role_id,
                              perm.permission_id
                            )
                          }
                          className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  {permissions.filter(
                    (p) =>
                      !role.permissions.some(
                        (rp) => rp.permission_id === p.permission_id
                      )
                  ).length === 0 && (
                    <p className="text-gray-500 italic">
                      All available permissions are already assigned to this
                      role.
                    </p>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <h3 className="font-semibold mb-3 text-lg border-b border-gray-700 pb-2">
        Available Permissions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {permissions.map((perm) => (
          <div
            key={perm.permission_id}
            className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex flex-col"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono bg-gray-700 px-2 py-1 rounded text-sm">
                {perm.resource}:{perm.action}
              </span>
              <button
                onClick={() => handleDeletePermission(perm.permission_id)}
                className="text-red-500 hover:text-red-700 ml-2"
                title="Delete Permission"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            {perm.description && (
              <p className="text-sm text-gray-400">{perm.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleManagement;
