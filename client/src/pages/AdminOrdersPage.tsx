import { useState, useMemo, useTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Eye, ChevronLeft, ChevronRight, Search, Printer, Share2, Download, Package } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { formatDateLocalized } from '@/lib/dateUtils';
import { apiRequest, queryClient, cacheStrategies } from '@/lib/queryClient';
import { safeJsonParse } from '@/lib/safeJson';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualList } from "@/components/VirtualList";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/useDebounce";

interface Order {
  id: string;
  clientId: string;
  ltaId: string | null;
  items: string;
  totalAmount: string;
  status: string;
  pipefyCardId: string | null;
  createdAt: string;
}

interface Client {
  id: string;
  nameEn: string;
  nameAr: string;
}

interface LTA {
  id: string;
  nameEn: string;
  nameAr: string;
}

interface OrderItem {
  productId: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  quantity: number;
  price: string;
}

export default function AdminOrdersPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);
  const [hideDoneAndCancelled, setHideDoneAndCancelled] = useState(false);
  const queryClient = useQueryClient();


  // Fetch all orders for virtual scrolling
  const { data: allOrdersData, isLoading: isLoadingAll } = useQuery<any>({
    queryKey: ['/api/admin/orders', 'all'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders?all=true`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: useVirtualScrolling,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch paginated orders with optimized caching
  const { data: ordersData = { orders: [], totalPages: 1 }, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/orders', currentPage, itemsPerPage, statusFilter, debouncedSearchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders?page=${currentPage}&pageSize=${itemsPerPage}&status=${statusFilter}&search=${debouncedSearchQuery}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: !useVirtualScrolling,
    placeholderData: (previousData: any) => previousData,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });

  const orders = useVirtualScrolling ? allOrdersData?.orders || [] : ordersData?.orders || [];
  const totalPages = useVirtualScrolling ? 1 : ordersData?.totalPages || 1;

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/admin/clients'],
    queryFn: async () => {
      const res = await fetch('/api/admin/clients', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    },
  });

  const { data: ltas = [] } = useQuery<LTA[]>({
    queryKey: ['/api/admin/ltas'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ltas', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch LTAs');
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        description: language === 'ar' ? 'تم تحديث حالة الطلب بنجاح' : 'Order status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? (language === 'ar' ? client.nameAr : client.nameEn) : clientId;
  };

  const getLtaName = (ltaId: string | null) => {
    if (!ltaId) return '-';
    const lta = ltas.find(l => l.id === ltaId);
    return lta ? (language === 'ar' ? lta.nameAr : lta.nameEn) : ltaId;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string; labelAr: string }> = {
      pending: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800', label: 'Pending', labelAr: 'قيد الانتظار' },
      confirmed: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-800', label: 'Confirmed', labelAr: 'مؤكد' },
      shipped: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-800', label: 'Shipped', labelAr: 'تم الشحن' },
      delivered: { className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800', label: 'Delivered', labelAr: 'تم التسليم' },
      cancelled: { className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800', label: 'Cancelled', labelAr: 'ملغي' },
    };

    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-800', label: status, labelAr: status };
    return (
      <Badge variant="outline" className={config.className} data-testid={`badge-status-${status}`}>
        {language === 'ar' ? config.labelAr : config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'PPp', { locale: language === 'ar' ? ar : enUS });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handlePrintOrder = (order: Order) => {
    const items = safeJsonParse<OrderItem[]>(order.items, []);
    const client = clients.find(c => c.id === order.clientId);
    const lta = ltas.find(l => l.id === order.ltaId);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل فتح نافذة الطباعة' : 'Failed to open print window',
      });
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${language === 'ar' ? 'طلب' : 'Order'} #${order.id.slice(0, 8)}</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #d4af37;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1a365d;
              margin-bottom: 10px;
            }
            .order-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-block {
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .info-value {
              color: #111827;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #1a365d;
              color: white;
              padding: 12px;
              text-align: left;
            }
            td {
              border-bottom: 1px solid #e5e7eb;
              padding: 12px;
            }
            .total {
              text-align: right;
              font-size: 18px;
              font-weight: bold;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #d4af37;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">
              ${language === 'ar' ? 'شركة القاضي التجارية' : 'Al Qadi Trading Company'}
            </div>
            <div style="color: #6b7280;">${language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</div>
          </div>

          <div class="order-info">
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'رقم الطلب' : 'Order ID'}</div>
              <div class="info-value">${order.id}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'التاريخ' : 'Date'}</div>
              <div class="info-value">${formatDate(order.createdAt)}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'العميل' : 'Client'}</div>
              <div class="info-value">${client ? (language === 'ar' ? client.nameAr : client.nameEn) : '-'}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'الاتفاقية' : 'LTA'}</div>
              <div class="info-value">${lta ? (language === 'ar' ? lta.nameAr : lta.nameEn) : '-'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${language === 'ar' ? '#' : 'No.'}</th>
                <th>${language === 'ar' ? 'رمز المنتج' : 'SKU'}</th>
                <th>${language === 'ar' ? 'المنتج' : 'Product'}</th>
                <th>${language === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th>${language === 'ar' ? 'السعر' : 'Price'}</th>
                <th>${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.sku}</td>
                  <td>${language === 'ar' ? item.nameAr : item.nameEn}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price}</td>
                  <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            ${language === 'ar' ? 'المجموع الكلي' : 'Total Amount'}: ${order.totalAmount}
          </div>

          <div class="no-print" style="text-align: center; margin-top: 40px;">
            <button onclick="window.print(); setTimeout(() => window.close(), 100);" style="padding: 12px 24px; background: #1a365d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              ${language === 'ar' ? 'طباعة' : 'Print'}
            </button>
          </div>

          <script>
            if (document.readyState === 'complete') {
              window.print();
            } else {
              window.addEventListener('load', function() {
                setTimeout(() => {
                  window.print();
                }, 100);
              });
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportPDF = async (order: Order) => {
    try {
      const items = safeJsonParse<OrderItem[]>(order.items, []);
      const client = clients.find(c => c.id === order.clientId);
      const lta = ltas.find(l => l.id === order.ltaId);

      const response = await apiRequest('POST', '/api/admin/orders/export-pdf', {
        order: {
          id: order.id,
          createdAt: order.createdAt,
          status: order.status,
          totalAmount: order.totalAmount,
        },
        client: client ? {
          nameEn: client.nameEn,
          nameAr: client.nameAr,
        } : null,
        lta: lta ? {
          nameEn: lta.nameEn,
          nameAr: lta.nameAr,
        } : null,
        items: items,
        language: language,
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${order.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: language === 'ar' ? 'تم التصدير' : 'Exported',
        description: language === 'ar' ? 'تم تصدير الطلب إلى PDF بنجاح' : 'Order exported to PDF successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    }
  };

  const handleShareOrder = (order: Order) => {
    const shareUrl = `${window.location.origin}/admin/orders?orderId=${order.id}`;

    if (navigator.share) {
      navigator.share({
        title: `${language === 'ar' ? 'طلب' : 'Order'} #${order.id.slice(0, 8)}`,
        text: `${language === 'ar' ? 'تفاصيل الطلب' : 'Order details'}: ${order.totalAmount}`,
        url: shareUrl,
      }).catch(() => {
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: language === 'ar' ? 'تم النسخ' : 'Copied',
        description: language === 'ar' ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard',
      });
    });
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o: Order) => o.id)));
    }
  };

  const handleBulkPrint = () => {
    selectedOrders.forEach(orderId => {
      const order = orders.find((o: Order) => o.id === orderId);
      if (order) handlePrintOrder(order);
    });
  };

  const handleBulkExportPDF = async () => {
    for (const orderId of Array.from(selectedOrders)) {
      const order = orders.find((o: Order) => o.id === orderId);
      if (order) await handleExportPDF(order);
    }
  };

  // Filter and search orders
  const filteredOrders = (orders || []).filter((order: Order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(order.clientId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pipefyCardId?.toLowerCase().includes(searchQuery.toLowerCase());

    // Hide done (delivered) and cancelled if toggle is on
    const shouldShow = !hideDoneAndCancelled || (order.status !== 'delivered' && order.status !== 'cancelled');

    return matchesStatus && matchesSearch && shouldShow;
  });

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    startTransition(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    });
  };

  const handleStatusFilterChange = (value: string) => {
    startTransition(() => {
      setStatusFilter(value);
      setCurrentPage(1);
    });
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id}
      className="border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-xl dark:hover:shadow-[#d4af37]/30 transition-all duration-300 bg-card/50 dark:bg-card/30 backdrop-blur-sm group"
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={selectedOrders.has(order.id)}
                onChange={() => toggleOrderSelection(order.id)}
                className="rounded border-gray-300 shrink-0 h-4 w-4 text-primary dark:text-[#d4af37] focus:ring-primary dark:focus:ring-[#d4af37]"
              />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="font-mono text-sm font-bold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  #{order.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground truncate ps-6">
              {getClientName(order.clientId)}
            </p>
          </div>
          <Select
            value={order.status}
            onValueChange={(value) => handleStatusChange(order.id, value)}
          >
            <SelectTrigger className="w-auto border-border/30 dark:border-[#d4af37]/10">
              {getStatusBadge(order.status)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
              <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
              <SelectItem value="shipped">{language === 'ar' ? 'تم الشحن' : 'Shipped'}</SelectItem>
              <SelectItem value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
              <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/30">
            <span className="text-xs text-muted-foreground font-medium">
              {language === 'ar' ? 'المبلغ' : 'Amount'}
            </span>
            <span className="font-mono font-bold text-sm">{order.totalAmount}</span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/30">
            <span className="text-xs text-muted-foreground font-medium">
              {language === 'ar' ? 'التاريخ' : 'Date'}
            </span>
            <span className="text-xs font-medium truncate">{formatDateLocalized(new Date(order.createdAt), language)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(order)}
            className="flex-1 hover:bg-primary hover:text-primary-foreground dark:hover:bg-[#d4af37] dark:hover:text-black transition-all"
          >
            <Eye className="h-4 w-4 me-1" />
            {language === 'ar' ? 'عرض' : 'View'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePrintOrder(order)}
            className="h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all"
            title={language === 'ar' ? 'طباعة' : 'Print'}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShareOrder(order)}
            className="h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all"
            title={language === 'ar' ? 'مشاركة' : 'Share'}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExportPDF(order)}
            className="h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all"
            title={language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/95 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="shrink-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-all"
              data-testid="button-back-admin"
            >
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10 shrink-0">
                <Package className="h-5 w-5 text-primary dark:text-[#d4af37]" />
              </div>
              <h1 className="text-xl font-semibold truncate bg-gradient-to-r from-primary to-primary/70 dark:from-[#d4af37] dark:to-[#d4af37]/70 bg-clip-text text-transparent">
                {language === 'ar' ? 'إدارة الطلبات' : 'Orders Management'}
              </h1>
            </div>
            {orders.length > 0 && (
              <Badge variant="secondary" className="hidden sm:inline-flex shrink-0 bg-primary/10 dark:bg-[#d4af37]/10 text-primary dark:text-[#d4af37] border-primary/20 dark:border-[#d4af37]/20">
                {orders.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-4 md:px-0 relative z-10">
        <Card className="border-border/50 dark:border-[#d4af37]/20 shadow-xl bg-card/50 dark:bg-card/30 backdrop-blur-sm">
          <CardHeader className="pb-4 space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                <Package className="h-6 w-6 text-primary dark:text-[#d4af37]" />
              </div>
              {language === 'ar' ? 'جميع الطلبات' : 'All Orders'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary dark:group-focus-within:text-[#d4af37]" />
                  <Input
                    placeholder={language === 'ar' ? 'البحث في الطلبات...' : 'Search orders...'}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 h-11 border-border/50 dark:border-[#d4af37]/20 focus-visible:ring-primary dark:focus-visible:ring-[#d4af37] bg-background/50 dark:bg-background/30 transition-all"
                    data-testid="input-search-orders"
                  />
                </div>

                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="h-11 border-border/50 dark:border-[#d4af37]/20 bg-background/50 dark:bg-background/30 transition-all" data-testid="select-filter-status">
                    <SelectValue placeholder={language === 'ar' ? 'جميع الحالات' : 'All Statuses'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
                    <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                    <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                    <SelectItem value="shipped">{language === 'ar' ? 'تم الشحن' : 'Shipped'}</SelectItem>
                    <SelectItem value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
                    <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="virtual-scroll"
                      checked={useVirtualScrolling}
                      onCheckedChange={setUseVirtualScrolling}
                    />
                    <Label htmlFor="virtual-scroll">{language === 'ar' ? 'التمرير الافتراضي' : 'Virtual Scrolling'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hide-done"
                      checked={hideDoneAndCancelled}
                      onCheckedChange={setHideDoneAndCancelled}
                    />
                    <Label htmlFor="hide-done">{language === 'ar' ? 'إخفاء المكتمل والملغي' : 'Hide Done & Cancelled'}</Label>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? `عرض ${startIndex + 1}-${Math.min(endIndex, filteredOrders.length)} من ${filteredOrders.length} طلب`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredOrders.length)} of ${filteredOrders.length} orders`
                  }
                </div>

                {selectedOrders.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {selectedOrders.size} {language === 'ar' ? 'محدد' : 'selected'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkPrint}
                    >
                      <Printer className="h-4 w-4 me-1" />
                      {language === 'ar' ? 'طباعة' : 'Print'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkExportPDF}
                    >
                      <Download className="h-4 w-4 me-1" />
                      {language === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {(isLoading || isLoadingAll) ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border border-border/50 dark:border-[#d4af37]/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden">
                  {useVirtualScrolling ? (
                    <VirtualList
                      items={filteredOrders}
                      estimateSize={200}
                      height="calc(100vh - 300px)"
                      renderItem={(order: Order, index: number) => renderOrderCard(order)}
                      keyExtractor={(order: Order) => order.id}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {paginatedOrders.map((order: Order) => renderOrderCard(order))}
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block border border-border/50 dark:border-[#d4af37]/20 rounded-lg overflow-hidden bg-card/30 dark:bg-card/20 backdrop-blur-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/40">
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                            onChange={toggleAllOrders}
                            className="rounded border-gray-300 h-4 w-4 text-primary dark:text-[#d4af37] focus:ring-primary dark:focus:ring-[#d4af37]"
                          />
                        </TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'الاتفاقية' : 'LTA'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                        <TableHead className="text-end font-semibold">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order: Order) => (
                        <TableRow
                          key={order.id}
                          data-testid={`row-order-${order.id}`}
                          className="hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors group"
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedOrders.has(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="rounded border-gray-300 h-4 w-4 text-primary dark:text-[#d4af37] focus:ring-primary dark:focus:ring-[#d4af37]"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm font-semibold">
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              #{order.id.slice(0, 8)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{getClientName(order.clientId)}</TableCell>
                          <TableCell className="text-muted-foreground">{getLtaName(order.ltaId)}</TableCell>
                          <TableCell className="font-mono font-semibold">{order.totalAmount}</TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className="w-36 border-border/30 dark:border-[#d4af37]/10">
                                {getStatusBadge(order.status)}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                                <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                                <SelectItem value="shipped">{language === 'ar' ? 'تم الشحن' : 'Shipped'}</SelectItem>
                                <SelectItem value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
                                <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm">{formatDateLocalized(new Date(order.createdAt), language)}</TableCell>
                          <TableCell className="text-end">
                            <div className="flex gap-1 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(order)}
                                data-testid={`button-view-${order.id}`}
                                className="hover:bg-primary hover:text-primary-foreground dark:hover:bg-[#d4af37] dark:hover:text-black transition-all"
                              >
                                <Eye className="h-4 w-4 me-1" />
                                {language === 'ar' ? 'عرض' : 'View'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintOrder(order)}
                                className="h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all"
                                title={language === 'ar' ? 'طباعة' : 'Print'}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShareOrder(order)}
                                className="h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all"
                                title={language === 'ar' ? 'مشاركة' : 'Share'}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportPDF(order)}
                                className="h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all"
                                title={language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && !useVirtualScrolling && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar'
                        ? `صفحة ${currentPage} من ${totalPages}`
                        : `Page ${currentPage} of ${totalPages}`
                      }
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4 me-1" />
                        {language === 'ar' ? 'السابق' : 'Previous'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        {language === 'ar' ? 'التالي' : 'Next'}
                        <ChevronRight className="h-4 w-4 ms-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-order-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary dark:text-[#d4af37]" />
              {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'معلومات تفصيلية عن الطلب والجدول الزمني' : 'Detailed information about the order and timeline'}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</p>
                  <p className="font-mono">#{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'العميل' : 'Client'}</p>
                  <p>{getClientName(selectedOrder.clientId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الاتفاقية' : 'LTA'}</p>
                  <p>{getLtaName(selectedOrder.ltaId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                {selectedOrder.pipefyCardId && (
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'معرف Pipefy' : 'Pipefy ID'}</p>
                    <p className="font-mono">{selectedOrder.pipefyCardId}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
                  <p>{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {language === 'ar' ? 'العناصر المطلوبة' : 'Order Items'}
                </h3>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                        <TableHead>{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeJsonParse<OrderItem[]>(selectedOrder.items, []).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{item.sku}</TableCell>
                          <TableCell>{language === 'ar' ? item.nameAr : item.nameEn}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="font-mono">{item.price}</TableCell>
                          <TableCell className="font-mono">
                            {(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 dark:bg-[#d4af37]/5 border border-primary/20 dark:border-[#d4af37]/20">
                  <span className="font-semibold text-lg">
                    {language === 'ar' ? 'المجموع الكلي' : 'Total Amount'}
                  </span>
                  <span className="font-bold text-2xl font-mono">{selectedOrder.totalAmount}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handlePrintOrder(selectedOrder)}
                  >
                    <Printer className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'طباعة' : 'Print'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleExportPDF(selectedOrder)}
                  >
                    <Download className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleShareOrder(selectedOrder)}
                  >
                    <Share2 className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'مشاركة' : 'Share'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}