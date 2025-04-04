
import { useAuth as useAuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  const auth = useAuthContext();
  return auth;
};

export default useAuth;
