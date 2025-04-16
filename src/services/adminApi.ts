const API_BASE = "/api";

export interface User {
  user_id: string;
  email: string;
  full_name?: string;
  roles: Role[];
}

export interface Role {
  role_id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  permission_id: string;
  action: string;
  resource: string;
  description?: string;
}

async function fetchJSON(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API request failed");
  }
  return response.json();
}

// Users
export async function fetchUsers(): Promise<User[]> {
  return fetchJSON(`${API_BASE}/users`);
}

export async function assignRoleToUser(userId: string, roleId: string) {
  return fetchJSON(`${API_BASE}/users/${userId}/roles`, {
    method: "POST",
    body: JSON.stringify({ roleId }),
  });
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  return fetchJSON(`${API_BASE}/users/${userId}/roles/${roleId}`, {
    method: "DELETE",
  });
}

// Roles
export async function fetchRoles(): Promise<Role[]> {
  return fetchJSON(`${API_BASE}/roles`);
}

export async function createRole(role: Partial<Role>) {
  return fetchJSON(`${API_BASE}/roles`, {
    method: "POST",
    body: JSON.stringify(role),
  });
}

export async function updateRole(roleId: string, role: Partial<Role>) {
  return fetchJSON(`${API_BASE}/roles/${roleId}`, {
    method: "PUT",
    body: JSON.stringify(role),
  });
}

export async function deleteRole(roleId: string) {
  return fetchJSON(`${API_BASE}/roles/${roleId}`, {
    method: "DELETE",
  });
}

// Permissions
export async function fetchPermissions(): Promise<Permission[]> {
  return fetchJSON(`${API_BASE}/permissions`);
}

export async function createPermission(permission: Partial<Permission>) {
  return fetchJSON(`${API_BASE}/permissions`, {
    method: "POST",
    body: JSON.stringify(permission),
  });
}

export async function updatePermission(
  permissionId: string,
  permission: Partial<Permission>
) {
  return fetchJSON(`${API_BASE}/permissions/${permissionId}`, {
    method: "PUT",
    body: JSON.stringify(permission),
  });
}

export async function deletePermission(permissionId: string) {
  return fetchJSON(`${API_BASE}/permissions/${permissionId}`, {
    method: "DELETE",
  });
}

// Role Permissions
export async function assignPermissionToRole(
  roleId: string,
  permissionId: string
) {
  return fetchJSON(`${API_BASE}/roles/${roleId}/permissions`, {
    method: "POST",
    body: JSON.stringify({ permissionId }),
  });
}

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string
) {
  return fetchJSON(`${API_BASE}/roles/${roleId}/permissions/${permissionId}`, {
    method: "DELETE",
  });
}
