/**
 * Terminal Initialization
 *
 * This module initializes the terminal components, registry, and workspace manager.
 */

import { initializeComponentRegistry } from './component-registry/init';
import { initializeWorkspaceManager } from './workspace/init';
import { setTabTraderAsDefault } from './workspace/set-tabtrader-default';

/**
 * Initialize the terminal
 */
export function initializeTerminal(): void {
  console.log('Initializing OmniTrade Terminal...');

  // Initialize the component registry
  initializeComponentRegistry();

  // Initialize the workspace manager
  initializeWorkspaceManager();

  // Set TabTrader template as the default workspace
  setTabTraderAsDefault();

  console.log('Terminal initialization complete');
}
