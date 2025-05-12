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

  // First, clean up any duplicate Default Workspaces
  const defaultWorkspaces = state.workspaces.filter(
    (workspace) =>
      workspace.name === 'Default Workspace' ||
      workspace.id.includes('simplified'),
  );

  console.log(`Found ${defaultWorkspaces.length} Default Workspace entries`);

  // Keep only the first non-empty Default Workspace, or the first one if all are empty
  if (defaultWorkspaces.length > 1) {
    // Find the first non-empty workspace
    const nonEmptyWorkspace = defaultWorkspaces.find(
      (workspace) =>
        workspace.root.children && workspace.root.children.length > 0,
    );

    // If we found a non-empty workspace, keep it; otherwise keep the first one
    const workspaceToKeep = nonEmptyWorkspace || defaultWorkspaces[0];

    // Delete all other Default Workspaces
    defaultWorkspaces.forEach((workspace) => {
      if (workspace.id !== workspaceToKeep.id) {
        console.log(`Deleting duplicate Default Workspace: ${workspace.id}`);
        workspaceManager.deleteWorkspace(workspace.id);
      }
    });

    // Set the remaining workspace as current
    workspaceManager.setCurrentWorkspace(workspaceToKeep.id);
    console.log(
      `Set current workspace to: ${workspaceToKeep.name} (${workspaceToKeep.id})`,
    );

    // If the workspace we kept is non-empty, we're done
    if (
      workspaceToKeep.root.children &&
      workspaceToKeep.root.children.length > 0
    ) {
      return;
    }
    // Otherwise, continue to recreate it with content
  } else if (defaultWorkspaces.length === 1) {
    // We have exactly one Default Workspace
    const existingWorkspace = defaultWorkspaces[0];

    // If it has content, use it
    if (
      existingWorkspace.root.children &&
      existingWorkspace.root.children.length > 0
    ) {
      workspaceManager.setCurrentWorkspace(existingWorkspace.id);
      console.log(
        `Set current workspace to existing default: ${existingWorkspace.name} (${existingWorkspace.id})`,
      );
      return;
    }
    // Otherwise, delete it so we can recreate it with content
    console.log(
      `Found empty default workspace, recreating it: ${existingWorkspace.id}`,
    );
    workspaceManager.deleteWorkspace(existingWorkspace.id);
  }
  // If we get here, either we have no Default Workspace or we deleted empty ones

  // Ensure the simplified template is registered
  let simplifiedTemplateExists = workspaceManager
    .getTemplates()
    .some((template) => template.id === 'simplified-default');

  if (!simplifiedTemplateExists) {
    console.log('Simplified template not found, registering it now');
    workspaceManager.addTemplate(simplifiedTemplate);
  }

  // Create a new workspace from the template
  const newWorkspace = workspaceManager.createFromTemplate(
    'simplified-default',
    'Default Workspace',
  );
  if (newWorkspace) {
    workspaceManager.setCurrentWorkspace(newWorkspace.id);
    console.log(
      `Created and set simplified workspace as default: ${newWorkspace.name}`,
    );
  } else {
    console.error('Failed to create simplified workspace from template');
  }
}
