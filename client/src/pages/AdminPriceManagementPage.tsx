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
import { ArrowLeft, Check, Clock, Package, Archive, FileText, Eye, CheckCircle, XCircle, AlertCircle, Plus, Users, Calendar as CalendarIcon, DollarSign, Trash2, Send, Edit, ChevronDown, Filter, Search, X, Printer, FileSpreadsheet } from 'lucide-react';
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

interface Product {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  unit?: string | null;
  unitType?: string | null;
}

// Price Offer Template Configuration
const PRICE_OFFER_TEMPLATE = {
  company: {
    nameAr: 'شركة القاضي للمواد الاستهلاكية والتسويق',
    nameEn: 'Al Qadi Trading Company',
    addressAr: 'البيرة – أمّ الشرايط، فلسطين',
    addressEn: 'Al-Bireh – Um Al-Shrayt, Palestine',
    phone: '009705925555532',
    phoneLabel: '(قسم المبيعات)',
    email: 'info@qadi.ps',
    website: 'qadi.ps',
    taxRegistrationNumber: '...',
  },
  headerTitle: {
    ar: 'عرض سعر',
    en: 'Price Offer',
  },
  termsAndConditions: {
    ar: `الأسعار: تشمل ضريبة القيمة المضافة دائمًا.
الصلاحية: يسري العرض لمدة ({validityDays} يومًا) من تاريخ الإصدار.
التوريد: خلال ({deliveryDays} أيام عمل) من تأكيد الطلب/الدفع، حسب التوفّر.
التسليم: إلى موقع العميل، وقد تُضاف كلفة شحن بحسب الموقع والكمية.
الدفع: ({paymentTerms}) حسب الاتفاق المكتوب.
الضمان: مطابقة المواصفات، وتُقبل الملاحظات خلال ({warrantyDays} أيام) من التسليم.
الإلغاء: قبل بدء التجهيز الفعلي؛ وتُحمّل أي تكاليف مترتبة على طالب الإلغاء.
أخرى: يحق للشركة مراجعة المواعيد عند ظروف قاهرة أو تغيّرات سوقية جوهرية.`,
    en: `Prices: Always include VAT.
Validity: Offer is valid for ({validityDays} days) from the issue date.
Supply: Within ({deliveryDays} working days) from order confirmation/payment, subject to availability.
Delivery: To client location, shipping costs may be added based on location and quantity.
Payment: ({paymentTerms}) as per written agreement.
Warranty: Specification compliance, and comments accepted within ({warrantyDays} days) of delivery.
Cancellation: Before actual preparation begins; any costs incurred are charged to the cancelling party.
Other: The company reserves the right to review schedules in case of force majeure or significant market changes.`,
  },
  footer: {
    ar: `شركة القاضي – info@qadi.ps – qadi.ps
المبيعات: 00970592555532 | اللوجستيات والتسليم: 0592555534 | الحسابات: 0592555536`,
    en: `Al Qadi Company – info@qadi.ps – qadi.ps
Sales: 00970592555532 | Logistics & Delivery: 0592555534 | Accounts: 0592555536`,
  },
};

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
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);
  const [createOfferDialogOpen, setCreateOfferDialogOpen] = useState(false);
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState<PriceRequest | null>(null);
  const [viewOfferDialogOpen, setViewOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PriceOffer | null>(null);
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [offerSearchQuery, setOfferSearchQuery] = useState('');
  const [selectedOffers, setSelectedOffers] = useState<Set<string>>(new Set());
  const [editableTerms, setEditableTerms] = useState<string>('');

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

  // Fetch products for enriching offer items with description and unit
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/all'],
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

  const sendOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const res = await apiRequest('POST', `/api/admin/price-offers/${offerId}/send`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send offer');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إرسال العرض' : 'Offer Sent',
        description: language === 'ar' ? 'تم إرسال عرض السعر بنجاح' : 'Price offer sent successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/price-offers/${offerId}`);
      if (!res.ok) {
        throw new Error('Failed to delete offer');
      }
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف عرض السعر بنجاح' : 'Price offer deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  const bulkDeleteOffersMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest('POST', '/api/admin/price-offers/bulk-delete', { ids });
      if (!res.ok) {
        throw new Error('Failed to delete offers');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف عروض الأسعار بنجاح' : 'Price offers deleted successfully',
      });
      setSelectedOffers(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  const handleDeleteOffer = (offerId: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العرض؟' : 'Are you sure you want to delete this offer?')) {
      deleteOfferMutation.mutate(offerId);
    }
  };

  const handleBulkDeleteOffers = () => {
    if (confirm(language === 'ar' ? `هل أنت متأكد من حذف ${selectedOffers.size} عروض؟` : `Are you sure you want to delete ${selectedOffers.size} offers?`)) {
      bulkDeleteOffersMutation.mutate(Array.from(selectedOffers));
    }
  };

  const toggleOfferSelection = (offerId: string) => {
    const newSelection = new Set(selectedOffers);
    if (newSelection.has(offerId)) {
      newSelection.delete(offerId);
    } else {
      newSelection.add(offerId);
    }
    setSelectedOffers(newSelection);
  };

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

  // Helper function to enrich offer items with product details
  const enrichOfferItems = (items: any[]): any[] => {
    return items.map((item: any) => {
      // Try to find product by productId first, then by SKU
      const product = products.find((p: Product) => 
        p.id === item.productId || p.sku === item.sku
      );
      
      return {
        ...item,
        descriptionAr: product?.descriptionAr || item.descriptionAr || '-',
        descriptionEn: product?.descriptionEn || item.descriptionEn || '-',
        unit: product?.unit || item.unit || '-',
        discount: item.discount || 0,
      };
    });
  };

  // Helper function to calculate validity days from offer
  const calculateValidityDays = (validUntil: string): number => {
    const now = new Date();
    const valid = new Date(validUntil);
    const diffTime = valid.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Helper function to escape HTML to prevent XSS
  const escapeHtml = (text: string | null | undefined): string => {
    if (!text) return '';
    // Use browser's native escaping via textContent
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Helper function to format terms and conditions with dynamic values
  const formatTermsAndConditions = (offer: PriceOffer): string => {
    const validityDays = calculateValidityDays(offer.validUntil);
    const deliveryDays = 30; // Default, can be customized
    const paymentTerms = 'تحويل بنكي/نقدًا عند التسليم/آجل 30 يومًا'; // Default
    const warrantyDays = 7; // Default
    
    const termsTemplate = PRICE_OFFER_TEMPLATE.termsAndConditions[language === 'ar' ? 'ar' : 'en'];
    return termsTemplate
      .replace('{validityDays}', validityDays.toString())
      .replace('{deliveryDays}', deliveryDays.toString())
      .replace('{paymentTerms}', paymentTerms)
      .replace('{warrantyDays}', warrantyDays.toString());
  };

  const handlePrintOffer = (offer: PriceOffer) => {
    const items = safeJsonParse(offer.items, []);
    const enrichedItems = enrichOfferItems(items);
    const client = clients.find(c => c.id === offer.clientId);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل فتح نافذة الطباعة' : 'Failed to open print window',
      });
      return;
    }

    const companyName = language === 'ar' ? PRICE_OFFER_TEMPLATE.company.nameAr : PRICE_OFFER_TEMPLATE.company.nameEn;
    const headerTitle = language === 'ar' ? PRICE_OFFER_TEMPLATE.headerTitle.ar : PRICE_OFFER_TEMPLATE.headerTitle.en;
    const footerText = language === 'ar' ? PRICE_OFFER_TEMPLATE.footer.ar : PRICE_OFFER_TEMPLATE.footer.en;
    const termsText = editableTerms || formatTermsAndConditions(offer);
    const currency = enrichedItems[0]?.currency || 'ILS';
    const subtotal = enrichedItems.reduce((sum: number, item: any) => {
      const price = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
      const quantity = Number(item.quantity) || 0;
      const discount = parseFloat(String(item.discount || '0')) || 0;
      return sum + (price * quantity - discount);
    }, 0);
    const tax = parseFloat(offer.tax || '0');
    const total = parseFloat(offer.total || subtotal.toString());

    const html = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <title>${headerTitle} #${offer.offerNumber}</title>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;
              padding: 20px;
              max-width: 100%;
              direction: ${language === 'ar' ? 'rtl' : 'ltr'};
              font-size: 11pt;
              line-height: 1.5;
              color: #2c3e50;
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 4px solid #d4af37;
              position: relative;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: -4px;
              left: 50%;
              transform: translateX(-50%);
              width: 100px;
              height: 4px;
              background: #1a365d;
            }
            .company-name {
              font-size: 22pt;
              font-weight: bold;
              color: #1a365d;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
            }
            .company-details {
              font-size: 10pt;
              color: #555;
              margin-top: 8px;
              line-height: 1.8;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0 20px;
              justify-items: start;
            }
            .company-details div {
              margin: 2px 0;
            }
            .offer-title {
              color: #555;
              margin-top: 12px;
              font-size: 18pt;
              font-weight: 600;
            }
            .offer-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 20px;
            }
            .info-block {
              border: 1.5px solid #ddd;
              padding: 12px;
              border-radius: 4px;
              background: #fafafa;
            }
            .info-label {
              font-weight: 600;
              color: #666;
              font-size: 9pt;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-value {
              color: #1a365d;
              font-size: 11pt;
              font-weight: 500;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              margin-bottom: 20px;
              font-size: 9pt;
              page-break-inside: auto;
            }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            th {
              background: #1a365d;
              color: white;
              padding: 8px 6px;
              text-align: ${language === 'ar' ? 'right' : 'left'};
              font-weight: 600;
              font-size: 9pt;
              border: 1px solid #1a365d;
            }
            td {
              border-bottom: 1px solid #e0e0e0;
              padding: 8px 6px;
              text-align: ${language === 'ar' ? 'right' : 'left'};
              vertical-align: top;
            }
            tbody tr:hover {
              background: #f8f9fa;
            }
            tbody tr:last-child td {
              border-bottom: 2px solid #1a365d;
            }
            .total-section {
              margin-top: 20px;
              margin-bottom: 20px;
              padding: 15px;
              background: #f8f9fa;
              border: 1px solid #e0e0e0;
              border-radius: 4px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              font-size: 11pt;
            }
            .grand-total {
              font-size: 14pt;
              font-weight: bold;
              border-top: 2px solid #d4af37;
              padding-top: 10px;
              margin-top: 10px;
              color: #1a365d;
            }
            .terms-section {
              margin-top: 20px;
              margin-bottom: 20px;
              padding: 15px;
              background: #f8f9fa;
              border-left: ${language === 'ar' ? 'none' : '4px solid #1a365d'};
              border-right: ${language === 'ar' ? '4px solid #1a365d' : 'none'};
              border-radius: 4px;
              font-size: 9pt;
              line-height: 1.8;
            }
            .terms-title {
              font-weight: bold;
              font-size: 11pt;
              margin-bottom: 8px;
              color: #1a365d;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .notes-section {
              margin-top: 20px;
              margin-bottom: 20px;
              padding: 15px;
              background: #fffbf0;
              border: 1px dashed #d4af37;
              border-radius: 4px;
              font-size: 9pt;
              line-height: 1.8;
            }
            .notes-title {
              font-weight: bold;
              font-size: 11pt;
              margin-bottom: 8px;
              color: #1a365d;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #e0e0e0;
              text-align: center;
              font-size: 9pt;
              color: #666;
              line-height: 1.8;
            }
            .footer div {
              margin: 3px 0;
            }
            @media print {
              body { 
                padding: 0;
                margin: 0;
              }
              .no-print { display: none !important; }
              .header { page-break-after: avoid; }
              table { page-break-inside: avoid; }
              .total-section { page-break-inside: avoid; }
            }
            @media screen {
              body {
                max-width: 21cm;
                margin: 0 auto;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                padding: 40px;
                background: white;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${companyName}</div>
            <div class="company-details">
              <div>${language === 'ar' ? PRICE_OFFER_TEMPLATE.company.addressAr : PRICE_OFFER_TEMPLATE.company.addressEn}</div>
              <div>${language === 'ar' ? `الهاتف: ${PRICE_OFFER_TEMPLATE.company.phone} ${PRICE_OFFER_TEMPLATE.company.phoneLabel}` : `Phone: ${PRICE_OFFER_TEMPLATE.company.phone}`}</div>
              <div>${language === 'ar' ? `البريد الإلكتروني: ${PRICE_OFFER_TEMPLATE.company.email}` : `Email: ${PRICE_OFFER_TEMPLATE.company.email}`}</div>
              <div>${language === 'ar' ? `الموقع: ${PRICE_OFFER_TEMPLATE.company.website}` : `Website: ${PRICE_OFFER_TEMPLATE.company.website}`}</div>
              <div>${language === 'ar' ? `الرقم الضريبي: ${PRICE_OFFER_TEMPLATE.company.taxRegistrationNumber}` : `Tax Registration: ${PRICE_OFFER_TEMPLATE.company.taxRegistrationNumber}`}</div>
            </div>
            <div class="offer-title">${headerTitle}</div>
          </div>

          <div class="offer-info">
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'رقم العرض' : 'Offer Number'}</div>
              <div class="info-value">${offer.offerNumber}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'التاريخ' : 'Date'}</div>
              <div class="info-value">${new Date(offer.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'العميل' : 'Client'}</div>
              <div class="info-value">${client ? (language === 'ar' ? client.nameAr : client.nameEn) : 'N/A'}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'الحالة' : 'Status'}</div>
              <div class="info-value">${offer.status}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${language === 'ar' ? 'رقم الصنف' : 'Item No.'}</th>
                <th>${language === 'ar' ? 'اسم الصنف' : 'Product Name'}</th>
                <th>${language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th>${language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                <th>${language === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th>${language === 'ar' ? 'سعر الوحدة (شيكل) – شامل الضريبة' : 'Unit Price (ILS) – VAT Included'}</th>
                <th>${language === 'ar' ? 'الخصم' : 'Discount'}</th>
                <th>${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              ${enrichedItems.map((item: any, idx: number) => {
                const itemPrice = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
                const itemQuantity = Number(item.quantity) || 0;
                const discount = parseFloat(String(item.discount || '0')) || 0;
                const itemTotal = (itemPrice * itemQuantity) - discount;
                const name = language === 'ar' 
                  ? (item.nameAr || item.productNameAr || item.nameEn || item.productNameEn || item.name || '-')
                  : (item.nameEn || item.productNameEn || item.nameAr || item.productNameAr || item.name || '-');
                const description = language === 'ar' ? (item.descriptionAr || '-') : (item.descriptionEn || '-');

                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${name}</td>
                    <td>${description}</td>
                    <td>${item.unit || '-'}</td>
                    <td>${itemQuantity}</td>
                    <td>${itemPrice.toFixed(2)} ${currency}</td>
                    <td>${discount > 0 ? discount.toFixed(2) : '-'}</td>
                    <td>${itemTotal.toFixed(2)} ${currency}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row grand-total">
              <span>${language === 'ar' ? 'المجموع الكلي' : 'Grand Total'}:</span>
              <span>${total.toFixed(2)} ${currency}</span>
            </div>
          </div>

          ${offer.notes ? `
          <div class="notes-section">
            <div class="notes-title">${language === 'ar' ? 'ملاحظات' : 'Notes'}</div>
            <div style="white-space: pre-line;">${escapeHtml(offer.notes)}</div>
          </div>
          ` : ''}

          <div class="terms-section">
            <div class="terms-title">${language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions'}</div>
            <div style="white-space: pre-line;">${termsText}</div>
          </div>

          <div class="footer">
            ${footerText.split('\n').map(line => `<div>${line}</div>`).join('')}
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

  const handleExportToExcel = (offers: PriceOffer[]) => {
    const headers = language === 'ar' 
      ? ['رقم العرض', 'رقم الطلب', 'العميل', 'التاريخ', 'الحالة', 'المجموع الفرعي', 'الضريبة', 'الإجمالي']
      : ['Offer Number', 'Request Number', 'Client', 'Date', 'Status', 'Subtotal', 'Tax', 'Total'];

    let csv = headers.join(',') + '\n';

    offers.forEach(offer => {
      const client = clients.find(c => c.id === offer.clientId);
      const clientName = client ? (language === 'ar' ? client.nameAr : client.nameEn) : 'N/A';
      const request = priceRequests.find((r: any) => r.id === offer.requestId);

      const row = [
        offer.offerNumber,
        request?.requestNumber || '-',
        clientName,
        new Date(offer.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US'),
        offer.status,
        (() => {
          const items = safeJsonParse(offer.items, []);
          return items.reduce((sum: number, item: any) => sum + (parseFloat(item.unitPrice || '0') * (item.quantity || 0)), 0).toFixed(2);
        })(),
        offer.tax || 0,
        offer.total
      ];

      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-offers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Exported',
      description: language === 'ar' ? 'تم تصدير عروض الأسعار بنجاح' : 'Price offers exported successfully',
    });
  };

  const handleViewRequest = async (request: PriceRequest) => {
    try {
      // Fetch full request details with enriched product information
      const res = await apiRequest('GET', `/api/admin/price-requests/${request.id}`);
      if (res.ok) {
        const detailedRequest = await res.json();
        setSelectedRequest(detailedRequest);
        setViewRequestDialogOpen(true);
      } else {
        // Fallback to original request if fetch fails
        setSelectedRequest(request);
        setViewRequestDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch detailed request:', error);
      // Fallback to original request
      setSelectedRequest(request);
      setViewRequestDialogOpen(true);
    }
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
    const termsText = formatTermsAndConditions(offer);
    setEditableTerms(termsText);
    setViewOfferDialogOpen(true);
  };

  const isSelectedOffer = (offerId: string) => selectedOffers.has(offerId);

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
            {filteredOffers.length > 0 && (
              <Button
                onClick={() => handleExportToExcel(filteredOffers)}
                variant="outline"
                size="sm"
                className="h-9 sm:h-10 px-2 sm:px-3 gap-1"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'ar' ? 'Excel' : 'Excel'}</span>
              </Button>
            )}
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <TabsList className="grid grid-cols-2 h-auto p-1 bg-muted/50 dark:bg-muted/30 shadow-sm w-full sm:w-auto">
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

            <div className="flex gap-2">
              <Button
                onClick={handleCreateOfferFromScratch}
                size="sm"
                className="bg-primary hover:bg-primary/90 dark:bg-[#d4af37] dark:hover:bg-[#d4af37]/90 text-primary-foreground dark:text-black shadow-md hover:shadow-lg transition-all duration-300 flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4 me-2" />
                {language === 'ar' ? 'إنشاء عرض' : 'Create Offer'}
              </Button>
            </div>
          </div>

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
                            <TableHead>
                              <input
                                type="checkbox"
                                checked={selectedOffers.size === filteredOffers.length && filteredOffers.length > 0}
                                onChange={() => {
                                  if (selectedOffers.size === filteredOffers.length) {
                                    setSelectedOffers(new Set());
                                  } else {
                                    setSelectedOffers(new Set(filteredOffers.map(o => o.id)));
                                  }
                                }}
                                className="form-checkbox h-4 w-4 text-primary dark:text-[#d4af37]"
                              />
                            </TableHead>
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
                              <TableRow key={offer.id} className={`${isSelectedOffer(offer.id) ? 'bg-primary/10 dark:bg-[#d4af37]/10' : ''}`}>
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={isSelectedOffer(offer.id)}
                                    onChange={() => toggleOfferSelection(offer.id)}
                                    className="form-checkbox h-4 w-4 text-primary dark:text-[#d4af37]"
                                  />
                                </TableCell>
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
                                      onClick={() => handlePrintOffer(offer)}
                                      title={language === 'ar' ? 'طباعة' : 'Print'}
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteOffer(offer.id)}
                                      className="hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
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
                      <Card key={offer.id} className={`overflow-hidden border-l-4 ${isSelectedOffer(offer.id) ? 'border-l-primary dark:border-l-[#d4af37] bg-primary/5 dark:bg-[#d4af37]/5' : 'border-l-primary dark:border-l-[#d4af37]'} shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-accent/5 dark:from-black dark:to-[#d4af37]/5`}>
                        <CardContent className="p-4 space-y-4">
                          {/* Header with Gradient Background */}
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/50 dark:border-[#d4af37]/20">
                            <div className="flex-1 min-w-0">
                              <div className="text-2xl font-bold font-mono mb-1 bg-gradient-to-r from-primary to-primary/70 dark:from-[#d4af37] dark:to-[#d4af37]/70 bg-clip-text text-transparent">
                                {offer.offerNumber}
                              </div>
                              {linkedRequest && (
                                <Badge variant="outline" className="text-xs border-primary/50 dark:border-[#d4af37]/50 bg-primary/5 dark:bg-[#d4af37]/5">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {linkedRequest.requestNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="checkbox"
                                checked={isSelectedOffer(offer.id)}
                                onChange={() => toggleOfferSelection(offer.id)}
                                className="form-checkbox h-4 w-4 text-primary dark:text-[#d4af37]"
                              />
                              <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#d4af37]/10 flex items-center justify-center border-2 ${isSelectedOffer(offer.id) ? 'border-primary dark:border-[#d4af37]' : 'border-primary/30 dark:border-[#d4af37]/30'}`}>
                                {getOfferStatusIcon(isExpired ? 'expired' : offer.status)}
                              </div>
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
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="h-10 border-destructive/30 hover:bg-destructive/10 hover:text-destructive border-destructive text-destructive"
                            >
                              <Trash2 className="h-4 w-4 me-1.5" />
                              <span className="text-xs">{language === 'ar' ? 'حذف' : 'Delete'}</span>
                            </Button>
                            {linkedRequest && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleViewRequest(linkedRequest);
                                  setViewOfferDialogOpen(false);
                                }}
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
              <div className="flex justify-between items-center mt-4 px-4">
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? `إجمالي ${filteredOffers.length} عرض سعر`
                    : `Total ${filteredOffers.length} price offer${filteredOffers.length !== 1 ? 's' : ''}`
                  }
                </div>
                {selectedOffers.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDeleteOffers}
                    className="gap-1.5"
                    disabled={bulkDeleteOffersMutation.isPending}
                  >
                    {bulkDeleteOffersMutation.isPending ? (
                      <span className="animate-pulse">{language === 'ar' ? 'جاري الحذف...' : 'Deleting...'}</span>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        {language === 'ar' ? `حذف ${selectedOffers.size}` : `Delete ${selectedOffers.size}`}
                      </>
                    )}
                  </Button>
                )}
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
                  <div className="mt-1 font-medium text-sm sm:text-base">{selectedRequest.requestNumber}</div>
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
                    {new Date(selectedRequest.requestedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
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

      {/* View Offer Details Dialog */}
      <Dialog open={viewOfferDialogOpen} onOpenChange={setViewOfferDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              {language === 'ar' ? 'تفاصيل عرض السعر' : 'Price Offer Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedOffer && (() => {
            const items = safeJsonParse(selectedOffer.items, []);
            const enrichedItems = enrichOfferItems(items);
            const client = clients.find(c => c.id === selectedOffer.clientId);
            const currency = enrichedItems[0]?.currency || 'ILS';
            const subtotal = enrichedItems.reduce((sum: number, item: any) => {
              const price = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
              const quantity = Number(item.quantity) || 0;
              const discount = parseFloat(String(item.discount || '0')) || 0;
              return sum + (price * quantity - discount);
            }, 0);
            const tax = parseFloat(selectedOffer.tax || '0');
            const total = parseFloat(selectedOffer.total || subtotal.toString());
            const companyName = language === 'ar' ? PRICE_OFFER_TEMPLATE.company.nameAr : PRICE_OFFER_TEMPLATE.company.nameEn;
            const headerTitle = language === 'ar' ? PRICE_OFFER_TEMPLATE.headerTitle.ar : PRICE_OFFER_TEMPLATE.headerTitle.en;
            const footerText = language === 'ar' ? PRICE_OFFER_TEMPLATE.footer.ar : PRICE_OFFER_TEMPLATE.footer.en;
            const termsText = formatTermsAndConditions(selectedOffer);

            return (
              <div className="space-y-6 py-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Print Preview Header - Matching Print Template */}
                <div className="text-center mb-8 pb-4 border-b-[3px] border-[#d4af37]">
                  <div className="text-2xl font-bold text-[#1a365d] mb-3">
                    {companyName}
                  </div>
                  <div className="text-sm text-[#6b7280] grid grid-cols-2 gap-x-4 gap-y-1 justify-items-start mt-2">
                    <div>{language === 'ar' ? PRICE_OFFER_TEMPLATE.company.addressAr : PRICE_OFFER_TEMPLATE.company.addressEn}</div>
                    <div>{language === 'ar' ? `الهاتف: ${PRICE_OFFER_TEMPLATE.company.phone} ${PRICE_OFFER_TEMPLATE.company.phoneLabel}` : `Phone: ${PRICE_OFFER_TEMPLATE.company.phone}`}</div>
                    <div>{language === 'ar' ? `البريد الإلكتروني: ${PRICE_OFFER_TEMPLATE.company.email}` : `Email: ${PRICE_OFFER_TEMPLATE.company.email}`}</div>
                    <div>{language === 'ar' ? `الموقع: ${PRICE_OFFER_TEMPLATE.company.website}` : `Website: ${PRICE_OFFER_TEMPLATE.company.website}`}</div>
                    <div>{language === 'ar' ? `الرقم الضريبي: ${PRICE_OFFER_TEMPLATE.company.taxRegistrationNumber}` : `Tax Registration: ${PRICE_OFFER_TEMPLATE.company.taxRegistrationNumber}`}</div>
                  </div>
                  <div className="text-[#6b7280] mt-4 text-lg">
                    {headerTitle}
                  </div>
                </div>

                {/* Offer Info Grid - Matching Print Template */}
                <div className="grid grid-cols-2 gap-5 mb-8">
                  <div className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="font-bold text-[#6b7280] text-xs mb-1">
                      {language === 'ar' ? 'رقم العرض' : 'Offer Number'}
                    </div>
                    <div className="text-[#111827] text-sm">
                      {selectedOffer.offerNumber}
                    </div>
                  </div>
                  <div className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="font-bold text-[#6b7280] text-xs mb-1">
                      {language === 'ar' ? 'التاريخ' : 'Date'}
                    </div>
                    <div className="text-[#111827] text-sm">
                      {new Date(selectedOffer.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </div>
                  </div>
                  <div className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="font-bold text-[#6b7280] text-xs mb-1">
                      {language === 'ar' ? 'العميل' : 'Client'}
                    </div>
                    <div className="text-[#111827] text-sm">
                      {client ? (language === 'ar' ? client.nameAr : client.nameEn) : 'N/A'}
                    </div>
                  </div>
                  <div className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="font-bold text-[#6b7280] text-xs mb-1">
                      {language === 'ar' ? 'الحالة' : 'Status'}
                    </div>
                    <div className="text-[#111827] text-sm">
                      {selectedOffer.status}
                    </div>
                  </div>
                </div>

                {/* Items Table - Matching Print Template */}
                {enrichedItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse mt-5 text-xs">
                      <thead>
                        <tr>
                          <th className="bg-[#1a365d] text-white p-2 text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                            {language === 'ar' ? 'رقم الصنف' : 'Item No.'}
                          </th>
                          <th className="bg-[#1a365d] text-white p-2 text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                            {language === 'ar' ? 'اسم الصنف' : 'Product Name'}
                          </th>
                          <th className="bg-[#1a365d] text-white p-2 text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                            {language === 'ar' ? 'الوصف' : 'Description'}
                          </th>
                          <th className="bg-[#1a365d] text-white p-2 text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                            {language === 'ar' ? 'الوحدة' : 'Unit'}
                          </th>
                          <th className="bg-[#1a365d] text-white p-2 text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                            {language === 'ar' ? 'الكمية' : 'Qty'}
                          </th>
                          <th className="bg-[#1a365d] text-white p-2 text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                            {language === 'ar' ? 'سعر الوحدة (شيكل) – شامل الضريبة' : 'Unit Price (ILS) – VAT Included'}
                          </th>
                          <th className="bg-[#1a365d] text-white p-2 text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                            {language === 'ar' ? 'الخصم' : 'Discount'}
                          </th>
                          <th className="bg-[#1a365d] text-white p-2 text-left" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                            {language === 'ar' ? 'الإجمالي' : 'Total'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrichedItems.map((item: any, idx: number) => {
                          const itemPrice = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
                          const itemQuantity = Number(item.quantity) || 0;
                          const discount = parseFloat(String(item.discount || '0')) || 0;
                          const itemTotal = (itemPrice * itemQuantity) - discount;
                          const name = language === 'ar' 
                            ? (item.nameAr || item.productNameAr || item.nameEn || item.productNameEn || item.name || '-')
                            : (item.nameEn || item.productNameEn || item.nameAr || item.productNameAr || item.name || '-');
                          const description = language === 'ar' ? (item.descriptionAr || '-') : (item.descriptionEn || '-');

                          return (
                            <tr key={idx} className="border-b border-[#e5e7eb]">
                              <td className="p-2" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>{idx + 1}</td>
                              <td className="p-2" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>{name}</td>
                              <td className="p-2" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>{description}</td>
                              <td className="p-2" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>{item.unit || '-'}</td>
                              <td className="p-2" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>{itemQuantity}</td>
                              <td className="p-2" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                                {itemPrice.toFixed(2)} {item.currency || currency}
                              </td>
                              <td className="p-2" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                                {discount > 0 ? discount.toFixed(2) : '-'}
                              </td>
                              <td className="p-2" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                                {itemTotal.toFixed(2)} {item.currency || currency}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {language === 'ar' ? 'لا توجد منتجات في هذا العرض' : 'No items in this offer'}
                  </div>
                )}

                {/* Total Section - Matching Print Template */}
                <div className="mt-8 p-5 bg-[#f9fafb] rounded-lg">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>{language === 'ar' ? 'المجموع الكلي' : 'Grand Total'}:</span>
                    <span>{total.toFixed(2)} {currency}</span>
                  </div>
                </div>

                {/* Notes Section - Matching Print Template */}
                {selectedOffer.notes && (
                  <div className="mt-8 p-5 bg-[#f9fafb] rounded-lg">
                    <div className="font-bold text-[#1a365d] mb-3 text-sm">
                      {language === 'ar' ? 'ملاحظات' : 'Notes'}
                    </div>
                    <div className="text-xs leading-relaxed whitespace-pre-line">
                      {selectedOffer.notes}
                    </div>
                  </div>
                )}

                {/* Terms and Conditions Section */}
                <div className="mt-8 p-5 bg-[#f9fafb] rounded-lg">
                  <div className="font-bold text-[#1a365d] mb-3 text-sm">
                    {language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions'}
                  </div>
                  <Textarea
                    value={editableTerms}
                    onChange={(e) => setEditableTerms(e.target.value)}
                    className="text-xs leading-relaxed min-h-[120px] resize-y"
                    placeholder={language === 'ar' ? 'أدخل الشروط والأحكام' : 'Enter terms and conditions'}
                  />
                </div>

                {/* Footer Section */}
                <div className="mt-8 pt-5 border-t border-[#e5e7eb] text-center text-xs text-[#6b7280] leading-relaxed">
                  {footerText.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>

                {/* Dialog Actions */}
                <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
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
                      onClick={() => handlePrintOffer(selectedOffer)}
                      className="w-full sm:w-auto bg-[#1a365d] hover:bg-[#1a365d]/90 text-white"
                    >
                      <Printer className="h-4 w-4 me-2" />
                      {language === 'ar' ? 'طباعة' : 'Print'}
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}