/**
 * Workspace Manager Initialization
 *
 * This module initializes the workspace manager with default templates.
 */

import { workspaceManager } from './index';
import { getDefaultTemplates } from './templates';
import { createCustomWorkspace, createMultiChartWorkspace } from './examples';

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

  // Create default workspaces from templates if none exist
  const state = workspaceManager.getState();
  if (state.workspaces.length <= 1) { // Only the default empty workspace exists
    // Create a workspace from the default trading template
    const tradingWorkspace = workspaceManager.createFromTemplate('default-trading', 'Trading Workspace');
    if (tradingWorkspace) {
      console.log(`Created default trading workspace: ${tradingWorkspace.name}`);

      // Set as current workspace
      workspaceManager.setCurrentWorkspace(tradingWorkspace.id);
    }

    // Create a custom workspace
    const customWorkspace = createCustomWorkspace('Custom Layout', 'A custom workspace layout example');
    if (customWorkspace) {
      console.log(`Created custom workspace: ${customWorkspace.name}`);
      workspaceManager.updateWorkspace(customWorkspace);
    }

    // Create a multi-chart workspace
    const multiChartWorkspace = createMultiChartWorkspace('Multi-Chart Layout', 'A workspace with multiple charts');
    if (multiChartWorkspace) {
      console.log(`Created multi-chart workspace: ${multiChartWorkspace.name}`);
      workspaceManager.updateWorkspace(multiChartWorkspace);
    }
  }
}
