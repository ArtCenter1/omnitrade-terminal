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

## 2026-05-25 - Validation Gap due to Type Erasure in DTOs
**Vulnerability:** The Orders module used TypeScript interfaces for its CreateOrderDto. Because interfaces are erased at runtime, the NestJS global ValidationPipe (configured with 'whitelist: true') was unable to validate or strip incoming request bodies, allowing unvalidated data to reach the service layer and causing 500 errors instead of 400s.
**Learning:** In NestJS, global validation pipes rely on class-based DTOs and decorators to perform runtime checks. Using interfaces bypasses this security layer entirely.
**Prevention:** Always use classes with 'class-validator' decorators for all request DTOs. Ensure 'ValidationPipe' is globally enabled with 'transform: true' and 'whitelist: true' to enforce these schemas at the edge.

## 2026-06-10 - Sensitive Information Leakage in Cache Keys and Query Parameters
**Vulnerability:** The `COINGECKO_API_KEY` was being added to the `params` object in `CoinGeckoProxyController`, which was then included in the Redis cache key and sent as a query parameter to the CoinGecko API.
**Learning:** Including secrets in cache keys or query strings makes them vulnerable to exposure in logs, monitoring tools, or intermediate proxies. It also pollutes the cache with sensitive data.
**Prevention:** Always transmit API keys and other sensitive credentials via secure HTTP headers. Ensure that cache keys are constructed using only non-sensitive request parameters.

## 2026-06-01 - Upstream API Error Leakage in Proxy Controllers
**Vulnerability:** Proxy controllers (`BinanceTestnetProxyController` and `CoinGeckoProxyController`) were returning raw `error.response.data` from upstream APIs to the client in their `catch` blocks.
**Learning:** Upstream error payloads often contain internal details (e.g., specific error codes, internal system paths, or reflected parameters) that can be used for reconnaissance by an attacker.
**Prevention:** Sanitize all error responses from third-party services. Only return the necessary status code and a generic message to the client, while logging the full error payload internally for debugging purposes.
## 2026-06-03 - Information Leakage in Proxy Error Responses
**Vulnerability:** Upstream error data from CoinGecko and Binance was being passed directly to the client via the `data` field in error responses.
**Learning:** Third-party APIs may include sensitive metadata, internal stack traces, or quota details in their error bodies. Direct passthrough of these bodies violates the principle of "Fail Securely".
**Prevention:** Intercept all upstream errors and map them to a standardized, safe error format that excludes the raw response body.

## 2026-07-02 - Path Traversal and SSRF Risk in Proxy Controllers
**Vulnerability:** Proxy controllers extracted endpoint paths from `req.originalUrl` or route parameters without validation, allowing sequences like `..` (traversal) or `://` (SSRF) to be passed to the target URL.
**Learning:** Even "read-only" proxies can be abused for reconnaissance or SSRF if they blindly concatenate user-provided path segments. Standard route validation might not catch these if wildcards are used.
**Prevention:** Always implement explicit path validation for proxy endpoints. Block `..`, `://`, and `\0` sequences before constructing the target URL.
