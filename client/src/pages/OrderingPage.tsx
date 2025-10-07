import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/LanguageProvider';
import { ShoppingCart, CartItem } from '@/components/ShoppingCart';
import { SaveTemplateDialog } from '@/components/SaveTemplateDialog';
import { OrderTemplateCard } from '@/components/OrderTemplateCard';
import { OrderHistoryTable } from '@/components/OrderHistoryTable';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart as CartIcon, LogOut, User, Search, Plus, Package, FileText, History, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

interface ProductWithPrice {
  id: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price: string | null;
  currency: string;
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
}

export default function OrderingPage() {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithPrice[]>({
    queryKey: ['/api/products'],
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
      setCartItems([]);
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

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const name = language === 'ar' ? product.nameAr : product.nameEn;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           product.sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddToCart = (product: ProductWithPrice) => {
    if (!product.price) {
      toast({
        title: language === 'ar' ? 'السعر غير متوفر' : 'Price not available',
        variant: 'destructive',
      });
      return;
    }

    const existingItem = cartItems.find(item => item.productId === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, {
        productId: product.id,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        price: product.price,
        quantity: 1,
        sku: product.sku,
      }]);
    }
    
    toast({
      title: t('itemAdded'),
      description: language === 'ar' ? product.nameAr : product.nameEn,
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.productId !== productId));
    } else {
      setCartItems(cartItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSubmitOrder = () => {
    const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const items = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    submitOrderMutation.mutate({
      items,
      totalAmount: total.toFixed(2),
      currency: 'USD',
    });
  };

  const handleSaveTemplate = (nameEn: string, nameAr: string) => {
    const items = cartItems.map(item => ({
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
        if (product && product.price) {
          newCartItems.push({
            productId: product.id,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            price: product.price,
            quantity: item.quantity,
            sku: product.sku,
          });
        }
      }

      setCartItems(newCartItems);
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
        if (product && product.price) {
          newCartItems.push({
            productId: product.id,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            price: product.price,
            quantity: item.quantity,
            sku: product.sku,
          });
        }
      }

      setCartItems(newCartItems);
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
    toast({
      title: language === 'ar' ? 'عرض تفاصيل الطلب' : 'View order details',
      description: `Order ID: ${orderId}`,
    });
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const formattedOrders = orders.map(order => {
    const orderItems = JSON.parse(order.items);
    return {
      id: order.id,
      createdAt: new Date(order.createdAt),
      itemCount: orderItems.length,
      totalAmount: order.totalAmount,
      status: order.status,
      currency: 'USD',
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {language === 'ar' ? 'نظام الطلبات' : 'Ordering System'}
            </h1>
            <Badge variant="secondary" className="hidden md:flex">
              {language === 'ar' ? user?.nameAr : user?.nameEn}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
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
                data-testid="button-admin"
              >
                <Link href="/admin">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
              data-testid="button-open-cart"
            >
              <CartIcon className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -end-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6" data-testid="tabs-list">
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
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                  data-testid="input-search-products"
                />
              </div>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="p-4 hover-elevate">
                    <div className="mb-3">
                      <h3 className="font-semibold mb-1">
                        {language === 'ar' ? product.nameAr : product.nameEn}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">
                        {product.price ? `${product.price} ${product.currency}` : (language === 'ar' ? 'لا يوجد سعر' : 'No price')}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.price}
                        data-testid={`button-add-${product.sku}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && !productsLoading && (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-0">
            {templatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </Card>
                ))}
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
              <Card className="p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </Card>
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
      <ShoppingCart
        items={cartItems}
        open={cartOpen}
        onOpenChange={setCartOpen}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
        onSaveTemplate={() => setSaveTemplateDialogOpen(true)}
        currency="USD"
      />

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={saveTemplateDialogOpen}
        onOpenChange={setSaveTemplateDialogOpen}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
