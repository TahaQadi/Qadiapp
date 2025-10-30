import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import { safeJsonParse } from '@/lib/safeJson';
import { formatDateLocalized } from '@/lib/dateUtils';
import { Package, Calendar, CreditCard, FileText, TrendingUp, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { OrderTimeline } from './OrderTimeline';
import { OrderFeedbackDialog } from './OrderFeedbackDialog';
import { DocumentViewer } from './DocumentViewer';

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
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: Date;
    currency: string;
    pipefyCardId?: string;
  } | null;
}

export function OrderDetailsDialog({ open, onOpenChange, order }: OrderDetailsDialogProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  // Check if feedback has been submitted for this order
  const { data: feedbackData } = useQuery({
    queryKey: [`/api/feedback/order/${order?.id}`],
    enabled: !!order && order.status === 'delivered',
  });

  // Fetch order history
  const { data: orderHistory = [] } = useQuery({
    queryKey: ['/api/orders', order?.id, 'history'],
    queryFn: async () => {
      if (!order?.id) return [];
      const res = await apiRequest('GET', `/api/orders/${order.id}/history`);
      if (!res.ok) throw new Error('Failed to fetch order history');
      return res.json();
    },
    enabled: !!order?.id && open,
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/cancel`, { reason });
      if (!res.ok) throw new Error("Failed to cancel order");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === "ar" ? "تم إلغاء الطلب" : "Order Cancelled",
        description: language === "ar"
          ? "تم إلغاء طلبك بنجاح"
          : "Your order has been cancelled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', order?.id, 'history'] });
      setShowCancelForm(false);
      setCancellationReason("");
      onOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar"
          ? "فشل إلغاء الطلب"
          : "Failed to cancel order",
      });
    },
  });

  const handleCancelOrder = () => {
    if (!order || !cancellationReason.trim()) {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar"
          ? "يرجى إدخال سبب الإلغاء"
          : "Please enter a cancellation reason",
      });
      return;
    }
    cancelMutation.mutate({ orderId: order.id, reason: cancellationReason });
  };


  if (!order) return null;

  const items: OrderItem[] = safeJsonParse(order.items, []);

  const statusConfig = {
    pending: { variant: 'secondary' as const, color: 'text-yellow-600 dark:text-yellow-400' },
    confirmed: { variant: 'default' as const, color: 'text-blue-600 dark:text-blue-400' },
    processing: { variant: 'default' as const, color: 'text-orange-600 dark:text-orange-400' },
    shipped: { variant: 'default' as const, color: 'text-purple-600 dark:text-purple-400' },
    delivered: { variant: 'default' as const, color: 'text-green-600 dark:text-green-400' },
    cancelled: { variant: 'destructive' as const, color: 'text-red-600 dark:text-red-400' },
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'عرض تفاصيل الطلب الكاملة والحالة والعناصر'
              : 'View complete order details, status, and items'}
          </DialogDescription>
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
              <p className="text-sm">{formatDateLocalized(order.createdAt, language, 'PPp')}</p>
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

          {/* Order Timeline */}
          {orderHistory.length > 0 && (
            <>
              <OrderTimeline
                history={orderHistory}
                currentStatus={order.status}
              />
              <Separator />
            </>
          )}

          {/* Related Documents Section */}
          <DocumentViewer
            relatedId={order.id}
            relatedType="order"
            showTitle={true}
            className="mt-6"
          />

          {orderHistory.length > 0 && (
            <>
              <Separator />
            </>
          )}

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

      {!showCancelForm && order.status !== "cancelled" && order.status !== "delivered" && (
        <DialogFooter className="mt-6">
          <Button
            variant="destructive"
            onClick={() => setShowCancelForm(true)}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            {language === "ar" ? "إلغاء الطلب" : "Cancel Order"}
          </Button>
        </DialogFooter>
      )}

      {showCancelForm && (
        <div className="mt-6 space-y-4 border-t pt-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">
              {language === "ar" ? "إلغاء الطلب" : "Cancel Order"}
            </h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">
              {language === "ar" ? "سبب الإلغاء" : "Cancellation Reason"}
            </Label>
            <Textarea
              id="cancellation-reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder={language === "ar"
                ? "يرجى إدخال سبب إلغاء هذا الطلب..."
                : "Please enter the reason for cancelling this order..."}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelForm(false);
                setCancellationReason("");
              }}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={!cancellationReason.trim() || cancelMutation.isPending}
              className="gap-2"
            >
              {cancelMutation.isPending ? (
                language === "ar" ? "جاري الإلغاء..." : "Cancelling..."
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  {language === "ar" ? "تأكيد الإلغاء" : "Confirm Cancellation"}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      )}

        {/* Feedback Button - Show for delivered orders without feedback */}
        {order.status === 'delivered' && !feedbackData && (
          <DialogFooter className="mt-6">
            <Button
              onClick={() => setShowFeedback(true)}
              className="w-full"
              variant="outline"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تقييم الطلب' : 'Rate This Order'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>

        {/* Feedback Dialog */}
        {order && (
          <OrderFeedbackDialog
            orderId={order.id}
            open={showFeedback}
            onOpenChange={setShowFeedback}
          />
        )}
      </Dialog>
    </>
  );
}