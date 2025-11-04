import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from './LanguageProvider';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { NotificationItem } from './notifications/NotificationItem';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
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
  const { toast } = useToast();

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
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/client/notifications'] });
      
      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(['/api/client/notifications']);
      
      // Optimistically update to the new value
      queryClient.setQueryData<Notification[]>(['/api/client/notifications'], (old) => 
        old?.map((n) => n.id === id ? { ...n, isRead: true } : n) || []
      );
      
      // Update unread count
      const previousCount = queryClient.getQueryData<{ count: number }>(['/api/client/notifications/unread-count']);
      queryClient.setQueryData<{ count: number }>(['/api/client/notifications/unread-count'], (old) => ({
        count: Math.max(0, (old?.count || 0) - 1)
      }));
      
      // Return context with previous values
      return { previousNotifications, previousCount };
    },
    onError: (error: Error, id: string, context: any) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['/api/client/notifications'], context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(['/api/client/notifications/unread-count'], context.previousCount);
      }
      
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تعليم الإشعار كمقروء' : 'Failed to mark notification as read',
      });
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
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
      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description: language === 'ar' ? 'تم تعليم جميع الإشعارات كمقروءة' : 'All notifications marked as read',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تعليم الإشعارات كمقروءة' : 'Failed to mark all notifications as read',
      });
    },
  });

  // Mutation to delete a notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/client/notifications/${id}`);
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/client/notifications'] });
      
      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(['/api/client/notifications']);
      
      // Check if the notification being deleted is unread
      const notification = previousNotifications?.find(n => n.id === id);
      const wasUnread = notification && !notification.isRead;
      
      // Optimistically remove the notification
      queryClient.setQueryData<Notification[]>(['/api/client/notifications'], (old) => 
        old?.filter((n) => n.id !== id) || []
      );
      
      // Update unread count if notification was unread
      const previousCount = queryClient.getQueryData<{ count: number }>(['/api/client/notifications/unread-count']);
      if (wasUnread) {
        queryClient.setQueryData<{ count: number }>(['/api/client/notifications/unread-count'], (old) => ({
          count: Math.max(0, (old?.count || 0) - 1)
        }));
      }
      
      // Return context with previous values
      return { previousNotifications, previousCount };
    },
    onError: (error: Error, id: string, context: any) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['/api/client/notifications'], context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(['/api/client/notifications/unread-count'], context.previousCount);
      }
      
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل حذف الإشعار' : 'Failed to delete notification',
      });
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications/unread-count'] });
    },
  });

  // Mutation to delete all read notifications
  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/client/notifications/read/all');
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications/unread-count'] });
      const count = data?.count || 0;
      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description: language === 'ar' 
          ? `تم حذف ${count} إشعار مقروء` 
          : `Deleted ${count} read notification${count !== 1 ? 's' : ''}`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل حذف الإشعارات المقروءة' : 'Failed to delete read notifications',
      });
    },
  });

  // Skeleton loader for notifications
  const NotificationSkeleton = () => (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );

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
          aria-label={
            language === 'ar' 
              ? `الإشعارات${(unreadCountQuery.data?.count || 0) > 0 ? `، ${unreadCountQuery.data?.count} غير مقروء` : ''}`
              : `Notifications${(unreadCountQuery.data?.count || 0) > 0 ? `, ${unreadCountQuery.data?.count} unread` : ''}`
          }
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {(unreadCountQuery.data?.count || 0) > 0 && unreadCountQuery.data && (
            <Badge 
              variant="destructive" 
              className="ms-auto h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center text-xs font-semibold"
              style={{ animation: 'pulse-slow 5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
              aria-label={language === 'ar' ? `${unreadCountQuery.data.count} غير مقروء` : `${unreadCountQuery.data.count} unread`}
            >
              {unreadCountQuery.data.count > 99 ? '99+' : unreadCountQuery.data.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold" id="notification-header">
              {language === 'ar' ? 'الإشعارات' : 'Notifications'}
            </h3>
            <div className="flex items-center gap-1" role="toolbar" aria-label={language === 'ar' ? 'أدوات الإشعارات' : 'Notification controls'}>
              {notifications.some(n => !n.isRead) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  title={language === 'ar' ? 'تعليم الكل كمقروء' : 'Mark all as read'}
                  aria-label={language === 'ar' ? 'تعليم جميع الإشعارات كمقروءة' : 'Mark all notifications as read'}
                >
                  <CheckCheck className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              {notifications.some(n => n.isRead) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAllReadMutation.mutate()}
                  disabled={deleteAllReadMutation.isPending}
                  title={language === 'ar' ? 'حذف جميع المقروءة' : 'Delete all read'}
                  aria-label={language === 'ar' ? 'حذف جميع الإشعارات المقروءة' : 'Delete all read notifications'}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                title={language === 'ar' ? 'إغلاق' : 'Close'}
                aria-label={language === 'ar' ? 'إغلاق الإشعارات' : 'Close notifications'}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <NotificationSkeleton />
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center" role="status" aria-live="polite">
                <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div 
                className="divide-y" 
                role="feed" 
                aria-labelledby="notification-header"
                aria-busy={isLoading}
                aria-live="polite"
              >
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    language={language}
                    onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                    onDelete={(id) => deleteNotificationMutation.mutate(id)}
                    onActionClick={handleActionClick}
                    isMarkingAsRead={markAsReadMutation.isPending}
                    isDeleting={deleteNotificationMutation.isPending}
                  />
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
        <Button 
          variant="outline" 
          size="icon" 
          className="relative h-10 w-10 rounded-full hover:bg-primary/10 hover:border-primary transition-all duration-300 shadow-sm"
          aria-label={
            language === 'ar' 
              ? `الإشعارات${(unreadCountQuery.data?.count || 0) > 0 ? `، ${unreadCountQuery.data?.count} غير مقروء` : ''}`
              : `Notifications${(unreadCountQuery.data?.count || 0) > 0 ? `, ${unreadCountQuery.data?.count} unread` : ''}`
          }
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {(unreadCountQuery.data?.count || 0) > 0 && unreadCountQuery.data && (
            <span
              className="absolute -top-1 -end-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center rounded-full text-xs font-semibold bg-destructive text-destructive-foreground shadow-lg"
              style={{ animation: 'pulse-slow 5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
              aria-label={language === 'ar' ? `${unreadCountQuery.data.count} غير مقروء` : `${unreadCountQuery.data.count} unread`}
            >
              {unreadCountQuery.data.count > 99 ? '99+' : unreadCountQuery.data.count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold" id="notification-header-default">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h3>
          <div className="flex items-center gap-1" role="toolbar" aria-label={language === 'ar' ? 'أدوات الإشعارات' : 'Notification controls'}>
            {notifications.some(n => !n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                title={language === 'ar' ? 'تعليم الكل كمقروء' : 'Mark all as read'}
                aria-label={language === 'ar' ? 'تعليم جميع الإشعارات كمقروءة' : 'Mark all notifications as read'}
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {notifications.some(n => n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAllReadMutation.mutate()}
                disabled={deleteAllReadMutation.isPending}
                title={language === 'ar' ? 'حذف جميع المقروءة' : 'Delete all read'}
                aria-label={language === 'ar' ? 'حذف جميع الإشعارات المقروءة' : 'Delete all read notifications'}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              title={language === 'ar' ? 'إغلاق' : 'Close'}
              aria-label={language === 'ar' ? 'إغلاق الإشعارات' : 'Close notifications'}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center" role="status" aria-live="polite">
              <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div 
              className="divide-y" 
              role="feed" 
              aria-labelledby="notification-header-default"
              aria-busy={isLoading}
              aria-live="polite"
            >
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  language={language}
                  onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                  onDelete={(id) => deleteNotificationMutation.mutate(id)}
                  onActionClick={handleActionClick}
                  isMarkingAsRead={markAsReadMutation.isPending}
                  isDeleting={deleteNotificationMutation.isPending}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}