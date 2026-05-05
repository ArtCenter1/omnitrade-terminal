import rateLimit from 'express-rate-limit';

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per windowMs
  message:
    'Too many password reset requests from this IP, please try again after an hour',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Global rate limiter for all API endpoints.
 * Limits each IP to 300 requests per 15-minute window.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for placing orders.
 * Limits each IP to 20 requests per minute.
 */
export const orderPlacementLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute
  message: 'Too many order placement requests, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for testing exchange API keys.
 * Limits each IP to 10 requests per 15-minute window.
 */
export const apiKeyTestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message:
    'Too many API key test requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
