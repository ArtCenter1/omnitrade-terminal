## 2025-05-15 - Hardcoded Encryption Keys and Static IVs
**Vulnerability:** Hardcoded encryption keys (`super_secret_key`) and static Initialization Vectors (all zeros) were used in `ExchangeApiKeyService` and `PortfolioService` to "encrypt" sensitive exchange API keys and secrets.
**Learning:** This implementation provided only a false sense of security (security theater). A static IV means the same plaintext always results in the same ciphertext, and a hardcoded key is easily discoverable by anyone with access to the source code.
**Prevention:** Always use environment-driven secrets for encryption keys and ensure each encryption operation uses a unique, random IV. Store the IV alongside the ciphertext.

## 2025-05-22 - Missing Proxy Trust for Rate Limiting
**Vulnerability:** Implementing `express-rate-limit` without configuring `app.set('trust proxy', 1)` in `main.ts` caused the rate limiter to see the IP of the reverse proxy instead of the client.
**Learning:** This could lead to a global Denial of Service where one user's excessive requests block all users, or where the entire site is blocked because the proxy's IP exceeds the limit.
**Prevention:** Always enable `trust proxy` when using IP-based rate limiting in environments with reverse proxies (e.g., Nginx, Heroku, AWS).
