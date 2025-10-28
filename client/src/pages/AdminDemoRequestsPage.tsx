
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDateLocalized } from "@/lib/dateUtils";
import { PlayCircle, Mail, Phone, Building2, Calendar, FileText, Loader2, Eye, CheckCircle2, Clock, XCircle, Filter, ArrowLeft, Search, RefreshCw, Download, Trash2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import { arrayToCSV, downloadCSV, formatDateForCSV } from "@/lib/csvExport";

interface DemoRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  message?: string;
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

type StatusFilter = 'all' | DemoRequest['status'];

const STATUS_CONFIG = {
  pending: { 
    label: 'Pending', 
    labelAr: 'قيد الانتظار', 
    variant: 'default' as const,
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-500'
  },
  contacted: { 
    label: 'Contacted', 
    labelAr: 'تم الاتصال', 
    variant: 'secondary' as const,
    icon: Phone,
    color: 'text-blue-600 dark:text-blue-500'
  },
  scheduled: { 
    label: 'Scheduled', 
    labelAr: 'مجدول', 
    variant: 'outline' as const,
    icon: Calendar,
    color: 'text-purple-600 dark:text-purple-500'
  },
  completed: { 
    label: 'Completed', 
    labelAr: 'مكتمل', 
    variant: 'secondary' as const,
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-500'
  },
  cancelled: { 
    label: 'Cancelled', 
    labelAr: 'ملغي', 
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600 dark:text-red-500'
  },
} as const;

export default function AdminDemoRequestsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  // State management
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'company' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Data fetching
  const { data: requests = [], isLoading, isError, refetch: refetchRequests } = useQuery<DemoRequest[]>({
    queryKey: ["/api/admin/demo-requests"],
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; notes: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/demo-requests/${data.id}`, {
        status: data.status,
        notes: data.notes,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update request');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث الطلب بنجاح' : 'Request updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/demo-requests"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل تحديث الطلب' : 'Failed to update request'),
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/demo-requests/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete request');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الطلب بنجاح' : 'Request deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/demo-requests"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل حذف الطلب' : 'Failed to delete request'),
      });
    },
  });

  // Filtered and sorted requests
  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    // Search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.name.toLowerCase().includes(query) ||
        req.email.toLowerCase().includes(query) ||
        req.company.toLowerCase().includes(query) ||
        req.phone.toLowerCase().includes(query) ||
        (req.message && req.message.toLowerCase().includes(query))
      );
    }
    
    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(req => new Date(req.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(req => new Date(req.createdAt) <= toDate);
    }
    
    // Sort requests
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [requests, statusFilter, debouncedSearchQuery, dateFrom, dateTo, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    scheduled: requests.filter(r => r.status === 'scheduled').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
    filtered: filteredRequests.length,
  }), [requests, filteredRequests]);

  // Handlers
  const handleViewRequest = (request: DemoRequest) => {
    setSelectedRequest(request);
    setStatus(request.status);
    setNotes(request.notes || '');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
    setStatus('');
    setNotes('');
  };

  const handleUpdate = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      status,
      notes,
    });
  };

  const handleDelete = () => {
    if (!selectedRequest) return;
    if (confirm(language === 'ar' 
      ? `هل أنت متأكد من حذف طلب ${selectedRequest.company}؟` 
      : `Are you sure you want to delete request from ${selectedRequest.company}?`)) {
      deleteMutation.mutate(selectedRequest.id);
    }
  };

  const handleExportCSV = () => {
    try {
      const exportData = filteredRequests.map(request => ({
        'ID': request.id,
        'Name': request.name,
        'Email': request.email,
        'Phone': request.phone,
        'Company': request.company,
        'Message': request.message || '',
        'Status': STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG]?.label || request.status,
        'Status (Arabic)': STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG]?.labelAr || request.status,
        'Notes': request.notes || '',
        'Created Date': formatDateForCSV(request.createdAt),
        'Updated Date': request.updatedAt ? formatDateForCSV(request.updatedAt) : '',
      }));

      const csvContent = arrayToCSV(exportData);
      const filename = `demo_requests_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(csvContent, filename);
      
      toast({
        title: language === 'ar' ? 'تم التصدير بنجاح' : 'Export Successful',
        description: language === 'ar' 
          ? `تم تصدير ${exportData.length} طلب إلى ملف CSV` 
          : `Exported ${exportData.length} requests to CSV file`,
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ في التصدير' : 'Export Error',
        description: language === 'ar' ? 'فشل تصدير البيانات' : 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (requestStatus: string) => {
    const config = STATUS_CONFIG[requestStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1.5">
        <Icon className="h-3 w-3" />
        {language === 'ar' ? config.labelAr : config.label}
      </Badge>
    );
  };

  const renderEmptyState = () => (
    <Card className="p-12 text-center border-dashed">
      <PlayCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
      <h3 className="text-lg font-semibold mb-2">
        {language === 'ar' ? 'لا توجد طلبات' : 'No Requests'}
      </h3>
      <p className="text-muted-foreground">
        {statusFilter === 'all' 
          ? (language === 'ar' ? 'لا توجد طلبات عروض توضيحية' : 'No demo requests yet')
          : (language === 'ar' ? `لا توجد طلبات ${STATUS_CONFIG[statusFilter].labelAr}` : `No ${STATUS_CONFIG[statusFilter].label.toLowerCase()} requests`)}
      </p>
    </Card>
  );

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="h-24 bg-muted rounded-t-lg"></CardHeader>
          <CardContent className="h-32 bg-muted/50"></CardContent>
        </Card>
      ))}
    </div>
  );

  const renderStatCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'الإجمالي' : 'Total'}
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {Object.entries(STATUS_CONFIG).map(([key, config]) => {
        const Icon = config.icon;
        const count = stats[key as keyof typeof stats];
        return (
          <Card 
            key={key}
            className={`hover:shadow-md transition-shadow cursor-pointer ${statusFilter === key ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(key as StatusFilter)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? config.labelAr : config.label}
                  </p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-bold">
                {language === 'ar' ? 'طلبات العروض التوضيحية' : 'Demo Requests'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {language === 'ar' ? 'إدارة طلبات العروض التوضيحية من العملاء' : 'Manage demo requests from clients'}
              </p>
            </div>
          </div>
            
            </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'ar' ? 'البحث في الطلبات...' : 'Search requests...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{language === 'ar' ? 'التاريخ' : 'Date'}</SelectItem>
                    <SelectItem value="name">{language === 'ar' ? 'الاسم' : 'Name'}</SelectItem>
                    <SelectItem value="company">{language === 'ar' ? 'الشركة' : 'Company'}</SelectItem>
                    <SelectItem value="status">{language === 'ar' ? 'الحالة' : 'Status'}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={language === 'ar' ? 'ترتيب' : 'Sort'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
                
                <Input
                  type="date"
                  placeholder={language === 'ar' ? 'من تاريخ' : 'From date'}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
                
                <Input
                  type="date"
                  placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetchRequests()}
                  title={language === 'ar' ? 'تحديث' : 'Refresh'}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Export Button */}
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={filteredRequests.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="mb-6">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">
                {language === 'ar' ? 'الكل' : 'All'} ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending">
                {language === 'ar' ? 'قيد الانتظار' : 'Pending'} ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="contacted">
                {language === 'ar' ? 'تم الاتصال' : 'Contacted'} ({stats.contacted})
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                {language === 'ar' ? 'مجدول' : 'Scheduled'} ({stats.scheduled})
              </TabsTrigger>
              <TabsTrigger value="completed">
                {language === 'ar' ? 'مكتمل' : 'Completed'} ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                {language === 'ar' ? 'ملغي' : 'Cancelled'} ({stats.cancelled})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Statistics */}
        {!isLoading && requests.length > 0 && renderStatCards()}

        {/* Content */}
        {isError ? (
          <Card className="p-8 text-center border-destructive">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive">
              {language === 'ar' ? 'خطأ في تحميل الطلبات' : 'Error loading requests'}
            </p>
          </Card>
        ) : isLoading ? (
          renderLoadingSkeleton()
        ) : filteredRequests.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="truncate">{request.company}</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground truncate">{request.name}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`mailto:${request.email}`} 
                      className="truncate hover:text-primary transition-colors"
                    >
                      {request.email}
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`tel:${request.phone}`}
                      className="hover:text-primary transition-colors"
                    >
                      {request.phone}
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {formatDateLocalized(new Date(request.createdAt), language)}
                    </span>
                  </div>
                  
                  {request.message && (
                    <div className="flex items-start gap-2 text-sm pt-2 border-t">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="line-clamp-2 text-muted-foreground">{request.message}</p>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => handleViewRequest(request)}
                    data-testid={`button-view-request-${request.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {selectedRequest?.company} - {selectedRequest?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <a 
                    href={`mailto:${selectedRequest.email}`}
                    className="block font-medium hover:text-primary transition-colors"
                  >
                    {selectedRequest.email}
                  </a>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </Label>
                  <a 
                    href={`tel:${selectedRequest.phone}`}
                    className="block font-medium hover:text-primary transition-colors"
                  >
                    {selectedRequest.phone}
                  </a>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">
                    {language === 'ar' ? 'تاريخ الطلب' : 'Request Date'}
                  </Label>
                  <p className="font-medium">
                    {formatDateLocalized(new Date(selectedRequest.createdAt), language)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">
                    {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                  </Label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {selectedRequest.message && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase">
                    {language === 'ar' ? 'الرسالة' : 'Message'}
                  </Label>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {selectedRequest.message}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">
                  {language === 'ar' ? 'تحديث الحالة' : 'Update Status'}
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon && <config.icon className={`h-4 w-4 ${config.color}`} />}
                          {language === 'ar' ? config.labelAr : config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'أضف ملاحظات...' : 'Add notes...'}
                  rows={4}
                  data-testid="textarea-notes"
                  className="resize-none"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                  data-testid="button-delete"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري الحذف...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCloseDialog} 
                  data-testid="button-cancel"
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  onClick={handleUpdate} 
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                  data-testid="button-save"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
