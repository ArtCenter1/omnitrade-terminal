/**
 * Workspace Manager Initialization
 *
 * This module initializes the workspace manager with default templates.
 */

import { workspaceManager } from './index';
import { getDefaultTemplates } from './templates';

/**
 * Initialize the workspace manager
 */
export function initializeWorkspaceManager(): void {
  console.log('Initializing workspace manager...');

  // Add default templates
  const templates = getDefaultTemplates();
  templates.forEach(template => {
    workspaceManager.addTemplate(template);
  });

  console.log(`Added ${templates.length} default workspace templates`);

  // Create default workspace from template if none exist
  const state = workspaceManager.getState();
  if (state.workspaces.length <= 1) { // Only the default empty workspace exists
    // Create a workspace from the Simplified template
    const defaultWorkspace = workspaceManager.createFromTemplate('simplified-default', 'Default Workspace');
    if (defaultWorkspace) {
      console.log(`Created default workspace: ${defaultWorkspace.name}`);

      // Set as current workspace
      workspaceManager.setCurrentWorkspace(defaultWorkspace.id);
    }
  }
}
