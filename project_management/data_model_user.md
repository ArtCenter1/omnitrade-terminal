# User Data Model

This document defines the data model for user-related information within the OpenTrade platform, covering database storage, API representation, and potential frontend state structure.

## 1. Database Schema (`users` table)

*(Reference: `project_management/database_schema.md`)*

The primary storage for user data resides in the `users` table:

| Column Name      | Data Type        | Constraints              | Description                                      |
| :--------------- | :--------------- | :----------------------- | :----------------------------------------------- |
| `user_id`        | UUID             | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the user                 |
| `email`          | VARCHAR(255)     | UNIQUE, NOT NULL         | User's email address (used for login)          |
| `password_hash`  | VARCHAR(255)     | NOT NULL                 | Hashed user password (e.g., using bcrypt)      |
| `full_name`      | VARCHAR(255)     | NULL                     | User's full name (optional)                    |
| `created_at`     | TIMESTAMPTZ      | NOT NULL, DEFAULT NOW()  | Timestamp when the user account was created    |
| `updated_at`     | TIMESTAMPTZ      | NOT NULL, DEFAULT NOW()  | Timestamp when the user account was last updated |
| `last_login_at`  | TIMESTAMPTZ      | NULL                     | Timestamp of the user's last login             |
| `is_active`      | BOOLEAN          | NOT NULL, DEFAULT TRUE   | Flag indicating if the account is active       |
| `email_verified` | BOOLEAN          | NOT NULL, DEFAULT FALSE  | Flag indicating if the email has been verified |

**Key Points:**
*   `password_hash` stores a securely hashed password, never the plain text.
*   `user_id` is the primary identifier used throughout the system.

## 2. API Representation

*(Reference: `project_management/api_structure.md`)*

User data is exposed via the API primarily through authentication and user profile endpoints. Sensitive information like `password_hash` is never exposed.

*   **Login Response (`POST /api/v1/auth/login`):**
    ```json
    {
      "accessToken": "...",
      "refreshToken": "...",
      "user": {
        "userId": "uuid-string",
        "email": "user@example.com",
        "fullName": "User Name"
      }
    }
    ```
*   **Get Profile Response (`GET /api/v1/users/me`):**
    ```json
    {
      "userId": "uuid-string",
      "email": "user@example.com",
      "fullName": "User Name",
      "createdAt": "iso-timestamp",
      "lastLoginAt": "iso-timestamp"
      // email_verified, is_active might be included if needed by frontend logic
    }
    ```
*   **Registration Request (`POST /api/v1/auth/register`):**
    ```json
    {
      "email": "user@example.com",
      "password": "...",
      "fullName": "User Name" // Optional
    }
    ```
*   **Update Profile Request (`PUT /api/v1/users/me`):**
    ```json
    {
      "fullName": "Updated Name"
      // Other updatable fields TBD
    }
    ```

## 3. Frontend State Representation (Conceptual)

Within the React frontend, user state might be managed using context or a state management library. A TypeScript interface could represent the authenticated user's data available in the state:

```typescript
interface AuthenticatedUser {
  userId: string;
  email: string;
  fullName: string | null;
  // Potentially add other non-sensitive fields received from API
  // e.g., createdAt?: string;
  // e.g., lastLoginAt?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  accessToken: string | null; // Or managed via cookies
  // isLoading: boolean; // To handle login/refresh states
}
```

**Key Points:**
*   Frontend state should only hold necessary, non-sensitive user information required for UI display or logic.
*   Tokens (`accessToken`, `refreshToken`) might be managed separately (e.g., in secure cookies or memory) rather than directly in a globally accessible state object, depending on the chosen storage strategy.

---
*This model consolidates the user data structure across different layers of the application.*