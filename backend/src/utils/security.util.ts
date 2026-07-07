/**
 * Security utility functions for input validation and sanitization.
 */

/**
 * Validates a path to prevent path traversal and SSRF/protocol injection.
 * @param path The path to validate
 * @returns true if the path is valid, false otherwise
 */
export function isValidPath(path: string): boolean {
  if (!path) return true;

  try {
    // Decode URI component to handle encoded characters like %2e%2e%2f
    const decodedPath = decodeURIComponent(path);

    // Check for path traversal attempts
    if (decodedPath.includes('..')) {
      return false;
    }

    // Check for protocol injection (e.g., http://, file://)
    if (decodedPath.includes('://')) {
      return false;
    }

    // Whitelist of allowed characters: alphanumeric, /, -, _, .
    // This prevents most other injection types and unexpected characters.
    // We allow '/' as it's a path separator.
    const pathRegex = /^[a-zA-Z0-9/\-_.]+$/;
    return pathRegex.test(decodedPath);
  } catch {
    // If decoding fails, it's likely a malformed path
    return false;
  }
}
