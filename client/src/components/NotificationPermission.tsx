import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function NotificationPermission() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // Check if user has already made a decision
    const permission = Notification.permission;
    const dismissed = localStorage.getItem('notification-permission-dismissed');

    if (permission === 'default' && !dismissed) {
      // Show prompt after a delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // Wait 5 seconds before showing

      return () => clearTimeout(timer);
    }
  }, [user]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUser = async () => {
    try {
      setIsSubscribing(true);

      // Request notification permission with timeout
      // On some mobile browsers, if user dismisses the popup, the promise hangs
      const permissionPromise = Notification.requestPermission();
      const timeoutPromise = new Promise<NotificationPermission>((_, reject) => {
        setTimeout(() => reject(new Error('Permission request timed out')), 10000); // 10 seconds
      });
      
      const permission = await Promise.race([permissionPromise, timeoutPromise]).catch((error) => {
        // If timeout or error, treat as denied
        console.error('Permission request error:', error);
        return 'denied' as NotificationPermission;
      });

      if (permission !== 'granted') {
        toast({
          variant: 'destructive',
          title: language === 'ar' ? 'تم الرفض' : 'Permission Denied',
          description: language === 'ar'
            ? 'لن تتلقى إشعارات فورية'
            : 'You will not receive push notifications',
        });
        setShowPrompt(false);
        localStorage.setItem('notification-permission-dismissed', 'true');
        setIsSubscribing(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const vapidResponse = await fetch('/api/push/vapid-public-key');
      if (!vapidResponse.ok) {
        throw new Error('Failed to fetch VAPID key');
      }
      const { publicKey } = await vapidResponse.json();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      await apiRequest('POST', '/api/push/subscribe', {
        subscription: subscription.toJSON(),
      });

      toast({
        title: language === 'ar' ? 'تم التفعيل' : 'Enabled',
        description: language === 'ar'
          ? 'سوف تتلقى إشعارات فورية الآن'
          : 'You will now receive push notifications',
      });

      setShowPrompt(false);
      setIsSubscribing(false);
    } catch (error: any) {
      console.error('Notification subscription failed:', error);
      
      // Provide more specific error messages
      let errorMessage = language === 'ar'
        ? 'فشل تفعيل الإشعارات'
        : 'Failed to enable notifications';
      
      if (error.message?.includes('VAPID')) {
        errorMessage = language === 'ar'
          ? 'خطأ في تكوين الخادم'
          : 'Server configuration error';
      } else if (error.message?.includes('subscription')) {
        errorMessage = language === 'ar'
          ? 'فشل الاشتراك في الإشعارات'
          : 'Subscription failed';
      }

      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: errorMessage,
      });
      
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-permission-dismissed', 'true');
  };

  if (!showPrompt || !user) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <Card className="shadow-2xl border-2 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                {language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {language === 'ar'
                  ? 'احصل على تحديثات فورية عن طلباتك وعروض الأسعار'
                  : 'Get instant updates about your orders and price offers'}
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={subscribeUser} 
                  size="sm" 
                  className="flex-1"
                  disabled={isSubscribing}
                  data-testid="button-enable-notifications"
                >
                  <Bell className="w-4 h-4 mr-1" />
                  {isSubscribing 
                    ? (language === 'ar' ? 'جاري التفعيل...' : 'Enabling...')
                    : (language === 'ar' ? 'تفعيل' : 'Enable')
                  }
                </Button>
                <Button 
                  onClick={handleDismiss} 
                  size="sm" 
                  variant="outline"
                  disabled={isSubscribing}
                  data-testid="button-dismiss-notifications"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
