/**
 * Workspace Reset Utility
 *
 * This utility provides functions to reset the workspace state if it gets out of sync.
 * It's particularly useful when running the application on different ports or in different environments.
 */

import { workspaceManager } from '@/lib/workspace';
import { setTabTraderAsDefault } from '@/lib/workspace/set-tabtrader-default';

/**
 * Reset the workspace state to default
 * This clears the workspace state from local storage and reinitializes it
 *
 * @param workspaceType The type of workspace to set as default: 'tabtrader', 'demo', or 'demo-tab'
 */
export function resetWorkspace(workspaceType: 'tabtrader' | 'demo' | 'demo-tab' = 'tabtrader'): void {
  console.log(`Resetting workspace state to ${workspaceType}...`);

  // Clear workspace state from local storage
  workspaceManager.clearStorage();

  // Reinitialize the workspace manager to create all workspaces
  // This will create the demo workspaces as well
  const { initializeWorkspaceManager } = require('@/lib/workspace/init');
  initializeWorkspaceManager();

  // Get the current state
  const state = workspaceManager.getState();

  if (workspaceType === 'demo') {
    // Find the Demo Workspace
    const demoWorkspace = state.workspaces.find(workspace =>
      workspace.name.includes('Demo Workspace') || workspace.id.includes('demo-workspace'));

    if (demoWorkspace) {
      // Set it as the current workspace
      workspaceManager.setCurrentWorkspace(demoWorkspace.id);
      console.log(`Set current workspace to Demo: ${demoWorkspace.name}`);
    }
  } else if (workspaceType === 'demo-tab') {
    // Find the Demo Tab Layout
    const demoTabWorkspace = state.workspaces.find(workspace =>
      workspace.name.includes('Demo Tab') || workspace.id.includes('demo-tab'));

    if (demoTabWorkspace) {
      // Set it as the current workspace
      workspaceManager.setCurrentWorkspace(demoTabWorkspace.id);
      console.log(`Set current workspace to Demo Tab: ${demoTabWorkspace.name}`);

      // Force the demo workspace to be used
      localStorage.setItem('force-demo-workspace', 'true');
    }
  } else {
    // Set TabTrader as default
    localStorage.removeItem('force-demo-workspace');
    setTabTraderAsDefault();
  }

  console.log('Workspace state reset complete');
}

/**
 * Add reset workspace buttons to the page for development purposes
 * This is useful for quickly resetting the workspace state during development
 */
export function addResetWorkspaceButton(): void {
  if (import.meta.env.DEV) {
    // Create a container for the buttons
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '5px';

    // Create the TabTrader reset button
    const tabTraderButton = document.createElement('button');
    tabTraderButton.textContent = 'Reset to TabTrader';
    tabTraderButton.style.padding = '8px 12px';
    tabTraderButton.style.backgroundColor = '#673ab7';
    tabTraderButton.style.color = 'white';
    tabTraderButton.style.border = 'none';
    tabTraderButton.style.borderRadius = '4px';
    tabTraderButton.style.cursor = 'pointer';
    tabTraderButton.style.fontFamily = 'sans-serif';
    tabTraderButton.style.fontSize = '12px';

    // Add click event listener for TabTrader button
    tabTraderButton.addEventListener('click', () => {
      resetWorkspace('tabtrader');
      // Reload the page to apply changes
      window.location.reload();
    });

    // Create the Demo reset button
    const demoButton = document.createElement('button');
    demoButton.textContent = 'Reset to Demo';
    demoButton.style.padding = '8px 12px';
    demoButton.style.backgroundColor = '#4caf50';
    demoButton.style.color = 'white';
    demoButton.style.border = 'none';
    demoButton.style.borderRadius = '4px';
    demoButton.style.cursor = 'pointer';
    demoButton.style.fontFamily = 'sans-serif';
    demoButton.style.fontSize = '12px';

    // Add click event listener for Demo button
    demoButton.addEventListener('click', () => {
      resetWorkspace('demo');
      // Reload the page to apply changes
      window.location.reload();
    });

    // Create the Demo Tab Layout reset button
    const demoTabButton = document.createElement('button');
    demoTabButton.textContent = 'Reset to Demo Tabs';
    demoTabButton.style.padding = '8px 12px';
    demoTabButton.style.backgroundColor = '#2196f3';
    demoTabButton.style.color = 'white';
    demoTabButton.style.border = 'none';
    demoTabButton.style.borderRadius = '4px';
    demoTabButton.style.cursor = 'pointer';
    demoTabButton.style.fontFamily = 'sans-serif';
    demoTabButton.style.fontSize = '12px';

    // Add click event listener for Demo Tab button
    demoTabButton.addEventListener('click', () => {
      resetWorkspace('demo-tab');
      // Reload the page to apply changes
      window.location.reload();
    });

    // Add the buttons to the container
    container.appendChild(tabTraderButton);
    container.appendChild(demoButton);
    container.appendChild(demoTabButton);

    // Add the container to the page
    document.body.appendChild(container);

    console.log('Reset workspace buttons added to the page');
  }
}
