import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, FileText, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
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

interface LTA {
  id: string;
  nameEn: string;
  nameAr: string;
}

export default function ClientPriceOffersPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedOffer, setSelectedOffer] = useState<PriceOffer | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseNote, setResponseNote] = useState('');
  const [responseAction, setResponseAction] = useState<'accepted' | 'rejected' | null>(null);

  const { data: offers = [], isLoading } = useQuery<PriceOffer[]>({
    queryKey: ['/api/client/price-offers'],
  });

  const { data: ltas = [] } = useQuery<LTA[]>({
    queryKey: ['/api/ltas'],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ offerId, status, note }: { offerId: string; status: string; note: string }) => {
      return apiRequest('PATCH', `/api/client/price-offers/${offerId}/status`, {
        status,
        responseNote: note
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/price-offers'] });
      toast({
        title: language === 'ar' ? 'تم التحديث بنجاح' : 'Response Submitted',
        description: language === 'ar' ? 'تم تسجيل ردك على عرض السعر' : 'Your response has been recorded',
      });
      setResponseDialogOpen(false);
      setSelectedOffer(null);
      setResponseNote('');
      setResponseAction(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل تسجيل الرد' : 'Failed to submit response'),
      });
    },
  });

  const getLtaName = (ltaId: string) => {
    const lta = ltas.find(l => l.id === ltaId);
    return lta ? (language === 'ar' ? lta.nameAr : lta.nameEn) : ltaId;
  };

  const getStatusBadge = (offer: PriceOffer) => {
    const statusConfig: Record<string, { label: string; labelAr: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Draft', labelAr: 'مسودة', variant: 'outline' },
      sent: { label: 'New', labelAr: 'جديد', variant: 'default' },
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

  const handleDownload = async (fileName: string) => {
    window.open(`/api/pdf/download/${fileName}`, '_blank');
  };

  const handleRespond = (offer: PriceOffer, action: 'accepted' | 'rejected') => {
    setSelectedOffer(offer);
    setResponseAction(action);
    setResponseDialogOpen(true);
  };

  const submitResponse = () => {
    if (!selectedOffer || !responseAction) return;
    respondMutation.mutate({
      offerId: selectedOffer.id,
      status: responseAction,
      note: responseNote,
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const canRespond = (offer: PriceOffer) => {
    return offer.status === 'sent' || offer.status === 'viewed';
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
            <Link href="/">
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
            <CardTitle>
              {language === 'ar' ? 'عروض الأسعار المستلمة' : 'Received Price Offers'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'ar' ? 'لا توجد عروض أسعار' : 'No price offers received'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'رقم العرض' : 'Offer #'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الاتفاقية' : 'LTA'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{language === 'ar' ? 'تاريخ الإرسال' : 'Sent Date'}</TableHead>
                    <TableHead>{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</TableHead>
                    <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer) => (
                    <TableRow key={offer.id} data-testid={`row-offer-${offer.id}`}>
                      <TableCell className="font-medium" data-testid={`text-offer-number-${offer.id}`}>
                        {offer.offerNumber}
                        {!offer.viewedAt && (
                          <Badge variant="default" className="ml-2">
                            {language === 'ar' ? 'جديد' : 'New'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-lta-${offer.id}`}>
                        {getLtaName(offer.ltaId)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(offer.status)}
                          {getStatusBadge(offer)}
                          {isExpired(offer.validUntil) && (
                            <Badge variant="destructive" className="ml-2">
                              {language === 'ar' ? 'منتهي' : 'Expired'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-sent-date-${offer.id}`}>
                        {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                      </TableCell>
                      <TableCell data-testid={`text-valid-until-${offer.id}`}>
                        {new Date(offer.validUntil).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(offer.pdfFileName)}
                            data-testid={`button-download-${offer.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canRespond(offer) && !isExpired(offer.validUntil) && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRespond(offer, 'accepted')}
                                data-testid={`button-accept-${offer.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {language === 'ar' ? 'قبول' : 'Accept'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRespond(offer, 'rejected')}
                                data-testid={`button-reject-${offer.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {language === 'ar' ? 'رفض' : 'Reject'}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'accepted'
                ? (language === 'ar' ? 'قبول عرض السعر' : 'Accept Price Offer')
                : (language === 'ar' ? 'رفض عرض السعر' : 'Reject Price Offer')
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {language === 'ar' ? 'ملاحظة (اختياري)' : 'Note (Optional)'}
              </label>
              <Textarea
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder={language === 'ar' ? 'أضف ملاحظة...' : 'Add a note...'}
                rows={3}
                data-testid="textarea-response-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setResponseDialogOpen(false)}
              data-testid="button-cancel-response"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant={responseAction === 'accepted' ? 'default' : 'destructive'}
              onClick={submitResponse}
              disabled={respondMutation.isPending}
              data-testid="button-submit-response"
            >
              {respondMutation.isPending
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                : (language === 'ar' ? 'تأكيد' : 'Confirm')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
