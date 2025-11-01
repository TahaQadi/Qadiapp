import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA (only in production)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Production: Register service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully');
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error.message || error);
        });
    });
  } else {
    // Development: Unregister any existing service workers to prevent conflicts
    window.addEventListener('load', async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🔧 Unregistered service worker in development mode');
      }
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
