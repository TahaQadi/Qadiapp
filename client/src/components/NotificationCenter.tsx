import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2, X, Package, ExternalLink, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from './LanguageProvider';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

interface Notification {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  isRead: boolean;
  metadata?: string;
  pdfFileName?: string | null;
  actionUrl?: string | null;
  actionType?: 'view_order' | 'review_request' | 'download_pdf' | 'view_request' | null;
  createdAt: string;
}

interface NotificationCenterProps {
  variant?: 'default' | 'sidebar';
}

export function NotificationCenter({ variant = 'default' }: NotificationCenterProps = {}) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch notifications and their unread count
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/client/notifications'],
    staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
    gcTime: 1000 * 60 * 10,  // Garbage collect after 10 minutes if not used
  });

  // Mutation to mark a single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('PATCH', `/api/client/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications/unread-count'] });
    },
  });

  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', '/api/client/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications/unread-count'] });
    },
  });

  // Mutation to delete a notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/client/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications/unread-count'] });
    },
  });

  // Get the appropriate icon for a notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_created':
        return '🛒';
      case 'order_status_changed':
        return '📦';
      default:
        return '🔔';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS,
    });
  };

  // Handle action button click
  const handleActionClick = (notification: Notification) => {
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setOpen(false);
      // Mark as read when action is taken
      if (!notification.isRead) {
        markAsReadMutation.mutate(notification.id);
      }
    }
  };

  // Get action button configuration
  const getActionButton = (notification: Notification) => {
    if (!notification.actionType || !notification.actionUrl) return null;

    const configs = {
      view_order: {
        icon: Eye,
        textEn: 'View Order',
        textAr: 'عرض الطلب',
      },
      review_request: {
        icon: ExternalLink,
        textEn: 'Review',
        textAr: 'مراجعة',
      },
      download_pdf: {
        icon: Download,
        textEn: 'Download',
        textAr: 'تنزيل',
      },
      view_request: {
        icon: Eye,
        textEn: 'View',
        textAr: 'عرض',
      },
    };

    const config = configs[notification.actionType];
    if (!config) return null;

    const Icon = config.icon;
    return {
      icon: Icon,
      text: language === 'ar' ? config.textAr : config.textEn,
    };
  };

  // Effect for polling notification unread count
  // This replaces the refetchInterval on the useQuery hook for better control
  // and to implement visibility and error handling.
  const unreadCountQuery = useQuery<{ count: number }>({
    queryKey: ['/api/client/notifications/unread-count'],
    staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
    gcTime: 1000 * 60 * 10,  // Garbage collect after 10 minutes if not used
  });

  useEffect(() => {
    // Assume 'user' object is available in the component's scope if needed for authentication checks
    // For this example, we'll assume it's always okay to poll if the component is mounted.
    // If 'user' is indeed required, uncomment the `if (!user) return;` line.
    // const user = getUserFromAuth(); // Replace with actual user retrieval logic

    // if (!user) return; // Only poll if user is authenticated

    let mounted = true;
    const interval = setInterval(() => {
      // Poll only if the tab is visible and the component is mounted
      if (mounted && document.visibilityState === 'visible') {
        unreadCountQuery.refetch().catch(err => {
          console.error('Failed to refresh notification count:', err);
        });
      }
    }, 30000); // Poll every 30 seconds

    // Re-fetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        unreadCountQuery.refetch().catch(err => {
          console.error('Failed to refresh notification count:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function to clear interval and remove event listener
    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [unreadCountQuery]); // Dependency array includes unreadCountQuery to ensure it's reactive

  // Render sidebar variant
  if (variant === 'sidebar') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 text-sm relative"
          >
            <Bell className="h-4 w-4" />
            <span>{language === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
            {(unreadCountQuery.data?.count || 0) > 0 && (
              <Badge 
                variant="destructive" 
                className="ms-auto h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center text-xs font-semibold animate-pulse"
              >
                {unreadCountQuery.data.count > 99 ? '99+' : unreadCountQuery.data.count}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">
              {language === 'ar' ? 'الإشعارات' : 'Notifications'}
            </h3>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.isRead) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-muted/50 transition-colors',
                      !notification.isRead && 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm">
                            {language === 'ar' ? notification.titleAr : notification.titleEn}
                          </h4>
                          {!notification.isRead && (
                            <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' ? notification.messageAr : notification.messageEn}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {notification.pdfFileName && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/api/pdf/download/${notification.pdfFileName}`, '_blank');
                              }}
                            >
                              <Package className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'تنزيل PDF' : 'Download PDF'}
                            </Button>
                          )}
                          {(() => {
                            const actionButton = getActionButton(notification);
                            if (!actionButton) return null;
                            const Icon = actionButton.icon;
                            return (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionClick(notification);
                                }}
                              >
                                <Icon className="h-4 w-4 me-2" />
                                {actionButton.text}
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                          disabled={deleteNotificationMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  }

  // Render default variant (e.g., for header icon)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-10 w-10 rounded-full hover:bg-primary/10 hover:border-primary transition-all duration-300 shadow-sm">
          <Bell className="h-5 w-5" />
          {(unreadCountQuery.data?.count || 0) > 0 && (
            <span
              className="absolute -top-1 -end-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center rounded-full text-xs font-semibold bg-destructive text-destructive-foreground shadow-lg animate-pulse"
            >
              {unreadCountQuery.data.count > 99 ? '99+' : unreadCountQuery.data.count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h3>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-muted/50 transition-colors',
                    !notification.isRead && 'bg-muted/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">
                          {language === 'ar' ? notification.titleAr : notification.titleEn}
                        </h4>
                        {!notification.isRead && (
                          <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? notification.messageAr : notification.messageEn}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {notification.pdfFileName && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/api/pdf/download/${notification.pdfFileName}`, '_blank');
                            }}
                          >
                            <Package className="h-4 w-4 me-2" />
                            {language === 'ar' ? 'تنزيل PDF' : 'Download PDF'}
                          </Button>
                        )}
                        {(() => {
                          const actionButton = getActionButton(notification);
                          if (!actionButton) return null;
                          const Icon = actionButton.icon;
                          return (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(notification);
                              }}
                            >
                              <Icon className="h-4 w-4 me-2" />
                              {actionButton.text}
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}