
# Database Schema Design (Initial)

This document outlines the initial design for the database schema supporting the OpenTrade platform.

**Note:** This initial design assumes a relational model (e.g., PostgreSQL). A NoSQL approach (e.g., MongoDB) could also be considered, especially if requirements evolve towards less structured data for certain features (like bot configurations).

## Goals

*   Securely store user authentication data.
*   Securely store user-provided exchange API keys (encrypted).
*   Store user profile information and preferences.
*   Provide a foundation for future features (bots, trade history, etc.).

## Schema Version: 1.0

### Table: `users`

Stores information about registered users.

| Column Name      | Data Type        | Constraints              | Description                                      |
| :--------------- | :--------------- | :----------------------- | :----------------------------------------------- |
| `user_id`        | UUID             | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the user                 |
| `email`          | VARCHAR(255)     | UNIQUE, NOT NULL         | User's email address (used for login)          |
| `password_hash`  | VARCHAR(255)     | NOT NULL                 | Hashed user password (e.g., using bcrypt)      |
| `first_name`     | VARCHAR(255)     | NULL                     | User's first name  (optional)                  |
| `last_name`      | VARCHAR(255)     | NULL                     | User's last name   (optional)                  |
| `created_at`     | TIMESTAMPTZ      | NOT NULL, DEFAULT NOW()  | Timestamp when the user account was created    |
| `updated_at`     | TIMESTAMPTZ      | NOT NULL, DEFAULT NOW()  | Timestamp when the user account was last updated |
| `last_login_at`  | TIMESTAMPTZ      | NULL                     | Timestamp of the user's last login             |
| `is_active`      | BOOLEAN          | NOT NULL, DEFAULT TRUE   | Flag indicating if the account is active       |
| `email_verified` | BOOLEAN          | NOT NULL, DEFAULT FALSE  | Flag indicating if the email has been verified |

**Indexes:**
*   Index on `email` for fast login lookups.

### Table: `exchanges`

Stores information about the supported exchanges. This could be pre-populated.

| Column Name     | Data Type    | Constraints      | Description                               |
| :-------------- | :----------- | :--------------- | :---------------------------------------- |
| `exchange_id`   | VARCHAR(50)  | PRIMARY KEY      | Unique identifier string (e.g., "binance") |
| `exchange_name` | VARCHAR(100) | NOT NULL, UNIQUE | Human-readable name (e.g., "Binance")     |
| `api_base_url`  | VARCHAR(255) | NULL             | Base URL for the exchange's REST API      |
| `ws_base_url`   | VARCHAR(255) | NULL             | Base URL for the exchange's WebSocket API |
| `is_active`     | BOOLEAN      | NOT NULL, DEFAULT TRUE | Whether integration is active             |

### Table: `user_api_keys`

Stores encrypted API keys provided by users for specific exchanges.

| Column Name        | Data Type    | Constraints                           | Description                                                                 |
| :----------------- | :----------- | :------------------------------------ | :-------------------------------------------------------------------------- |
| `api_key_id`       | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for this specific key entry                             |
| `user_id`          | UUID         | NOT NULL, FOREIGN KEY (users.user_id) | References the user who owns this key                                       |
| `exchange_id`      | VARCHAR(50)  | NOT NULL, FOREIGN KEY (exchanges.exchange_id) | References the exchange this key is for                                   |
| `api_key_encrypted`| TEXT         | NOT NULL                              | The user's API key, encrypted using a strong algorithm (e.g., AES-256-GCM) |
| `api_secret_encrypted`| TEXT       | NOT NULL                              | The user's API secret, encrypted using a strong algorithm                 |
| `key_nickname`     | VARCHAR(100) | NULL                                  | Optional user-defined nickname for the key (e.g., "My Main Binance Key")  |
| `permissions`      | JSONB        | NULL                                  | Store key permissions if available from exchange (e.g., read, trade)      |
| `created_at`       | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()               | Timestamp when the key was added                                            |
| `updated_at`       | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()               | Timestamp when the key was last updated                                     |
| `is_valid`         | BOOLEAN      | NULL                                  | Flag indicating if the key is currently valid (checked periodically?)     |

**Constraints:**
*   UNIQUE constraint on (`user_id`, `exchange_id`, `key_nickname`) to prevent duplicate entries for the same user/exchange/nickname combination (if nickname is used). Consider if multiple keys per exchange per user are allowed.

**Indexes:**
*   Index on `user_id` for retrieving all keys for a user.
*   Index on (`user_id`, `exchange_id`) for specific user/exchange lookups.

### Future Tables (Placeholders)

*   `trading_bots` (bot_id, user_id, strategy_id, config, status, created_at)
*   `bot_instances` (instance_id, bot_id, exchange_id, api_key_id, status, started_at)
*   `strategies` (strategy_id, name, description, parameters)
*   `orders` (order_id, user_id, exchange_id, api_key_id, symbol, type, side, amount, price, status, created_at, updated_at, exchange_order_id) - *Note: Storing all orders might become large.*
*   `user_settings` (setting_id, user_id, setting_key, setting_value)

## Relationships

*   `users` (1) <--> (*) `user_api_keys` (A user can have multiple API keys)
*   `exchanges` (1) <--> (*) `user_api_keys` (An exchange can be associated with multiple user keys)

## Security Considerations

*   **Encryption:** API keys and secrets MUST be encrypted at rest using strong, modern encryption algorithms and proper key management practices. The encryption key itself must be stored securely and separately from the database if possible (e.g., using a secrets manager like AWS Secrets Manager, HashiCorp Vault).
*   **Password Hashing:** User passwords MUST be hashed using a strong, adaptive hashing algorithm like bcrypt or Argon2.
*   **Access Control:** Database access should be strictly limited to the necessary backend services.

---
*This schema is subject to change based on further requirements analysis and technical decisions.*
