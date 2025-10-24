import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import { Package, DollarSign, AlertCircle, ShoppingCart, ArrowLeft, FileText } from 'lucide-react';

export interface OrderConfirmationItem {
  productId: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  quantity: number;
  price: string;
}

interface OrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OrderConfirmationItem[];
  totalAmount: number;
  currency: string;
  ltaName?: string;
  onConfirm: () => void;
  onEdit: () => void;
  isSubmitting?: boolean;
}

export function OrderConfirmationDialog({
  open,
  onOpenChange,
  items,
  totalAmount,
  currency,
  ltaName,
  onConfirm,
  onEdit,
  isSubmitting = false,
}: OrderConfirmationDialogProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  // Assume ltaContract is available if ltaName is provided, and has nameAr/nameEn properties.
  // In a real scenario, you might need to fetch or pass the full ltaContract object.
  const ltaContract = ltaName ? { nameEn: ltaName, nameAr: ltaName } : null;


  const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-6 w-6 text-primary" />
            {language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'يرجى مراجعة تفاصيل طلبك قبل التأكيد'
              : 'Please review your order details before confirming'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* LTA Information */}
          {ltaContract && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {language === 'ar' ? 'اتفاقية العقد' : 'LTA Contract'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? ltaContract.nameAr : ltaContract.nameEn}
                </p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {language === 'ar' ? 'العناصر المطلوبة' : 'Order Items'}
              </h3>
              <Badge variant="outline">{items.length} {language === 'ar' ? 'صنف' : 'items'}</Badge>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {language === 'ar' ? item.nameAr : item.nameEn}
                    </p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="text-sm font-medium">
                      {item.quantity} × {item.price} {currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} {currency}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold">
              {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
                </span>
                <span className="font-mono">{currency} {total.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">
                  {language === 'ar' ? 'الإجمالي' : 'Total'}
                </span>
                <div className="text-end">
                  <p className="text-2xl font-bold font-mono text-primary">
                    {currency} {totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'الأسعار شاملة الضريبة' : 'Prices include tax'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              {language === 'ar'
                ? 'بمجرد تأكيد الطلب، سيتم إرساله للمعالجة. يمكنك طلب التعديلات لاحقًا إذا لزم الأمر.'
                : 'Once confirmed, your order will be submitted for processing. You can request modifications later if needed.'}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onEdit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 me-2" />
            {language === 'ar' ? 'تعديل الطلب' : 'Edit Order'}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <DollarSign className="h-4 w-4 me-2" />
            {isSubmitting
              ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
              : (language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}