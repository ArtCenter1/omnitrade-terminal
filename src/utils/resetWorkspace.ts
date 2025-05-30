/**
 * Workspace Reset Utility
 *
 * This utility provides functions to reset the workspace state if it gets out of sync.
 * It's particularly useful when running the application on different ports or in different environments.
 */

import { workspaceManager } from '@/lib/workspace';
import { setVSCodeAsDefault } from '@/lib/workspace/set-vscode-default';

/**
 * Reset the workspace state to default
 * This clears the workspace state from local storage and reinitializes it
 */
export function resetWorkspace(): void {
  console.log('Resetting workspace state to default...');

  try {
    // First, directly remove from localStorage to ensure a clean slate
    localStorage.removeItem('omnitrade-terminal-workspaces');

    // Clear workspace state using the manager's method
    workspaceManager.clearStorage();

    // Reinitialize the workspace manager to create all workspaces
    const { initializeWorkspaceManager } = require('@/lib/workspace/init');
    initializeWorkspaceManager();

    // Set VS Code template as default
    setVSCodeAsDefault();

    console.log('Workspace state reset complete');
  } catch (error) {
    console.error('Error resetting workspace:', error);

    // Fallback: direct localStorage manipulation and reload
    localStorage.removeItem('omnitrade-terminal-workspaces');
    console.log('Workspace state cleared using fallback method');

    // Force reload to reinitialize everything
    window.location.reload();
  }
}

/**
 * Add reset workspace button to the page for development purposes
 * This is useful for quickly resetting the workspace state during development
 *
 * Note: Buttons are currently disabled as requested by the user
 */
export function addResetWorkspaceButton(): void {
  // Buttons are disabled
  console.log('Workspace buttons are disabled');

  // The buttons code is kept but commented out for future reference if needed
  /*
  if (import.meta.env.DEV) {
    // Create a container for the button
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '5px';

    // Create the reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Workspace';
    resetButton.style.padding = '8px 12px';
    resetButton.style.backgroundColor = '#673ab7';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.fontFamily = 'sans-serif';
    resetButton.style.fontSize = '12px';

    // Add click event listener for reset button
    resetButton.addEventListener('click', () => {
      try {
        resetWorkspace();
        // Reload the page to apply changes
        window.location.reload();
      } catch (error) {
        console.error('Error in reset button click handler:', error);
        // Set flag for next load and force reload
        localStorage.setItem('workspace-needs-reset', 'true');
        localStorage.removeItem('omnitrade-terminal-workspaces');
        window.location.reload();
      }
    });

    // Create the VS Code layout button
    const vsCodeButton = document.createElement('button');
    vsCodeButton.textContent = 'Apply VS Code Layout';
    vsCodeButton.style.padding = '8px 12px';
    vsCodeButton.style.backgroundColor = '#007acc'; // VS Code blue
    vsCodeButton.style.color = 'white';
    vsCodeButton.style.border = 'none';
    vsCodeButton.style.borderRadius = '4px';
    vsCodeButton.style.cursor = 'pointer';
    vsCodeButton.style.fontFamily = 'sans-serif';
    vsCodeButton.style.fontSize = '12px';

    // Add click event listener for VS Code layout button
    vsCodeButton.addEventListener('click', () => {
      try {
        // Define the VS Code layout directly
        const vsCodeLayout = {
          id: 'vscode-layout-' + Date.now(),
          name: 'VS Code Layout',
          root: {
            id: 'root',
            type: 'container',
            direction: 'row',
            children: [
              // Left sidebar - Watchlist
              {
                id: 'left-sidebar',
                type: 'component',
                componentId: 'market-watchlist',
                componentState: {
                  favorites: true
                },
                title: 'Watchlist'
              },

              // Center area - Split into upper and lower sections
              {
                id: 'center-area',
                type: 'container',
                direction: 'column',
                children: [
                  // Upper section - Chart (70%)
                  {
                    id: 'chart',
                    type: 'component',
                    componentId: 'shared-tradingview',
                    componentState: {
                      symbol: 'BTC/USDT',
                      interval: 'D'
                    },
                    title: 'BTC/USDT Chart'
                  },

                  // Lower section - Terminal/Output (30%)
                  {
                    id: 'terminal',
                    type: 'component',
                    componentId: 'recent-trades',
                    componentState: {
                      symbol: 'BTC/USDT'
                    },
                    title: 'Recent Trades'
                  }
                ],
                // Distribute space: 70% chart, 30% terminal
                sizes: [70, 30]
              },

              // Right sidebar - Order Book
              {
                id: 'right-sidebar',
                type: 'component',
                componentId: 'order-book',
                componentState: {
                  symbol: 'BTC/USDT'
                },
                title: 'Order Book'
              }
            ],
            // Distribute space: 25% left sidebar, 50% center area, 25% right sidebar (1:2:1 ratio)
            sizes: [25, 50, 25]
          }
        };

        // Clear workspace state from local storage
        localStorage.removeItem('omnitrade-terminal-workspaces');

        // Store the VS Code layout directly
        const workspaces = {
          currentId: vsCodeLayout.id,
          workspaces: [vsCodeLayout]
        };

        localStorage.setItem('omnitrade-terminal-workspaces', JSON.stringify(workspaces));
        console.log('VS Code layout directly applied to localStorage');

        // Reload the page to apply changes
        window.location.reload();
      } catch (error) {
        console.error('Error in VS Code layout button click handler:', error);
        // Force reload
        window.location.reload();
      }
    });

    // Add the buttons to the container
    container.appendChild(resetButton);
    container.appendChild(vsCodeButton);

    // Add the container to the page
    document.body.appendChild(container);

    console.log('Workspace buttons added to the page');
  }
  */
}
