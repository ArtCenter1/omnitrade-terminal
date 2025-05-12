/**
 * Terminal Initialization
 *
 * This module initializes the terminal components, registry, and workspace manager.
 */

import { initializeComponentRegistry } from './component-registry/init';
import { initializeWorkspaceManager } from './workspace/init';
import { setSimplifiedAsDefault } from './workspace/set-simplified-default';

/**
 * Initialize the terminal
 */
export function initializeTerminal(): void {
  console.log('Initializing OmniTrade Terminal...');

  // Initialize the component registry
  initializeComponentRegistry();

  // Initialize the workspace manager
  initializeWorkspaceManager();

  // Set simplified template as the default workspace
  setSimplifiedAsDefault();

  console.log('Terminal initialization complete');
}
