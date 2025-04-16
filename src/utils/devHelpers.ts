// Development helper functions

/**
 * Enable or disable the mock user for development
 * This allows testing protected routes without having to sign in
 * @param enable Whether to enable or disable the mock user
 */
export function enableMockUser(enable: boolean = true): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Mock user can only be enabled in development mode');
    return;
  }

  localStorage.setItem('useMockUser', enable ? 'true' : 'false');
  console.log(
    `Mock user ${enable ? 'enabled' : 'disabled'}. Reload the page to apply changes.`,
  );
}

/**
 * Check if the mock user is enabled
 */
export function isMockUserEnabled(): boolean {
  return localStorage.getItem('useMockUser') === 'true';
}

// Add this to the window object for easy access in the browser console
if (process.env.NODE_ENV === 'development') {
  (window as any).enableMockUser = enableMockUser;
  (window as any).isMockUserEnabled = isMockUserEnabled;

  console.log(
    'Development helpers available:\n' +
      '- enableMockUser(true/false): Enable or disable the mock user\n' +
      '- isMockUserEnabled(): Check if the mock user is enabled',
  );
}
