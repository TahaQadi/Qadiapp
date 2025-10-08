// Based on blueprint: javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id: number;
  username: string;
  nameEn: string;
  nameAr: string;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  profileImageUrl?: string | null;
}

// Renaming User to AuthUser to match the interface
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