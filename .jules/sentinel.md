## 2025-05-15 - Hardcoded Encryption Keys and Static IVs
**Vulnerability:** Hardcoded encryption keys (`super_secret_key`) and static Initialization Vectors (all zeros) were used in `ExchangeApiKeyService` and `PortfolioService` to "encrypt" sensitive exchange API keys and secrets.
**Learning:** This implementation provided only a false sense of security (security theater). A static IV means the same plaintext always results in the same ciphertext, and a hardcoded key is easily discoverable by anyone with access to the source code.
**Prevention:** Always use environment-driven secrets for encryption keys and ensure each encryption operation uses a unique, random IV. Store the IV alongside the ciphertext.

## 2025-05-22 - Logic Error in Exchange ID Validation
**Vulnerability:** The `in` operator was incorrectly used on the `ccxt.exchanges` array to validate user-provided exchange IDs. In JavaScript/TypeScript, `in` checks for property keys (indices in an array), not values. This resulted in legitimate exchange IDs failing validation.
**Learning:** Confusing the `in` operator with value membership checks is a common logic error that can break security-critical input validation.
**Prevention:** Always use `.includes()` for checking if a value exists within an array. When working with third-party libraries like `ccxt`, be aware that TypeScript definitions might sometimes be overly complex, requiring explicit type casting (e.g., `as unknown as string[]`) to use standard array methods safely.

## 2026-04-29 - Secure Error Handling for External Library Integrations
**Vulnerability:** Raw error messages from the `ccxt` library and network requests were being returned directly to the client in the `testApiKey` endpoint, potentially leaking internal details.
**Learning:** External libraries can leak sensitive information about backend configuration, network topology, or dependency versions in their error objects.
**Prevention:** Catch all exceptions from external library calls and map them to a predefined set of safe, generic error messages for the client. Log the full error internally for debugging.
