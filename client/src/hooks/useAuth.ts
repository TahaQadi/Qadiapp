import { useQuery } from "@tanstack/react-query";
import type { AuthUser } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = async () => {
    window.location.href = '/api/logout';
  };

  return {
    user: user ?? null,
    isLoading,
    error,
    logout,
    isAuthenticated: !!user,
  };
}