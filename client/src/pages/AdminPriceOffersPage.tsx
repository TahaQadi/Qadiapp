import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, FileText, Eye, CheckCircle, XCircle, Clock, Trash2, BarChart3, CalendarClock, Ban } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface PriceOffer {
  id: string;
  offerNumber: string;
  clientId: string;
  ltaId: string;
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

export default function AdminPriceOffersPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedDeleteFilters, setSelectedDeleteFilters] = useState<{
    status: string[];
    expired: boolean;
  }>({ status: [], expired: false });
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PriceOffer | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);

  const { data: offers = [], isLoading } = useQuery<PriceOffer[]>({
    queryKey: ['/api/admin/price-offers'],
  });

  const { data: analytics } = useQuery<any>({
    queryKey: ['/api/admin/price-offers/analytics'],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/admin/clients'],
  });

  const { data: ltas = [] } = useQuery<LTA[]>({
    queryKey: ['/api/admin/ltas'],
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (filters: any) => {
      const res = await apiRequest('POST', '/api/admin/price-offers/bulk-delete', { filters });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted Successfully',
        description: data.messageAr && language === 'ar' ? data.messageAr : data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers/analytics'] });
      setBulkDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل الحذف' : 'Delete failed'),
      });
    },
  });

  const extendMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const res = await apiRequest('PATCH', `/api/admin/price-offers/${id}/extend`, { days });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'تم التمديد' : 'Extended',
        description: data.messageAr && language === 'ar' ? data.messageAr : data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
      setExtendDialogOpen(false);
      setSelectedOffer(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', `/api/admin/price-offers/${id}/revoke`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'تم الإلغاء' : 'Revoked',
        description: data.messageAr && language === 'ar' ? data.messageAr : data.message,
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

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? (language === 'ar' ? client.nameAr : client.nameEn) : clientId;
  };

  const getLtaName = (ltaId: string) => {
    const lta = ltas.find(l => l.id === ltaId);
    return lta ? (language === 'ar' ? lta.nameAr : lta.nameEn) : ltaId;
  };

  const getStatusBadge = (offer: PriceOffer) => {
    const statusConfig: Record<string, { label: string; labelAr: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Draft', labelAr: 'مسودة', variant: 'outline' },
      sent: { label: 'Sent', labelAr: 'مُرسل', variant: 'default' },
      viewed: { label: 'Viewed', labelAr: 'مُشاهد', variant: 'secondary' },
      accepted: { label: 'Accepted', labelAr: 'مقبول', variant: 'default' },
      rejected: { label: 'Rejected', labelAr: 'مرفوض', variant: 'destructive' },
    };

    const config = statusConfig[offer.status] || { label: offer.status, labelAr: offer.status, variant: 'outline' as const };
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${offer.id}`}>
        {language === 'ar' ? config.labelAr : config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
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

  const filteredOffers = statusFilter === 'all' 
    ? offers 
    : offers.filter(o => o.status === statusFilter);

  const handleDownload = async (fileName: string, offerId: string) => {
    try {
      const tokenResponse = await apiRequest<{ token: string }>('POST', `/api/pdf/generate-token/${offerId}`);
      window.open(`/api/pdf/download/${fileName}?token=${tokenResponse.token}`, '_blank');
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل إنشاء رمز التنزيل' : 'Failed to generate download token',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'عروض الأسعار' : 'Price Offers'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {language === 'ar' ? 'جميع عروض الأسعار' : 'All Price Offers'}
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
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
          </CardHeader>
          <CardContent>
            {filteredOffers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'ar' ? 'لا توجد عروض أسعار' : 'No price offers found'}
              </div>
            ) : (
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
                  {filteredOffers.map((offer) => (
                    <TableRow key={offer.id} data-testid={`row-offer-${offer.id}`}>
                      <TableCell className="font-medium" data-testid={`text-offer-number-${offer.id}`}>
                        {offer.offerNumber}
                      </TableCell>
                      <TableCell data-testid={`text-client-${offer.id}`}>
                        {getClientName(offer.clientId)}
                      </TableCell>
                      <TableCell data-testid={`text-lta-${offer.id}`}>
                        {getLtaName(offer.ltaId)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(offer.status)}
                          {getStatusBadge(offer)}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-sent-date-${offer.id}`}>
                        {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                      </TableCell>
                      <TableCell data-testid={`text-valid-until-${offer.id}`}>
                        {new Date(offer.validUntil).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(offer.pdfFileName, offer.id)}
                          data-testid={`button-download-${offer.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {filteredOffers.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {language === 'ar' 
              ? `إجمالي ${filteredOffers.length} عرض سعر`
              : `Total ${filteredOffers.length} price offer${filteredOffers.length !== 1 ? 's' : ''}`
            }
          </div>
        )}
      </div>
    </div>
  );
}
