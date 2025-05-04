/**
 * Set TabTrader Template as Default
 *
 * This module sets the TabTrader-inspired template as the default workspace.
 */

import { workspaceManager } from './index';

/**
 * Set the TabTrader template as the default workspace
 *
 * This function ensures that the TabTrader workspace is available,
 * but preserves demo workspaces if they are currently selected.
 */
export function setTabTraderAsDefault(): void {
  console.log('Setting up TabTrader workspace...');

  // Get all workspaces
  const state = workspaceManager.getState();

  // Check if the current workspace is a demo workspace
  const currentWorkspace = state.workspaces.find(w => w.id === state.currentWorkspaceId);
  const isCurrentDemo = currentWorkspace && (
    currentWorkspace.name.includes('Demo') ||
    currentWorkspace.id.includes('demo')
  );

  // If the current workspace is a demo workspace, keep it selected
  if (isCurrentDemo) {
    console.log(`Keeping current demo workspace: ${currentWorkspace.name}`);
    return;
  }

  // Check if we should force the demo workspace (for testing)
  const forceDemo = localStorage.getItem('force-demo-workspace') === 'true';
  if (forceDemo) {
    // Find a demo workspace
    const demoWorkspace = state.workspaces.find(workspace =>
      workspace.name.includes('Demo') || workspace.id.includes('demo'));

    if (demoWorkspace) {
      // Set it as the current workspace
      workspaceManager.setCurrentWorkspace(demoWorkspace.id);
      console.log(`Forced demo workspace: ${demoWorkspace.name}`);
      return;
    }
  }

  // Find the TabTrader workspace if it exists
  const tabTraderWorkspace = state.workspaces.find(workspace =>
    workspace.name.includes('TabTrader') || workspace.id.includes('tabtrader'));

  if (tabTraderWorkspace) {
    // Set it as the current workspace
    workspaceManager.setCurrentWorkspace(tabTraderWorkspace.id);
    console.log(`Set current workspace to TabTrader: ${tabTraderWorkspace.name}`);
    return;
  }

  // If TabTrader workspace doesn't exist, create it from the template
  const tabTraderTemplate = workspaceManager.getTemplates().find(template =>
    template.id === 'tabtrader-inspired');

  if (tabTraderTemplate) {
    const newWorkspace = workspaceManager.createFromTemplate('tabtrader-inspired', 'TabTrader-Style Workspace');
    if (newWorkspace) {
      workspaceManager.setCurrentWorkspace(newWorkspace.id);
      console.log(`Created and set TabTrader workspace as default: ${newWorkspace.name}`);
    }
  } else {
    console.warn('TabTrader template not found');
  }
}
