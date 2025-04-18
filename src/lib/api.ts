import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Create an axios instance with default config
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    // Check if we're using a mock user in development mode
    if (
      process.env.NODE_ENV === 'development' &&
      localStorage.getItem('useMockUser') === 'true'
    ) {
      console.log('Using mock auth token for request:', config.url);
      config.headers.Authorization = 'Bearer mock-auth-token';
      return config;
    }

    // Regular Firebase auth flow
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    } else {
      console.warn(
        'No authenticated user found when making request to:',
        config.url,
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        console.error('Unauthorized request:', error.config?.url);
        console.error('Response:', error.response.data);

        // In development mode with mock user, try to help debug the issue
        if (
          process.env.NODE_ENV === 'development' &&
          localStorage.getItem('useMockUser') === 'true'
        ) {
          console.warn(
            'You are using a mock user in development mode. Make sure the backend is configured to accept mock tokens.',
          );
        }
      } else if (error.response.status === 403) {
        // Forbidden - user doesn't have permission
        console.error(
          'Forbidden request. You do not have permission:',
          error.config?.url,
        );
      } else {
        console.error(
          `Request failed with status ${error.response.status}:`,
          error.config?.url,
        );
        console.error('Response:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server:', error.config?.url);
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }

    return Promise.reject(error);
  },
);
