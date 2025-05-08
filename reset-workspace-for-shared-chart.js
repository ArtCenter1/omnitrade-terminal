// Script to reset the workspace to apply the shared TradingView chart
console.log('Resetting workspace to apply shared TradingView chart...');

// Set the reset flag
localStorage.setItem('workspace-needs-reset', 'true');

// Clear the current workspace state
localStorage.removeItem('omnitrade-terminal-workspaces');

console.log('Workspace reset flag set, reloading page...');

// Reload the page
window.location.reload();
