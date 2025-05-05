// This script fixes asset paths for GitHub Pages deployment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('Fixing asset paths for GitHub Pages...');

// Create a .nojekyll file
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log('✅ Created .nojekyll file');

// Copy placeholder.svg to the dist directory
try {
  fs.copyFileSync(
    path.join(rootDir, 'public', 'placeholder.svg'),
    path.join(distDir, 'placeholder.svg')
  );
  console.log('✅ Copied placeholder.svg to dist directory');
} catch (error) {
  console.error('❌ Error copying placeholder.svg:', error);
}

// Use a simplified index.html for GitHub Pages
try {
  // Copy the GitHub Pages specific index.html
  const githubPagesIndexPath = path.join(rootDir, 'public', 'index-github-pages.html');
  const indexPath = path.join(distDir, 'index.html');

  if (fs.existsSync(githubPagesIndexPath)) {
    // Read the GitHub Pages index file
    let indexContent = fs.readFileSync(githubPagesIndexPath, 'utf8');

    // Make a backup of the original index.html
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, path.join(distDir, 'index.original.html'));
      console.log('✅ Created backup of original index.html');
    }

    // Write the GitHub Pages index file
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Replaced index.html with GitHub Pages version');
  } else {
    // If the GitHub Pages index file doesn't exist, fix the paths in the original
    console.log('⚠️ GitHub Pages index file not found, fixing paths in original index.html');

    const indexPath = path.join(distDir, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    // Fix asset paths
    let fixedContent = indexContent
      .replace(/src="\/assets\//g, 'src="./assets/')
      .replace(/href="\/assets\//g, 'href="./assets/')
      .replace(/src="\/omnitrade-terminal\/assets\//g, 'src="./assets/')
      .replace(/href="\/omnitrade-terminal\/assets\//g, 'href="./assets/')
      .replace(/src="\/src\//g, 'src="./src/')
      .replace(/href="\/src\//g, 'href="./src/');

    // Replace any remaining references to main.tsx with the built JS file
    fixedContent = fixedContent
      .replace(/src="\.\/src\/main\.tsx"/g, 'src="./assets/index.js"')
      .replace(/src="\/src\/main\.tsx"/g, 'src="./assets/index.js"')
      .replace(/src="\.\/main\.tsx"/g, 'src="./assets/index.js"');

    if (fixedContent !== indexContent) {
      fs.writeFileSync(indexPath, fixedContent);
      console.log('✅ Fixed asset paths in index.html');
    }
  }
} catch (error) {
  console.error('❌ Error handling index.html:', error);
}

// Create fallback scripts to prevent 404 errors
try {
  // Ensure assets directory exists
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Create a proper main.js in the assets directory
  const mainJsContent = `// Main entry point for the application
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '../src/App';

// Mount the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/omnitrade-terminal">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`;

  // Check if the real main.js exists
  const hasRealMainJs = fs.readdirSync(assetsDir)
    .some(file => file === 'main.js' || file.startsWith('main-') && file.endsWith('.js'));

  if (!hasRealMainJs) {
    fs.writeFileSync(
      path.join(assetsDir, 'main.js'),
      mainJsContent
    );
    console.log('✅ Created proper assets/main.js');
  }

  // Create a proper index.js in the assets directory
  const indexJsContent = `// Fallback entry point that loads the main script
import './main.js';
`;

  // Check if the real index.js exists
  const hasRealIndexJs = fs.readdirSync(assetsDir)
    .some(file => file === 'index.js' || file.startsWith('index-') && file.endsWith('.js'));

  if (!hasRealIndexJs) {
    fs.writeFileSync(
      path.join(assetsDir, 'index.js'),
      indexJsContent
    );
    console.log('✅ Created proper assets/index.js');
  }

  // Create a simple main.js in the root directory as a fallback
  fs.writeFileSync(
    path.join(distDir, 'main.js'),
    `// Fallback script for GitHub Pages
console.log("Root fallback main.js loaded");
// Redirect to the correct location
window.location.href = '/omnitrade-terminal/';
`
  );
  console.log('✅ Created root fallback main.js');

  // Create a simple main.tsx in the root directory as a fallback (but it's actually JS)
  fs.writeFileSync(
    path.join(distDir, 'main.tsx'),
    `// Fallback script for GitHub Pages (this is actually JavaScript)
console.log("Root fallback main.tsx loaded");
// Redirect to the correct location
window.location.href = '/omnitrade-terminal/';
`
  );
  console.log('✅ Created root fallback main.tsx');

  // Create a .js-mime file to help GitHub Pages serve the correct MIME type
  fs.writeFileSync(
    path.join(distDir, '.js-mime'),
    'application/javascript'
  );
  console.log('✅ Created .js-mime file for GitHub Pages');

} catch (error) {
  console.error('❌ Error creating fallback scripts:', error);
}

console.log('Asset path fixes complete!');
