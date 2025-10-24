import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@db/schema';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterCredentials extends LoginCredentials {
  nameEn: string;
  nameAr?: string;
  phone?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['auth-user'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!res.ok) {
          if (res.status === 401) return null;
          throw new Error('Failed to fetch user');
        }
        return res.json();
      } catch (error) {
        console.error('Auth check failed:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const logout = async () => {
    window.location.href = '/api/logout';
  };

  return {
    user: user ?? null,
    isLoading,
    logout,
    isAuthenticated: !!user,
  };
}