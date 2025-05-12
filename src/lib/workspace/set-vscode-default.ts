/**
 * Set VS Code Template as Default
 *
 * This module sets the VS Code template as the default workspace.
 */

import { workspaceManager } from './index';
import { vsCodeTemplate } from './vscode-template';

/**
 * Set the VS Code template as the default workspace
 */
export function setVSCodeAsDefault(): void {
  console.log('Setting up VS Code default workspace...');

  // Get all workspaces
  const state = workspaceManager.getState();

  // First, clean up any duplicate VS Code Workspaces
  const vsCodeWorkspaces = state.workspaces.filter(
    (workspace) =>
      workspace.name.includes('VS Code') || workspace.id.includes('vscode'),
  );

  console.log(`Found ${vsCodeWorkspaces.length} VS Code Workspace entries`);

  // Keep only the first non-empty VS Code Workspace, or the first one if all are empty
  if (vsCodeWorkspaces.length > 1) {
    // Find the first non-empty workspace
    const nonEmptyWorkspace = vsCodeWorkspaces.find(
      (workspace) =>
        workspace.root.children && workspace.root.children.length > 0,
    );

    // If we found a non-empty workspace, keep it; otherwise keep the first one
    const workspaceToKeep = nonEmptyWorkspace || vsCodeWorkspaces[0];

    // Delete all other VS Code Workspaces
    vsCodeWorkspaces.forEach((workspace) => {
      if (workspace.id !== workspaceToKeep.id) {
        console.log(`Deleting duplicate VS Code Workspace: ${workspace.id}`);
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
  } else if (vsCodeWorkspaces.length === 1) {
    // We have exactly one VS Code Workspace
    const existingWorkspace = vsCodeWorkspaces[0];

    // If it has content, use it
    if (
      existingWorkspace.root.children &&
      existingWorkspace.root.children.length > 0
    ) {
      workspaceManager.setCurrentWorkspace(existingWorkspace.id);
      console.log(
        `Set current workspace to existing VS Code: ${existingWorkspace.name} (${existingWorkspace.id})`,
      );
      return;
    }
    // Otherwise, delete it so we can recreate it with content
    console.log(
      `Found empty VS Code workspace, recreating it: ${existingWorkspace.id}`,
    );
    workspaceManager.deleteWorkspace(existingWorkspace.id);
  }
  // If we get here, either we have no VS Code Workspace or we deleted empty ones

  // Ensure the VS Code template is registered
  let vsCodeTemplateExists = workspaceManager
    .getTemplates()
    .some((template) => template.id === 'vscode-layout');

  if (!vsCodeTemplateExists) {
    console.log('VS Code template not found, registering it now');
    workspaceManager.addTemplate(vsCodeTemplate);
  }

  // Check if a workspace with the name "VS Code Layout" already exists
  const updatedState = workspaceManager.getState();
  const existingVSCodeWorkspace = updatedState.workspaces.find(
    (workspace) => workspace.name === 'VS Code Layout',
  );

  if (existingVSCodeWorkspace) {
    // Use the existing workspace
    workspaceManager.setCurrentWorkspace(existingVSCodeWorkspace.id);
    console.log(
      `Using existing VS Code workspace: ${existingVSCodeWorkspace.name}`,
    );
  } else {
    // Create a new workspace from the template
    const newWorkspace = workspaceManager.createFromTemplate(
      'vscode-layout',
      'VS Code Layout',
    );
    if (newWorkspace) {
      workspaceManager.setCurrentWorkspace(newWorkspace.id);
      console.log(
        `Created and set VS Code workspace as default: ${newWorkspace.name}`,
      );
    } else {
      console.error('Failed to create VS Code workspace from template');
    }
  }
}
