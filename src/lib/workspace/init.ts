/**
 * Workspace Manager Initialization
 *
 * This module initializes the workspace manager with default templates.
 */

import { workspaceManager } from './index';
import { getDefaultTemplates } from './templates';
import { checkVSCodeFlag } from './check-vscode-flag';

/**
 * Initialize the workspace manager
 */
export function initializeWorkspaceManager(): void {
  console.log('Initializing workspace manager...');

  // Add default templates
  const templates = getDefaultTemplates();
  templates.forEach((template) => {
    workspaceManager.addTemplate(template);
  });

  console.log(`Added ${templates.length} default workspace templates`);

  // Check for VS Code layout flag - if applied, we don't need to create another workspace
  const vsCodeApplied = checkVSCodeFlag();

  // Create default workspace from template if none exist and VS Code layout wasn't applied
  if (!vsCodeApplied) {
    const state = workspaceManager.getState();
    if (state.workspaces.length <= 1) {
      // Only the default empty workspace exists
      // Check if we should use VS Code template
      const useVSCodeLayout =
        localStorage.getItem('use-vscode-layout') === 'true';

      // Create a workspace from the appropriate template
      const templateId = useVSCodeLayout
        ? 'vscode-layout'
        : 'tabtrader-template'; // Default to TabTrader template ID
      const workspaceName = useVSCodeLayout
        ? 'VS Code Layout'
        : 'TabTrader Layout'; // Default to TabTrader template name

      // Check if a workspace with this name already exists
      const existingWorkspace = state.workspaces.find(
        (w) => w.name === workspaceName,
      );

      if (!existingWorkspace) {
        const defaultWorkspace = workspaceManager.createFromTemplate(
          templateId,
          workspaceName,
        );
        if (defaultWorkspace) {
          console.log(`Created default workspace: ${defaultWorkspace.name}`);

          // Set as current workspace
          workspaceManager.setCurrentWorkspace(defaultWorkspace.id);

          // Clear the flag if it was used
          if (useVSCodeLayout) {
            localStorage.removeItem('use-vscode-layout');
          }
        }
      } else {
        console.log(`Using existing workspace: ${existingWorkspace.name}`);
        workspaceManager.setCurrentWorkspace(existingWorkspace.id);
      }
    }
  }
}
