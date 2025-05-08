// Script to reset the workspace state
console.log('Resetting workspace state...');

// Clear workspace state from local storage
localStorage.removeItem('omnitrade-terminal-workspaces');
console.log('Cleared workspace state from local storage');

// Force a page reload to reinitialize the workspace
window.location.reload();
