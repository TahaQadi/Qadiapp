import { Router } from 'express';
import webpush from 'web-push';
import { storage } from './storage';
import { z } from 'zod';

const router = Router();

// Generate VAPID keys (run once and store them)
// This will be set from environment variables in production
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEY6oHq8CqRGhF6K_xp3aZ4k-M8qO1NnQ2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'placeholder-private-key';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@alqadi.ps';

// Configure web-push
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = req.user!;
    const subscriptionSchema = z.object({
      endpoint: z.string(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
    });

    const { subscription } = req.body;
    const validatedSubscription = subscriptionSchema.parse(subscription);

    // Determine user type
    const userType = user.userId ? 'company_user' : 'client';
    const userId = user.userId || user.id;

    // Save subscription to database
    await storage.savePushSubscription({
      userId,
      userType,
      endpoint: validatedSubscription.endpoint,
      keys: validatedSubscription.keys,
      userAgent: req.headers['user-agent'] || null,
    });

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    res.status(400).json({ message: error.message || 'Failed to save subscription' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint required' });
    }

    await storage.deletePushSubscription(endpoint);

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error: any) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: error.message || 'Failed to unsubscribe' });
  }
});

// Send push notification (admin only or system triggered)
router.post('/send', async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId, title, body, url, tag } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ message: 'userId, title, and body are required' });
    }

    const subscriptions = await storage.getPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscriptions found for user' });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      tag: tag || 'notification',
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: { endpoint: string; keys: any }) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          }, payload);
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          // If subscription is invalid or expired, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await storage.deletePushSubscription(sub.endpoint);
          }
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter((r): r is PromiseFulfilledResult<{ success: true; endpoint: string }> => 
      r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.length - successful;

    res.json({
      message: `Notifications sent: ${successful} successful, ${failed} failed`,
      results: results.map((r: PromiseSettledResult<any>) => 
        r.status === 'fulfilled' ? r.value : { error: r.reason }
      ),
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ message: error.message || 'Failed to send notification' });
  }
});

export default router;
