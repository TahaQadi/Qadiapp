import { Check, Trash2, Package, Eye, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

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

interface NotificationItemProps {
  notification: Notification;
  language: 'en' | 'ar';
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onActionClick: (notification: Notification) => void;
  isMarkingAsRead: boolean;
  isDeleting: boolean;
}

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'order_created':
      return '🛒';
    case 'order_status_changed':
      return '📦';
    case 'order_modification_requested':
      return '✏️';
    case 'order_modification_reviewed':
      return '✅';
    case 'price_request':
      return '💰';
    case 'price_offer_ready':
      return '📊';
    case 'price_request_sent':
      return '📤';
    case 'issue_report':
      return '⚠️';
    case 'system':
      return '🔔';
    default:
      return '📬';
  }
};

const getActionButton = (
  notification: Notification,
  language: 'en' | 'ar'
): { icon: typeof Eye; text: string } | null => {
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

  return {
    icon: config.icon,
    text: language === 'ar' ? config.textAr : config.textEn,
  };
};

const formatDate = (dateString: string, language: 'en' | 'ar'): string => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS,
  });
};

export function NotificationItem({
  notification,
  language,
  onMarkAsRead,
  onDelete,
  onActionClick,
  isMarkingAsRead,
  isDeleting,
}: NotificationItemProps): JSX.Element {
  const actionButton = getActionButton(notification, language);

  const title = notification.title;
  const message = notification.message;
  const notificationLabel = `${title}. ${message}. ${formatDate(notification.createdAt, language)}${!notification.isRead ? '. Unread' : ''}`;

  return (
    <div
      role="article"
      aria-label={notificationLabel}
      className={cn(
        'p-4 hover:bg-muted/50 transition-colors',
        !notification.isRead && 'bg-muted/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0" aria-hidden="true">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm">
              {title}
            </h4>
            {!notification.isRead && (
              <Badge 
                variant="default" 
                className="h-2 w-2 p-0 rounded-full"
                aria-label={language === 'ar' ? 'غير مقروء' : 'Unread'}
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {formatDate(notification.createdAt, language)}
          </p>
          <div className="flex gap-2 mt-2" role="group" aria-label={language === 'ar' ? 'إجراءات الإشعار' : 'Notification actions'}>
            {notification.pdfFileName && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/api/pdf/download/${notification.pdfFileName}`, '_blank');
                }}
                aria-label={language === 'ar' ? `تنزيل PDF ${notification.pdfFileName}` : `Download PDF ${notification.pdfFileName}`}
              >
                <Package className="h-4 w-4 me-2" aria-hidden="true" />
                {language === 'ar' ? 'تنزيل PDF' : 'Download PDF'}
              </Button>
            )}
            {actionButton && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onActionClick(notification);
                }}
                aria-label={`${actionButton.text} - ${title}`}
              >
                <actionButton.icon className="h-4 w-4 me-2" aria-hidden="true" />
                {actionButton.text}
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label={language === 'ar' ? 'إجراءات سريعة' : 'Quick actions'}>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              disabled={isMarkingAsRead}
              title={language === 'ar' ? 'تعليم كمقروء' : 'Mark as read'}
              aria-label={language === 'ar' ? `تعليم "${title}" كمقروء` : `Mark "${title}" as read`}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            disabled={isDeleting}
            title={language === 'ar' ? 'حذف' : 'Delete'}
            aria-label={language === 'ar' ? `حذف إشعار "${title}"` : `Delete notification "${title}"`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

