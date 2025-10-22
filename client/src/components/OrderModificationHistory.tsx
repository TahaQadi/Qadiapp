
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderModificationHistoryProps {
  orderId: string;
}

export function OrderModificationHistory({ orderId }: OrderModificationHistoryProps) {
  const { t, language } = useLanguage();

  const { data: modifications, isLoading } = useQuery({
    queryKey: [`/api/client/orders/${orderId}/modifications`],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'default',
      approved: 'success',
      rejected: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="text-mobile-xs">
        {t(`modifications.status.${status}`)}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  if (!modifications || modifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-mobile-sm">
          {t('modifications.none')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-mobile-lg">{t('modifications.history')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] smooth-scroll">
          <div className="space-y-3 p-4">
            {modifications.map((mod: any) => (
              <div
                key={mod.id}
                className="border border-border rounded-lg p-3 space-y-2 bg-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(mod.status)}
                    <span className="font-medium text-mobile-sm">
                      {t(`modifications.type.${mod.modificationType}`)}
                    </span>
                  </div>
                  {getStatusBadge(mod.status)}
                </div>

                <p className="text-mobile-sm text-muted-foreground">
                  {language === 'ar' ? mod.requestDetailsAr : mod.requestDetailsEn}
                </p>

                {mod.adminResponse && (
                  <div className="bg-muted/50 rounded p-2 mt-2">
                    <p className="text-mobile-xs font-medium mb-1">
                      {t('modifications.adminResponse')}:
                    </p>
                    <p className="text-mobile-xs text-muted-foreground">
                      {language === 'ar' ? mod.adminResponseAr : mod.adminResponseEn}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-mobile-xs text-muted-foreground pt-2 border-t border-border">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(new Date(mod.createdAt), 'PPp')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
