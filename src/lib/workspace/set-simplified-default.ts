/**
 * Set Simplified Template as Default
 *
 * This module sets the simplified template as the default workspace.
 */

import { workspaceManager } from './index';

/**
 * Set the simplified template as the default workspace
 */
export function setSimplifiedAsDefault(): void {
  console.log('Setting up simplified default workspace...');

  // Get all workspaces
  const state = workspaceManager.getState();

  // Find the simplified workspace if it exists
  const simplifiedWorkspace = state.workspaces.find(workspace =>
    workspace.name.includes('Default Workspace') || workspace.id.includes('simplified'));

  if (simplifiedWorkspace) {
    // Set it as the current workspace
    workspaceManager.setCurrentWorkspace(simplifiedWorkspace.id);
    console.log(`Set current workspace to simplified default: ${simplifiedWorkspace.name}`);
    return;
  }

  // If simplified workspace doesn't exist, create it from the template
  const simplifiedTemplate = workspaceManager.getTemplates().find(template =>
    template.id === 'simplified-default');

  if (simplifiedTemplate) {
    const newWorkspace = workspaceManager.createFromTemplate('simplified-default', 'Default Workspace');
    if (newWorkspace) {
      workspaceManager.setCurrentWorkspace(newWorkspace.id);
      console.log(`Created and set simplified workspace as default: ${newWorkspace.name}`);
    }
  } else {
    console.warn('Simplified template not found');
  }
}
