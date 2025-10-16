// Based on blueprint: javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id: string; // Company/Client ID (for backwards compatibility with existing routes)
  userId?: string; // Company User ID (for multi-user system)
  username: string;
  nameEn: string;
  nameAr: string;
  email?: string;
  phone?: string;
  isAdmin: boolean;
  companyId?: string; // Same as id, kept for clarity
  companyNameEn?: string;
  companyNameAr?: string;
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