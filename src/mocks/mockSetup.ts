// src/mocks/mockSetup.ts
import { setupWorker } from 'msw/browser';

// Import handlers from different mock files
import { handlers as generalHandlers } from './handlers';

// Create a single worker instance with all handlers
export const worker = setupWorker(...generalHandlers);

// Initialize all mock APIs
export function setupMockApis() {
  if (typeof window !== 'undefined') {
    // Start the worker with appropriate options
    worker
      .start({
        onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
        serviceWorker: {
          url: '/mockServiceWorker.js', // Ensure this path is correct
        },
      })
      .catch((error) => {
        console.error('Error starting MSW worker:', error);
      });

    console.log('Mock Service Worker started');
  }
}
