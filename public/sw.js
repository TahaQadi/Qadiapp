// Service Worker Version - increment when updating caching strategy
const CACHE_VERSION = 'v2';
const CACHE_NAME = `alqadi-${CACHE_VERSION}`;

// Separate caches for different resource types
const STATIC_CACHE = `${CACHE_NAME}-static`;
const API_CACHE = `${CACHE_NAME}-api`;
const HTML_CACHE = `${CACHE_NAME}-html`;

// URLs to precache on install
const urlsToPrecache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/logo.png'
];

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  STATIC: 365 * 24 * 60 * 60 * 1000, // 1 year for hashed assets
  API: 5 * 60 * 1000, // 5 minutes for API responses
  HTML: 0, // Always revalidate HTML
};

// Helper: Check if request is for static asset (hashed JS/CSS/images)
function isStaticAsset(url) {
  const staticPatterns = [
    /\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|webp|ico)$/i,
    /\/assets\//,
    /\/static\//,
  ];
  return staticPatterns.some(pattern => pattern.test(url));
}

// Helper: Check if request is for API
function isAPIRequest(url) {
  return url.includes('/api/');
}

// Helper: Check if request is HTML
function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html') || 
         request.url.endsWith('/') || 
         !request.url.includes('.');
}

// Cache-first strategy for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    // If network fails and no cache, return offline page for navigation requests
    if (isHTMLRequest(request)) {
      const offlinePage = await cache.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    throw error;
  }
}

// Network-first with cache fallback for API requests
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache).then(() => {
        // Set expiration timestamp in metadata
        setTimeout(() => {
          cache.delete(request);
        }, CACHE_TTL.API);
      });
    }
    
    return response;
  } catch (error) {
    // Fallback to cache if network fails
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale-while-revalidate for HTML
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Start fetching fresh content in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    return response;
  }).catch(() => null);
  
  // Return cached version immediately if available
  if (cached) {
    return cached;
  }
  
  // Otherwise wait for network
  const response = await fetchPromise;
  if (response) {
    return response;
  }
  
  // Last resort: offline page
  const offlinePage = await cache.match('/offline.html');
  if (offlinePage) return offlinePage;
  
  throw new Error('Offline and no cache available');
}

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(urlsToPrecache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all caches that don't match current version
          if (!cacheName.startsWith(`alqadi-${CACHE_VERSION}`)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - route requests to appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests (except we might want to handle POST for offline later)
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    (async () => {
      const url = request.url;
      
      // Static assets: cache-first strategy
      if (isStaticAsset(url)) {
        return cacheFirst(request, STATIC_CACHE);
      }
      
      // API requests: network-first with cache fallback
      if (isAPIRequest(url)) {
        return networkFirst(request, API_CACHE);
      }
      
      // HTML requests: stale-while-revalidate
      if (isHTMLRequest(request)) {
        return staleWhileRevalidate(request, HTML_CACHE);
      }
      
      // Default: network-first
      return networkFirst(request, STATIC_CACHE);
    })().catch(() => {
      // Final fallback: offline page
      return caches.match('/offline.html');
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Al Qadi Portal';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/',
      ...data.data
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Get pending orders from IndexedDB and sync with server
  // This will be implemented when needed
  return Promise.resolve();
}
