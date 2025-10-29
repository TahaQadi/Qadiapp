import { Router } from 'express';
import webpush from 'web-push';
import { storage } from './storage';
import { z } from 'zod';

const router = Router();

// TypeScript interfaces for push notifications
interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

interface SendNotificationResult {
  success: boolean;
  endpoint: string;
  error?: string;
}

// VAPID keys for push notifications - MUST be set in environment variables
// Generate using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@alqadi.ps';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('❌ VAPID keys not configured! Push notifications will not work.');
  console.error('Generate keys with: npx web-push generate-vapid-keys');
  console.error('Then set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your environment variables.');
}

// Configure web-push only if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

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
  } catch (error) {
    const err = error as Error;
    console.error('Error saving push subscription:', err);
    res.status(400).json({ message: err.message || 'Failed to save subscription' });
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
  } catch (error) {
    const err = error as Error;
    console.error('Error unsubscribing:', err);
    res.status(500).json({ message: err.message || 'Failed to unsubscribe' });
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
      subscriptions.map(async (sub: PushSubscriptionData): Promise<SendNotificationResult> => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: sub.keys,
          }, payload);
          return { success: true, endpoint: sub.endpoint };
        } catch (error) {
          const err = error as { statusCode?: number; message: string };
          // If subscription is invalid or expired, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await storage.deletePushSubscription(sub.endpoint);
          }
          return { success: false, endpoint: sub.endpoint, error: err.message };
        }
      })
    );

    const successful = results.filter((r): r is PromiseFulfilledResult<SendNotificationResult> => 
      r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.length - successful;

    res.json({
      message: `Notifications sent: ${successful} successful, ${failed} failed`,
      results: results.map((r) => 
        r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }
      ),
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error sending push notification:', err);
    res.status(500).json({ message: err.message || 'Failed to send notification' });
  }
});

export default router;
