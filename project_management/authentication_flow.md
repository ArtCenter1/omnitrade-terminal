# Authentication Flow Design

---

## Provider Support & Migration Status

**OmniTrade now supports both Supabase and Firebase as authentication providers.**
The active provider is controlled by the `VITE_AUTH_PROVIDER` environment variable (`supabase` or `firebase`).
- See the `.env` file and `README.md` for setup instructions.
- Both sets of environment variables are present for compatibility.
- Supabase documentation and code remain for reference during the migration.

### Flow Differences

- **Supabase**: Handles user registration, login, and session management via Supabase's built-in auth APIs. Tokens are managed by Supabase.
- **Firebase**: Handles authentication via Firebase Auth. Tokens and user state are managed by Firebase SDK.
- The frontend code uses the `VITE_AUTH_PROVIDER` flag to determine which provider to use at runtime.

**Caveats:**
- Ensure only one provider is active at a time.
- Review all authentication logic and environment variables when switching providers.
- Future changes should update both documentation and environment setup instructions.

---


This document details the proposed authentication flow for the OpenTrade platform, using JSON Web Tokens (JWT).

## Overview

The flow uses short-lived Access Tokens for authorizing API requests and longer-lived Refresh Tokens for obtaining new Access Tokens without requiring the user to log in again frequently.

## Components Involved

*   **Frontend Application:** User interface where login/registration occurs. Stores tokens securely (e.g., HttpOnly cookies or secure local storage - TBD).
*   **Backend API Gateway:** Handles authentication logic, issues tokens, validates tokens, manages user sessions/tokens.
*   **Database:** Stores user credentials (hashed passwords) and potentially invalidated refresh tokens or session information.

## Flows

### 1. User Registration

1.  **User:** Enters email, password (and optionally other details) into the registration form on the **Frontend**.
2.  **Frontend:** Sends a `POST` request to `/api/v1/auth/register` with user details.
3.  **Backend:**
    *   Validates input (email format, password strength).
    *   Checks if email already exists in the **Database**.
    *   Hashes the password securely (e.g., bcrypt).
    *   Creates a new user record in the **Database**.
    *   (Optional) Sends a verification email.
    *   Returns a success response (e.g., `{ userId, email }`) to the **Frontend**.
4.  **Frontend:** Displays a success message, potentially redirects to login or requests email verification.

### 2. User Login

1.  **User:** Enters email and password into the login form on the **Frontend**.
2.  **Frontend:** Sends a `POST` request to `/api/v1/auth/login` with credentials.
3.  **Backend:**
    *   Validates input.
    *   Finds the user by email in the **Database**.
    *   Compares the provided password with the stored `password_hash` using the hashing algorithm's compare function.
    *   If credentials are valid:
        *   Generates a short-lived JWT Access Token containing user identifiers (e.g., `userId`, roles).
        *   Generates a longer-lived JWT Refresh Token.
        *   (Optional but recommended) Stores the Refresh Token (or metadata about it) in the **Database**, associated with the user, to allow for invalidation.
        *   Updates `last_login_at` in the **Database**.
        *   Returns `{ accessToken, refreshToken, user: { ... } }` to the **Frontend**.
    *   If credentials are invalid, returns an authentication error (e.g., 401 Unauthorized).
4.  **Frontend:**
    *   Securely stores the `accessToken` and `refreshToken`. **Storage Strategy TBD:**
        *   **Option A (Cookies):** Store tokens in HttpOnly, Secure cookies (Set-Cookie header from Backend). Access token might be readable by JS if needed, refresh token strictly HttpOnly. Mitigates XSS risk for refresh token.
        *   **Option B (Local Storage/Session Storage):** Store tokens in browser storage. More vulnerable to XSS. Requires careful handling.
    *   Updates UI state to reflect logged-in status.
    *   Redirects user to the dashboard or intended page.

### 3. Authenticated API Request

1.  **Frontend:** Needs to access a protected resource (e.g., `/api/v1/users/me`).
2.  **Frontend:** Includes the `accessToken` in the `Authorization: Bearer <token>` header of the request.
3.  **Backend:**
    *   Receives the request and extracts the `accessToken` from the header.
    *   Validates the token's signature and expiration date.
    *   If valid, extracts user information (e.g., `userId`) from the token payload.
    *   Proceeds with processing the request using the user's context.
    *   Returns the requested resource.
4.  **Frontend:** Receives and processes the response.

### 4. Access Token Expiration & Refresh

1.  **Frontend:** Makes an authenticated API request (as in step 3).
2.  **Backend:** Validates the `accessToken` and finds it has expired. Returns an error (e.g., 401 Unauthorized with a specific error code like `TOKEN_EXPIRED`).
3.  **Frontend:** Catches the `TOKEN_EXPIRED` error.
4.  **Frontend:** Sends a `POST` request to `/api/v1/auth/refresh` including the `refreshToken` (e.g., from HttpOnly cookie or storage).
5.  **Backend:**
    *   Receives the `refreshToken`.
    *   Validates the refresh token (signature, expiration, checks if invalidated in **Database**).
    *   If valid:
        *   Generates a new short-lived `accessToken`.
        *   (Optional) Issues a new `refreshToken` (token rotation).
        *   (Optional) Updates refresh token status in **Database**.
        *   Returns `{ accessToken }` (and potentially new `refreshToken`) to the **Frontend**.
    *   If invalid, returns an authentication error (e.g., 401 Unauthorized), requiring the user to log in again.
6.  **Frontend:**
    *   Securely stores the new `accessToken` (and potentially `refreshToken`).
    *   Retries the original API request (from step 1) with the new `accessToken`.
    *   If refresh fails, clears stored tokens and redirects the user to the login page.

### 5. User Logout

1.  **User:** Clicks the logout button on the **Frontend**.
2.  **Frontend:**
    *   Sends a `POST` request to `/api/v1/auth/logout`. (May include refresh token if needed for server-side invalidation).
    *   Removes the `accessToken` and `refreshToken` from storage (clears cookies or local/session storage).
    *   Updates UI state to reflect logged-out status.
    *   Redirects user to the login page or public homepage.
3.  **Backend:**
    *   Receives the logout request.
    *   (Optional but recommended) Invalidates the associated `refreshToken` in the **Database** to prevent its further use.
    *   Returns a success response.

## Security Considerations

*   **Token Storage:** Secure storage on the frontend is crucial. HttpOnly cookies are generally preferred for refresh tokens to mitigate XSS.
*   **Token Expiration:** Keep Access Token lifetimes short (e.g., 15-60 minutes). Refresh Token lifetimes can be longer (e.g., days or weeks) but should be invalidated on logout or suspicious activity.
*   **HTTPS:** All communication must be over HTTPS.
*   **Password Hashing:** Use strong, adaptive hashing (bcrypt, Argon2).
*   **Refresh Token Invalidation:** Implement server-side refresh token invalidation on logout and potentially on password change or detection of compromise.
*   **CSRF Protection:** If using cookies, implement CSRF protection (e.g., using SameSite cookie attribute, CSRF tokens).

---
*This flow provides a robust foundation. Specific implementation details (e.g., exact token storage method, library choices) will be determined during development.*