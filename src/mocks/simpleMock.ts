// src/mocks/simpleMock.ts

// Mock data for exchange API keys
let mockApiKeys = [
  {
    api_key_id: 'mock-key-1',
    exchange_id: 'kraken',
    key_nickname: 'Kraken Main',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_valid: true,
  },
  {
    api_key_id: 'mock-key-2',
    exchange_id: 'binance',
    key_nickname: 'Binance Artcenter1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_valid: true,
  },
  {
    api_key_id: 'mock-key-3',
    exchange_id: 'coinbase',
    key_nickname: 'Coinbase Pro',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_valid: true,
  },
  {
    api_key_id: 'sandbox-key',
    exchange_id: 'sandbox',
    key_nickname: '🔰 Demo Account',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_valid: true,
  },
];

// Mock data for users
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for roles
const mockRoles = [
  {
    id: '1',
    name: 'admin',
    description: 'Administrator with full access',
    permissions: ['read:all', 'write:all', 'delete:all'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'user',
    description: 'Regular user with limited access',
    permissions: ['read:own', 'write:own'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for permissions
const mockPermissions = [
  {
    id: '1',
    name: 'read:all',
    description: 'Read all resources',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'write:all',
    description: 'Write all resources',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'delete:all',
    description: 'Delete all resources',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'read:own',
    description: 'Read own resources',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'write:own',
    description: 'Write own resources',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Setup simple mock
export function setupSimpleMock() {
  // Try to load saved API keys from localStorage
  try {
    const savedKeys = localStorage.getItem('exchange_api_keys');
    if (savedKeys) {
      const parsedKeys = JSON.parse(savedKeys);
      if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
        console.log('Loaded saved API keys from localStorage:', parsedKeys);
        mockApiKeys = parsedKeys;
      }
    }
  } catch (error) {
    console.error('Error loading saved API keys:', error);
  }

  // Store a reference to the original fetch function
  // Make sure we don't override it if it's already been overridden
  const originalFetch = window.originalFetch || window.fetch;

  // Store the original fetch for other modules to use
  if (!window.originalFetch) {
    window.originalFetch = originalFetch;
  }

  // Override the fetch function
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const method = init?.method?.toUpperCase() || 'GET';

    console.log(`Simple mock intercepted: ${method} ${url}`);

    // Handle API endpoints
    if (url.includes('/api/')) {
      // Exchange API keys
      if (url === '/api/exchange-api-keys' && method === 'GET') {
        return mockResponse(mockApiKeys);
      }

      // Users
      if (url === '/api/users' && method === 'GET') {
        return mockResponse(mockUsers);
      }

      // Roles
      if (url === '/api/roles' && method === 'GET') {
        return mockResponse(mockRoles);
      }

      // Permissions
      if (url === '/api/permissions' && method === 'GET') {
        return mockResponse(mockPermissions);
      }
    }

    // Pass through to original fetch for all other requests
    return originalFetch(input, init);
  };

  console.log('Simple mock setup complete');
}

// Helper function to create a mock response
function mockResponse(data: any, status = 200, delay = 500) {
  return new Promise<Response>((resolve) => {
    setTimeout(() => {
      resolve(
        new Response(JSON.stringify(data), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }, delay);
  });
}
