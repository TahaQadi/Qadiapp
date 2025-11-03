import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar, DollarSign, Edit, ShoppingBag, ArrowLeft, User, LogOut, Star, AlertTriangle, FileText } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type { Order } from "@shared/schema";
import { OrderModificationDialog } from "@/components/OrderModificationDialog";
import { OrderFeedbackDialog } from "@/components/OrderFeedbackDialog";
import { IssueReportDialog } from "@/components/IssueReportDialog";
import { OrderDetailsDialog } from "@/components/OrderDetailsDialog";
import { DocumentViewer } from "@/components/DocumentViewer";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { OrderFilters, OrderFilterState } from "@/components/OrderFilters";

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false); // State for feedback dialog
  const [issueReportDialogOpen, setIssueReportDialogOpen] = useState(false); // State for issue report dialog
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState<string | null>(null); // State for selected order ID for feedback
  const [selectedOrderForIssue, setSelectedOrderForIssue] = useState<string | null>(null); // State for selected order ID for issue report

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
    queryKey: ['/api/client/orders'],
  });

  // Handle feedback URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const feedbackOrderId = params.get('feedback');
    const issueOrderId = params.get('issue');

    if (feedbackOrderId && ordersData) {
      const order = ordersData.find(o => o.id === feedbackOrderId);
      if (order) {
        setSelectedOrder(order); // Keep this for modification dialog
        setSelectedOrderForFeedback(order.id);
        setFeedbackDialogOpen(true);
        window.history.replaceState({}, '', '/orders');
      }
    } else if (issueOrderId && ordersData) {
      const order = ordersData.find(o => o.id === issueOrderId);
      if (order) {
        setSelectedOrder(order); // Keep this for modification dialog
        setSelectedOrderForIssue(order.id);
        setIssueReportDialogOpen(true);
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
          ltaNumber: order.ltaId.slice(0, 8),
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
        order.ltaId?.toLowerCase().includes(searchLower)
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
      filtered = filtered.filter(order => parseFloat(order.totalAmount) >= min);
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      filtered = filtered.filter(order => parseFloat(order.totalAmount) <= max);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "amount":
          comparison = parseFloat(a.totalAmount) - parseFloat(b.totalAmount);
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

  if (isLoading || !user) {
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
    <PageLayout>
      <PageHeader
        title={i18n.language === 'ar' ? 'طلباتي' : 'My Orders'}
        backHref="/ordering"
        showLogo={true}
        actions={
          <>
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
          </>
        }
      />

      <div className="space-y-6 container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-2" data-testid="heading-orders">
            {i18n.language === 'ar' ? 'قائمة الطلبات' : 'Orders List'}
          </h2>
          <p className="text-sm text-muted-foreground" data-testid="text-description">
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
        <Card data-testid="card-no-orders" className="border-border/50 dark:border-[#d4af37]/20">
          <CardContent className="py-12">
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
        <div className="grid gap-3 sm:gap-4">
          {orders.map((order) => {
            const items = JSON.parse(order.items || '[]');
            const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
            const language = i18n.language; // For easier access in this scope

            return (
              <Card 
                key={order.id} 
                className="border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-xl dark:hover:shadow-[#d4af37]/30 transition-all duration-300 bg-card/50 dark:bg-card/30 backdrop-blur-sm group overflow-hidden" 
                data-testid={`card-order-${order.id}`}
              >
                {/* Status Bar */}
                <div className={`h-1 w-full ${
                  order.status === 'delivered' ? 'bg-green-500' :
                  order.status === 'shipped' ? 'bg-blue-500' :
                  order.status === 'processing' ? 'bg-purple-500' :
                  order.status === 'confirmed' ? 'bg-indigo-500' :
                  order.status === 'cancelled' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-[#d4af37]/10 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-primary dark:text-[#d4af37]" />
                        </div>
                        <CardTitle className="text-base sm:text-lg font-bold truncate" data-testid={`text-order-id-${order.id}`}>
                          #{order.id.substring(0, 8)}
                        </CardTitle>
                      </div>
                      <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm mt-2">
                        <span className="flex items-center gap-1" data-testid={`text-date-${order.id}`}>
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1" data-testid={`text-items-${order.id}`}>
                          <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {itemCount} {language === 'ar' ? 'عنصر' : 'items'}
                        </span>
                        {order.ltaId && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <span className="text-xs">LTA:</span>
                            <span className="font-mono">{order.ltaId.slice(0, 8)}</span>
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Amount Display */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary dark:text-[#d4af37]" />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {language === 'ar' ? 'الإجمالي' : 'Total'}
                      </span>
                    </div>
                    <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent" data-testid={`text-total-${order.id}`}>
                      {order.totalAmount} {language === 'ar' ? 'ر.س' : 'SAR'}
                    </span>
                  </div>

                  {/* Cancellation Reason */}
                  {order.cancellationReason && (
                    <div className="p-3 bg-destructive/10 dark:bg-destructive/20 rounded-lg border border-destructive/20" data-testid={`text-cancellation-${order.id}`}>
                      <p className="text-xs sm:text-sm font-semibold text-destructive mb-1">
                        {language === 'ar' ? 'سبب الإلغاء:' : 'Cancellation Reason:'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {order.cancellationReason}
                      </p>
                    </div>
                  )}

                  {/* Compact Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {/* Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setDetailsOpen(true);
                      }}
                      data-testid={`button-view-details-${order.id}`}
                      className="flex-1 min-h-[36px] text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 me-1.5" />
                      {language === 'ar' ? 'التفاصيل' : 'Details'}
                    </Button>

                    {/* Issue Report Icon Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrderForIssue(order.id);
                        setIssueReportDialogOpen(true);
                      }}
                      data-testid={`button-report-issue-${order.id}`}
                      className="min-h-[36px] px-3 border-orange-200 hover:bg-orange-50 hover:border-orange-300 dark:border-orange-900 dark:hover:bg-orange-950"
                      title={language === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report Issue'}
                    >
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </Button>

                    {/* Feedback Icon Button - Only for delivered/cancelled */}
                    {['delivered', 'cancelled'].includes(order.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrderForFeedback(order.id);
                          setFeedbackDialogOpen(true);
                        }}
                        data-testid={`button-submit-feedback-${order.id}`}
                        className="min-h-[36px] px-3 border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-900 dark:hover:bg-green-950"
                        title={language === 'ar' ? 'تقديم ملاحظات' : 'Submit Feedback'}
                      >
                        <Star className="h-4 w-4 text-yellow-500" />
                      </Button>
                    )}
                  </div>

                  {/* Modification Actions - Only for confirmed/processing */}
                  {['confirmed', 'processing'].includes(order.status) && (
                    <Button
                      variant="outline"
                      className="w-full min-h-[44px] border-primary/20 dark:border-[#d4af37]/20 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:border-primary dark:hover:border-[#d4af37] transition-all duration-300"
                      onClick={() => handleRequestModification(order)}
                      data-testid={`button-modify-${order.id}`}
                    >
                      <Edit className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'طلب تعديل' : 'Request Modification'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        order={selectedOrder ? { 
          ...selectedOrder, 
          createdAt: new Date(selectedOrder.createdAt),
          currency: 'SAR',
          status: selectedOrder.status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
          pipefyCardId: selectedOrder.pipefyCardId || undefined,
          clientId: selectedOrder.clientId,
          ltaId: selectedOrder.ltaId || null
        } : null}
      />

      {/* Modification Dialog */}
      <OrderModificationDialog
          order={selectedOrder}
          open={modifyOpen}
          onOpenChange={setModifyOpen}
        />

      {/* Feedback Dialog */}
      <OrderFeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        orderId={selectedOrderForFeedback || ''}
      />

      {/* Issue Report Dialog */}
      <IssueReportDialog
        open={issueReportDialogOpen}
        onOpenChange={setIssueReportDialogOpen}
        orderId={selectedOrderForIssue || ''}
      />
      </div>
    </PageLayout>
  );
}