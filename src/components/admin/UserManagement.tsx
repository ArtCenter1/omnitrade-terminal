import React, { useEffect, useState } from 'react';
import {
  fetchUsers,
  fetchRoles,
  assignRoleToUser,
  removeRoleFromUser,
  User,
  Role,
} from '../../services/adminApi';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([fetchUsers(), fetchRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await assignRoleToUser(userId, roleId);
      setMessage('Role assigned successfully');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await removeRoleFromUser(userId, roleId);
      setMessage('Role removed successfully');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">User Management</h2>
      {loading && <p>Loading...</p>}
      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Full Name</th>
              <th className="border px-2 py-1">Roles</th>
              <th className="border px-2 py-1">Assign Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td className="border px-2 py-1">{user.email}</td>
                <td className="border px-2 py-1">{user.full_name || '-'}</td>
                <td className="border px-2 py-1">
                  {user.roles.map((role) => (
                    <span key={role.role_id} className="inline-block bg-gray-200 rounded px-2 py-1 m-1">
                      {role.name}
                      <button
                        onClick={() => handleRemoveRole(user.user_id, role.role_id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="Remove Role"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </td>
                <td className="border px-2 py-1">
                  <select
                    data-testid="assign-role-select"
                    onChange={(e) => handleAssignRole(user.user_id, e.target.value)}
                    defaultValue=""
                    className="border p-1"
                  >
                    <option value="" disabled>
                      Select role
                    </option>
                    {roles
                      .filter((r) => !user.roles.some((ur) => ur.role_id === r.role_id))
                      .map((role) => (
                        <option key={role.role_id} value={role.role_id}>
                          {role.name}
                        </option>
                      ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;