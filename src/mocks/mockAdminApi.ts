import { User, Role, Permission } from "../services/adminApi";

// Load mock data from localStorage or use defaults
const loadMockData = () => {
  try {
    const savedData = localStorage.getItem("mockAdminData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log("Loaded mock data from localStorage:", parsedData);

        // Validate the data structure
        if (
          parsedData &&
          parsedData.users &&
          parsedData.roles &&
          parsedData.permissions
        ) {
          return parsedData;
        } else {
          console.warn(
            "Invalid mock data structure in localStorage, using default data"
          );
        }
      } catch (parseError) {
        console.error("Error parsing mock data from localStorage:", parseError);
      }
    }
  } catch (error) {
    console.error("Error loading mock data from localStorage:", error);
  }

  // Default mock data
  const defaultData = {
    users: [
      {
        user_id: "u1",
        email: "artcenter1@gmail.com",
        full_name: "Art Center",
        roles: [
          {
            role_id: "r1",
            name: "Admin",
            description: "Administrator role",
            permissions: [],
          },
        ],
      },
      {
        user_id: "u2",
        email: "user@example.com",
        full_name: "Regular User",
        roles: [
          {
            role_id: "r2",
            name: "User",
            description: "Regular user role",
            permissions: [],
          },
        ],
      },
    ],
    roles: [
      {
        role_id: "r1",
        name: "Admin",
        description: "Administrator role",
        permissions: [
          {
            permission_id: "p1",
            action: "read",
            resource: "users",
            description: "Read users",
          },
          {
            permission_id: "p2",
            action: "write",
            resource: "users",
            description: "Write users",
          },
          {
            permission_id: "p3",
            action: "read",
            resource: "roles",
            description: "Read roles",
          },
          {
            permission_id: "p4",
            action: "write",
            resource: "roles",
            description: "Write roles",
          },
        ],
      },
      {
        role_id: "r2",
        name: "User",
        description: "Regular user role",
        permissions: [
          {
            permission_id: "p1",
            action: "read",
            resource: "users",
            description: "Read users",
          },
        ],
      },
      {
        role_id: "r3",
        name: "Premium",
        description: "Premium user role",
        permissions: [
          {
            permission_id: "p1",
            action: "read",
            resource: "users",
            description: "Read users",
          },
          {
            permission_id: "p5",
            action: "read",
            resource: "premium",
            description: "Access premium features",
          },
        ],
      },
    ],
    permissions: [
      {
        permission_id: "p1",
        action: "read",
        resource: "users",
        description: "Read users",
      },
      {
        permission_id: "p2",
        action: "write",
        resource: "users",
        description: "Write users",
      },
      {
        permission_id: "p3",
        action: "read",
        resource: "roles",
        description: "Read roles",
      },
      {
        permission_id: "p4",
        action: "write",
        resource: "roles",
        description: "Write roles",
      },
      {
        permission_id: "p5",
        action: "read",
        resource: "premium",
        description: "Access premium features",
      },
    ],
  };
  console.log("Using default mock data");
  return defaultData;
};

// Initialize mock data
const mockData = loadMockData();
const mockUsers: User[] = mockData.users;

const mockRoles: Role[] = mockData.roles;
const mockPermissions: Permission[] = mockData.permissions;

// Function to save mock data to localStorage
const saveMockData = () => {
  try {
    const dataToSave = {
      users: mockUsers,
      roles: mockRoles,
      permissions: mockPermissions,
    };
    localStorage.setItem("mockAdminData", JSON.stringify(dataToSave));
    console.log("Mock data saved to localStorage:", dataToSave);

    // Also update the userRole in localStorage if the current user's roles have changed
    const currentUserEmail =
      localStorage.getItem("userEmail") || "artcenter1@gmail.com";
    const currentUser = mockUsers.find((u) => u.email === currentUserEmail);

    if (currentUser) {
      // Check if user has admin role
      const hasAdminRole = currentUser.roles.some((r) => r.name === "Admin");
      if (hasAdminRole) {
        localStorage.setItem("userRole", "admin");
        console.log("Updated userRole to admin in localStorage");
        return;
      }

      // Check if user has premium role
      const hasPremiumRole = currentUser.roles.some(
        (r) => r.name === "Premium"
      );
      if (hasPremiumRole) {
        localStorage.setItem("userRole", "premium");
        console.log("Updated userRole to premium in localStorage");
        return;
      }

      // Default to user role
      localStorage.setItem("userRole", "user");
      console.log("Updated userRole to user in localStorage");
    }
  } catch (error) {
    console.error("Error saving mock data to localStorage:", error);
  }
};

// Setup mock API handlers
export function setupMockAdminApi() {
  // Listen for role changes in localStorage
  window.addEventListener("storage", (event) => {
    if (event.key === "userRole") {
      console.log("Role changed to:", event.newValue);
      // Get the current user's email
      const currentUserEmail =
        localStorage.getItem("userEmail") || "artcenter1@gmail.com";
      // Update the mock data to reflect the role change
      const currentUser = mockUsers.find((u) => u.email === currentUserEmail);
      if (currentUser) {
        // Remove all roles
        currentUser.roles = [];

        // Add the new role
        const newRole = event.newValue;
        if (newRole === "admin") {
          const adminRole = mockRoles.find((r) => r.name === "Admin");
          if (adminRole)
            currentUser.roles.push({ ...adminRole, permissions: [] });
        } else if (newRole === "premium") {
          const premiumRole = mockRoles.find((r) => r.name === "Premium");
          if (premiumRole)
            currentUser.roles.push({ ...premiumRole, permissions: [] });
        } else {
          const userRole = mockRoles.find((r) => r.name === "User");
          if (userRole)
            currentUser.roles.push({ ...userRole, permissions: [] });
        }

        // Save the updated data
        saveMockData();
      }
    }
  });

  // Override fetch for specific admin API endpoints
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo, init?: RequestInit) {
    const url = typeof input === "string" ? input : input.url;

    // Handle users endpoint
    if (url === "/api/users") {
      return new Response(JSON.stringify(mockUsers), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle roles endpoint
    if (url === "/api/roles") {
      return new Response(JSON.stringify(mockRoles), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle permissions endpoint
    if (url === "/api/permissions") {
      return new Response(JSON.stringify(mockPermissions), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle assign role to user
    if (url.match(/\/api\/users\/.*\/roles/) && init?.method === "POST") {
      const userId = url.split("/")[3];
      const body = init.body ? JSON.parse(init.body.toString()) : {};
      const roleId = body.roleId;

      // Find the user and role
      const user = mockUsers.find((u) => u.user_id === userId);
      const role = mockRoles.find((r) => r.role_id === roleId);

      if (user && role) {
        // Check if user already has this role
        if (!user.roles.some((r) => r.role_id === roleId)) {
          user.roles.push({ ...role, permissions: [] });
          // Save changes to localStorage
          saveMockData();
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle remove role from user
    if (url.match(/\/api\/users\/.*\/roles\/.*/) && init?.method === "DELETE") {
      const parts = url.split("/");
      const userId = parts[3];
      const roleId = parts[5];

      // Find the user
      const user = mockUsers.find((u) => u.user_id === userId);

      if (user) {
        // Remove the role
        user.roles = user.roles.filter((r) => r.role_id !== roleId);
        // Save changes to localStorage
        saveMockData();
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle create role
    if (url === "/api/roles" && init?.method === "POST") {
      const body = init.body ? JSON.parse(init.body.toString()) : {};
      console.log("Creating new role:", body);

      const newRole: Role = {
        role_id: `r${mockRoles.length + 1}`,
        name: body.name,
        description: body.description || "",
        permissions: [],
      };

      console.log("New role object:", newRole);
      console.log("Current roles before adding:", [...mockRoles]);

      mockRoles.push(newRole);
      console.log("Current roles after adding:", [...mockRoles]);

      // Save changes to localStorage
      saveMockData();

      // Verify the role was saved
      const savedData = localStorage.getItem("mockAdminData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log("Saved roles in localStorage:", parsedData.roles);
      }

      return new Response(JSON.stringify(newRole), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle create permission
    if (url === "/api/permissions" && init?.method === "POST") {
      const body = init.body ? JSON.parse(init.body.toString()) : {};
      const newPermission: Permission = {
        permission_id: `p${mockPermissions.length + 1}`,
        action: body.action,
        resource: body.resource,
        description: body.description || "",
      };

      mockPermissions.push(newPermission);
      // Save changes to localStorage
      saveMockData();

      return new Response(JSON.stringify(newPermission), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle delete role
    if (url.match(/\/api\/roles\/.*/) && init?.method === "DELETE") {
      const roleId = url.split("/")[3];
      const index = mockRoles.findIndex((r) => r.role_id === roleId);

      if (index !== -1) {
        mockRoles.splice(index, 1);
        // Save changes to localStorage
        saveMockData();
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle delete permission
    if (url.match(/\/api\/permissions\/.*/) && init?.method === "DELETE") {
      const permissionId = url.split("/")[3];
      const index = mockPermissions.findIndex(
        (p) => p.permission_id === permissionId
      );

      if (index !== -1) {
        mockPermissions.splice(index, 1);

        // Also remove this permission from all roles
        mockRoles.forEach((role) => {
          role.permissions = role.permissions.filter(
            (p) => p.permission_id !== permissionId
          );
        });

        // Save changes to localStorage
        saveMockData();
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle assign permission to role
    if (url.match(/\/api\/roles\/.*\/permissions/) && init?.method === "POST") {
      const roleId = url.split("/")[3];
      const body = init.body ? JSON.parse(init.body.toString()) : {};
      const permissionId = body.permissionId;

      // Find the role and permission
      const role = mockRoles.find((r) => r.role_id === roleId);
      const permission = mockPermissions.find(
        (p) => p.permission_id === permissionId
      );

      if (role && permission) {
        // Check if role already has this permission
        if (!role.permissions.some((p) => p.permission_id === permissionId)) {
          role.permissions.push(permission);
          // Save changes to localStorage
          saveMockData();
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle remove permission from role
    if (
      url.match(/\/api\/roles\/.*\/permissions\/.*/) &&
      init?.method === "DELETE"
    ) {
      const parts = url.split("/");
      const roleId = parts[3];
      const permissionId = parts[5];

      // Find the role
      const role = mockRoles.find((r) => r.role_id === roleId);

      if (role) {
        // Remove the permission
        role.permissions = role.permissions.filter(
          (p) => p.permission_id !== permissionId
        );
        // Save changes to localStorage
        saveMockData();
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pass through to original fetch for all other requests
    try {
      return await originalFetch(input, init);
    } catch (error) {
      console.error("Error in mock API or original fetch:", error);
      throw error; // Re-throw the error to ensure it propagates correctly
    }
  };

  console.log("Mock Admin API setup complete");
}
