/**
 * Check for VS Code Layout Flag
 *
 * This module checks for a flag in localStorage that indicates the VS Code layout
 * should be used, and applies it if found.
 */

import { setVSCodeAsDefault } from './set-vscode-default';

/**
 * Check for the VS Code layout flag and apply it if found
 * @returns {boolean} True if VS Code layout was applied, false otherwise
 */
export function checkVSCodeFlag(): boolean {
  const useVSCodeLayout = localStorage.getItem('use-vscode-layout');

  if (useVSCodeLayout === 'true') {
    console.log('VS Code layout flag found, applying VS Code layout...');

    // Apply the VS Code layout
    setVSCodeAsDefault();

    // Clear the flag so it doesn't keep applying on every load
    localStorage.removeItem('use-vscode-layout');

    console.log('VS Code layout applied and flag cleared');
    return true;
  }

  return false;
}
