
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Package, Calendar, CreditCard, FileText, TrendingUp } from 'lucide-react';

interface OrderItem {
  productId: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  quantity: number;
  price: string;
}

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    items: string;
    totalAmount: string;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
    createdAt: Date;
    currency: string;
    pipefyCardId?: string;
  } | null;
}

export function OrderDetailsDialog({ open, onOpenChange, order }: OrderDetailsDialogProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  if (!order) return null;

  const items: OrderItem[] = JSON.parse(order.items);

  const statusConfig = {
    pending: { variant: 'secondary' as const, color: 'text-yellow-600 dark:text-yellow-400' },
    confirmed: { variant: 'default' as const, color: 'text-blue-600 dark:text-blue-400' },
    shipped: { variant: 'default' as const, color: 'text-purple-600 dark:text-purple-400' },
    delivered: { variant: 'default' as const, color: 'text-green-600 dark:text-green-400' },
  };

  const formatDate = (date: Date) => {
    return format(date, 'PPp', { locale: language === 'ar' ? ar : enUS });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'رقم الطلب' : 'Order ID'}
              </p>
              <p className="font-mono text-sm">{order.id}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {language === 'ar' ? 'تاريخ الطلب' : 'Order Date'}
              </p>
              <p className="text-sm">{formatDate(order.createdAt)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'الحالة' : 'Status'}
              </p>
              <Badge variant={statusConfig[order.status].variant}>
                {t(order.status)}
              </Badge>
            </div>

            {order.pipefyCardId && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'معرف بطاقة Pipefy' : 'Pipefy Card ID'}
                </p>
                <p className="font-mono text-sm">{order.pipefyCardId}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">
                {language === 'ar' ? 'العناصر المطلوبة' : 'Ordered Items'}
              </h3>
              <Badge variant="outline">{items.length}</Badge>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {language === 'ar' ? item.nameAr : item.nameEn}
                    </p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium">
                      {item.quantity} × {item.price} {order.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} {order.currency}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">
                  {language === 'ar' ? 'المجموع الكلي' : 'Total Amount'}
                </span>
              </div>
              <span className="font-bold text-2xl font-mono">
                {order.currency} {order.totalAmount}
              </span>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? 'جميع الأسعار وفقًا لشروط عقد الاتفاقية طويلة الأجل الخاص بك.'
                  : 'All prices are according to your Long-Term Agreement contract terms.'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
