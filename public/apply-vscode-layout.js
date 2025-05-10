// Script to apply the VS Code H-shaped layout
console.log('Applying VS Code H-shaped layout...');

// Set the flag to use VS Code layout
localStorage.setItem('use-vscode-layout', 'true');

// Clear workspace state from local storage
localStorage.removeItem('omnitrade-terminal-workspaces');
console.log('Cleared workspace state from local storage');

// Force a page reload to reinitialize the workspace
window.location.reload();
