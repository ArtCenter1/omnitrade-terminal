/**
 * Utility for centralizing CORS configuration.
 * Restricts access to trusted origins to prevent Cross-Site WebSocket Hijacking (CSWSH)
 * and other cross-origin attacks.
 */

/**
 * Retrieves the list of allowed origins from environment variables.
 * Defaults to localhost development ports if not specified.
 */
export const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];
  return origins;
};

/**
 * Returns a CORS configuration object compatible with both NestJS Express and WebSocket gateways.
 */
export const getCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();
  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      // or if the origin is in our whitelist.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };
};
