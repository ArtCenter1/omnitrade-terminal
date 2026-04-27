## 2025-05-15 - Hardcoded Encryption Keys and Static IVs
**Vulnerability:** Hardcoded encryption keys (`super_secret_key`) and static Initialization Vectors (all zeros) were used in `ExchangeApiKeyService` and `PortfolioService` to "encrypt" sensitive exchange API keys and secrets.
**Learning:** This implementation provided only a false sense of security (security theater). A static IV means the same plaintext always results in the same ciphertext, and a hardcoded key is easily discoverable by anyone with access to the source code.
**Prevention:** Always use environment-driven secrets for encryption keys and ensure each encryption operation uses a unique, random IV. Store the IV alongside the ciphertext.

## 2025-05-22 - Logic Error in Exchange ID Validation
**Vulnerability:** The `in` operator was incorrectly used on the `ccxt.exchanges` array to validate user-provided exchange IDs. In JavaScript/TypeScript, `in` checks for property keys (indices in an array), not values. This resulted in legitimate exchange IDs failing validation.
**Learning:** Confusing the `in` operator with value membership checks is a common logic error that can break security-critical input validation.
**Prevention:** Always use `.includes()` for checking if a value exists within an array. When working with third-party libraries like `ccxt`, be aware that TypeScript definitions might sometimes be overly complex, requiring explicit type casting (e.g., `as unknown as string[]`) to use standard array methods safely.

## 2026-04-27 - Information Leakage and Resource Exhaustion in API Key Testing
**Vulnerability:** The API key testing endpoint (`/api/exchange-api-keys/:id/test`) was not rate-limited and potentially leaked internal library error messages from `ccxt`.
**Learning:** Resource-intensive endpoints that perform external network calls or cryptographic operations are high-priority targets for DoS attacks and should always have specific rate limits. Furthermore, blindly returning `error.message` from third-party libraries can expose sensitive environment details or internal logic.
**Prevention:** Implement specific rate limiters for sensitive endpoints in addition to global limits. Always sanitize error responses by returning generic messages for unknown exception types, while allowing through specific, safe messages for known error categories (e.g., AuthenticationError).
