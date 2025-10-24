import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error.message || error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
