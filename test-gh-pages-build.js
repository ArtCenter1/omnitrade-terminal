// Simple script to test GitHub Pages build
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variables
process.env.VITE_BASE_PATH = '/omnitrade-terminal/';
process.env.VITE_USE_MOCK_API = 'true';
process.env.NODE_ENV = 'production';

// Run the build command
console.log('Running build command...');
execSync('npm run build', { stdio: 'inherit' });

// Check the output
console.log('\nChecking build output...');
const indexPath = path.join(__dirname, 'dist', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Check for absolute paths
const absolutePathsInIndex = (indexContent.match(/src="\/assets\//g) || []).length +
                            (indexContent.match(/href="\/assets\//g) || []).length;

if (absolutePathsInIndex > 0) {
  console.error(`❌ Found ${absolutePathsInIndex} absolute paths in index.html. These should be relative paths.`);

  // Fix the paths
  console.log('Fixing paths...');
  const fixedContent = indexContent
    .replace(/src="\/assets\//g, 'src="./assets/')
    .replace(/href="\/assets\//g, 'href="./assets/');

  fs.writeFileSync(indexPath, fixedContent);
  console.log('✅ Paths fixed. Check the dist/index.html file.');
} else {
  console.log('✅ No absolute paths found in index.html.');
}

// Check for the base path in the Vite config
console.log('\nVerifying build configuration...');
const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
console.log(`Found ${distFiles.length} files/directories in the dist folder.`);
console.log('Files:', distFiles.join(', '));

console.log('\nTest complete. If you see any issues, please fix them before deploying to GitHub Pages.');
