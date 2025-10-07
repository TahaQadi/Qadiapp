import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/LanguageProvider';
import { ShoppingCart, CartItem } from '@/components/ShoppingCart';
import { SaveTemplateDialog } from '@/components/SaveTemplateDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart as CartIcon, LogOut, User, Search, Plus } from 'lucide-react';
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

  const { data: templates = [] } = useQuery({
    queryKey: ['/api/client/templates'],
  });

  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest('POST', '/api/client/orders', orderData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Order submitted successfully',
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
        title: language === 'ar' ? 'تم حفظ القالب' : 'Template saved',
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
      title: language === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart',
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

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
