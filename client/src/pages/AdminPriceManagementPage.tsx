import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Clock, Package, Download, Archive, FileText, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { safeJsonParse } from '@/lib/safeJson';

interface Notification {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  isRead: boolean;
  metadata: string | null;
  pdfFileName?: string | null;
  createdAt: string;
}

interface PriceOffer {
  id: string;
  offerNumber: string;
  requestId: string | null; // Added requestId here
  clientId: string;
  ltaId: string | null;
  status: string;
  language: 'en' | 'ar';
  items: string;
  validFrom: string;
  validUntil: string;
  pdfFileName: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PriceRequestMetadata {
  clientId: string;
  clientNameEn: string;
  clientNameAr: string;
  productIds: string[];
  products: Array<{
    id: string;
    sku: string;
    nameEn: string;
    nameAr: string;
  }>;
  message?: string;
}

interface PriceRequest {
  id: string;
  requestNumber: string;
  clientId: string;
  ltaId: string | null;
  status: 'pending' | 'processed' | 'cancelled';
  requestedAt: string;
  products: string | Array<{
    id: string;
    sku: string;
    nameEn: string;
    nameAr: string;
  }>;
  notes: string | null;
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

export default function AdminPriceManagementPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [location] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<PriceRequest | null>(null);
  const [viewRequestDialogOpen, setViewRequestDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [contractPrice, setContractPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [selectedLtaId, setSelectedLtaId] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [offerStatusFilter, setOfferStatusFilter] = useState<string>('all');
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [selectedRequestForPdf, setSelectedRequestForPdf] = useState<Notification | null>(null);
  const [pdfLtaId, setPdfLtaId] = useState('');
  const [pdfValidityDays, setPdfValidityDays] = useState('30');
  const [pdfNotes, setPdfNotes] = useState('');
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);

  const { data: notifications = [], isLoading: isLoadingRequests } = useQuery<Notification[]>({
    queryKey: ['/api/client/notifications'],
  });

  const { data: priceRequests = [], isLoading: isLoadingPriceRequests } = useQuery<PriceRequest[]>({
    queryKey: ['/api/admin/price-requests'],
  });

  const { data: offers = [], isLoading: isLoadingOffers } = useQuery<PriceOffer[]>({
    queryKey: ['/api/admin/price-offers'],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/admin/clients'],
  });

  const { data: ltas = [] } = useQuery<LTA[]>({
    queryKey: ['/api/admin/ltas'],
  });

  const { data: ltaAssignments } = useQuery<{
    ltaClients: Array<{ ltaId: string; clientId: string }>;
    ltaProducts: Array<{ ltaId: string; productId: string; contractPrice: string; currency: string }>;
  }>({
    queryKey: ['/api/admin/lta-assignments'],
  });

  // Auto-fill from price request if requestId is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get('requestId');
    
    if (requestId && priceRequests.length > 0) {
      const request = priceRequests.find(r => r.id === requestId);
      if (request) {
        setLinkedRequestId(requestId);
        setSelectedLtaId(request.ltaId || '');
        setPdfLtaId(request.ltaId || '');
        setPdfNotes(request.notes || '');
        
        toast({
          title: language === 'ar' ? 'تم التحميل من الطلب' : 'Loaded from Request',
          description: language === 'ar' 
            ? `تم تحميل البيانات من الطلب ${request.requestNumber}` 
            : `Data loaded from request ${request.requestNumber}`,
        });
      }
    }
  }, [priceRequests, language, toast]);

  const requestNotifications = notifications.filter(n => n.type === 'price_request');

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('PATCH', `/api/client/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
    },
  });

  const archiveRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/client/notifications/${id}`);
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الأرشفة' : 'Archived',
        description: language === 'ar' ? 'تم أرشفة الطلب بنجاح' : 'Request archived successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
    },
  });

  const assignProductMutation = useMutation({
    mutationFn: async (data: { ltaId: string; productId: string; contractPrice: string; currency: string; clientId?: string }) => {
      const res = await apiRequest('POST', `/api/admin/ltas/${data.ltaId}/products`, {
        productId: data.productId,
        contractPrice: data.contractPrice,
        currency: data.currency,
        clientId: data.clientId,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إضافة المنتج' : 'Product Added',
        description: language === 'ar' ? 'تم إضافة المنتج إلى الاتفاقية بنجاح' : 'Product added to LTA successfully',
      });
      setPriceDialogOpen(false);
      setContractPrice('');
      setSelectedProduct(null);
      setSelectedLtaId('');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/lta-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/all'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  const generatePdfMutation = useMutation({
    mutationFn: async (data: { notificationId: string; ltaId: string; validityDays: number; notes?: string }) => {
      const res = await apiRequest('POST', `/api/admin/price-requests/${data.notificationId}/generate-pdf`, {
        language,
        ltaId: data.ltaId,
        validityDays: data.validityDays,
        notes: data.notes,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'تم إنشاء PDF' : 'PDF Generated',
        description: data.message || (language === 'ar' ? 'تم إنشاء مستند عرض السعر بنجاح' : 'Price offer document generated successfully'),
      });
      setPdfDialogOpen(false);
      setPdfLtaId('');
      setPdfValidityDays('30');
      setPdfNotes('');
      setSelectedRequestForPdf(null);
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل إنشاء PDF' : 'Failed to generate PDF'),
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

  const parseMetadata = (metadataStr: string | null): PriceRequestMetadata => {
    if (!metadataStr) {
      return { 
        clientId: '', 
        clientNameEn: '', 
        clientNameAr: '', 
        productIds: [], 
        products: [] 
      };
    }
    return typeof metadataStr === 'string' 
      ? safeJsonParse(metadataStr, { 
          clientId: '', 
          clientNameEn: '', 
          clientNameAr: '', 
          productIds: [], 
          products: [] 
        })
      : metadataStr;
  };

  const isProductAssignedToLta = (productId: string, clientId: string) => {
    if (!ltaAssignments) return false;
    const clientLtaIds = ltaAssignments.ltaClients
      .filter(lc => lc.clientId === clientId)
      .map(lc => lc.ltaId);
    return ltaAssignments.ltaProducts.some(lp => 
      lp.productId === productId && clientLtaIds.includes(lp.ltaId)
    );
  };

  // Check if a request has been completed (has an associated offer)
  const isRequestCompleted = (request: PriceRequest) => {
    return request.status === 'processed' || request.status === 'cancelled';
  };

  // Filter requests based on status
  const filteredRequests = priceRequests.filter(request => {
    if (requestStatusFilter === 'all') return true;
    if (requestStatusFilter === 'pending') return request.status === 'pending';
    if (requestStatusFilter === 'completed') return isRequestCompleted(request);
    return true;
  });

  const filteredOffers = offerStatusFilter === 'all' 
    ? offers 
    : offers.filter(o => o.status === offerStatusFilter);

  const handleAssignPrice = (product: any, request: Notification) => {
    setSelectedProduct(product);
    setSelectedRequest(request);
    setPriceDialogOpen(true);
  };

  const handleSubmitPrice = () => {
    if (!selectedProduct || !selectedLtaId || !contractPrice) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
      });
      return;
    }

    const metadata = selectedRequest ? parseMetadata(selectedRequest.metadata) : null;
    assignProductMutation.mutate({
      ltaId: selectedLtaId,
      productId: selectedProduct.id,
      contractPrice,
      currency,
      clientId: metadata?.clientId,
    });
  };

  const formatDateLocalized = (date: Date, lang: string) => {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: lang === 'ar' ? ar : enUS,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; labelAr: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Draft', labelAr: 'مسودة', variant: 'outline' },
      sent: { label: 'Sent', labelAr: 'مُرسل', variant: 'default' },
      viewed: { label: 'Viewed', labelAr: 'مُشاهد', variant: 'secondary' },
      accepted: { label: 'Accepted', labelAr: 'مقبول', variant: 'default' },
      rejected: { label: 'Rejected', labelAr: 'مرفوض', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, labelAr: status, variant: 'outline' as const };
    return (
      <Badge variant={config.variant}>
        {language === 'ar' ? config.labelAr : config.label}
      </Badge>
    );
  };

  const getOfferStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'viewed':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'sent':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleDownload = async (fileName: string) => {
    window.open(`/api/pdf/download/${fileName}`, '_blank');
  };

  const handleViewRequest = (request: PriceRequest) => {
    setSelectedRequest(request);
    setViewRequestDialogOpen(true);
  };

  const handleCreateOffer = (request: PriceRequest) => {
    // Navigate to price management page with request ID for auto-fill
    setLocation(`/admin/price-management?requestId=${request.id}`);
    
    toast({
      title: language === 'ar' ? 'إنشاء عرض من الطلب' : 'Creating Offer from Request',
      description: language === 'ar' 
        ? `سيتم ربط العرض بالطلب ${request.requestNumber}` 
        : `Offer will be linked to request ${request.requestNumber}`,
    });
  };

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
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 text-primary dark:text-[#d4af37] shrink-0" />
              <h1 className="text-xl font-semibold truncate">
                {language === 'ar' ? 'إدارة الأسعار' : 'Price Management'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {linkedRequestId && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">
                  {language === 'ar' 
                    ? `تم التحميل من طلب السعر: ${priceRequests.find(r => r.id === linkedRequestId)?.requestNumber || linkedRequestId}`
                    : `Loaded from price request: ${priceRequests.find(r => r.id === linkedRequestId)?.requestNumber || linkedRequestId}`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-auto p-1">
            <TabsTrigger value="requests" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'طلبات الأسعار' : 'Price Requests'}</span>
              <span className="sm:hidden">{language === 'ar' ? 'طلبات' : 'Requests'}</span>
              {priceRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">{priceRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'عروض الأسعار' : 'Price Offers'}</span>
              <span className="sm:hidden">{language === 'ar' ? 'عروض' : 'Offers'}</span>
              {offers.length > 0 && (
                <Badge variant="secondary" className="ml-1">{offers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Price Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {/* Filter Tabs */}
            {priceRequests.length > 0 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                <Button
                  variant={requestStatusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setRequestStatusFilter('all')}
                  className="gap-2 shrink-0"
                  size="sm"
                >
                  {language === 'ar' ? 'الكل' : 'All'}
                  <Badge variant={requestStatusFilter === 'all' ? 'secondary' : 'outline'}>
                    {priceRequests.length}
                  </Badge>
                </Button>
                <Button
                  variant={requestStatusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setRequestStatusFilter('pending')}
                  className="gap-2 shrink-0"
                  size="sm"
                >
                  {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
                  <Badge variant={requestStatusFilter === 'pending' ? 'secondary' : 'outline'}>
                    {priceRequests.filter(r => r.status === 'pending').length}
                  </Badge>
                </Button>
                <Button
                  variant={requestStatusFilter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setRequestStatusFilter('completed')}
                  className="gap-2 shrink-0"
                  size="sm"
                >
                  {language === 'ar' ? 'مكتمل' : 'Completed'}
                  <Badge variant={requestStatusFilter === 'completed' ? 'secondary' : 'outline'}>
                    {priceRequests.filter(isRequestCompleted).length}
                  </Badge>
                </Button>
              </div>
            )}

            {isLoadingPriceRequests ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card className="border-2 border-dashed border-border/50 dark:border-[#d4af37]/20">
                <CardContent className="p-8 sm:p-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Package className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground opacity-50" />
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">
                        {language === 'ar' ? 'لا توجد طلبات' : 'No Requests'}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {requestStatusFilter === 'all' 
                          ? (language === 'ar' 
                            ? 'لم يتم استلام أي طلبات لعروض الأسعار بعد'
                            : 'No price requests have been received yet')
                          : (language === 'ar'
                            ? `لا توجد طلبات ${requestStatusFilter === 'pending' ? 'قيد الانتظار' : 'مكتملة'}`
                            : `No ${requestStatusFilter} requests`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => {
                  const products = typeof request.products === 'string' 
                    ? JSON.parse(request.products) 
                    : request.products || [];
                  const isCompleted = isRequestCompleted(request);
                  
                  // Find linked offer
                  const linkedOffer = offers.find(o => o.requestId === request.id);

                  const client = clients.find(c => c.id === request.clientId);
                  const lta = ltas.find(l => l.id === request.ltaId);

                  return (
                    <Card key={request.id} className="hover-elevate">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-yellow-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-base sm:text-lg">
                                    {request.requestNumber}
                                  </h3>
                                  {linkedOffer && (
                                    <Badge variant="secondary" className="text-xs">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {linkedOffer.offerNumber}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium">
                                  {client?.nameEn || client?.nameAr || 'Unknown Client'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {language === 'ar' ? 'الاتفاقية:' : 'LTA:'} {lta?.nameEn || lta?.nameAr || 'Unknown LTA'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(request.requestedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge variant={isCompleted ? 'secondary' : 'default'}>
                                {isCompleted 
                                  ? (language === 'ar' ? 'مكتمل' : 'Completed')
                                  : (language === 'ar' ? 'قيد الانتظار' : 'Pending')}
                              </Badge>
                              <Badge variant="outline">
                                {products.length} {language === 'ar' ? 'منتج' : 'products'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRequest(request)}
                              className="w-full sm:w-auto"
                            >
                              <Eye className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                            </Button>
                            {!isCompleted && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateOffer(request)}
                                  className="w-full sm:w-auto"
                                >
                                  <FileText className="h-4 w-4 me-2" />
                                  {language === 'ar' ? 'إنشاء عرض' : 'Create Offer'}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Price Offers Tab */}
          <TabsContent value="offers" className="space-y-4">
            <div className="flex items-center justify-between">
              <Select value={offerStatusFilter} onValueChange={setOfferStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="sent">{language === 'ar' ? 'مُرسل' : 'Sent'}</SelectItem>
                  <SelectItem value="viewed">{language === 'ar' ? 'مُشاهد' : 'Viewed'}</SelectItem>
                  <SelectItem value="accepted">{language === 'ar' ? 'مقبول' : 'Accepted'}</SelectItem>
                  <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoadingOffers ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </p>
              </div>
            ) : filteredOffers.length === 0 ? (
              <Card className="border-2 border-dashed border-border/50 dark:border-[#d4af37]/20">
                <CardContent className="p-8 sm:p-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <FileText className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground opacity-50" />
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">
                        {language === 'ar' ? 'لا توجد عروض أسعار' : 'No Price Offers'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'لم يتم إنشاء أي عروض أسعار بعد' : 'No price offers have been created yet'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 dark:border-[#d4af37]/20 shadow-md hover:shadow-xl dark:hover:shadow-[#d4af37]/20 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'ar' ? 'رقم العرض' : 'Offer #'}</TableHead>
                          <TableHead>{language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                          <TableHead>{language === 'ar' ? 'الاتفاقية' : 'LTA'}</TableHead>
                          <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                          <TableHead>{language === 'ar' ? 'تاريخ الإرسال' : 'Sent Date'}</TableHead>
                          <TableHead>{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</TableHead>
                          <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOffers.map((offer) => {
                          const linkedRequest = offer.requestId 
                            ? priceRequests.find(r => r.id === offer.requestId)
                            : null;
                          
                          return (
                            <TableRow key={offer.id}>
                              <TableCell className="font-medium font-mono">
                                <div className="flex items-center gap-2">
                                  {offer.offerNumber}
                                  {linkedRequest && (
                                    <Badge variant="outline" className="text-xs">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {linkedRequest.requestNumber}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getClientName(offer.clientId)}</TableCell>
                              <TableCell>{getLtaName(offer.ltaId)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getOfferStatusIcon(offer.status)}
                                  {getStatusBadge(offer.status)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                              </TableCell>
                              <TableCell>
                                {new Date(offer.validUntil).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  {linkedRequest && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewRequest(linkedRequest)}
                                      title={language === 'ar' ? 'عرض الطلب الأصلي' : 'View original request'}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(offer.pdfFileName)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredOffers.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? `إجمالي ${filteredOffers.length} عرض سعر`
                  : `Total ${filteredOffers.length} price offer${filteredOffers.length !== 1 ? 's' : ''}`
                }
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Assign Price Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعيين سعر للمنتج' : 'Assign Product Price'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {language === 'ar' ? 'المنتج' : 'Product'}
              </p>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-base">
                  {selectedProduct && (language === 'ar' ? selectedProduct.nameAr : selectedProduct?.nameEn)}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  SKU: {selectedProduct?.sku}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lta-select">
                {language === 'ar' ? 'اختر الاتفاقية' : 'Select LTA'}
              </Label>
              <Select value={selectedLtaId} onValueChange={setSelectedLtaId}>
                <SelectTrigger id="lta-select">
                  <SelectValue placeholder={language === 'ar' ? 'اختر اتفاقية' : 'Select an LTA'} />
                </SelectTrigger>
                <SelectContent>
                  {ltas.map((lta) => (
                    <SelectItem key={lta.id} value={lta.id}>
                      {language === 'ar' ? lta.nameAr : lta.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-price">
                {language === 'ar' ? 'السعر التعاقدي' : 'Contract Price'}
              </Label>
              <Input
                id="contract-price"
                type="number"
                step="0.01"
                value={contractPrice}
                onChange={(e) => setContractPrice(e.target.value)}
                placeholder="0.00"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">
                {language === 'ar' ? 'العملة' : 'Currency'}
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="ILS">ILS</SelectItem>
                  <SelectItem value="JOD">JOD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPriceDialogOpen(false)}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmitPrice}
              disabled={assignProductMutation.isPending}
            >
              {assignProductMutation.isPending
                ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...')
                : (language === 'ar' ? 'إضافة' : 'Add')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={viewRequestDialogOpen} onOpenChange={setViewRequestDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تفاصيل طلب السعر' : 'Price Request Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{language === 'ar' ? 'رقم الطلب' : 'Request Number'}:</span>
                  <div className="mt-1 font-medium font-mono">{selectedRequest.requestNumber}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}:</span>
                  <div className="mt-1">
                    <Badge variant={selectedRequest.status === 'pending' ? 'default' : 'secondary'}>
                      {selectedRequest.status === 'pending' 
                        ? (language === 'ar' ? 'قيد الانتظار' : 'Pending')
                        : (language === 'ar' ? 'تمت المعالجة' : 'Processed')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === 'ar' ? 'العميل' : 'Client'}:</span>
                  <div className="mt-1 font-medium">{getClientName(selectedRequest.clientId)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === 'ar' ? 'الاتفاقية' : 'LTA'}:</span>
                  <div className="mt-1 font-medium">{getLtaName(selectedRequest.ltaId)}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{language === 'ar' ? 'التاريخ' : 'Date'}:</span>
                  <div className="mt-1 font-medium">
                    {new Date(selectedRequest.requestedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {language === 'ar' ? 'المنتجات المطلوبة' : 'Requested Products'}
                </h4>
                <div className="space-y-2">
                  {(typeof selectedRequest.products === 'string' 
                    ? JSON.parse(selectedRequest.products) 
                    : selectedRequest.products || []).map((product: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium">{language === 'ar' ? product.nameAr : product.nameEn}</div>
                        <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{language === 'ar' ? 'الكمية:' : 'Qty:'} {product.quantity || 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setViewRequestDialogOpen(false)}
                  >
                    {language === 'ar' ? 'إغلاق' : 'Close'}
                  </Button>
                  <Button onClick={() => handleCreateOffer(selectedRequest)}>
                    <FileText className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'إنشاء عرض سعر' : 'Create Offer'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Generation Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إنشاء مستند عرض السعر' : 'Generate Price Offer Document'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pdf-lta-select">
                {language === 'ar' ? 'اختر الاتفاقية' : 'Select LTA'}
              </Label>
              <Select value={pdfLtaId} onValueChange={setPdfLtaId}>
                <SelectTrigger id="pdf-lta-select">
                  <SelectValue placeholder={language === 'ar' ? 'اختر اتفاقية' : 'Select an LTA'} />
                </SelectTrigger>
                <SelectContent>
                  {ltas.map((lta) => (
                    <SelectItem key={lta.id} value={lta.id}>
                      {language === 'ar' ? lta.nameAr : lta.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validity-days">
                {language === 'ar' ? 'صلاحية العرض (أيام)' : 'Offer Validity (days)'}
              </Label>
              <Input
                id="validity-days"
                type="number"
                value={pdfValidityDays}
                onChange={(e) => setPdfValidityDays(e.target.value)}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf-notes">
                {language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)'}
              </Label>
              <Textarea
                id="pdf-notes"
                value={pdfNotes}
                onChange={(e) => setPdfNotes(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل أي ملاحظات إضافية...' : 'Enter any additional notes...'}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPdfDialogOpen(false)}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={() => {
                if (!pdfLtaId || !selectedRequestForPdf) {
                  toast({
                    variant: 'destructive',
                    title: language === 'ar' ? 'خطأ' : 'Error',
                    description: language === 'ar' ? 'يرجى اختيار اتفاقية' : 'Please select an LTA',
                  });
                  return;
                }
                generatePdfMutation.mutate({
                  notificationId: selectedRequestForPdf.id,
                  ltaId: pdfLtaId,
                  validityDays: parseInt(pdfValidityDays) || 30,
                  notes: pdfNotes || undefined,
                });
              }}
              disabled={generatePdfMutation.isPending}
            >
              {generatePdfMutation.isPending
                ? (language === 'ar' ? 'جاري الإنشاء...' : 'Generating...')
                : (language === 'ar' ? 'إنشاء PDF' : 'Generate PDF')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}