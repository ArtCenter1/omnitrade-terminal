/**
 * Set TabTrader Template as Default
 * 
 * This module sets the TabTrader-inspired template as the default workspace.
 */

import { workspaceManager } from './index';

/**
 * Set the TabTrader template as the default workspace
 */
export function setTabTraderAsDefault(): void {
  console.log('Setting TabTrader template as default workspace...');
  
  // Get all workspaces
  const state = workspaceManager.getState();
  
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
