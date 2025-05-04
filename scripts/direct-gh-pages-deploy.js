// This script creates a minimal GitHub Pages deployment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('Creating minimal GitHub Pages deployment...');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

// Copy the simple index.html
fs.copyFileSync(
  path.join(rootDir, 'public', 'index-simple.html'),
  path.join(distDir, 'index.html')
);
console.log('✅ Copied simple index.html');

// Copy the test.html
fs.copyFileSync(
  path.join(rootDir, 'public', 'test.html'),
  path.join(distDir, 'test.html')
);
console.log('✅ Copied test.html');

// Copy the placeholder.svg
fs.copyFileSync(
  path.join(rootDir, 'public', 'placeholder.svg'),
  path.join(distDir, 'placeholder.svg')
);
console.log('✅ Copied placeholder.svg');

// Create a .nojekyll file
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log('✅ Created .nojekyll file');

// Create a simple 404.html
const simple404 = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmniTrade - Page Not Found</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: #131722;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            color: #aaa;
        }
        .button {
            background-color: #6366F1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.2s;
            text-decoration: none;
        }
        .button:hover {
            background-color: #4F46E5;
        }
    </style>
</head>
<body>
    <h1>Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <a href="/" class="button">Go to Home Page</a>
    <script>
        // Redirect to home page after 3 seconds
        setTimeout(function() {
            window.location.href = '/omnitrade-terminal/';
        }, 3000);
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, '404.html'), simple404);
console.log('✅ Created simple 404.html');

console.log('✅ Minimal GitHub Pages deployment created successfully!');
console.log('You can now commit and push these changes to deploy to GitHub Pages.');
