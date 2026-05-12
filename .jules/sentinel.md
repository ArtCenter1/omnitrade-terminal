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

## 2025-06-05 - User ID Mismatch and Silent Validation Failure
**Vulnerability:** A mismatch between the `JwtAuthGuard` (which set `user_id`) and the `OrdersController` (which requested `userId` via `@User('userId')`) broke data isolation, effectively grouping all orders under an `undefined` key. Simultaneously, using an `interface` for `CreateOrderDto` caused the global `ValidationPipe` to silently skip runtime validation.
**Learning:** Decorators like `@User()` fail silently if the key is incorrect, returning `undefined`. Furthermore, NestJS `ValidationPipe` requires classes (not interfaces) to perform runtime checks based on decorators.
**Prevention:** Always verify that controller decorators match the keys set by authentication guards. Use classes for DTOs to ensure that security-critical validation is enforced at the network boundary.
