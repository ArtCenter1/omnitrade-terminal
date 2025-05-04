/**
 * Page Type Utilities
 * 
 * Utility functions for determining page types (landing vs. protected)
 */

/**
 * List of routes that are considered landing pages
 */
export const LANDING_PAGE_ROUTES = [
  '/',
  '/auth',
  '/login',
  '/register',
  '/forgot-password',
  '/auth/reset-password',
  '/pricing',
  '/omni-token',
  '/trading-bots',
  '/blog',
  '/ai-driven',
];

/**
 * Check if a route is a landing page
 * @param path The current path
 * @returns True if the path is a landing page route
 */
export function isLandingPage(path: string): boolean {
  // Check if the path exactly matches any landing page route
  if (LANDING_PAGE_ROUTES.includes(path)) {
    return true;
  }
  
  // Check if the path starts with any landing page route prefix
  // This handles nested routes like /auth/something
  return LANDING_PAGE_ROUTES.some(route => 
    route !== '/' && path.startsWith(route)
  );
}

/**
 * Check if a route is a protected page
 * @param path The current path
 * @returns True if the path is a protected page route
 */
export function isProtectedPage(path: string): boolean {
  return !isLandingPage(path);
}

/**
 * Apply the landing page class to the body element
 * This is useful for components that need to manually set the landing page class
 * @param isLanding Whether the current page is a landing page
 */
export function applyLandingPageClass(isLanding: boolean): void {
  if (isLanding) {
    document.body.classList.add('landing-page');
  } else {
    document.body.classList.remove('landing-page');
  }
}
