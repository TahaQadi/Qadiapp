import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, RotateCcw, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from './LanguageProvider';

interface Order {
  id: string;
  createdAt: Date;
  itemCount: number;
  totalAmount: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  currency: string;
}

interface OrderHistoryTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onReorder?: (order: Order) => void;
}

export function OrderHistoryTable({ orders, onViewDetails, onReorder }: OrderHistoryTableProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const statusVariant = {
    pending: 'secondary' as const,
    confirmed: 'default' as const,
    shipped: 'default' as const,
    delivered: 'default' as const,
  };

  const formatDate = (date: Date) => {
    return format(date, 'PP', { locale: language === 'ar' ? ar : enUS });
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('orderDate')}</TableHead>
            <TableHead>{t('orderId')}</TableHead>
            <TableHead>{t('itemsSummary')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead className="text-end">{t('amount')}</TableHead>
            <TableHead className="text-end">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">{t('noOrders')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'ar' 
                        ? 'ابدأ بتقديم طلبك الأول من صفحة المنتجات'
                        : 'Start by placing your first order from the products page'}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                <TableCell className="text-sm">{formatDate(order.createdAt)}</TableCell>
                <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                <TableCell className="text-sm">
                  {order.itemCount} {t('items')}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[order.status]}>
                    {t(order.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-end font-mono">
                  {order.currency} {order.totalAmount}
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(order)}
                      data-testid={`button-view-order-${order.id}`}
                    >
                      <Eye className="h-4 w-4 me-1" />
                      {t('viewDetails')}
                    </Button>
                    {onReorder && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReorder(order)}
                        data-testid={`button-reorder-${order.id}`}
                      >
                        <RotateCcw className="h-4 w-4 me-1" />
                        {t('reorder')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}