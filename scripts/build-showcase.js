// Build script for the showcase version
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('Building showcase version...');

// Ensure the showcase environment variables are used
try {
  // Copy .env.showcase to .env.local for the build
  fs.copyFileSync(
    path.join(rootDir, '.env.showcase'),
    path.join(rootDir, '.env.local')
  );
  console.log('✅ Using showcase environment variables');
} catch (error) {
  console.error('❌ Error setting up environment variables:', error);
  process.exit(1);
}

// Run the build command
try {
  execSync('bun run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Create a .nojekyll file
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log('✅ Created .nojekyll file');

// Fix asset paths in index.html
try {
  const indexPath = path.join(distDir, 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // Fix asset paths
  const fixedContent = indexContent
    .replace(/src="\/assets\//g, 'src="./assets/')
    .replace(/href="\/assets\//g, 'href="./assets/')
    .replace(/src="\/omnitrade-terminal\/assets\//g, 'src="./assets/')
    .replace(/href="\/omnitrade-terminal\/assets\//g, 'href="./assets/');

  if (fixedContent !== indexContent) {
    fs.writeFileSync(indexPath, fixedContent);
    console.log('✅ Fixed asset paths in index.html');
  }
} catch (error) {
  console.error('❌ Error fixing asset paths:', error);
}

// Create a README for the showcase
fs.writeFileSync(
  path.join(distDir, 'README.md'),
  `# OmniTrade Terminal - Showcase

This is a showcase version of the OmniTrade Terminal UI, demonstrating the interface and functionality without requiring a backend server.

## Features

- Interactive trading terminal UI
- Mock market data visualization
- Draggable and resizable panels
- Theme switching

## Note

This is a demonstration version with mock data. For the full version with real-time data and trading capabilities, please visit the main repository.
`
);
console.log('✅ Created README for showcase');

console.log('Showcase build completed successfully!');
