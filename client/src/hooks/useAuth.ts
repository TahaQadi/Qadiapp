import { useQuery } from "@tanstack/react-query";
import type { AuthUser } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
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