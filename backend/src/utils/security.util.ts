/**
 * Validate if a path is safe from traversal attacks and other common injection patterns.
 * @param path The path to validate
 * @returns Whether the path is valid
 */
export function isValidPath(path: string): boolean {
  if (!path) return true;

  // Check for path traversal attempts
  if (
    path.includes('..') ||
    path.includes('./') ||
    path.includes('//') ||
    path.includes('\\')
  ) {
    return false;
  }

  // Check for sensitive characters that might be used in exploitation
  const sensitiveChars = [';', '>', '<', '|', '&', '$'];
  if (sensitiveChars.some((char) => path.includes(char))) {
    return false;
  }

  return true;
}
