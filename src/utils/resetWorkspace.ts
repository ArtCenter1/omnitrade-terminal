/**
 * Workspace Reset Utility
 *
 * This utility provides functions to reset the workspace state if it gets out of sync.
 * It's particularly useful when running the application on different ports or in different environments.
 */

import { workspaceManager } from '@/lib/workspace';
import { setSimplifiedAsDefault } from '@/lib/workspace/set-simplified-default';

/**
 * Reset the workspace state to default
 * This clears the workspace state from local storage and reinitializes it
 */
export function resetWorkspace(): void {
  console.log('Resetting workspace state to default...');

  try {
    // First, directly remove from localStorage to ensure a clean slate
    localStorage.removeItem('omnitrade-terminal-workspaces');

    // Clear workspace state using the manager's method
    workspaceManager.clearStorage();

    // Reinitialize the workspace manager to create all workspaces
    const { initializeWorkspaceManager } = require('@/lib/workspace/init');
    initializeWorkspaceManager();

    // Set simplified template as default
    setSimplifiedAsDefault();

    console.log('Workspace state reset complete');
  } catch (error) {
    console.error('Error resetting workspace:', error);

    // Fallback: direct localStorage manipulation and reload
    localStorage.removeItem('omnitrade-terminal-workspaces');
    console.log('Workspace state cleared using fallback method');

    // Force reload to reinitialize everything
    window.location.reload();
  }
}

/**
 * Add reset workspace button to the page for development purposes
 * This is useful for quickly resetting the workspace state during development
 */
export function addResetWorkspaceButton(): void {
  if (import.meta.env.DEV) {
    // Create a container for the button
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '5px';

    // Create the reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Workspace';
    resetButton.style.padding = '8px 12px';
    resetButton.style.backgroundColor = '#673ab7';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.fontFamily = 'sans-serif';
    resetButton.style.fontSize = '12px';

    // Add click event listener for reset button
    resetButton.addEventListener('click', () => {
      try {
        resetWorkspace();
        // Reload the page to apply changes
        window.location.reload();
      } catch (error) {
        console.error('Error in reset button click handler:', error);
        // Set flag for next load and force reload
        localStorage.setItem('workspace-needs-reset', 'true');
        localStorage.removeItem('omnitrade-terminal-workspaces');
        window.location.reload();
      }
    });

    // Add the button to the container
    container.appendChild(resetButton);

    // Add the container to the page
    document.body.appendChild(container);

    console.log('Reset workspace button added to the page');
  }
}
