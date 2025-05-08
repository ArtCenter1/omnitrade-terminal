/**
 * Set Simplified Template as Default
 *
 * This module sets the simplified template as the default workspace.
 */

import { workspaceManager } from './index';
import { simplifiedTemplate } from './simplified-template';

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
    // Check if the workspace has content
    if (simplifiedWorkspace.root.children && simplifiedWorkspace.root.children.length > 0) {
      // Set it as the current workspace
      workspaceManager.setCurrentWorkspace(simplifiedWorkspace.id);
      console.log(`Set current workspace to simplified default: ${simplifiedWorkspace.name}`);
      return;
    } else {
      // Workspace exists but is empty, delete it so we can recreate it
      console.log(`Found empty simplified workspace, recreating it: ${simplifiedWorkspace.id}`);
      workspaceManager.deleteWorkspace(simplifiedWorkspace.id);
    }
  }

  // Ensure the simplified template is registered
  let simplifiedTemplateExists = workspaceManager.getTemplates().some(template =>
    template.id === 'simplified-default');

  if (!simplifiedTemplateExists) {
    console.log('Simplified template not found, registering it now');
    workspaceManager.addTemplate(simplifiedTemplate);
  }

  // Create a new workspace from the template
  const newWorkspace = workspaceManager.createFromTemplate('simplified-default', 'Default Workspace');
  if (newWorkspace) {
    workspaceManager.setCurrentWorkspace(newWorkspace.id);
    console.log(`Created and set simplified workspace as default: ${newWorkspace.name}`);
  } else {
    console.error('Failed to create simplified workspace from template');
  }
}
