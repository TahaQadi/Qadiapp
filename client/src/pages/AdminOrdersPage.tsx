
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Eye, ChevronLeft, ChevronRight, Search, Filter, Printer, Share2, Download } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { safeJsonParse } from '@/lib/safeJson';
import { Input } from '@/components/ui/input';

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const itemsPerPage = 20;

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/admin/clients'],
  });

  const { data: ltas = [] } = useQuery<LTA[]>({
    queryKey: ['/api/admin/ltas'],
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
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; labelAr: string }> = {
      pending: { variant: 'secondary', label: 'Pending', labelAr: 'قيد الانتظار' },
      confirmed: { variant: 'default', label: 'Confirmed', labelAr: 'مؤكد' },
      shipped: { variant: 'default', label: 'Shipped', labelAr: 'تم الشحن' },
      delivered: { variant: 'default', label: 'Delivered', labelAr: 'تم التسليم' },
      cancelled: { variant: 'destructive', label: 'Cancelled', labelAr: 'ملغي' },
    };

    const config = statusConfig[status] || { variant: 'outline' as const, label: status, labelAr: status };
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
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
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${language === 'ar' ? 'طلب' : 'Order'} #${order.id.slice(0, 8)}</title>
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
              button { display: none; }
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

          <div style="text-align: center; margin-top: 40px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #1a365d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              ${language === 'ar' ? 'طباعة' : 'Print'}
            </button>
          </div>
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
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders.map(o => o.id)));
    }
  };

  const handleBulkPrint = () => {
    selectedOrders.forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (order) handlePrintOrder(order);
    });
  };

  const handleBulkExportPDF = async () => {
    for (const orderId of Array.from(selectedOrders)) {
      const order = orders.find(o => o.id === orderId);
      if (order) await handleExportPDF(order);
    }
  };

  // Filter and search orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(order.clientId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pipefyCardId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 sm:h-10 sm:w-10"
              data-testid="button-back-admin"
            >
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">
              {language === 'ar' ? 'إدارة الطلبات' : 'Orders Management'}
            </h1>
            {orders.length > 0 && (
              <Badge variant="secondary">{orders.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'جميع الطلبات' : 'All Orders'}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'ar' ? 'البحث...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-orders"
                  />
                </div>

                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger data-testid="select-filter-status">
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

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? `عرض ${startIndex + 1}-${Math.min(endIndex, filteredOrders.length)} من ${filteredOrders.length} طلب`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredOrders.length)} of ${filteredOrders.length} orders`
                  }
                </div>
                
                {selectedOrders.size > 0 && (
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {selectedOrders.size} {language === 'ar' ? 'محدد' : 'selected'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkPrint}
                    >
                      <Printer className="h-4 w-4 me-1" />
                      {language === 'ar' ? 'طباعة الكل' : 'Print All'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkExportPDF}
                    >
                      <Download className="h-4 w-4 me-1" />
                      {language === 'ar' ? 'تصدير الكل' : 'Export All'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </p>
              </div>
            ) : paginatedOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
              </div>
            ) : (
              <>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                            onChange={toggleAllOrders}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                        <TableHead>{language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الاتفاقية' : 'LTA'}</TableHead>
                        <TableHead>{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedOrders.has(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}</TableCell>
                          <TableCell>{getClientName(order.clientId)}</TableCell>
                          <TableCell>{getLtaName(order.ltaId)}</TableCell>
                          <TableCell className="font-mono">{order.totalAmount}</TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
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
                          <TableCell className="text-sm">{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="text-end">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(order)}
                                data-testid={`button-view-${order.id}`}
                              >
                                <Eye className="h-4 w-4 me-1" />
                                <span className="hidden sm:inline">
                                  {language === 'ar' ? 'عرض' : 'View'}
                                </span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintOrder(order)}
                                title={language === 'ar' ? 'طباعة' : 'Print'}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShareOrder(order)}
                                title={language === 'ar' ? 'مشاركة' : 'Share'}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportPDF(order)}
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
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-order-details">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'معلومات تفصيلية عن الطلب' : 'Detailed information about the order'}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</p>
                  <p className="font-mono">{selectedOrder.id}</p>
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
                <h3 className="font-semibold mb-3">{language === 'ar' ? 'العناصر المطلوبة' : 'Order Items'}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                      <TableHead>{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeJsonParse<OrderItem[]>(selectedOrder.items, []).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
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

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-lg">
                    {language === 'ar' ? 'المجموع الكلي' : 'Total Amount'}
                  </span>
                  <span className="font-bold text-2xl font-mono">{selectedOrder.totalAmount}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handlePrintOrder(selectedOrder)}
                  >
                    <Printer className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'طباعة' : 'Print'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleExportPDF(selectedOrder)}
                  >
                    <Download className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
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
