/**
 * React Query Cache Persistence
 * Persists query cache to localStorage/IndexedDB for offline support
 */

import { QueryClient } from "@tanstack/react-query";

const CACHE_KEY = "alqadi-query-cache";
const CACHE_VERSION = "v1";
const STORAGE_KEY = `${CACHE_KEY}-${CACHE_VERSION}`;

// Queries that should NOT be persisted (sensitive data)
const EXCLUDE_PATTERNS = [
  "/api/auth/",
  "/api/user/profile",
  "/api/admin/",
];

// Check if a query key should be persisted
function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const keyString = queryKey.join("/");
  return !EXCLUDE_PATTERNS.some((pattern) => keyString.includes(pattern));
}

// Storage interface for cache persistence
interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// IndexedDB storage adapter (preferred for large cache)
class IndexedDBStorage implements StorageAdapter {
  private dbName = "alqadi-cache";
  private storeName = "queryCache";

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          resolve(request.result || null);
        };
      });
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch {
      // Fallback to localStorage if IndexedDB fails
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch {
      // Fallback to localStorage if IndexedDB fails
    }
  }
}

// LocalStorage adapter (fallback)
class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage quota exceeded or unavailable
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
}

// Get the best available storage adapter
function getStorageAdapter(): StorageAdapter {
  if (typeof indexedDB !== "undefined") {
    return new IndexedDBStorage();
  }
  return new LocalStorageAdapter();
}

const storage = getStorageAdapter();

/**
 * Save query cache to persistent storage
 */
export async function persistQueryCache(queryClient: QueryClient): Promise<void> {
  try {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    // Filter and serialize queries
    const cacheData: Record<string, unknown> = {};
    for (const query of queries) {
      const queryKey = query.queryKey;
      if (shouldPersistQuery(queryKey)) {
        const key = JSON.stringify(queryKey);
        cacheData[key] = {
          data: query.state.data,
          dataUpdatedAt: query.state.dataUpdatedAt,
          status: query.state.status,
        };
      }
    }

    // Store with timestamp
    const cacheWithMeta = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      queries: cacheData,
    };

    await storage.setItem(STORAGE_KEY, JSON.stringify(cacheWithMeta));
  } catch (error) {
    console.warn("Failed to persist query cache:", error);
  }
}

/**
 * Restore query cache from persistent storage
 */
export async function restoreQueryCache(queryClient: QueryClient): Promise<void> {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (!stored) return;

    const cacheWithMeta = JSON.parse(stored);

    // Validate cache version
    if (cacheWithMeta.version !== CACHE_VERSION) {
      await storage.removeItem(STORAGE_KEY);
      return;
    }

    // Check if cache is too old (older than 7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - cacheWithMeta.timestamp > maxAge) {
      await storage.removeItem(STORAGE_KEY);
      return;
    }

    // Restore queries
    const queries = Object.entries(cacheWithMeta.queries || {});
    for (const [keyStr, queryData] of queries) {
      try {
        const queryKey = JSON.parse(keyStr);
        queryClient.setQueryData(queryKey, (queryData as { data: unknown }).data);
      } catch {
        // Skip invalid query keys
      }
    }
  } catch (error) {
    console.warn("Failed to restore query cache:", error);
    // Clear corrupted cache
    await storage.removeItem(STORAGE_KEY);
  }
}

/**
 * Clear persisted cache
 */
export async function clearPersistedCache(): Promise<void> {
  try {
    await storage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear persisted cache:", error);
  }
}

/**
 * Setup automatic cache persistence
 */
export function setupCachePersistence(queryClient: QueryClient): () => void {
  // Persist cache on mutations
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === "updated") {
      // Debounce persistence to avoid too frequent writes
      setTimeout(() => {
        persistQueryCache(queryClient);
      }, 1000);
    }
  });

  // Persist on visibility change (before page unload)
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      persistQueryCache(queryClient);
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Persist on page unload
  const handleBeforeUnload = () => {
    persistQueryCache(queryClient);
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  // Return cleanup function
  return () => {
    unsubscribe();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}

