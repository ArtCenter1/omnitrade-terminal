# OmniTrade Role-Based Access Control (RBAC) Design

This document outlines the design for the Role-Based Access Control (RBAC) system for the OmniTrade project.

## 1. Roles

The following roles are defined for the system:

*   **`Admin`**: Superuser with full system access. Can manage users (CRUD, role assignment), manage system-wide settings, view all data (including audit logs), manage exchanges, and potentially oversee all trading bots and API keys.
*   **`Trader`**: Standard user role. Can manage their own profile, create/manage their own trading bots and API keys, view their own performance data and activity logs.
*   **(Optional)** `Viewer`: A role with read-only access (e.g., public market data, shared bot performance). Cannot perform write operations.
*   **(Optional)** `Support`: A role for internal support staff with limited read/update access for troubleshooting.

## 2. Permissions

Permissions define actions allowed on specific resources, using a `resource:action` format. Permissions are assigned to Roles.

| Resource          | Action         | Description                                      | Admin | Trader | Viewer | Support |
| :---------------- | :------------- | :----------------------------------------------- | :---- | :----- | :----- | :------ |
| `user`            | `create`       | Create new users                                 | ✓     |        |        |         |
| `user`            | `read`         | View user profiles (all)                         | ✓     |        |        | ✓       |
| `user`            | `update`       | Update any user profile                          | ✓     |        |        | ✓¹      |
| `user`            | `delete`       | Delete users                                     | ✓     |        |        |         |
| `user`            | `assign_role`  | Assign/remove roles to/from users                | ✓     |        |        |         |
| `profile`         | `read:own`     | View own user profile                            | ✓     | ✓      |        | ✓       |
| `profile`         | `update:own`   | Update own user profile                          | ✓     | ✓      |        | ✓       |
| `bot`             | `create`       | Create new trading bots (own)                    | ✓     | ✓      |        |         |
| `bot`             | `read:own`     | View own trading bots                            | ✓     | ✓      |        | ✓       |
| `bot`             | `read:all`     | View all trading bots                            | ✓     |        |        | ✓       |
| `bot`             | `update:own`   | Update own trading bots                          | ✓     | ✓      |        |         |
| `bot`             | `update:all`   | Update any trading bot                           | ✓     |        |        |         |
| `bot`             | `delete:own`   | Delete own trading bots                          | ✓     | ✓      |        |         |
| `bot`             | `delete:all`   | Delete any trading bot                           | ✓     |        |        |         |
| `apikey`          | `create`       | Create new API keys (own)                        | ✓     | ✓      |        |         |
| `apikey`          | `read:own`     | View own API keys                                | ✓     | ✓      |        | ✓       |
| `apikey`          | `read:all`     | View all API keys (sensitive info masked)        | ✓     |        |        | ✓       |
| `apikey`          | `update:own`   | Update own API keys                              | ✓     | ✓      |        |         |
| `apikey`          | `update:all`   | Update any API key                               | ✓     |        |        |         |
| `apikey`          | `delete:own`   | Delete own API keys                              | ✓     | ✓      |        |         |
| `apikey`          | `delete:all`   | Delete any API key                               | ✓     |        |        |         |
| `exchange`        | `manage`       | Add/update/remove supported exchanges            | ✓     |        |        |         |
| `system_settings` | `manage`       | Modify system-wide configurations                | ✓     |        |        |         |
| `auditlog`        | `read`         | View user activity logs                          | ✓     |        |        | ✓       |
| `data`            | `read:public`  | View public market data/platform stats           | ✓     | ✓      | ✓      | ✓       |
| `data`            | `read:own`     | View own performance, logs, etc.                 | ✓     | ✓      |        | ✓       |

*¹ Support update permissions might be limited (e.g., only password reset, email verification).*

## 3. Database Schema (Prisma)

The RBAC system requires modifications to the Prisma schema, replacing the simple `Role` enum with dedicated `Role` and `Permission` models linked via many-to-many relationships. The `User` model is updated to use an optional `full_name` field.

### Schema Diagram

```mermaid
erDiagram
    USER ||--o{ USER_ROLE : "has"
    ROLE ||--o{ USER_ROLE : "assigned to"
    ROLE ||--o{ ROLE_PERMISSION : "has"
    PERMISSION ||--o{ ROLE_PERMISSION : "granted by"

    USER {
        String user_id PK
        String email UK
        String password_hash
        String full_name "Optional"
        DateTime created_at
        DateTime updated_at
        DateTime last_login_at
        Boolean is_active
        Boolean email_verified
        String reset_token
        DateTime reset_token_expiry
        UserApiKey[] apiKeys
        Bot[] bots
        UserSetting[] settings
        Notification[] notifications
        UserActivityLog[] activityLogs
        UserRole[] roles
    }

    ROLE {
        String role_id PK
        String name UK
        String description
        DateTime created_at
        DateTime updated_at
        RolePermission[] permissions
        UserRole[] users
    }

    PERMISSION {
        String permission_id PK
        String action
        String resource
        String description
        DateTime created_at
        DateTime updated_at
        RolePermission[] roles
        @@unique([action, resource])
    }

    USER_ROLE {
        String user_id PK, FK
        String role_id PK, FK
        DateTime assigned_at
    }

    ROLE_PERMISSION {
        String role_id PK, FK
        String permission_id PK, FK
        DateTime assigned_at
    }
```

### Prisma Schema Modifications

```prisma
// Remove the old Role enum if it exists:
// enum Role {
//   ADMIN
//   USER
// }

// --- User Model ---
model User {
  user_id        String    @id @default(uuid())
  email          String    @unique
  password_hash  String
  full_name      String?   // Optional full name
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt
  last_login_at  DateTime?
  is_active      Boolean   @default(true)
  email_verified Boolean   @default(false)

  // Remove the old enum role field if it exists:
  // role             Role       @default(USER)

  reset_token      String?
  reset_token_expiry DateTime?

  apiKeys UserApiKey[]
  bots Bot[] @relation("UserBots")
  settings UserSetting[]
  notifications Notification[]
  activityLogs UserActivityLog[]

  // Add relation to UserRole join table
  roles UserRole[]

  @@map("users")
}


// --- RBAC Models ---

model Role {
  role_id     String   @id @default(uuid())
  name        String   @unique // e.g., "Admin", "Trader", "Viewer", "Support"
  description String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  permissions RolePermission[] // Relation to RolePermission join table
  users       UserRole[]       // Relation to UserRole join table

  @@map("roles")
}

model Permission {
  permission_id String   @id @default(uuid())
  action        String   // e.g., "create", "read", "update", "delete", "manage", "assign_role"
  resource      String   // e.g., "user", "profile", "bot", "apikey", "exchange", "system_settings", "auditlog", "data"
  description   String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  roles         RolePermission[] // Relation to RolePermission join table

  @@unique([action, resource]) // Ensure unique permission definitions
  @@map("permissions")
}

// Join table for Users and Roles (Many-to-Many)
model UserRole {
  user_id     String
  role_id     String
  assigned_at DateTime @default(now())

  user        User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  role        Role     @relation(fields: [role_id], references: [role_id], onDelete: Cascade)

  @@id([user_id, role_id]) // Composite primary key
  @@map("user_roles")
}

// Join table for Roles and Permissions (Many-to-Many)
model RolePermission {
  role_id       String
  permission_id String
  assigned_at   DateTime @default(now())

  role          Role       @relation(fields: [role_id], references: [role_id], onDelete: Cascade)
  permission    Permission @relation(fields: [permission_id], references: [permission_id], onDelete: Cascade)

  @@id([role_id, permission_id]) // Composite primary key
  @@map("role_permissions")
}

// --- Other models remain largely unchanged ---
// Ensure other models like Bot, UserApiKey etc. are present in the actual schema.prisma file.
```

## 4. Backend Enforcement Strategy (Node.js)

Enforcement in the backend (Node.js/Express) will follow these steps:

1.  **Authentication Middleware:** Verifies user identity (e.g., JWT) and attaches `req.user = { id: userId }`.
2.  **Permission Loading Middleware:** Fetches the user's roles and associated permissions based on `req.user.id`. Compiles a flat list/Set of permission strings (e.g., `['bot:create', 'profile:read:own']`) and attaches it as `req.user.permissions`. Consider caching this data.
3.  **Authorization Middleware/Helpers:** A reusable function (e.g., `checkPermission(requiredPermission)`) checks if `req.user.permissions` contains the required permission for the route.
    ```javascript
    // Example Middleware Factory
    const checkPermission = (requiredPermission) => (req, res, next) => {
      if (!req.user?.permissions?.has(requiredPermission)) {
        return res.status(403).send({ message: 'Forbidden: Insufficient permissions.' });
      }
      next();
    };

    // Example Usage in Routes
    app.post('/api/bots', isAuthenticated, checkPermission('bot:create'), botsController.createBot);
    ```
4.  **Ownership Checks:** For permissions ending in `:own` (e.g., `bot:update:own`), the route handler must perform an additional check to compare the resource's owner ID with `req.user.id` after fetching the resource.