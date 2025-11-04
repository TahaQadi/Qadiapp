import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { useLanguage } from './LanguageProvider';
import { formatDateLocalized } from '@/lib/dateUtils';

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


  const emptyState = (
    <div className="text-center py-12">
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
    </div>
  );

  return (
    <div className="border rounded-md">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
                <TableCell colSpan={6}>{emptyState}</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                  <TableCell className="text-sm">{formatDateLocalized(order.createdAt, language)}</TableCell>
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

      {/* Mobile Card View */}
      <div className="md:hidden">
        {orders.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-3">
            {orders.map((order, index) => (
              <Card key={order.id} className="border rounded-lg shadow-sm">
                <CardContent className="p-4 space-y-3">
                  {/* Header: Date and Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatDateLocalized(order.createdAt, language)}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                        {t('orderId')}: {order.id.slice(0, 8)}
                      </p>
                    </div>
                    <Badge variant={statusVariant[order.status]} className="shrink-0">
                      {t(order.status)}
                    </Badge>
                  </div>

                  {/* Details: Items and Amount */}
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {order.itemCount} {t('items')}
                    </span>
                    <span className="font-mono font-semibold">
                      {order.currency} {order.totalAmount}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => onViewDetails(order)}
                      data-testid={`button-view-order-${order.id}`}
                    >
                      <Eye className="h-3.5 w-3.5 me-1.5" />
                      {t('viewDetails')}
                    </Button>
                    {onReorder && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => onReorder(order)}
                        data-testid={`button-reorder-${order.id}`}
                      >
                        <RotateCcw className="h-3.5 w-3.5 me-1.5" />
                        {t('reorder')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}