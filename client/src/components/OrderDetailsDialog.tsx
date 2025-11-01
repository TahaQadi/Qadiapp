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
import { Package, Calendar, CreditCard, FileText, TrendingUp, XCircle, AlertTriangle, MessageSquare, MapPin, ExternalLink } from 'lucide-react';
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
    clientId?: string;
    ltaId?: string | null;
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

  // Fetch client information
  const { data: clientData } = useQuery({
    queryKey: ['/api/admin/clients', order?.clientId],
    queryFn: async () => {
      if (!order?.clientId) return null;
      const res = await apiRequest('GET', `/api/admin/clients/${order.clientId}`);
      if (!res.ok) throw new Error('Failed to fetch client');
      return res.json();
    },
    enabled: !!order?.clientId && open,
  });

  const client = clientData?.client;
  const clientLocations = clientData?.locations || [];
  const clientDepartments = clientData?.departments || [];

  // Find headquarters or first available location
  const deliveryLocation = clientLocations.find((loc: any) => loc.isHeadquarters) || clientLocations[0];

  // Find warehouse department
  const warehouseDepartment = clientDepartments.find((dept: any) => dept.departmentType === 'warehouse');

  // Fetch LTA information
  const { data: ltaData } = useQuery({
    queryKey: ['/api/admin/ltas', order?.ltaId],
    queryFn: async () => {
      if (!order?.ltaId) return null;
      const res = await apiRequest('GET', `/api/admin/ltas/${order.ltaId}`);
      if (!res.ok) throw new Error('Failed to fetch LTA');
      return res.json();
    },
    enabled: !!order?.ltaId && open,
  });

  // Helper function to generate map navigation URL
  const getMapNavigationUrl = (latitude: string | number | null, longitude: string | number | null): string | null => {
    if (!latitude || !longitude) return null;
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    if (isNaN(lat) || isNaN(lng)) return null;
    // Use Google Maps (works on all platforms)
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

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
            {language === 'ar' ? 'تأكيد الطلب' : 'Order Confirmation'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'عرض تفاصيل الطلب الكاملة والحالة والعناصر'
              : 'View complete order details, status, and items'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Details Labels Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">
              {language === 'ar' ? 'معلومات تفصيلية عن الطلب والجدول الزمني' : 'Detailed Order Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'رقم الطلب:' : 'Order Number:'}
                </p>
                <p className="font-mono text-sm">#{order.id}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {language === 'ar' ? 'تاريخ الطلب:' : 'Order Date:'}
                </p>
                <p className="text-sm">{formatDateLocalized(order.createdAt, language, 'PPp')}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'اسم العميل/الجهة:' : 'Client/Entity Name:'}
                </p>
                <p className="text-sm">{client?.nameAr || client?.nameEn || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'العنوان:' : 'Address:'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm flex-1">
                    {deliveryLocation 
                      ? (language === 'ar' ? deliveryLocation.addressAr : deliveryLocation.addressEn)
                      : (language === 'ar' ? 'غير محدد' : 'Not specified')
                    }
                  </p>
                  {deliveryLocation?.latitude && deliveryLocation?.longitude && (
                    <a
                      href={getMapNavigationUrl(deliveryLocation.latitude, deliveryLocation.longitude) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 flex items-center gap-1"
                      title={language === 'ar' ? 'فتح في الخرائط' : 'Open in Maps'}
                    >
                      <MapPin className="h-4 w-4" />
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'رقم الاتصال:' : 'Contact Phone:'}
                </p>
                <p className="text-sm">
                  {client?.phone || deliveryLocation?.phone || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}
                </p>
                <p className="text-sm">{language === 'ar' ? 'سيتم تحديدها لاحقاً' : 'To be determined'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'المرجع (عرض السعر/اتفاق):' : 'Reference (Price Offer/Agreement):'}
                </p>
                <p className="text-sm">
                  {ltaData 
                    ? (language === 'ar' ? ltaData.nameAr : ltaData.nameEn)
                    : (language === 'ar' ? 'غير محدد' : 'Not specified')
                  }
                </p>
              </div>

              {warehouseDepartment && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'معلومات المستودع:' : 'Warehouse Information:'}
                  </p>
                  <div className="text-sm space-y-1">
                    {warehouseDepartment.contactName && (
                      <p>
                        {language === 'ar' ? 'اسم المسؤول:' : 'Contact Name:'} {warehouseDepartment.contactName}
                      </p>
                    )}
                    {warehouseDepartment.contactPhone && (
                      <p>
                        {language === 'ar' ? 'هاتف:' : 'Phone:'} {warehouseDepartment.contactPhone}
                      </p>
                    )}
                    {warehouseDepartment.contactEmail && (
                      <p>
                        {language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'} {warehouseDepartment.contactEmail}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Delivery Information Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">
              {language === 'ar' ? 'معلومات التسليم' : 'Delivery Information'}
            </h3>
            <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed">
              <p className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' 
                  ? 'سيجري تجهيز وتسليم الطلب خلال (… أيام عمل) إلى عنوان التسليم الموضّح. يرجى توفير جهة اتصال للتنسيق والاستلام. أي فروقات تُوثّق على سند التسليم فور الوصول. الأسعار شاملة لضريبة القيمة المضافة.'
                  : 'The order will be prepared and delivered within (… working days) to the delivery address specified. Please provide a contact for coordination and receipt. Any discrepancies will be documented on the delivery note upon arrival. Prices include VAT.'
                }
              </p>
            </div>
          </div>

          <Separator />

          {/* Department Contacts Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">
              {language === 'ar' ? 'جهات الاتصال' : 'Department Contacts'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="font-medium mb-1">
                  {language === 'ar' ? 'قسم المبيعات:' : 'Sales Department:'}
                </p>
                <p className="text-muted-foreground">00970592555532 | taha@qadi.ps</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="font-medium mb-1">
                  {language === 'ar' ? 'اللوجستيات والتسليم:' : 'Logistics & Delivery:'}
                </p>
                <p className="text-muted-foreground">0592555534 | issam@qadi.ps</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="font-medium mb-1">
                  {language === 'ar' ? 'الحسابات والفوترة:' : 'Accounts & Billing:'}
                </p>
                <p className="text-muted-foreground">0592555536 | info@qadi.ps</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Thank You Message */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-sm font-medium">
              {language === 'ar' 
                ? 'شكرًا لثقتكم بشركة القاضي. نلتزم بسرعة التنفيذ وجودة الخدمة.'
                : 'Thank you for your trust in Al Qadi Company. We are committed to speed of execution and quality of service.'
              }
            </p>
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

          <Separator />

          {/* Footer Section */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>
              {language === 'ar'
                ? 'شركة القاضي – info@qadi.ps – qadi.ps | جميع العمليات خاضعة لشروط وأحكام الشركة.'
                : 'Al Qadi Company – info@qadi.ps – qadi.ps | All operations are subject to the terms and conditions of the company.'
              }
            </p>
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