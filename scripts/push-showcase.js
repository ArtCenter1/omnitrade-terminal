// Script to push the showcase branch to GitHub
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('Preparing to push showcase branch to GitHub...');

// Check if we're on the showcase branch
try {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  if (currentBranch !== 'showcase') {
    console.error('❌ Not on showcase branch. Please run: git checkout showcase');
    process.exit(1);
  }
  console.log('✅ Currently on showcase branch');
} catch (error) {
  console.error('❌ Error checking current branch:', error);
  process.exit(1);
}

// Build the showcase version
try {
  console.log('Building showcase version...');
  execSync('npm run build:showcase', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Commit changes
try {
  console.log('Committing changes...');
  
  // Check if there are changes to commit
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.length === 0) {
    console.log('No changes to commit');
  } else {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Update showcase version"', { stdio: 'inherit' });
    console.log('✅ Changes committed');
  }
} catch (error) {
  console.error('❌ Error committing changes:', error);
  process.exit(1);
}

// Push to GitHub
try {
  console.log('Pushing to GitHub...');
  execSync('git push origin showcase', { stdio: 'inherit' });
  console.log('✅ Pushed to GitHub');
} catch (error) {
  console.error('❌ Error pushing to GitHub:', error);
  process.exit(1);
}

console.log('Showcase branch pushed to GitHub successfully!');
console.log('GitHub Actions will now deploy the showcase to GitHub Pages.');
console.log('You can check the status at: https://github.com/ArtCenter1/omnitrade-terminal/actions');
