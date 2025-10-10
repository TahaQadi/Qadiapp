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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check, Clock, Package, User, Mail, Phone, Archive } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  isRead: boolean;
  metadata: string | null;
  createdAt: string;
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

export default function AdminPriceRequestsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<Notification | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [contractPrice, setContractPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [selectedLtaId, setSelectedLtaId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/client/notifications'],
  });

  const { data: ltas = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/ltas'],
  });

  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/products/all'],
  });

  const priceRequests = notifications.filter(n => n.type === 'price_request');

  // Check if a product has been assigned to any LTA
  const isProductAssignedToLta = (productId: string) => {
    return allProducts.some((p: any) => p.id === productId && p.contractPrice !== null);
  };

  // Check if all products in a request have been assigned
  const isRequestCompleted = (request: Notification) => {
    const metadata: PriceRequestMetadata = (request.metadata as any) || { 
      clientId: '', 
      clientNameEn: '', 
      clientNameAr: '', 
      productIds: [], 
      products: [] 
    };
    
    if (!metadata.products || metadata.products.length === 0) return false;
    
    return metadata.products.every(product => isProductAssignedToLta(product.id));
  };

  // Filter requests based on status
  const filteredRequests = priceRequests.filter(request => {
    if (statusFilter === 'all') return true;
    const completed = isRequestCompleted(request);
    return statusFilter === 'completed' ? completed : !completed;
  });

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
    onSuccess: (data, variables) => {
      toast({
        title: language === 'ar' ? 'تم إضافة المنتج' : 'Product Added',
        description: language === 'ar' ? 'تم إضافة المنتج إلى الاتفاقية بنجاح' : 'Product added to LTA successfully',
      });
      setPriceDialogOpen(false);
      setContractPrice('');
      setSelectedProduct(null);
      setSelectedLtaId(null);
      setSelectedRequest(null);
      // Refresh the price requests list
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
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

    const metadata: PriceRequestMetadata = (selectedRequest?.metadata as any) || {};
    
    assignProductMutation.mutate({
      ltaId: selectedLtaId,
      productId: selectedProduct.id,
      contractPrice,
      currency,
      clientId: metadata.clientId,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">
              {language === 'ar' ? 'طلبات عروض الأسعار' : 'Price Requests'}
            </h1>
            {priceRequests.length > 0 && (
              <Badge variant="secondary">{priceRequests.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filter Tabs */}
        {priceRequests.length > 0 && (
          <div className="flex gap-2 mb-6">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
            >
              {language === 'ar' ? 'الكل' : 'All'}
              <Badge variant="secondary" className="ms-2">
                {priceRequests.length}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
            >
              {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
              <Badge variant="secondary" className="ms-2">
                {priceRequests.filter(r => !isRequestCompleted(r)).length}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('completed')}
            >
              {language === 'ar' ? 'مكتمل' : 'Completed'}
              <Badge variant="secondary" className="ms-2">
                {priceRequests.filter(r => isRequestCompleted(r)).length}
              </Badge>
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {language === 'ar' ? 'لا توجد طلبات' : 'No Requests'}
            </h3>
            <p className="text-muted-foreground">
              {statusFilter === 'all' 
                ? (language === 'ar' 
                  ? 'لم يتم استلام أي طلبات لعروض الأسعار بعد'
                  : 'No price requests have been received yet')
                : (language === 'ar'
                  ? `لا توجد طلبات ${statusFilter === 'pending' ? 'قيد الانتظار' : 'مكتملة'}`
                  : `No ${statusFilter} requests`)}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              // metadata is already an object from JSONB, not a string
              const metadata: PriceRequestMetadata = (request.metadata as any) || { 
                clientId: '', 
                clientNameEn: '', 
                clientNameAr: '', 
                productIds: [], 
                products: [] 
              };

              const completed = isRequestCompleted(request);

              return (
                <Card key={request.id} className={!request.isRead && !completed ? 'border-primary' : completed ? 'border-green-500/30' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {!request.isRead && !completed && (
                            <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                          )}
                          {language === 'ar' ? metadata.clientNameAr : metadata.clientNameEn}
                          {completed && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                              <Check className="h-3 w-3 me-1" />
                              {language === 'ar' ? 'مكتمل' : 'Completed'}
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!request.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(request.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {language === 'ar' ? 'وضع علامة كمقروء' : 'Mark as Read'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => archiveRequestMutation.mutate(request.id)}
                          disabled={archiveRequestMutation.isPending}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'أرشفة' : 'Archive'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metadata.message && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{metadata.message}</p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-3">
                          {language === 'ar' ? 'المنتجات المطلوبة:' : 'Requested Products:'}
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</TableHead>
                              <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                              <TableHead className="text-end">{language === 'ar' ? 'إجراء' : 'Action'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {metadata.products.map((product) => {
                              const hasPrice = isProductAssignedToLta(product.id);
                              return (
                                <TableRow key={product.id}>
                                  <TableCell className="font-mono">{product.sku}</TableCell>
                                  <TableCell>
                                    {language === 'ar' ? product.nameAr : product.nameEn}
                                  </TableCell>
                                  <TableCell className="text-end">
                                    {hasPrice ? (
                                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                        <Check className="h-3 w-3 me-1" />
                                        {language === 'ar' ? 'تم التعيين' : 'Assigned'}
                                      </Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => handleAssignPrice(product, request)}
                                      >
                                        {language === 'ar' ? 'تعيين سعر' : 'Assign Price'}
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Assign Price Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعيين سعر للمنتج' : 'Assign Product Price'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {language === 'ar' ? 'المنتج' : 'Product'}
              </p>
              <p className="font-medium">
                {selectedProduct && (language === 'ar' ? selectedProduct.nameAr : selectedProduct?.nameEn)}
              </p>
              <p className="text-sm text-muted-foreground">
                SKU: {selectedProduct?.sku}
              </p>
            </div>

            <div>
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

            <div>
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
              />
            </div>

            <div>
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
    </div>
  );
}