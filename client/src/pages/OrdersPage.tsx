import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar, DollarSign, Edit, ShoppingBag, ArrowLeft, User, LogOut } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type { Order } from "@shared/schema";
import { OrderModificationDialog } from "@/components/OrderModificationDialog";
import { ModificationSheet } from "@/components/ModificationSheet";
import { OrderFeedbackDialog } from "@/components/OrderFeedbackDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { OrderFilters, OrderFilterState } from "@/components/OrderFilters";

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [filters, setFilters] = useState<OrderFilterState>({
    searchTerm: "",
    status: "all",
    ltaId: "all",
    dateFrom: undefined,
    dateTo: undefined,
    minAmount: "",
    maxAmount: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  const { data: ordersData, isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  // Handle feedback URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const feedbackOrderId = params.get('feedback');
    
    if (feedbackOrderId && ordersData) {
      const order = ordersData.find(o => o.id === feedbackOrderId);
      if (order) {
        setSelectedOrder(order);
        setFeedbackOpen(true);
        // Clear the URL parameter
        window.history.replaceState({}, '', '/orders');
      }
    }
  }, [ordersData]);

  // Get unique LTAs for filter
  const availableLTAs = useMemo(() => {
    if (!ordersData) return [];
    const ltaMap = new Map();
    ordersData.forEach(order => {
      if (order.ltaId && !ltaMap.has(order.ltaId)) {
        ltaMap.set(order.ltaId, {
          id: order.ltaId,
          ltaNumber: order.ltaNumber || order.ltaId,
        });
      }
    });
    return Array.from(ltaMap.values());
  }, [ordersData]);

  // Apply filters and sorting
  const orders = useMemo(() => {
    if (!ordersData) return [];

    let filtered = [...ordersData];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.ltaNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // LTA filter
    if (filters.ltaId !== "all") {
      filtered = filtered.filter(order => order.ltaId === filters.ltaId);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= filters.dateFrom!
      );
    }
    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= endOfDay
      );
    }

    // Amount range filter
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      filtered = filtered.filter(order => order.totalAmount >= min);
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      filtered = filtered.filter(order => order.totalAmount <= max);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "amount":
          comparison = a.totalAmount - b.totalAmount;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [ordersData, filters]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300">
              <Link href="/ordering">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <img 
              src="/logo.png" 
              alt={i18n.language === 'ar' ? 'شعار الشركة' : 'Company Logo'} 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                {i18n.language === 'ar' ? 'طلباتي' : 'My Orders'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 sm:h-10 sm:w-10">
              <Link href="/profile">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            {user?.isAdmin && (
              <Button variant="ghost" size="icon" asChild className="h-9 w-9 sm:h-10 sm:w-10">
                <Link href="/admin">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            )}
            <NotificationCenter />
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 sm:h-10 sm:w-10"
            >
              <Link href="/logout">
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-6 container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        <div>
          <h2 className="text-2xl font-bold" data-testid="heading-orders">
            {i18n.language === 'ar' ? 'قائمة الطلبات' : 'Orders List'}
          </h2>
          <p className="text-muted-foreground" data-testid="text-description">
            {i18n.language === 'ar' ? 'عرض وإدارة طلباتك' : 'View and manage your orders'}
          </p>
        </div>

        <div className="mb-6">
          <OrderFilters 
            onFilterChange={setFilters}
            availableLTAs={availableLTAs}
          />
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

      {selectedOrder && (
        <OrderFeedbackDialog
          order={selectedOrder}
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
        />
      )}
      </div>
    </div>
  );
}