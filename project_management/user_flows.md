# User Flow Descriptions

This document describes the step-by-step flows for key user interactions within the OpenTrade platform. These descriptions complement the wireframes and user stories.

## 1. New User Registration Flow

1.  **Start:** User lands on the Login page or clicks a "Sign Up" link.
2.  **Navigate:** User navigates to the Registration page (`/register`).
3.  **Input:** User fills in the registration form (Email, Password, Confirm Password, optional Full Name).
4.  **Agree:** User checks the "Agree to Terms of Service" checkbox.
5.  **Submit:** User clicks the "Create Account" button.
6.  **Validation (Client-side):** Basic checks (e.g., required fields, email format, password match). Show errors if invalid.
7.  **API Call:** Frontend sends registration data to `POST /api/v1/auth/register`.
8.  **Processing (Backend):**
    *   Validate data (server-side).
    *   Check for existing email.
    *   Hash password.
    *   Create user record in the database.
    *   (Optional) Trigger verification email.
9.  **Response:** Backend returns success or error.
10. **End (Success):** Frontend displays a success message (e.g., "Account created. Please log in." or "Please check your email to verify."). Redirects to Login page.
11. **End (Failure):** Frontend displays relevant error message (e.g., "Email already exists.", "Password too weak.").

## 2. User Login Flow

1.  **Start:** User is on the Login page (`/login`).
2.  **Input:** User enters Email and Password.
3.  **Submit:** User clicks the "Login" button.
4.  **Validation (Client-side):** Basic checks (e.g., required fields).
5.  **API Call:** Frontend sends credentials to `POST /api/v1/auth/login`.
6.  **Processing (Backend):**
    *   Validate credentials against database (hashed password).
    *   If valid, generate Access Token and Refresh Token.
    *   Update `last_login_at`.
7.  **Response:** Backend returns tokens and user info (success) or an authentication error (failure).
8.  **End (Success):**
    *   Frontend securely stores tokens.
    *   Frontend updates application state (user is logged in).
    *   Frontend redirects user to the Dashboard (`/dashboard`).
9.  **End (Failure):** Frontend displays an error message (e.g., "Invalid email or password.").

## 3. Placing a Limit Buy Order Flow (Authenticated User)

1.  **Start:** User is on the Trading Terminal page (`/terminal`).
2.  **Select Market:** User selects the desired trading pair (e.g., BTC/USDT) using the Market Selector.
3.  **Select Exchange:** User ensures the correct connected exchange account (via API Key) is selected.
4.  **Select Order Type:** User selects "Limit" order type in the Trading Form.
5.  **Select Side:** User selects the "Buy" tab/option.
6.  **Input Price:** User enters the desired limit buy price.
7.  **Input Amount:** User enters the amount of the base asset (e.g., BTC) to buy OR the amount of quote asset (e.g., USDT) to spend. (Form should handle conversion/calculation).
8.  **Review:** User reviews the Price, Amount, and estimated Total cost displayed in the form.
9.  **Submit:** User clicks the "Buy [Base Asset]" button (e.g., "Buy BTC").
10. **Confirmation (Optional):** A confirmation dialog might appear asking the user to confirm the order details. User confirms.
11. **API Call:** Frontend sends order details (including `apiKeyId` derived from selected exchange) to `POST /api/v1/trading/orders`.
12. **Processing (Backend):**
    *   Validate request.
    *   Retrieve and decrypt API credentials for the `apiKeyId`.
    *   Forward order request to the relevant Exchange Connector.
    *   Exchange Connector sends the order to the exchange API.
13. **Response:** Exchange confirms order placement (or rejection). Backend relays this confirmation (or error) to the Frontend.
14. **End (Success):**
    *   Frontend displays a success notification (e.g., "Limit buy order placed successfully.").
    *   The new open order appears in the "Open Orders" table.
    *   Trading form might reset.
15. **End (Failure):** Frontend displays an error notification (e.g., "Insufficient balance.", "Invalid price.", "Exchange error: [message]").

## 4. Connecting a New Exchange API Key Flow

1.  **Start:** User is logged in.
2.  **Navigate:** User navigates to the Profile/Settings page, then to an "API Keys" or "Exchange Connections" section.
3.  **Initiate:** User clicks an "Add API Key" or "Connect Exchange" button.
4.  **Input:** A form/modal appears. User selects the Exchange (e.g., Binance) from a dropdown. User enters the API Key and API Secret obtained from the exchange website. User enters an optional Nickname for the key.
5.  **Submit:** User clicks "Save" or "Connect".
6.  **API Call:** Frontend sends the data to `POST /api/v1/user-api-keys`.
7.  **Processing (Backend):**
    *   Validate input.
    *   Encrypt the API Key and Secret.
    *   Store the encrypted keys, user ID, exchange ID, and nickname in the `user_api_keys` table.
    *   (Optional but recommended) Perform a test API call (e.g., fetch balances) using the new key to verify its validity and permissions. Update `is_valid` flag.
8.  **Response:** Backend returns success (confirming storage, not returning keys) or error (e.g., "Invalid keys provided.", "Connection failed.").
9.  **End (Success):**
    *   Frontend displays a success message.
    *   The new key appears (masked or just by nickname) in the list of configured keys.
10. **End (Failure):** Frontend displays an error message.

---
*These flows describe the primary paths. Edge cases (e.g., token expiry during a flow, network errors) need to be handled gracefully based on non-functional requirements.*