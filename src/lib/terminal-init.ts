/**
 * Terminal Initialization
 * 
 * This module initializes the terminal components, registry, and workspace manager.
 */

import { initializeComponentRegistry } from './component-registry/init';
import { initializeWorkspaceManager } from './workspace/init';

/**
 * Initialize the terminal
 */
export function initializeTerminal(): void {
  console.log('Initializing OmniTrade Terminal...');
  
  // Initialize the component registry
  initializeComponentRegistry();
  
  // Initialize the workspace manager
  initializeWorkspaceManager();
  
  console.log('Terminal initialization complete');
}
