
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Heart, Package, Trash2, Send, ArrowLeft, User, LogOut, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import type { Product } from '@shared/schema';

interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

interface PriceRequestItem {
  productId: string;
  productSku: string;
  productNameEn: string;
  productNameAr: string;
}

export default function PriceRequestPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [priceRequestList, setPriceRequestList] = useState<PriceRequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const { data: products = [] } = useQuery<ProductWithLtaPrice[]>({
    queryKey: ['/api/products'],
  });

  const requestPriceMutation = useMutation({
    mutationFn: async (data: { productIds: string[]; message: string }) => {
      const res = await apiRequest('POST', '/api/client/price-request', data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'تم إرسال الطلب' : 'Request Sent',
        description: data.messageAr && language === 'ar' ? data.messageAr : data.message,
      });
      setPriceRequestList([]);
      setRequestMessage('');
      setRequestDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === '' ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameAr.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Only show products without prices
    return matchesSearch && !p.hasPrice;
  });

  const handleAddToPriceRequest = (product: ProductWithLtaPrice) => {
    const exists = priceRequestList.find(item => item.productId === product.id);
    
    if (exists) {
      toast({
        description: language === 'ar' 
          ? 'المنتج موجود بالفعل في قائمة طلبات الأسعار' 
          : 'Product already in price request list'
      });
      return;
    }

    setPriceRequestList([...priceRequestList, {
      productId: product.id,
      productSku: product.sku,
      productNameEn: product.nameEn,
      productNameAr: product.nameAr,
    }]);

    toast({
      description: language === 'ar'
        ? `تمت إضافة ${product.nameAr} إلى قائمة طلبات الأسعار`
        : `${product.nameEn} added to price request list`
    });
  };

  const handleRemoveFromPriceRequest = (productId: string) => {
    setPriceRequestList(priceRequestList.filter(item => item.productId !== productId));
    toast({
      description: language === 'ar' ? 'تمت إزالة المنتج' : 'Product removed'
    });
  };

  const handleRequestPriceOffer = () => {
    if (priceRequestList.length === 0) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'قائمة فارغة' : 'Empty List',
        description: language === 'ar' 
          ? 'يرجى إضافة منتجات إلى القائمة أولاً' 
          : 'Please add products to the list first'
      });
      return;
    }
    setRequestDialogOpen(true);
  };

  const handleSubmitRequest = () => {
    const productIds = priceRequestList.map(item => item.productId);
    requestPriceMutation.mutate({
      productIds,
      message: requestMessage.trim() || '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">
              {language === 'ar' ? 'طلبات الأسعار' : 'Price Requests'}
            </h1>
            {priceRequestList.length > 0 && (
              <Badge variant="secondary">{priceRequestList.length}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
            >
              <Link href="/profile">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            {user?.isAdmin && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin">
                  <Package className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <NotificationCenter />
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {language === 'ar' ? 'المنتجات المتاحة' : 'Available Products'}
              </h2>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const inPriceRequest = priceRequestList.some(item => item.productId === product.id);
                return (
                  <Card key={product.id}>
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {language === 'ar' ? product.nameAr : product.nameEn}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            SKU: {product.sku}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {language === 'ar' ? 'بدون سعر' : 'No Price'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        onClick={() => handleAddToPriceRequest(product)}
                        disabled={inPriceRequest}
                        className="w-full"
                        variant={inPriceRequest ? "secondary" : "default"}
                        data-testid={`button-add-to-price-request-${product.id}`}
                      >
                        <Heart className={`h-4 w-4 me-2 ${inPriceRequest ? 'fill-current' : ''}`} />
                        {inPriceRequest
                          ? (language === 'ar' ? 'في القائمة' : 'In List')
                          : (language === 'ar' ? 'أضف إلى طلبات الأسعار' : 'Add to Price Request')
                        }
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <Card className="p-12 text-center border-dashed">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {language === 'ar' 
                    ? 'لا توجد منتجات متاحة' 
                    : 'No products available'}
                </p>
              </Card>
            )}
          </div>

          {/* Price Request Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {language === 'ar' ? 'طلبات الأسعار' : 'Price Requests'}
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {priceRequestList.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' 
                        ? 'قائمتك فارغة' 
                        : 'Your list is empty'}
                    </p>
                  </div>
                ) : (
                  <>
                    {priceRequestList.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between gap-2 p-2 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {language === 'ar' ? item.productNameAr : item.productNameEn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.productSku}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFromPriceRequest(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
              {priceRequestList.length > 0 && (
                <CardFooter>
                  <Button 
                    onClick={handleRequestPriceOffer} 
                    className="w-full"
                    data-testid="button-submit-price-request"
                  >
                    <Send className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'طلب عرض سعر' : 'Request Price Offer'}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'طلب عرض سعر' : 'Request Price Offer'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {language === 'ar' 
                  ? `سيتم طلب عرض سعر لـ ${priceRequestList.length} منتج` 
                  : `Price offer will be requested for ${priceRequestList.length} product(s)`}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'رسالة إضافية (اختياري)' : 'Additional Message (Optional)'}
              </label>
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder={language === 'ar' 
                  ? 'أضف أي ملاحظات أو تفاصيل إضافية...' 
                  : 'Add any notes or additional details...'}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmitRequest} disabled={requestPriceMutation.isPending}>
              <Send className="h-4 w-4 me-2" />
              {language === 'ar' ? 'إرسال الطلب' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
