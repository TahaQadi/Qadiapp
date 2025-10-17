# PWA Features - Setup & Testing Guide

## ✅ Fixed Issues
The service worker and manifest files are now properly configured and accessible at:
- `/sw.js` (Service Worker)
- `/manifest.json` (PWA Manifest)
- `/offline.html` (Offline fallback page)
- `/logo.png` (App icon)

## 📱 Install App Prompt

### When It Shows:
The "Install App" prompt appears automatically when:
1. **On mobile devices only** (Android Chrome/Edge, iOS Safari 16.4+)
2. The app meets PWA installation criteria
3. User hasn't dismissed it before (stored in localStorage)

### How to Test:
**On Android:**
1. Open the app in Chrome or Edge browser
2. The install prompt should appear at the bottom of the screen
3. Tap "Install" to add the app to your home screen

**On iOS (Safari):**
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

**Manual Trigger (Desktop Testing):**
```javascript
// Open browser console and run:
window.dispatchEvent(new Event('beforeinstallprompt'))
```

### To Reset the Prompt:
```javascript
// Open browser console and run:
localStorage.removeItem('pwa-install-dismissed')
// Then refresh the page
```

## 🔔 Notification Permission Prompt

### When It Shows:
The notification prompt appears automatically when:
1. **User is logged in** (not shown on login page)
2. **After 5 seconds** of being on any page (delay to avoid interrupting)
3. Browser supports notifications
4. User hasn't already granted/denied permission
5. User hasn't dismissed it before (stored in localStorage)

### How to Test:
1. **Login** to the application (e.g., `taha@qadi.ps`)
2. **Wait 5 seconds** - the prompt will appear at the bottom
3. Click "Enable" to grant notification permission
4. Check browser console for confirmation

### To Reset the Prompt:
```javascript
// Option 1: Clear localStorage
localStorage.removeItem('notification-permission-dismissed')

// Option 2: Reset browser notification permission
// Chrome: Site settings → Notifications → Reset
// Firefox: Page Info → Permissions → Notifications → Reset
// Then refresh the page
```

### To Test Push Notifications:
Once enabled, you can send a test notification via the API:
```bash
curl -X POST http://localhost:5000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test push notification",
    "url": "/"
  }'
```

## 🔍 Troubleshooting

### Service Worker Not Registering
**Check browser console for errors:**
```javascript
// Should see: "SW registered: ServiceWorkerRegistration"
// If you see: "SW registration failed:" - check the error details
```

**Common causes:**
- Not using HTTPS (service workers require secure context)
- Browser doesn't support service workers
- Files not accessible (check `/sw.js` loads correctly)

**To manually check:**
```javascript
// Open browser console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered service workers:', registrations);
});
```

### Prompts Not Showing
**Install Prompt:**
- ✅ Works: Android Chrome/Edge, Desktop Chrome/Edge (in some cases)
- ❌ Doesn't work: Desktop browsers (by design), iOS Safari (use manual install)

**Notification Prompt:**
- Make sure you're logged in
- Wait at least 5 seconds after page load
- Check localStorage: `localStorage.getItem('notification-permission-dismissed')`
- Check notification permission: `Notification.permission` (should be 'default')

### Clear All PWA Data
```javascript
// Run in browser console:
localStorage.removeItem('pwa-install-dismissed');
localStorage.removeItem('notification-permission-dismissed');
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
// Then refresh the page
```

## 📊 Verify PWA Features

### Check PWA Installation Criteria
**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Manifest" - verify all fields load correctly
4. Click "Service Workers" - verify worker is registered and active

### Test Offline Functionality
1. Install the PWA on your device
2. Open DevTools → Network tab
3. Check "Offline" mode
4. Navigate the app - should show offline page or cached content

### Test Push Notifications
1. Enable notifications via the prompt
2. Check DevTools → Application → Push Messaging
3. Send a test notification via API
4. Notification should appear even when app is closed

## 🎯 Production Checklist

Before deploying to production:
- [ ] HTTPS is enabled (required for service workers)
- [ ] All PWA files accessible (`/sw.js`, `/manifest.json`, `/logo.png`)
- [ ] VAPID keys are set as environment variables
- [ ] Notification permission prompt appears for logged-in users
- [ ] Install prompt appears on mobile devices
- [ ] App installs successfully from home screen
- [ ] Push notifications work when app is closed
- [ ] Offline page loads when network is unavailable
- [ ] App icons display correctly on all devices

## 📱 User Experience Flow

### First Time User (Mobile):
1. Opens app in browser
2. Sees install prompt after browsing → Installs to home screen
3. Logs in
4. Sees notification prompt after 5 seconds → Enables notifications
5. Receives push notifications about orders/modifications

### Returning User:
1. Opens installed PWA from home screen
2. Already has notifications enabled
3. Receives instant updates
4. Can use app offline (cached content)

## 🔗 Testing URLs

- Main app: `http://localhost:5000/`
- Service worker: `http://localhost:5000/sw.js`
- Manifest: `http://localhost:5000/manifest.json`
- Offline page: `http://localhost:5000/offline.html`
- VAPID public key: `http://localhost:5000/api/push/vapid-public-key`

## 💡 Tips

1. **Desktop testing**: PWA features are limited on desktop. Use mobile device or Chrome DevTools device emulation.

2. **iOS limitations**: iOS requires manual "Add to Home Screen" - the automatic prompt doesn't work.

3. **Development mode**: Some PWA features may behave differently in development vs production.

4. **Notification timing**: 5-second delay is intentional to avoid interrupting user login flow.

5. **Prompt dismissal**: Users can permanently dismiss prompts, so test with cleared localStorage.
