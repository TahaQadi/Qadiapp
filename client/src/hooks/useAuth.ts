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

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
