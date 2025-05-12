// Script to reset the workspace to apply the VS Code H-shaped layout
console.log('Resetting workspace to apply VS Code H-shaped layout...');

// Set the reset flag to ensure proper reset on next load
localStorage.setItem('workspace-needs-reset', 'true');
localStorage.setItem('use-vscode-layout', 'true');

// Clear workspace state from local storage
localStorage.removeItem('omnitrade-terminal-workspaces');
console.log('Cleared workspace state from local storage');

// Force a page reload to reinitialize the workspace
window.location.reload();
