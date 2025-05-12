// Script to force reset the workspace on next page load
console.log('Setting workspace reset flag...');

// Set the reset flag
localStorage.setItem('workspace-needs-reset', 'true');

// Clear the current workspace state
localStorage.removeItem('omnitrade-terminal-workspaces');

console.log('Workspace reset flag set, reloading page...');

// Reload the page
window.location.reload();
