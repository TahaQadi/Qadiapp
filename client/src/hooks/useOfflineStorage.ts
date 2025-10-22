
import { useState, useEffect } from 'react';

interface OfflineQueueItem<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'lta-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-actions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial count
    getPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPendingCount = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => {
        setPendingCount(request.result);
      };
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  };

  const addToQueue = async <T,>(type: string, data: T): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const item: OfflineQueueItem<T> = {
        id: `${type}-${Date.now()}-${Math.random()}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      await getPendingCount();
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
      throw error;
    }
  };

  const removeFromQueue = async (id: string): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      await getPendingCount();
    } catch (error) {
      console.error('Failed to remove from queue:', error);
    }
  };

  const getAllPending = async (): Promise<OfflineQueueItem[]> => {
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get pending items:', error);
      return [];
    }
  };

  const syncPendingActions = async () => {
    if (!navigator.onLine) return;

    const items = await getAllPending();

    for (const item of items) {
      try {
        // Handle different action types
        switch (item.type) {
          case 'order':
            // Sync order to server
            await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            });
            break;
          // Add more action types as needed
        }

        // Remove from queue on success
        await removeFromQueue(item.id);
      } catch (error) {
        console.error('Failed to sync item:', item.id, error);
        // Could implement retry logic here
      }
    }
  };

  return {
    isOnline,
    pendingCount,
    addToQueue,
    removeFromQueue,
    getAllPending,
    syncPendingActions,
  };
}
