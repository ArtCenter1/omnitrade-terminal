/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path for GitHub Pages deployment
  base: process.env.VITE_BASE_PATH || '/',

  // Force base path for GitHub Pages in production build
  ...(process.env.NODE_ENV === 'production' && {
    base: '/omnitrade-terminal/'
  }),
  // Ensure assets are properly handled
  build: {
    assetsInlineLimit: 0, // Don't inline any assets as data URLs
    rollupOptions: {
      output: {
        manualChunks: undefined, // Don't split chunks for GitHub Pages
        entryFileNames: 'assets/[name].js', // Simplify entry file names
        chunkFileNames: 'assets/[name].js', // Simplify chunk file names
        assetFileNames: 'assets/[name].[ext]', // Simplify asset file names
      },
    },
  },
  server: {
    host: '::',
    port: 8080,
    proxy: {
      // Conditionally apply proxy configuration
      ...(!(process.env.VITE_USE_MOCK_API === 'true' ||
           process.env.VITE_DISABLE_BACKEND_FEATURES === 'true' ||
           process.env.MODE === 'showcase') && {
          '/api': {
            target: 'http://localhost:8888', // Your backend server (updated port)
            changeOrigin: true,
            // Add error handling for proxy
            configure: (proxy, _options) => {
              proxy.on('error', (err, req, res) => {
                // Check if mock data is enabled
                // In showcase mode, always consider mock data as enabled
                const useMockData = process.env.VITE_USE_MOCK_API === 'true' ||
                                   process.env.VITE_DISABLE_BACKEND_FEATURES === 'true' ||
                                   process.env.MODE === 'showcase';

                // Log error with more context
                console.warn(
                  `Proxy error for ${req.url}: ${err.message}. Mock data is ${useMockData ? 'enabled' : 'disabled'}.`
                );

                // Only log full error details in development
                if (process.env.NODE_ENV !== 'production') {
                  console.error('Full proxy error:', err);
                }

                // Only handle API requests that haven't sent headers yet
                if (!res.headersSent) {
                  // Check if this is a CoinGecko proxy request
                  if (req.url?.includes('/proxy/coingecko')) {
                    console.warn(
                      'Returning fallback response for CoinGecko request',
                    );
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(
                      JSON.stringify({
                        error: true,
                        status: 503,
                        message: useMockData
                          ? 'Using mock data. Backend connection not required.'
                          : 'Backend service unavailable. Please ensure the backend server is running or enable mock data in the admin UI.',
                        code: err.code || 'ECONNREFUSED',
                        fallback: true,
                        useMockData: useMockData,
                      }),
                    );
                  } else if (req.url?.includes('/proxy/binance-testnet')) {
                    console.warn(
                      'Returning fallback response for Binance Testnet request',
                    );
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(
                      JSON.stringify({
                        error: true,
                        status: 503,
                        message: useMockData
                          ? 'Using mock data. Backend connection not required.'
                          : 'Backend service unavailable. Please ensure the backend server is running or enable mock data in the admin UI.',
                        code: err.code || 'ECONNREFUSED',
                        fallback: true,
                        useMockData: useMockData,
                      }),
                    );
                  } else {
                    // Generic error for other API requests
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(
                      JSON.stringify({
                        error: true,
                        message: useMockData
                          ? 'Using mock data. Backend connection not required.'
                          : 'Backend service unavailable. Please ensure the backend server is running or enable mock data in the admin UI.',
                        useMockData: useMockData,
                        suggestion: 'Visit /admin/dev-settings to enable mock data mode',
                      }),
                    );
                  }
                }
              });

              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Proxying:', req.method, req.url);
              });
            },
          },
        }),
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Added Vitest config
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts', // Path to setup file
    css: true, // Optional: if you need CSS processing during tests
  },
}));
