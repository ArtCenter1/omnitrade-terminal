/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path for GitHub Pages deployment
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: '::',
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Your backend server (default port)
        changeOrigin: true,
        // Add error handling for proxy
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);

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
                    message:
                      'Backend service unavailable. Please ensure the backend server is running.',
                    code: err.code || 'ECONNREFUSED',
                    fallback: true,
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
                    message:
                      'Backend service unavailable. Please ensure the backend server is running.',
                    code: err.code || 'ECONNREFUSED',
                    fallback: true,
                  }),
                );
              } else {
                // Generic error for other API requests
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    error: true,
                    message:
                      'Backend service unavailable. Please ensure the backend server is running.',
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
