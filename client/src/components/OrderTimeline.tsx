
import { CheckCircle2, Clock, Package, Truck, XCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import { formatDateLocalized } from '@/lib/dateUtils';
import { Badge } from './ui/badge';

interface OrderHistoryEntry {
  id: string;
  status: string;
  changedBy: string;
  changedAt: Date;
  notes?: string | null;
  isAdminNote: boolean;
}

interface OrderTimelineProps {
  history: OrderHistoryEntry[];
  currentStatus: string;
  isAdmin?: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  confirmed: <CheckCircle2 className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle2 className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  modification_requested: <FileText className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-purple-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
  modification_requested: 'bg-orange-500',
};

export function OrderTimeline({ history, currentStatus, isAdmin = false }: OrderTimelineProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">
          {language === 'ar' ? 'لا يوجد سجل للحالات' : 'No status history available'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-lg">
          {language === 'ar' ? 'تتبع الطلب' : 'Order Timeline'}
        </h3>
        <Badge variant="outline" className="ms-auto">
          {t(currentStatus)}
        </Badge>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-0 bottom-0 start-4 w-0.5 bg-border" />

        {/* Timeline entries */}
        <div className="space-y-4">
          {history.map((entry, index) => {
            const isLatest = index === history.length - 1;
            const statusColor = statusColors[entry.status] || 'bg-gray-500';

            return (
              <div key={entry.id} className="relative flex gap-4 pb-4">
                {/* Status indicator */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${statusColor} ${
                    isLatest ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ color: 'white' }}
                >
                  {statusIcons[entry.status] || <Clock className="h-4 w-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{t(entry.status)}</span>
                    {isLatest && (
                      <Badge variant="secondary" className="text-xs">
                        {language === 'ar' ? 'الحالة الحالية' : 'Current'}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {formatDateLocalized(new Date(entry.changedAt), language, 'PPp')}
                  </p>

                  {/* Notes - show admin notes only to admins */}
                  {entry.notes && (entry.isAdminNote ? isAdmin : true) && (
                    <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm">
                      {entry.isAdminNote && (
                        <Badge variant="outline" className="mb-1 text-xs">
                          {language === 'ar' ? 'ملاحظة إدارية' : 'Admin Note'}
                        </Badge>
                      )}
                      <p className="text-muted-foreground">{entry.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
