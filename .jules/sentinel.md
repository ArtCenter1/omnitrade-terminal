## 2025-05-15 - Hardcoded Encryption Keys and Static IVs
**Vulnerability:** Hardcoded encryption keys (`super_secret_key`) and static Initialization Vectors (all zeros) were used in `ExchangeApiKeyService` and `PortfolioService` to "encrypt" sensitive exchange API keys and secrets.
**Learning:** This implementation provided only a false sense of security (security theater). A static IV means the same plaintext always results in the same ciphertext, and a hardcoded key is easily discoverable by anyone with access to the source code.
**Prevention:** Always use environment-driven secrets for encryption keys and ensure each encryption operation uses a unique, random IV. Store the IV alongside the ciphertext.

## 2025-05-22 - Logic Error in Exchange ID Validation
**Vulnerability:** The `in` operator was incorrectly used on the `ccxt.exchanges` array to validate user-provided exchange IDs. In JavaScript/TypeScript, `in` checks for property keys (indices in an array), not values. This resulted in legitimate exchange IDs failing validation.
**Learning:** Confusing the `in` operator with value membership checks is a common logic error that can break security-critical input validation.
**Prevention:** Always use `.includes()` for checking if a value exists within an array. When working with third-party libraries like `ccxt`, be aware that TypeScript definitions might sometimes be overly complex, requiring explicit type casting (e.g., `as unknown as string[]`) to use standard array methods safely.

## 2025-05-30 - Sensitive Information Leakage and Rate Limiting Gaps
**Vulnerability:** The `testApiKey` endpoint was leaking detailed library-specific error messages (from `ccxt`) to the client and lacked specific rate limiting, making it vulnerable to brute-force or DoS attacks.
**Learning:** Returning raw exception messages from third-party libraries can expose backend implementation details or network topology. Furthermore, sensitive operations like credential validation must always have dedicated rate limits beyond the global API limit.
**Prevention:** Always map library-specific errors to generic, safe messages for the client. Implement granular rate limiting for all endpoints that perform expensive or security-sensitive operations. Ensure E2E tests for rate limiting correctly simulate production conditions by setting `trust proxy` and matching global route prefixes.

## 2026-05-02 - Public Proxy Endpoints Exposing API Quota
**Vulnerability:** Market data proxy endpoints (`/api/proxy/coingecko/*` and `/api/proxy/binance-testnet/*`) were accessible without authentication. This allowed any external party to use the application's server as a proxy, consuming its API rate limit and potential pro-tier credits.
**Learning:** Proxy endpoints are often overlooked during security audits. While they seem "read-only", they expose the server's identity and its associated third-party service quotas to the public.
**Prevention:** All proxy endpoints must be protected by authentication guards, even if they only provide access to public market data, to protect the application's infrastructure and service quotas from abuse.

## 2026-05-07 - Broken Access Control via Incorrect Decorator Key
**Vulnerability:** The `OrdersController` used `@User('userId')` to extract the authenticated user's ID. However, the `JwtAuthGuard` attached the ID using the key `user_id`. This mismatch caused `userId` to be `undefined` for all requests, effectively putting all orders into a single shared bucket and allowing any authenticated user to view or cancel any other user's orders.
**Learning:** Custom decorators and manual request object manipulation can easily introduce "silent" broken access control if keys are not perfectly aligned. TypeScript may not catch these runtime property mismatches on the request object.
**Prevention:** Standardize property keys across all guards and decorators. Always include E2E tests specifically designed to verify data isolation between different authenticated users to catch these regressions.
