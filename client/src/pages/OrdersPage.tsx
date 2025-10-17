import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar, DollarSign, Edit, ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type { Order } from "@shared/schema";
import { OrderModificationDialog } from "@/components/OrderModificationDialog";
import { ModificationSheet } from "@/components/ModificationSheet";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: i18n.language === 'ar' ? 'قيد الانتظار' : 'Pending' },
      confirmed: { variant: "default", label: i18n.language === 'ar' ? 'مؤكد' : 'Confirmed' },
      processing: { variant: "default", label: i18n.language === 'ar' ? 'قيد المعالجة' : 'Processing' },
      shipped: { variant: "default", label: i18n.language === 'ar' ? 'تم الشحن' : 'Shipped' },
      delivered: { variant: "default", label: i18n.language === 'ar' ? 'تم التوصيل' : 'Delivered' },
      cancelled: { variant: "destructive", label: i18n.language === 'ar' ? 'ملغى' : 'Cancelled' },
      modification_requested: { variant: "outline", label: i18n.language === 'ar' ? 'طلب تعديل' : 'Modification Requested' },
    };

    const config = statusMap[status] || statusMap.pending;

    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const handleRequestModification = (order: Order) => {
    setSelectedOrder(order);
    setModifyOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 container mx-auto px-4 py-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-shimmer rounded" />
          <div className="h-4 w-64 bg-muted/50 animate-shimmer rounded" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-32 bg-muted animate-shimmer rounded" />
                  <div className="h-4 w-48 bg-muted/50 animate-shimmer rounded" />
                </div>
                <div className="h-6 w-24 bg-muted animate-shimmer rounded" />
              </div>
              <div className="h-4 w-full bg-muted/30 animate-shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-orders">
          {i18n.language === 'ar' ? 'طلباتي' : 'My Orders'}
        </h1>
        <p className="text-muted-foreground" data-testid="text-description">
          {i18n.language === 'ar' ? 'عرض وإدارة طلباتك' : 'View and manage your orders'}
        </p>
      </div>

      {orders.length === 0 ? (
        <Card data-testid="card-no-orders">
          <CardContent className="py-2">
            <EmptyState
              icon={ShoppingBag}
              title={i18n.language === 'ar' ? 'لا توجد طلبات' : 'No Orders Yet'}
              description={i18n.language === 'ar' ? 'ابدأ التسوق لإنشاء طلبك الأول' : 'Start shopping to create your first order'}
              actionLabel={i18n.language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
              onAction={() => window.location.href = '/catalog'}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const items = JSON.parse(order.items || '[]');
            const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

            return (
              <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2" data-testid={`text-order-id-${order.id}`}>
                        <Package className="w-5 h-5" />
                        {i18n.language === 'ar' ? 'الطلب' : 'Order'} #{order.id.substring(0, 8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1" data-testid={`text-date-${order.id}`}>
                          <Calendar className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                        <span className="flex items-center gap-1" data-testid={`text-items-${order.id}`}>
                          <Package className="w-4 h-4" />
                          {itemCount} {i18n.language === 'ar' ? 'صنف' : 'items'}
                        </span>
                      </CardDescription>
                    </div>
                    <div className={isMobile ? "w-24" : ""}>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-muted-foreground" />
                      <span className="text-lg font-semibold" data-testid={`text-total-${order.id}`}>
                        {order.totalAmount} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                  </div>

                  {order.cancellationReason && (
                    <div className="p-3 bg-destructive/10 rounded-md" data-testid={`text-cancellation-${order.id}`}>
                      <p className="text-sm font-semibold text-destructive">
                        {i18n.language === 'ar' ? 'سبب الإلغاء:' : 'Cancellation Reason:'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.cancellationReason}
                      </p>
                    </div>
                  )}

                  {!['cancelled', 'delivered', 'shipped'].includes(order.status) && (
                    <Button
                      variant="outline"
                      className={`w-full py-2 rounded-lg ${isMobile ? 'text-base' : 'text-sm'}`}
                      onClick={() => handleRequestModification(order)}
                      data-testid={`button-modify-${order.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {i18n.language === 'ar' ? 'طلب تعديل' : 'Request Modification'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ModificationSheet
        order={selectedOrder}
        open={modifyOpen}
        onOpenChange={setModifyOpen}
      />
    </div>
  );
}