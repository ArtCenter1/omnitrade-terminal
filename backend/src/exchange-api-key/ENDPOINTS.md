# Exchange API Key Management Endpoints

These endpoints allow authenticated users to manage their exchange API keys.

## Security

- All endpoints require JWT authentication (`@UseGuards(JwtAuthGuard)`).
- API keys and secrets are stored encrypted in the database.

## Endpoints

### 1. Add a new exchange API key

- **POST** `/exchange-api-keys`
- **Body:**
  ```json
  {
    "exchange_id": "binance",
    "api_key": "your_api_key",
    "api_secret": "your_api_secret",
    "key_nickname": "optional label"
  }
  ```
- **Response:**  
  Returns the created API key record (excluding secrets).

### 2. List all exchange API keys for the user

- **GET** `/exchange-api-keys`
- **Response:**  
  Array of API key records (excluding secrets).

### 3. Delete a specific exchange API key

- **DELETE** `/exchange-api-keys/:id`
- **Response:**  
  `{ "message": "API key deleted" }`

### 4. Test the connection/credentials for a given API key

- **POST** `/exchange-api-keys/:id/test`
- **Response:**  
  `{ "success": true, "message": "API key credentials are valid (mocked)" }`

## Notes

- All operations are per-user and require authentication.
- The "test" endpoint currently mocks the connection check; replace with real exchange API calls for production.
- API secrets are never returned in responses.
