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
import { ArrowLeft, Check, Clock, Package, Download, Archive, FileText, Eye, CheckCircle, XCircle, AlertCircle, Plus, Users, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { safeJsonParse } from '@/lib/safeJson';
import PriceOfferCreationDialog from '@/components/PriceOfferCreationDialog';

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
  tax?: string | null;
  total?: string | null;
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
    productNameEn?: string; // Added for potential alternate names
    productNameAr?: string;
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
  const [location, setLocation] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<PriceRequest | null>(null);
  const [viewRequestDialogOpen, setViewRequestDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [contractPrice, setContractPrice] = useState('');
  const [currency, setCurrency] = useState('ILS');
  const [selectedLtaId, setSelectedLtaId] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [offerStatusFilter, setOfferStatusFilter] = useState<string>('all');
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [selectedRequestForPdf, setSelectedRequestForPdf] = useState<Notification | null>(null);
  const [pdfLtaId, setPdfLtaId] = useState('');
  const [pdfValidityDays, setPdfValidityDays] = useState('30');
  const [pdfNotes, setPdfNotes] = useState('');
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);
  const [createOfferDialogOpen, setCreateOfferDialogOpen] = useState(false);
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState<PriceRequest | null>(null);
  const [viewOfferDialogOpen, setViewOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PriceOffer | null>(null);

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
        // Set the selected request for the dialog
        setSelectedRequestForOffer(request);
        setCreateOfferDialogOpen(true);

        // Clear the URL parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('requestId');
        window.history.replaceState({}, '', newUrl.toString());

        toast({
          title: language === 'ar' ? 'تم تحميل طلب السعر' : 'Price Request Loaded',
          description: language === 'ar' 
            ? `تم تحميل الطلب ${request.requestNumber} لإنشاء عرض سعر` 
            : `Loaded request ${request.requestNumber} to create price offer`,
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

  const updateOfferStatusMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/price-offers/${offerId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث حالة العرض بنجاح' : 'Offer status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status'),
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

  const handleAssignPrice = (product: any, request: PriceRequest) => {
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

    assignProductMutation.mutate({
      ltaId: selectedLtaId,
      productId: selectedProduct.id,
      contractPrice,
      currency,
      clientId: selectedRequest?.clientId,
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
    setSelectedRequestForOffer(request);
    setCreateOfferDialogOpen(true);
  };

  const handleCreateOfferFromScratch = () => {
    setSelectedRequestForOffer(null);
    setCreateOfferDialogOpen(true);
  };

  const handleUpdateOfferStatus = (offerId: string, newStatus: string) => {
    updateOfferStatusMutation.mutate({ offerId, status: newStatus });
  };

  const handleViewOffer = (offer: PriceOffer) => {
    setSelectedOffer(offer);
    setViewOfferDialogOpen(true);
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
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary dark:hover:text-[#d4af37] hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-all duration-300 shrink-0"
            >
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary dark:text-[#d4af37] shrink-0" />
              <h1 className="text-base sm:text-xl font-semibold truncate bg-gradient-to-r from-primary to-primary/70 dark:from-[#d4af37] dark:to-[#d4af37]/70 bg-clip-text text-transparent">
                {language === 'ar' ? 'إدارة الأسعار' : 'Price Management'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              onClick={handleCreateOfferFromScratch}
              size="sm"
              className="bg-primary hover:bg-primary/90 dark:bg-[#d4af37] dark:hover:bg-[#d4af37]/90 text-primary-foreground dark:text-black shadow-md hover:shadow-lg transition-all duration-300 h-9 sm:h-10 px-2 sm:px-4"
            >
              <Plus className="h-4 w-4 sm:me-2" />
              <span className="hidden sm:inline">{language === 'ar' ? 'إنشاء عرض' : 'Create Offer'}</span>
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
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

        <Tabs defaultValue="requests" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 dark:bg-muted/30 shadow-sm">
            <TabsTrigger 
              value="requests" 
              className="gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-[#d4af37] dark:data-[state=active]:text-black data-[state=active]:shadow-md transition-all duration-300 py-2.5 sm:py-3 text-xs sm:text-sm"
            >
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">{language === 'ar' ? 'الطلبات' : 'Requests'}</span>
              {priceRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{priceRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="offers" 
              className="gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-[#d4af37] dark:data-[state=active]:text-black data-[state=active]:shadow-md transition-all duration-300 py-2.5 sm:py-3 text-xs sm:text-sm"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{language === 'ar' ? 'العروض' : 'Offers'}</span>
              {offers.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{offers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Price Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {/* Filter Tabs */}
            {priceRequests.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant={requestStatusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setRequestStatusFilter('all')}
                  className={`gap-1.5 shrink-0 transition-all duration-300 ${
                    requestStatusFilter === 'all' 
                      ? 'bg-primary dark:bg-[#d4af37] text-primary-foreground dark:text-black shadow-md' 
                      : 'hover:bg-primary/10 dark:hover:bg-[#d4af37]/10'
                  }`}
                  size="sm"
                >
                  <span className="text-xs sm:text-sm">{language === 'ar' ? 'الكل' : 'All'}</span>
                  <Badge 
                    variant={requestStatusFilter === 'all' ? 'secondary' : 'outline'}
                    className="h-5 min-w-5 px-1.5 text-xs"
                  >
                    {priceRequests.length}
                  </Badge>
                </Button>
                <Button
                  variant={requestStatusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setRequestStatusFilter('pending')}
                  className={`gap-1.5 shrink-0 transition-all duration-300 ${
                    requestStatusFilter === 'pending' 
                      ? 'bg-primary dark:bg-[#d4af37] text-primary-foreground dark:text-black shadow-md' 
                      : 'hover:bg-primary/10 dark:hover:bg-[#d4af37]/10'
                  }`}
                  size="sm"
                >
                  <span className="text-xs sm:text-sm">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
                  <Badge 
                    variant={requestStatusFilter === 'pending' ? 'secondary' : 'outline'}
                    className="h-5 min-w-5 px-1.5 text-xs"
                  >
                    {priceRequests.filter(r => r.status === 'pending').length}
                  </Badge>
                </Button>
                <Button
                  variant={requestStatusFilter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setRequestStatusFilter('completed')}
                  className={`gap-1.5 shrink-0 transition-all duration-300 ${
                    requestStatusFilter === 'completed' 
                      ? 'bg-primary dark:bg-[#d4af37] text-primary-foreground dark:text-black shadow-md' 
                      : 'hover:bg-primary/10 dark:hover:bg-[#d4af37]/10'
                  }`}
                  size="sm"
                >
                  <span className="text-xs sm:text-sm">{language === 'ar' ? 'مكتمل' : 'Completed'}</span>
                  <Badge 
                    variant={requestStatusFilter === 'completed' ? 'secondary' : 'outline'}
                    className="h-5 min-w-5 px-1.5 text-xs"
                  >
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
                    <Card key={request.id} className="hover-elevate border-l-4 border-l-primary dark:border-l-[#d4af37] shadow-sm hover:shadow-md transition-all duration-300">
                      <CardContent className="p-3 sm:p-6">
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-yellow-100 dark:bg-yellow-900/30'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-sm sm:text-base font-mono">
                                  {request.requestNumber}
                                </h3>
                                {linkedOffer && (
                                  <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700 dark:bg-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {linkedOffer.offerNumber}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium text-foreground mb-1">
                                {client?.nameEn || client?.nameAr || 'Unknown Client'}
                              </p>
                              <p className="text-xs text-muted-foreground mb-1">
                                {language === 'ar' ? 'الاتفاقية:' : 'LTA:'} {lta?.nameEn || lta?.nameAr || 'Unknown LTA'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(request.requestedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              variant={isCompleted ? 'secondary' : 'default'}
                              className={isCompleted 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-primary dark:bg-[#d4af37] text-primary-foreground dark:text-black'}
                            >
                              {isCompleted 
                                ? (language === 'ar' ? 'مكتمل' : 'Completed')
                                : (language === 'ar' ? 'قيد الانتظار' : 'Pending')}
                            </Badge>
                            <Badge variant="outline" className="border-primary/50 dark:border-[#d4af37]/50">
                              <Package className="h-3 w-3 mr-1" />
                              {products.length} {language === 'ar' ? 'منتج' : 'items'}
                            </Badge>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRequest(request)}
                              className="w-full sm:w-auto hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-colors text-xs sm:text-sm"
                            >
                              <Eye className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'التفاصيل' : 'Details'}
                            </Button>
                            {!isCompleted && (
                              <Button
                                size="sm"
                                onClick={() => handleCreateOffer(request)}
                                className="w-full sm:w-auto bg-primary hover:bg-primary/90 dark:bg-[#d4af37] dark:hover:bg-[#d4af37]/90 shadow-sm hover:shadow-md transition-all text-xs sm:text-sm"
                              >
                                <FileText className="h-4 w-4 me-2" />
                                {language === 'ar' ? 'إنشاء عرض' : 'Create Offer'}
                              </Button>
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
            {/* Filter Bar with Stats */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-[#d4af37]/5 dark:to-[#d4af37]/10 rounded-lg border border-primary/20 dark:border-[#d4af37]/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-[#d4af37]/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground dark:text-white">
                    {language === 'ar' ? 'عروض الأسعار' : 'Price Offers'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? `${filteredOffers.length} عرض` : `${filteredOffers.length} offers`}
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <Select value={offerStatusFilter} onValueChange={setOfferStatusFilter}>
                  <SelectTrigger className="w-full sm:w-56 h-10 border-primary/30 dark:border-[#d4af37]/30 focus:border-primary dark:focus:border-[#d4af37] shadow-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-primary/70 dark:from-[#d4af37] dark:to-[#d4af37]/70" />
                        {language === 'ar' ? 'جميع العروض' : 'All Offers'}
                      </div>
                    </SelectItem>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                        {language === 'ar' ? 'مسودة' : 'Draft'}
                      </div>
                    </SelectItem>
                    <SelectItem value="sent">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        {language === 'ar' ? 'مُرسل' : 'Sent'}
                      </div>
                    </SelectItem>
                    <SelectItem value="viewed">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        {language === 'ar' ? 'مُشاهد' : 'Viewed'}
                      </div>
                    </SelectItem>
                    <SelectItem value="accepted">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        {language === 'ar' ? 'مقبول' : 'Accepted'}
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        {language === 'ar' ? 'مرفوض' : 'Rejected'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <>
                {/* Desktop Table View */}
                <Card className="hidden md:block border-border/50 dark:border-[#d4af37]/20 shadow-md hover:shadow-xl dark:hover:shadow-[#d4af37]/20 transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === 'ar' ? 'رقم العرض' : 'Offer #'}</TableHead>
                            <TableHead>{language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الاتفاقية' : 'LTA'}</TableHead>
                            <TableHead>{language === 'ar' ? 'المنتجات' : 'Items'}</TableHead>
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
                            const isExpired = new Date(offer.validUntil) < new Date();

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
                                  <div className="max-w-xs">
                                    {(() => {
                                      try {
                                        const items = typeof offer.items === 'string' 
                                          ? JSON.parse(offer.items) 
                                          : (Array.isArray(offer.items) ? offer.items : []);

                                        if (!Array.isArray(items) || items.length === 0) {
                                          return (
                                            <span className="text-muted-foreground text-sm">
                                              {language === 'ar' ? 'لا توجد منتجات' : 'No items'}
                                            </span>
                                          );
                                        }

                                        return (
                                          <div className="space-y-1">
                                            {items.slice(0, 2).map((item: any, idx: number) => {
                                              const name = language === 'ar' 
                                                ? (item.nameAr || item.productNameAr || item.nameEn || item.productNameEn || item.name || 'منتج غير معروف')
                                                : (item.nameEn || item.productNameEn || item.nameAr || item.productNameAr || item.name || 'Unknown Product');

                                              return (
                                                <div key={idx} className="text-sm">
                                                  <div className="font-medium truncate">
                                                    {name}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                    {item.quantity || 1}x {item.unitPrice || '0.00'} {item.currency || 'ILS'}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                            {items.length > 2 && (
                                              <div className="text-xs text-muted-foreground">
                                                +{items.length - 2} {language === 'ar' ? 'أخرى' : 'more'}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      } catch (error) {
                                        console.error('Error parsing items:', error);
                                        return (
                                          <span className="text-muted-foreground text-sm">
                                            {language === 'ar' ? 'خطأ في عرض المنتجات' : 'Error displaying items'}
                                          </span>
                                        );
                                      }
                                    })()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={offer.status}
                                    onValueChange={(newStatus) => handleUpdateOfferStatus(offer.id, newStatus)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <div className="flex items-center gap-2">
                                        {getOfferStatusIcon(isExpired ? 'expired' : offer.status)}
                                        <SelectValue />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                                      <SelectItem value="sent">{language === 'ar' ? 'مُرسل' : 'Sent'}</SelectItem>
                                      <SelectItem value="viewed">{language === 'ar' ? 'مُشاهد' : 'Viewed'}</SelectItem>
                                      <SelectItem value="accepted">{language === 'ar' ? 'مقبول' : 'Accepted'}</SelectItem>
                                      <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                                </TableCell>
                                <TableCell>
                                  <div className={isExpired ? 'text-destructive font-medium' : ''}>
                                    {new Date(offer.validUntil).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                    {isExpired && (
                                      <Badge variant="destructive" className="ml-2 text-xs">
                                        {language === 'ar' ? 'منتهي' : 'Expired'}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewOffer(offer)}
                                      title={language === 'ar' ? 'عرض تفاصيل العرض' : 'View offer details'}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {linkedRequest && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewRequest(linkedRequest)}
                                        title={language === 'ar' ? 'عرض الطلب الأصلي' : 'View original request'}
                                      >
                                        <FileText className="h-4 w-4" />
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

                {/* Mobile Card View */}
                <div className="md:hidden grid gap-3">
                  {filteredOffers.map((offer) => {
                    const linkedRequest = offer.requestId 
                      ? priceRequests.find(r => r.id === offer.requestId)
                      : null;
                    const isExpired = new Date(offer.validUntil) < new Date();

                    return (
                      <Card key={offer.id} className="overflow-hidden border-l-4 border-l-primary dark:border-l-[#d4af37] shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-accent/5 dark:from-black dark:to-[#d4af37]/5">
                        <CardContent className="p-4 space-y-4">
                          {/* Header with Gradient Background */}
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/50 dark:border-[#d4af37]/20">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono font-bold text-base mb-2 bg-gradient-to-r from-primary to-primary/70 dark:from-[#d4af37] dark:to-[#d4af37]/70 bg-clip-text text-transparent">
                                {offer.offerNumber}
                              </div>
                              {linkedRequest && (
                                <Badge variant="outline" className="text-xs border-primary/50 dark:border-[#d4af37]/50 bg-primary/5 dark:bg-[#d4af37]/5">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {linkedRequest.requestNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#d4af37]/10 flex items-center justify-center border-2 border-primary/30 dark:border-[#d4af37]/30">
                              {getOfferStatusIcon(isExpired ? 'expired' : offer.status)}
                            </div>
                          </div>

                          {/* Client & LTA Info - Enhanced */}
                          <div className="space-y-3 p-3 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50 dark:border-[#d4af37]/10">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span className="text-xs">{language === 'ar' ? 'العميل' : 'Client'}</span>
                              </div>
                              <span className="font-medium text-sm text-right">{getClientName(offer.clientId)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Package className="h-4 w-4" />
                                <span className="text-xs">{language === 'ar' ? 'الاتفاقية' : 'LTA'}</span>
                              </div>
                              <span className="font-medium text-sm text-right">{getLtaName(offer.ltaId)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span className="text-xs">{language === 'ar' ? 'المنتجات' : 'Items'}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {(() => {
                                  try {
                                    const items = typeof offer.items === 'string' 
                                      ? JSON.parse(offer.items) 
                                      : (Array.isArray(offer.items) ? offer.items : []);
                                    return Array.isArray(items) && items.length > 0 ? `${items.length} ${language === 'ar' ? 'منتج' : 'items'}` : (language === 'ar' ? 'لا توجد' : 'None');
                                  } catch {
                                    return language === 'ar' ? 'خطأ' : 'Error';
                                  }
                                })()}
                              </Badge>
                            </div>
                          </div>

                          {/* Status Selector - Enhanced */}
                          <div className="space-y-2 p-3 bg-primary/5 dark:bg-[#d4af37]/5 rounded-lg border border-primary/20 dark:border-[#d4af37]/20">
                            <Label className="text-xs font-semibold text-foreground dark:text-white flex items-center gap-2">
                              <AlertCircle className="h-3 w-3" />
                              {language === 'ar' ? 'حالة العرض' : 'Offer Status'}
                            </Label>
                            <Select
                              value={offer.status}
                              onValueChange={(newStatus) => handleUpdateOfferStatus(offer.id, newStatus)}
                            >
                              <SelectTrigger className="w-full h-10 border-primary/30 dark:border-[#d4af37]/30 bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                                <SelectItem value="sent">{language === 'ar' ? 'مُرسل' : 'Sent'}</SelectItem>
                                <SelectItem value="viewed">{language === 'ar' ? 'مُشاهد' : 'Viewed'}</SelectItem>
                                <SelectItem value="accepted">{language === 'ar' ? 'مقبول' : 'Accepted'}</SelectItem>
                                <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Dates - Enhanced */}
                          <div className="space-y-3 p-3 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50 dark:border-[#d4af37]/10">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs">{language === 'ar' ? 'تاريخ الإرسال' : 'Sent Date'}</span>
                              </div>
                              <span className="text-sm font-medium">
                                {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : '-'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                <span className="text-xs">{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</span>
                              </div>
                              <span className={`text-sm font-medium ${isExpired ? 'text-destructive' : ''}`}>
                                {new Date(offer.validUntil).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            {isExpired && (
                              <Badge variant="destructive" className="w-full justify-center text-xs py-1.5">
                                <XCircle className="h-3 w-3 mr-1" />
                                {language === 'ar' ? 'منتهي الصلاحية' : 'Expired'}
                              </Badge>
                            )}
                          </div>

                          {/* Actions - Enhanced with Touch Targets */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/20 dark:border-[#d4af37]/20">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOffer(offer)}
                              className="h-10 border-primary/30 dark:border-[#d4af37]/30 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:border-primary dark:hover:border-[#d4af37] transition-all"
                            >
                              <Eye className="h-4 w-4 me-1.5" />
                              <span className="text-xs">{language === 'ar' ? 'التفاصيل' : 'Details'}</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownload(offer.pdfFileName)}
                              className="h-10 bg-primary hover:bg-primary/90 dark:bg-[#d4af37] dark:hover:bg-[#d4af37]/90 shadow-sm hover:shadow-md transition-all"
                            >
                              <Download className="h-4 w-4 me-1.5" />
                              <span className="text-xs">{language === 'ar' ? 'تحميل' : 'Download'}</span>
                            </Button>
                            {linkedRequest && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRequest(linkedRequest)}
                                className="col-span-2 h-10 border-primary/30 dark:border-[#d4af37]/30 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:border-primary dark:hover:border-[#d4af37] transition-all"
                              >
                                <FileText className="h-4 w-4 me-1.5" />
                                <span className="text-xs">{language === 'ar' ? 'عرض الطلب الأصلي' : 'View Original Request'}</span>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {filteredOffers.length > 0 && (
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                {language === 'ar' 
                  ? `إجمالي ${filteredOffers.length} عرض سعر`
                  : `Total ${filteredOffers.length} price offer${filteredOffers.length !== 1 ? 's' : ''}`
                }
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Price Offer Creation Dialog */}
      <PriceOfferCreationDialog
        open={createOfferDialogOpen}
        onOpenChange={setCreateOfferDialogOpen}
        requestId={selectedRequestForOffer?.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/price-requests'] });
          setSelectedRequestForOffer(null);
        }}
      />

      {/* Assign Price Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {language === 'ar' ? 'تعيين سعر للمنتج' : 'Assign Product Price'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                {language === 'ar' ? 'المنتج' : 'Product'}
              </p>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm sm:text-base">
                  {selectedProduct && (language === 'ar' ? selectedProduct.nameAr : selectedProduct?.nameEn)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                  SKU: {selectedProduct?.sku}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lta-select" className="text-xs sm:text-sm">
                {language === 'ar' ? 'اختر الاتفاقية' : 'Select LTA'}
              </Label>
              <Select value={selectedLtaId} onValueChange={setSelectedLtaId}>
                <SelectTrigger id="lta-select" className="h-10 text-sm">
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
              <Label htmlFor="contract-price" className="text-xs sm:text-sm">
                {language === 'ar' ? 'السعر التعاقدي' : 'Contract Price'}
              </Label>
              <Input
                id="contract-price"
                type="number"
                step="0.01"
                value={contractPrice}
                onChange={(e) => setContractPrice(e.target.value)}
                placeholder="0.00"
                className="font-mono h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-xs sm:text-sm">
                {language === 'ar' ? 'العملة' : 'Currency'}
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency" className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">ILS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="JOD">JOD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPriceDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmitPrice}
              disabled={assignProductMutation.isPending}
              className="w-full sm:w-auto order-1 sm:order-2"
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
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {language === 'ar' ? 'تفاصيل طلب السعر' : 'Price Request Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">{language === 'ar' ? 'رقم الطلب' : 'Request Number'}:</span>
                  <div className="mt-1 font-medium font-mono text-sm sm:text-base">{selectedRequest.requestNumber}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}:</span>
                  <div className="mt-1">
                    <Badge variant={selectedRequest.status === 'pending' ? 'default' : 'secondary'} className="text-xs">
                      {selectedRequest.status === 'pending' 
                        ? (language === 'ar' ? 'قيد الانتظار' : 'Pending')
                        : (language === 'ar' ? 'تمت المعالجة' : 'Processed')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === 'ar' ? 'العميل' : 'Client'}:</span>
                  <div className="mt-1 font-medium text-sm sm:text-base">{getClientName(selectedRequest.clientId)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === 'ar' ? 'الاتفاقية' : 'LTA'}:</span>
                  <div className="mt-1 font-medium text-sm sm:text-base">{getLtaName(selectedRequest.ltaId)}</div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">{language === 'ar' ? 'التاريخ' : 'Date'}:</span>
                  <div className="mt-1 font-medium text-sm sm:text-base">
                    {new Date(selectedRequest.requestedAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Jerusalem'
                    })}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 sm:p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  {language === 'ar' ? 'المنتجات المطلوبة' : 'Requested Products'}
                </h4>
                <div className="space-y-2">
                  {(typeof selectedRequest.products === 'string' 
                    ? JSON.parse(selectedRequest.products) 
                    : selectedRequest.products || []).map((product: any, idx: number) => {
                      // Handle different product name formats
                      const productName = language === 'ar' 
                        ? (product.nameAr || product.nameEn || product.name || 'منتج غير معروف')
                        : (product.nameEn || product.nameAr || product.name || 'Unknown Product');

                      return (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base mb-1 truncate">
                              {productName}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              SKU: {product.sku || 'N/A'}
                            </div>
                            {product.unit && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {language === 'ar' ? 'الوحدة:' : 'Unit:'} {product.unit}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold text-base sm:text-lg">{product.quantity || 1}</div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">{language === 'ar' ? 'الكمية' : 'Quantity'}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setViewRequestDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    {language === 'ar' ? 'إغلاق' : 'Close'}
                  </Button>
                  <Button onClick={() => handleCreateOffer(selectedRequest)} className="w-full sm:w-auto">
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
        <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {language === 'ar' ? 'إنشاء مستند عرض السعر' : 'Generate Price Offer Document'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pdf-lta-select" className="text-xs sm:text-sm">
                {language === 'ar' ? 'اختر الاتفاقية' : 'Select LTA'}
              </Label>
              <Select value={pdfLtaId} onValueChange={setPdfLtaId}>
                <SelectTrigger id="pdf-lta-select" className="h-10 text-sm">
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
              <Label htmlFor="validity-days" className="text-xs sm:text-sm">
                {language === 'ar' ? 'صلاحية العرض (أيام)' : 'Offer Validity (days)'}
              </Label>
              <Input
                id="validity-days"
                type="number"
                value={pdfValidityDays}
                onChange={(e) => setPdfValidityDays(e.target.value)}
                placeholder="30"
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf-notes" className="text-xs sm:text-sm">
                {language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)'}
              </Label>
              <Textarea
                id="pdf-notes"
                value={pdfNotes}
                onChange={(e) => setPdfNotes(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل أي ملاحظات إضافية...' : 'Enter any additional notes...'}
                rows={4}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPdfDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
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
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {generatePdfMutation.isPending
                ? (language === 'ar' ? 'جاري الإنشاء...' : 'Generating...')
                : (language === 'ar' ? 'إنشاء PDF' : 'Generate PDF')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Offer Details Dialog */}
      <Dialog open={viewOfferDialogOpen} onOpenChange={setViewOfferDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              {language === 'ar' ? 'تفاصيل عرض السعر' : 'Price Offer Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header Card with Key Info */}
              <Card className="border-l-4 border-l-primary dark:border-l-[#d4af37] bg-gradient-to-r from-primary/5 to-transparent dark:from-[#d4af37]/5">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-2xl font-bold font-mono mb-1">
                        {selectedOffer.offerNumber}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(selectedOffer.status)}
                        {new Date(selectedOffer.validUntil) < new Date() && (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'منتهي' : 'Expired'}
                          </Badge>
                        )}
                        {selectedOffer.requestId && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'من طلب' : 'From Request'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">
                        {language === 'ar' ? 'تم الإنشاء في' : 'Created on'}
                      </div>
                      <div className="text-sm font-medium">
                        {new Date(selectedOffer.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offer Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{language === 'ar' ? 'العميل' : 'Client'}</span>
                    </div>
                    <div className="font-medium text-sm">{getClientName(selectedOffer.clientId)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{language === 'ar' ? 'الاتفاقية' : 'LTA'}</span>
                    </div>
                    <div className="font-medium text-sm">{getLtaName(selectedOffer.ltaId)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</span>
                    </div>
                    <div className={`font-medium text-sm ${new Date(selectedOffer.validUntil) < new Date() ? 'text-destructive' : ''}`}>
                      {new Date(selectedOffer.validUntil).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </CardContent>
                </Card>

                {selectedOffer.sentAt && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{language === 'ar' ? 'تاريخ الإرسال' : 'Sent Date'}</span>
                      </div>
                      <div className="font-medium text-sm">
                        {new Date(selectedOffer.sentAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedOffer.viewedAt && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{language === 'ar' ? 'تاريخ المشاهدة' : 'Viewed Date'}</span>
                      </div>
                      <div className="font-medium text-sm">
                        {new Date(selectedOffer.viewedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedOffer.respondedAt && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{language === 'ar' ? 'تاريخ الرد' : 'Response Date'}</span>
                      </div>
                      <div className="font-medium text-sm">
                        {new Date(selectedOffer.respondedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Items Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5" />
                    {language === 'ar' ? 'منتجات العرض' : 'Offer Items'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {(() => {
                    try {
                      const items = typeof selectedOffer.items === 'string' 
                        ? JSON.parse(selectedOffer.items) 
                        : (Array.isArray(selectedOffer.items) ? selectedOffer.items : []);

                      if (!Array.isArray(items) || items.length === 0) {
                        return (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            {language === 'ar' ? 'لا توجد منتجات في هذا العرض' : 'No items in this offer'}
                          </div>
                        );
                      }

                      // Get currency (assume all items have same currency)
                      const currency = items[0]?.currency || 'ILS';

                      return (
                        <>
                          {/* Desktop Table */}
                          <div className="hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">#</TableHead>
                                  <TableHead>{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                                  <TableHead className="w-32">{language === 'ar' ? 'رمز المنتج' : 'SKU'}</TableHead>
                                  <TableHead className="w-24 text-right">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                                  <TableHead className="w-32 text-right">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                                  <TableHead className="w-32 text-right">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map((item: any, idx: number) => {
                                  const itemPrice = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
                                  const itemQuantity = Number(item.quantity) || 0;
                                  const total = itemPrice * itemQuantity;
                                  const name = language === 'ar' 
                                    ? (item.nameAr || item.productNameAr || item.nameEn || item.productNameEn || item.name || 'منتج غير معروف')
                                    : (item.nameEn || item.productNameEn || item.nameAr || item.productNameAr || item.name || 'Unknown Product');

                                  return (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">{idx + 1}</TableCell>
                                      <TableCell>
                                        <div className="font-medium">{name}</div>
                                      </TableCell>
                                      <TableCell>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">{item.sku || 'N/A'}</code>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">{itemQuantity}</TableCell>
                                      <TableCell className="text-right">
                                        {itemPrice.toFixed(2)} {item.currency || currency}
                                      </TableCell>
                                      <TableCell className="text-right font-semibold">
                                        {total.toFixed(2)} {item.currency || currency}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="md:hidden space-y-3 p-4">
                            {items.map((item: any, idx: number) => {
                              const itemPrice = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
                              const itemQuantity = Number(item.quantity) || 0;
                              const total = itemPrice * itemQuantity;
                              const name = language === 'ar' 
                                ? (item.nameAr || item.productNameAr || item.nameEn || item.productNameEn || item.name || 'منتج غير معروف')
                                : (item.nameEn || item.productNameEn || item.nameAr || item.productNameAr || item.name || 'Unknown Product');

                              return (
                                <div key={idx} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs shrink-0">#{idx + 1}</Badge>
                                        <div className="font-medium text-sm truncate">{name}</div>
                                      </div>
                                      <code className="text-xs bg-background px-2 py-1 rounded">
                                        {item.sku || 'N/A'}
                                      </code>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="text-center p-2 bg-background rounded">
                                      <div className="text-muted-foreground mb-1">{language === 'ar' ? 'الكمية' : 'Qty'}</div>
                                      <div className="font-semibold">{itemQuantity}</div>
                                    </div>
                                    <div className="text-center p-2 bg-background rounded">
                                      <div className="text-muted-foreground mb-1">{language === 'ar' ? 'السعر' : 'Price'}</div>
                                      <div className="font-semibold">{itemPrice.toFixed(2)}</div>
                                    </div>
                                    <div className="text-center p-2 bg-primary/10 dark:bg-[#d4af37]/10 rounded">
                                      <div className="text-muted-foreground mb-1">{language === 'ar' ? 'المجموع' : 'Total'}</div>
                                      <div className="font-bold">{total.toFixed(2)}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    } catch (error) {
                      console.error('Error parsing offer items:', error);
                      return (
                        <div className="text-center py-8 text-sm text-muted-foreground p-4">
                          {language === 'ar' ? 'خطأ في عرض المنتجات' : 'Error displaying items'}
                        </div>
                      );
                    }
                  })()}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              {(() => {
                const items = typeof selectedOffer.items === 'string' 
                  ? JSON.parse(selectedOffer.items) 
                  : selectedOffer.items || [];
                if (items.length > 0) {
                  const currency = items[0]?.currency || 'ILS';
                  const subtotal = items.reduce((sum: number, item: any) => {
                    const price = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
                    const quantity = Number(item.quantity) || 0;
                    return sum + (price * quantity);
                  }, 0);
                  const tax = parseFloat(selectedOffer.tax || '0');
                  const total = parseFloat(selectedOffer.total || subtotal.toString());

                  return (
                    <Card className="border-2 border-primary/20 dark:border-[#d4af37]/20 bg-gradient-to-br from-primary/5 to-transparent dark:from-[#d4af37]/5">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                            <h4 className="font-semibold">{language === 'ar' ? 'الملخص المالي' : 'Financial Summary'}</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}:</span>
                              <span className="font-medium">{subtotal.toFixed(2)} {currency}</span>
                            </div>
                            {tax > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{language === 'ar' ? 'الضريبة' : 'Tax'}:</span>
                                <span className="font-medium">{tax.toFixed(2)} {currency}</span>
                              </div>
                            )}
                            <div className="border-t pt-2 flex justify-between items-center text-lg font-bold">
                              <span>{language === 'ar' ? 'المجموع الإجمالي' : 'Total Amount'}:</span>
                              <span className="text-primary dark:text-[#d4af37]">{total.toFixed(2)} {currency}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            {language === 'ar' 
                              ? `${items.length} منتج • إجمالي ${items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)} وحدة`
                              : `${items.length} item${items.length !== 1 ? 's' : ''} • ${items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)} total units`
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}

              {/* Notes and Response */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedOffer.notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {language === 'ar' ? 'ملاحظات العرض' : 'Offer Notes'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedOffer.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedOffer.responseNote && (
                  <Card className={selectedOffer.status === 'accepted' ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {selectedOffer.status === 'accepted' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        {language === 'ar' ? 'رد العميل' : 'Client Response'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedOffer.responseNote}
                      </p>
                      {selectedOffer.respondedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(selectedOffer.respondedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-2">
                  {selectedOffer.requestId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const request = priceRequests.find(r => r.id === selectedOffer.requestId);
                        if (request) {
                          handleViewRequest(request);
                          setViewOfferDialogOpen(false);
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      <FileText className="h-4 w-4 me-2" />
                      {language === 'ar' ? 'عرض الطلب الأصلي' : 'View Original Request'}
                    </Button>
                  )}
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewOfferDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    {language === 'ar' ? 'إغلاق' : 'Close'}
                  </Button>
                  <Button
                    onClick={() => handleDownload(selectedOffer.pdfFileName)}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 dark:bg-[#d4af37] dark:hover:bg-[#d4af37]/90"
                  >
                    <Download className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
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