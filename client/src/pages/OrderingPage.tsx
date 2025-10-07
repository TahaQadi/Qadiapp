import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/LanguageProvider';
import { ClientSelector } from '@/components/ClientSelector';
import { ProductCard } from '@/components/ProductCard';
import { ShoppingCart, CartItem } from '@/components/ShoppingCart';
import { OrderTemplateCard } from '@/components/OrderTemplateCard';
import { OrderHistoryTable } from '@/components/OrderHistoryTable';
import { SaveTemplateDialog } from '@/components/SaveTemplateDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart as CartIcon, FileText, History, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// todo: remove mock functionality
const mockClients = [
  { id: '1', nameEn: 'Acme Corporation', nameAr: 'شركة أكمي' },
  { id: '2', nameEn: 'Global Trading Co.', nameAr: 'شركة التجارة العالمية' },
  { id: '3', nameEn: 'Tech Solutions Inc.', nameAr: 'شركة الحلول التقنية' },
];

const mockProducts = [
  { id: '1', nameEn: 'Office Chair', nameAr: 'كرسي مكتب', descriptionEn: 'Ergonomic design', descriptionAr: 'تصميم مريح', sku: 'CHAIR-001', price: '299.99', stockStatus: 'in-stock' as const },
  { id: '2', nameEn: 'Standing Desk', nameAr: 'مكتب واقف', descriptionEn: 'Adjustable height', descriptionAr: 'ارتفاع قابل للتعديل', sku: 'DESK-001', price: '599.99', stockStatus: 'in-stock' as const },
  { id: '3', nameEn: 'Monitor Arm', nameAr: 'ذراع شاشة', descriptionEn: 'Dual monitor support', descriptionAr: 'دعم شاشتين', sku: 'ARM-001', price: '149.99', stockStatus: 'low-stock' as const },
  { id: '4', nameEn: 'Keyboard', nameAr: 'لوحة مفاتيح', descriptionEn: 'Mechanical switches', descriptionAr: 'مفاتيح ميكانيكية', sku: 'KB-001', price: '179.99', stockStatus: 'in-stock' as const },
  { id: '5', nameEn: 'Mouse', nameAr: 'فأرة', descriptionEn: 'Wireless ergonomic', descriptionAr: 'لاسلكية مريحة', sku: 'MOUSE-001', price: '89.99', stockStatus: 'out-of-stock' as const },
  { id: '6', nameEn: 'Laptop Stand', nameAr: 'حامل لابتوب', descriptionEn: 'Adjustable aluminum', descriptionAr: 'ألمنيوم قابل للتعديل', sku: 'STAND-001', price: '79.99', stockStatus: 'in-stock' as const },
];

export default function OrderingPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState([
    { id: '1', nameEn: 'Weekly Office Supplies', nameAr: 'مستلزمات مكتبية أسبوعية', itemCount: 5, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  ]);
  
  type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered';
  interface OrderItem {
    id: string;
    createdAt: Date;
    itemCount: number;
    totalAmount: string;
    status: OrderStatus;
    currency: string;
  }
  
  const [orders, setOrders] = useState<OrderItem[]>([
    { id: '550e8400-e29b-41d4-a716-446655440000', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), itemCount: 5, totalAmount: '1250.00', status: 'delivered', currency: 'USD' },
  ]);

  const filteredProducts = mockProducts.filter(product => {
    if (!searchQuery) return true;
    const name = language === 'ar' ? product.nameAr : product.nameEn;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || product.sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddToCart = (productId: string) => {
    const product = mockProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cartItems.find(item => item.productId === productId);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
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
    toast({
      title: t('itemRemoved'),
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    toast({
      title: t('emptyCart'),
    });
  };

  const handleSubmitOrder = () => {
    const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      itemCount: cartItems.length,
      totalAmount: (total * 1.15).toFixed(2),
      status: 'pending' as const,
      currency: 'USD',
    };
    setOrders([newOrder, ...orders]);
    setCartItems([]);
    setCartOpen(false);
    
    toast({
      title: t('orderSubmitted'),
      description: `Order ${newOrder.id} - USD ${newOrder.totalAmount}`,
    });
  };

  const handleSaveTemplate = (nameEn: string, nameAr: string) => {
    const newTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      nameEn,
      nameAr,
      itemCount: cartItems.length,
      createdAt: new Date(),
    };
    setTemplates([newTemplate, ...templates]);
    
    toast({
      title: t('templateSaved'),
      description: language === 'ar' ? nameAr : nameEn,
    });
  };

  const handleLoadTemplate = (templateId: string) => {
    // Simulate loading template items
    setCartItems([
      { productId: '1', nameEn: 'Office Chair', nameAr: 'كرسي مكتب', price: '299.99', quantity: 2, sku: 'CHAIR-001' },
      { productId: '2', nameEn: 'Standing Desk', nameAr: 'مكتب واقف', price: '599.99', quantity: 1, sku: 'DESK-001' },
    ]);
    
    toast({
      title: t('templateLoaded'),
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    
    toast({
      title: t('templateDeleted'),
    });
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
            <ClientSelector
              clients={mockClients}
              selectedClientId={selectedClientId}
              onClientSelect={setSelectedClientId}
            />
          </div>

          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products" data-testid="tab-products">
              <Search className="h-4 w-4 me-2" />
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

          <TabsContent value="products" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('searchProducts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                  data-testid="input-search-products"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  nameEn={product.nameEn}
                  nameAr={product.nameAr}
                  descriptionEn={product.descriptionEn}
                  descriptionAr={product.descriptionAr}
                  price={product.price}
                  currency="USD"
                  sku={product.sku}
                  stockStatus={product.stockStatus}
                  onAddToCart={() => handleAddToCart(product.id)}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <OrderTemplateCard
                  key={template.id}
                  id={template.id}
                  nameEn={template.nameEn}
                  nameAr={template.nameAr}
                  itemCount={template.itemCount}
                  createdAt={template.createdAt}
                  onLoad={() => handleLoadTemplate(template.id)}
                  onDelete={() => handleDeleteTemplate(template.id)}
                />
              ))}
            </div>

            {templates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">{t('noTemplates')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('createTemplate')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <OrderHistoryTable
              orders={orders}
              onViewDetails={(id) => console.log('View order:', id)}
              onReorder={(id) => {
                handleLoadTemplate(id);
                toast({
                  title: t('templateLoaded'),
                });
              }}
            />

            {orders.length === 0 && (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">{t('noOrders')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('placeFirstOrder')}</p>
              </div>
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
