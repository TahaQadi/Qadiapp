import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        const errorMessage = error?.message || '';
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (errorMessage.includes('429')) {
          return failureCount < 3; // Retry rate limit errors up to 3 times
        }
        if (errorMessage.match(/4\d\d/)) {
          return false; // Don't retry other 4xx errors
        }
        
        // Retry server errors (5xx) up to 3 times
        if (errorMessage.match(/5\d\d/)) {
          return failureCount < 3;
        }
        
        // Retry network errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex, error: any) => {
        const errorMessage = error?.message || '';
        
        // For rate limit errors, use Retry-After header if available
        if (errorMessage.includes('429')) {
          // Extract retry-after from error message if present
          const retryAfterMatch = errorMessage.match(/retry.*?(\d+)/i);
          if (retryAfterMatch) {
            return parseInt(retryAfterMatch[1]) * 1000;
          }
        }
        
        // Exponential backoff: 1s, 2s, 4s, 8s, capped at 30s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        const errorMessage = error?.message || '';
        
        // Retry rate limit errors for mutations
        if (errorMessage.includes('429')) {
          return failureCount < 2;
        }
        
        // Retry server errors for mutations
        if (errorMessage.match(/5\d\d/)) {
          return failureCount < 1; // Only retry once for mutations
        }
        
        return false; // Don't retry other errors for mutations
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      gcTime: 5 * 60 * 1000,
    },
  },
});

// Granular cache strategies by data type
export const cacheStrategies = {
  // Static/rarely changing data - increased staleTime for better caching
  products: {
    staleTime: 30 * 60 * 1000, // 30 minutes (increased from 15)
    gcTime: 60 * 60 * 1000, // 1 hour (increased from 30 minutes)
  },
  categories: {
    staleTime: 60 * 60 * 1000, // 1 hour (increased from 30 minutes)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours (increased from 1 hour)
  },
  vendors: {
    staleTime: 30 * 60 * 1000, // 30 minutes (increased from 10)
    gcTime: 60 * 60 * 1000, // 1 hour (increased from 20 minutes)
  },
  
  // Semi-dynamic data
  clients: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  templates: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  },
  
  // Frequently changing data
  orders: {
    staleTime: 1 * 60 * 1000, // 1 minute - more frequent updates for admin
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  },
  modifications: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  },
  
  // Real-time data
  notifications: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
  },
  
  // User-specific data
  profile: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
};

// Prefetch common queries with optimized strategies
export const prefetchCommonQueries = async () => {
  const prefetchPromises = [
    queryClient.prefetchQuery({
      queryKey: ['/api/products'],
      ...cacheStrategies.products,
    }),
    queryClient.prefetchQuery({
      queryKey: ['/api/categories'],
      ...cacheStrategies.categories,
    }),
  ];
  
  await Promise.allSettled(prefetchPromises);
};

// Invalidate specific cache patterns
export const invalidateCachePattern = (pattern: string) => {
  queryClient.invalidateQueries({
    predicate: (query) => 
      query.queryKey.some((key) => 
        typeof key === 'string' && key.includes(pattern)
      ),
  });
};

// Initialize cache persistence (call this in App.tsx)
export async function initializeCachePersistence(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const { restoreQueryCache, setupCachePersistence } = await import('./queryCachePersistence');
    
    // Restore cache on app startup
    await restoreQueryCache(queryClient);
    
    // Setup automatic persistence
    setupCachePersistence(queryClient);
  } catch (error) {
    console.warn('Failed to initialize cache persistence:', error);
  }
}