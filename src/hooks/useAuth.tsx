
import { useAuth as useAuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};

// Default export removed to resolve HMR warning
