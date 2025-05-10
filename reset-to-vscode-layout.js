// Script to reset the workspace to apply the VS Code layout
console.log('Resetting workspace to apply VS Code layout...');

// Set the reset flag
localStorage.setItem('workspace-needs-reset', 'true');

// Clear the current workspace state
localStorage.removeItem('omnitrade-terminal-workspaces');

console.log('Workspace reset flag set, reloading page...');

// Reload the page
window.location.reload();
