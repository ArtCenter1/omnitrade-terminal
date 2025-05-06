/**
 * Service Worker for Handling Missing Files
 * 
 * This service worker intercepts requests for missing JavaScript files
 * and returns empty JavaScript files to prevent 404 errors.
 */

// List of files that might be requested but don't exist
const missingFiles = [
  'fix-mock-mode.js',
  'ensure-mock-data.js',
  'exchange-adapter-mock.js',
  'binance-testnet-mock.js',
  'fix-portfolio-errors.js',
  'fix-connection-errors.js',
  'fix-exchange-adapters.js',
  'fix-rtfolio-errors.js',
  'f-nction-errors.js',
  'e-e-adapter-mock.js',
  'ensure-mock-data.js'
];

// Install event - cache a dummy response for missing files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('missing-files-cache').then(cache => {
      // Create a dummy response for each missing file
      const dummyResponse = new Response(
        '// Empty file to prevent 404 errors',
        { headers: { 'Content-Type': 'application/javascript' } }
      );
      
      // Cache the dummy response for each missing file
      const cachePromises = missingFiles.map(file => {
        return cache.put(`/${file}`, dummyResponse.clone());
      });
      
      return Promise.all(cachePromises);
    })
  );
  
  // Activate the service worker immediately
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Fetch event - intercept requests for missing files
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const fileName = url.pathname.split('/').pop();
  
  // Check if the request is for a missing file
  if (missingFiles.includes(fileName)) {
    event.respondWith(
      caches.match(`/${fileName}`).then(response => {
        // Return the cached dummy response
        if (response) {
          console.log(`Intercepted request for missing file: ${fileName}`);
          return response;
        }
        
        // If not in cache, create a new dummy response
        console.log(`Creating dummy response for: ${fileName}`);
        return new Response(
          '// Empty file to prevent 404 errors',
          { headers: { 'Content-Type': 'application/javascript' } }
        );
      })
    );
  }
});
