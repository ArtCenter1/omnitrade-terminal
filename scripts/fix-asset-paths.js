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

// Fix asset paths in index.html
try {
  const indexPath = path.join(distDir, 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Fix asset paths
  const fixedContent = indexContent
    .replace(/src="\/assets\//g, 'src="./assets/')
    .replace(/href="\/assets\//g, 'href="./assets/')
    .replace(/src="\/omnitrade-terminal\/assets\//g, 'src="./assets/')
    .replace(/href="\/omnitrade-terminal\/assets\//g, 'href="./assets/')
    .replace(/src="\/src\//g, 'src="./src/')
    .replace(/href="\/src\//g, 'href="./src/');
  
  if (fixedContent !== indexContent) {
    fs.writeFileSync(indexPath, fixedContent);
    console.log('✅ Fixed asset paths in index.html');
  }
} catch (error) {
  console.error('❌ Error fixing asset paths in index.html:', error);
}

// Create a simple main.js file in the dist directory to prevent 404 errors
try {
  fs.writeFileSync(
    path.join(distDir, 'main.js'),
    '// Fallback script for GitHub Pages\nconsole.log("Fallback script loaded");'
  );
  console.log('✅ Created fallback main.js');
} catch (error) {
  console.error('❌ Error creating fallback main.js:', error);
}

console.log('Asset path fixes complete!');
