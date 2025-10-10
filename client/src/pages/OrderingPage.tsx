import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/LanguageProvider';
import { ShoppingCart as ShoppingCartComponent } from '@/components/ShoppingCart';
import { SaveTemplateDialog } from '@/components/SaveTemplateDialog';
import { OrderTemplateCard } from '@/components/OrderTemplateCard';
import { OrderHistoryTable } from '@/components/OrderHistoryTable';
import { OrderDetailsDialog } from '@/components/OrderDetailsDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Package, FileText, History, Settings, X, Loader2, User, Search, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import type { Product, Lta } from '@shared/schema';
import { cn } from '@/lib/utils';

interface ProductWithLtaPrice extends Product {
  contractPrice: string;
  currency: string;
  ltaId: string;
}

interface CartItem {
  productId: string;
  productSku: string;
  productNameEn: string;
  productNameAr: string;
  quantity: number;
  price: string;
  currency: string;
  ltaId: string;
}

interface Template {
  id: string;
  nameEn: string;
  nameAr: string;
  items: string;
  createdAt: string;
}

interface Order {
  id: string;
  items: string;
  totalAmount: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: string;
  pipefyCardId?: string;
}

export default function OrderingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [activeLtaId, setActiveLtaId] = useState<string | null>(null);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLtaFilter, setSelectedLtaFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithLtaPrice[]>({
    queryKey: ['/api/products'],
  });

  const { data: clientLtas = [], isLoading: ltasLoading } = useQuery<Lta[]>({
    queryKey: ['/api/client/ltas'],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/client/templates'],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/client/orders'],
  });

  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest('POST', '/api/client/orders', orderData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('orderSubmitted'),
      });
      setCart([]);
      setActiveLtaId(null);
      setCartOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/client/orders'] });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const res = await apiRequest('POST', '/api/client/templates', template);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/templates'] });
      toast({
        title: t('templateSaved'),
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/client/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/templates'] });
      toast({
        title: t('templateDeleted'),
      });
    },
  });

  // Get unique categories from products
  const categories = ['all', ...new Set((products || []).map(p => p.category).filter(Boolean))];

  // Check for empty state or loading states
  if (ltasLoading || productsLoading || templatesLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }




  const filteredProducts = selectedLtaFilter !== 'all'
    ? (products || []).filter(p => {
        const matchesLta = p.ltaId === selectedLtaFilter;
        const matchesSearch = searchQuery === '' ||
          p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nameAr.includes(searchQuery) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesLta && matchesSearch && matchesCategory;
      })
    : [];


  const handleAddToCart = (product: ProductWithLtaPrice) => {
    // Check if cart is empty or product is from same LTA
    if (activeLtaId && activeLtaId !== product.ltaId) {
      // Show warning dialog asking user to clear cart or cancel
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Different Contract' : 'عقد مختلف',
        description: language === 'en'
          ? 'This product is from a different LTA contract. Please complete or clear your current order first.'
          : 'هذا المنتج من عقد اتفاقية مختلف. يرجى إكمال أو مسح طلبك الحالي أولاً.',
      });
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productSku: product.sku,
        productNameEn: product.nameEn,
        productNameAr: product.nameAr,
        quantity: 1,
        price: product.contractPrice,
        currency: product.currency,
        ltaId: product.ltaId,
      }]);

      // Set active LTA if cart was empty
      if (!activeLtaId) {
        setActiveLtaId(product.ltaId);
      }
    }

    toast({
      description: language === 'ar'
        ? `تمت إضافة ${product.nameAr} إلى السلة`
        : `${product.nameEn} added to cart`
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  };

  const handleRemoveItem = (productId: string) => {
    const newCart = cart.filter(item => item.productId !== productId);
    setCart(newCart);

    // If cart is empty, reset active LTA
    if (newCart.length === 0) {
      setActiveLtaId(null);
    }

    toast({
      description: language === 'ar' ? 'تمت إزالة العنصر من السلة' : 'Item removed from cart'
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setActiveLtaId(null);
    toast({
      description: language === 'ar' ? 'تم مسح السلة' : 'Cart cleared'
    });
  };

  const handleSubmitOrder = () => {
    // Validate all items from same LTA
    const ltaIds = Array.from(new Set(cart.map(item => item.ltaId)));
    if (ltaIds.length > 1) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Order Error' : 'خطأ في الطلب',
        description: language === 'en'
          ? 'All items must be from the same LTA contract'
          : 'يجب أن تكون جميع العناصر من نفس عقد الاتفاقية',
      });
      return;
    }

    const total = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const items = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    submitOrderMutation.mutate({
      items,
      totalAmount: total.toFixed(2),
      currency: cart[0]?.currency || 'USD',
    });
  };

  const handleSaveTemplate = (nameEn: string, nameAr: string) => {
    const items = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    saveTemplateMutation.mutate({
      nameEn,
      nameAr,
      items,
    });
    setSaveTemplateDialogOpen(false);
  };

  const handleLoadTemplate = (templateData: { id: string; nameEn: string; nameAr: string; items: string; createdAt: Date }) => {
    try {
      const templateItems = JSON.parse(templateData.items);
      const newCartItems: CartItem[] = [];

      for (const item of templateItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          newCartItems.push({
            productId: product.id,
            productNameEn: product.nameEn,
            productNameAr: product.nameAr,
            price: product.contractPrice,
            quantity: item.quantity,
            productSku: product.sku,
            currency: product.currency,
            ltaId: product.ltaId,
          });
        }
      }

      setCart(newCartItems);
      toast({
        title: t('templateLoaded'),
        description: language === 'ar' ? templateData.nameAr : templateData.nameEn,
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ في تحميل القالب' : 'Error loading template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplateMutation.mutate(id);
  };

  const handleReorder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const orderItems = JSON.parse(order.items);
      const newCartItems: CartItem[] = [];

      for (const item of orderItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          newCartItems.push({
            productId: product.id,
            productNameEn: product.nameEn,
            productNameAr: product.nameAr,
            price: product.contractPrice,
            quantity: item.quantity,
            productSku: product.sku,
            currency: product.currency,
            ltaId: product.ltaId,
          });
        }
      }

      setCart(newCartItems);
      toast({
        title: language === 'ar' ? 'تم تحميل الطلب إلى السلة' : 'Order loaded to cart',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ في تحميل الطلب' : 'Error loading order',
        variant: 'destructive',
      });
    }
  };

  const handleViewOrderDetails = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setOrderDetailsDialogOpen(true);
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formattedOrders = orders.map(order => {
    const orderItems = JSON.parse(order.items);
    return {
      id: order.id,
      createdAt: new Date(order.createdAt),
      itemCount: orderItems.length,
      totalAmount: order.totalAmount,
      status: order.status,
      currency: orderItems[0]?.currency || 'USD',
    };
  });

  const formattedTemplates = templates.map(template => {
    const templateItems = JSON.parse(template.items);
    return {
      id: template.id,
      nameEn: template.nameEn,
      nameAr: template.nameAr,
      items: template.items,
      itemCount: templateItems.length,
      createdAt: new Date(template.createdAt),
    };
  });

  // Convert cart items to match ShoppingCart component interface
  const shoppingCartItems = cart.map(item => ({
    productId: item.productId,
    nameEn: item.productNameEn,
    nameAr: item.productNameAr,
    price: item.price,
    quantity: item.quantity,
    sku: item.productSku,
  }));

  function ProductCard({ product }: { product: ProductWithLtaPrice }) {
    const name = language === 'ar' ? product.nameAr : product.nameEn;
    const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
    const cartItem = cart.find(item => item.productId === product.id);
    const isDifferentLta = activeLtaId !== null && activeLtaId !== product.ltaId;

    return (
      <Card
        className={cn(
          "flex flex-col overflow-hidden hover-elevate",
          isDifferentLta && "opacity-50"
        )}
        data-testid={`card-product-${product.id}`}
      >
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-muted">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={name}
              className="w-full h-full object-cover"
              data-testid={`img-product-${product.id}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground" />
            </div>
          )}

        </div>

        {/* Product Info */}
        <CardContent className="flex-1 p-4 space-y-2">
          <div>
            <h3 className="font-semibold text-base line-clamp-1" data-testid={`text-product-name-${product.id}`}>
              {name}
            </h3>
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              <p className="text-lg font-bold font-mono" data-testid={`text-price-${product.id}`}>
                {product.contractPrice} {product.currency}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'سعر العقد' : 'Contract Price'}
              </p>
            </div>

            {/* Quantity in cart indicator */}
            {cartItem && (
              <Badge variant="outline" data-testid={`badge-in-cart-${product.id}`}>
                {cartItem.quantity} {language === 'ar' ? 'في السلة' : 'in cart'}
              </Badge>
            )}
          </div>
        </CardContent>

        {/* Add to Cart */}
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={() => handleAddToCart(product)}
            disabled={isDifferentLta}
            className="w-full"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <Package className="w-4 h-4 me-2" />
            {isDifferentLta
              ? (language === 'ar' ? 'عقد مختلف' : 'Different Contract')
              : (language === 'ar' ? 'أضف إلى السلة' : 'Add to Cart')
            }
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1a1a] to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${scrolled ? 'bg-background/80 border-border shadow-lg' : 'bg-background/50 border-border/50'}`}>
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="/logo.png"
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'}
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0"
            />
            <h1 className="text-sm sm:text-xl font-semibold truncate text-primary">
              {language === 'ar' ? 'نظام الطلبات' : 'Ordering System'}
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
              data-testid="button-profile"
            >
              <Link href="/profile">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            {user?.isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                data-testid="button-admin"
              >
                <Link href="/admin">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <NotificationCenter />
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="relative hover:bg-primary/10 hover:border-primary transition-all duration-300"
              onClick={() => setCartOpen(true)}
              data-testid="button-open-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  className="absolute -top-1 -end-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground border-0"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
              className="text-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6" data-testid="tabs-list">
            <TabsTrigger value="products" data-testid="tab-products">
              <Package className="h-4 w-4 me-2" />
              {language === 'ar' ? 'المنتجات' : 'Products'}
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <FileText className="h-4 w-4 me-2" />
              {t('templates')}
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 me-2" />
              {t('history')}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-0">
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold">{t('ordering.title')}</h1>
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {filteredProducts.length} {t('ordering.products')}
                    </Badge>
                  </div>

                  {/* LTA Selector */}
                  <Select value={selectedLtaFilter} onValueChange={setSelectedLtaFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-lta-filter">
                      <SelectValue placeholder={language === 'ar' ? 'العقد' : 'Contract'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {language === 'ar' ? 'جميع العقود' : 'All Contracts'}
                      </SelectItem>
                      {clientLtas.map(lta => (
                        <SelectItem key={lta.id} value={lta.id}>
                          {language === 'ar' ? lta.nameAr : lta.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedLtaFilter !== 'all' && (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1">
                      <Input
                        type="search"
                        placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                        data-testid="input-search-products"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-category">
                        <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {language === 'ar' ? 'جميع الفئات' : 'All Categories'}
                        </SelectItem>
                        {categories.filter(c => c !== 'all').map((category) => (
                          <SelectItem key={category} value={category || ''}>
                            {category || (language === 'ar' ? 'غير مصنف' : 'Uncategorized')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Results count */}
              <div className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? `${filteredProducts.length} منتج`
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`}
              </div>
            </div>

            {selectedLtaFilter === 'all' ? (
              <Card className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'ar' ? 'اختر عقد اتفاقية' : 'Select a Contract'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar'
                    ? 'يرجى اختيار عقد اتفاقية من القائمة أعلاه لعرض المنتجات المتاحة'
                    : 'Please select an LTA contract from the dropdown above to view available products'}
                </p>
              </Card>
            ) : productsLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="flex flex-col">
                      <Skeleton className="w-full aspect-square" />
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-6 w-1/3 mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'ar' ? 'لا توجد منتجات متاحة' : 'No Products Available'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar'
                    ? 'لم يتم تعيين أي منتجات لعقد الاتفاقية الخاص بك بعد.'
                    : 'No products are assigned to your LTA contract yet.'}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-0">
            {templatesLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {language === 'ar' ? 'جاري تحميل القوالب...' : 'Loading templates...'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </Card>
                  ))}
                </div>
              </div>
            ) : formattedTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formattedTemplates.map((template) => (
                  <OrderTemplateCard
                    key={template.id}
                    id={template.id}
                    nameEn={template.nameEn}
                    nameAr={template.nameAr}
                    itemCount={template.itemCount}
                    createdAt={template.createdAt}
                    onLoad={() => handleLoadTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('noTemplates')}</p>
                <p className="text-sm text-muted-foreground mt-2">{t('createTemplate')}</p>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            {ordersLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {language === 'ar' ? 'جاري تحميل الطلبات...' : 'Loading orders...'}
                  </span>
                </div>
                <Card className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </Card>
              </div>
            ) : (
              <OrderHistoryTable
                orders={formattedOrders}
                onViewDetails={handleViewOrderDetails}
                onReorder={handleReorder}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Shopping Cart */}
      <ShoppingCartComponent
        items={shoppingCartItems}
        open={cartOpen}
        onOpenChange={setCartOpen}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
        onSaveTemplate={() => setSaveTemplateDialogOpen(true)}
        currency={cart[0]?.currency || 'USD'}
      />

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={saveTemplateDialogOpen}
        onOpenChange={setSaveTemplateDialogOpen}
        onSave={handleSaveTemplate}
      />

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        open={orderDetailsDialogOpen}
        onOpenChange={setOrderDetailsDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
}