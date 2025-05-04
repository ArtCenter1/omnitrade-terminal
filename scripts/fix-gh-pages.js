// This script fixes common GitHub Pages issues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

console.log('Fixing GitHub Pages issues...');

// 1. Check if the placeholder.svg exists
const placeholderPath = path.join(distDir, 'placeholder.svg');
if (!fs.existsSync(placeholderPath)) {
  console.error('❌ placeholder.svg not found in dist directory');
  console.log('Creating a simple SVG placeholder...');
  
  // Create a simple SVG placeholder
  const simpleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#333"/>
  <text x="50" y="50" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dominant-baseline="middle">Placeholder</text>
</svg>`;
  
  fs.writeFileSync(placeholderPath, simpleSvg);
  console.log('✅ Created placeholder.svg');
}

// 2. Check the index.html file for correct paths
const indexPath = path.join(distDir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Fix asset paths
const fixedContent = indexContent
  .replace(/src="\/omnitrade-terminal\/assets\//g, 'src="./assets/')
  .replace(/href="\/omnitrade-terminal\/assets\//g, 'href="./assets/')
  .replace(/src="\/assets\//g, 'src="./assets/')
  .replace(/href="\/assets\//g, 'href="./assets/');

if (fixedContent !== indexContent) {
  fs.writeFileSync(indexPath, fixedContent);
  console.log('✅ Fixed asset paths in index.html');
}

// 3. Create a .nojekyll file
const nojekyllPath = path.join(distDir, '.nojekyll');
if (!fs.existsSync(nojekyllPath)) {
  fs.writeFileSync(nojekyllPath, '');
  console.log('✅ Created .nojekyll file');
}

console.log('GitHub Pages fixes complete!');
