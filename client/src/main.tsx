import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Service Worker registration with update detection
function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (import.meta.env.PROD) {
    // Production: Register service worker with update handling
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('✅ Service Worker registered successfully');

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available - prompt user to refresh
                console.log('🔄 New service worker available. Refresh to update.');
                
                // Optional: Show notification to user
                if (window.confirm('A new version is available. Refresh now?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          });

          // Handle controller change (service worker activated)
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              refreshing = true;
              window.location.reload();
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error.message || error);
        });
    });
  } else {
    // Development: Unregister any existing service workers to prevent conflicts
    window.addEventListener('load', async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('🔧 Unregistered service worker in development mode');
        }
      } catch (error) {
        console.warn('Failed to unregister service workers:', error);
      }
    });
  }
}

// Initialize service worker
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
