/**
 * Force Reset Workspace
 * 
 * This utility forces a reset of the workspace state when the application loads.
 * It's a temporary fix to ensure the workspace is properly initialized.
 */

import { resetWorkspace } from './resetWorkspace';

/**
 * Force reset the workspace state when the application loads
 */
export function forceResetWorkspaceOnLoad(): void {
  // Check if we need to reset the workspace
  const needsReset = localStorage.getItem('workspace-needs-reset') === 'true';
  
  if (needsReset) {
    console.log('Forcing workspace reset on load...');
    
    // Reset the workspace
    resetWorkspace();
    
    // Clear the flag
    localStorage.removeItem('workspace-needs-reset');
    
    console.log('Workspace reset complete');
  }
}

/**
 * Set a flag to force reset the workspace on the next page load
 */
export function setWorkspaceResetFlag(): void {
  localStorage.setItem('workspace-needs-reset', 'true');
  console.log('Workspace reset flag set, will reset on next page load');
}
