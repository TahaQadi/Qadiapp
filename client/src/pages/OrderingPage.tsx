import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Heart, Package, Trash2, Send, X, ShoppingCart, User, LogOut, FileText, Loader2, Settings, Search, History, Menu, DollarSign, AlertCircle, Minus, Plus, Boxes } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import type { Product, Lta } from '@shared/schema';
import { SEO } from "@/components/SEO";
import { safeJsonParse } from '@/lib/safeJson';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCartActions } from '@/hooks/useCartActions';
import { cn } from '@/lib/utils';

export interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

export interface CartItem {
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
  currency: string;
  pipefyCardId?: string;
}

export default function OrderingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();

  const isArabic = language === 'ar';

  const [cartOpen, setCartOpen] = useState(false);
  const {
    cart,
    setCart,
    activeLtaId,
    setActiveLtaId,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart
  } = useCartActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLtaFilter, setSelectedLtaFilter] = useState<string>('');
  const [customQuantity, setCustomQuantity] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductWithLtaPrice | null>(null);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [priceRequestList, setPriceRequestList] = useState<CartItem[]>([]);
  const [priceRequestDialogOpen, setPriceRequestDialogOpen] = useState(false);
  const [priceRequestMessage, setPriceRequestMessage] = useState('');

  // Ref to store scroll position for restoration after cart updates
  const scrollPositionRef = useRef<number | null>(null);

  // Restore scroll position after cart updates
  useEffect(() => {
    if (scrollPositionRef.current !== null) {
      // Use setTimeout to ensure DOM has fully updated
      const timeoutId = setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current!);
        scrollPositionRef.current = null; // Reset after restoration
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [cart]);

  // Load price request list from sessionStorage on mount
  useEffect(() => {
    const savedList = sessionStorage.getItem('priceRequestList');
    if (savedList) {
      try {
        const parsedList = JSON.parse(savedList);
        setPriceRequestList(parsedList);
        sessionStorage.removeItem('priceRequestList'); // Clear after loading
      } catch (error) {
        console.error('Error loading price request list:', error);
      }
    }
  }, []);

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

  // Set initial LTA filter to first LTA when loaded
  useEffect(() => {
    if (clientLtas.length > 0 && !selectedLtaFilter) {
      setSelectedLtaFilter(clientLtas[0].id);
    }
  }, [clientLtas, selectedLtaFilter]);


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
      setPriceRequestMessage('');
      setPriceRequestDialogOpen(false);
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

  // Optimized add to cart handler - must be before conditional logic
  const handleAddToCart = useCallback((product: ProductWithLtaPrice, quantityChange: number = 1) => {
    if (!product.hasPrice || !product.contractPrice || !product.ltaId) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'No Price Available' : 'لا يوجد سعر',
        description: language === 'en'
          ? 'Please request a price offer for this product first.'
          : 'يرجى طلب عرض سعر لهذا المنتج أولاً.',
      });
      return;
    }

    if (activeLtaId && activeLtaId !== product.ltaId) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Different Contract' : 'عقد مختلف',
        description: language === 'en'
          ? 'This product is from a different LTA contract. Please complete or clear your current order first.'
          : 'هذا المنتج من عقد اتفاقية مختلف. يرجى إكمال أو مسح طلبك الحالي أولاً.',
      });
      return;
    }

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.productId === product.id);

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        const newQuantity = newCart[existingItemIndex].quantity + quantityChange;

        // Remove item if quantity becomes 0 or less
        if (newQuantity <= 0) {
          // Preserve scroll position before state change
          scrollPositionRef.current = window.scrollY;
          newCart.splice(existingItemIndex, 1);
          if (newCart.length === 0) {
            setActiveLtaId(null);
          }
          return newCart;
        }

        // Preserve scroll position before state change
        scrollPositionRef.current = window.scrollY;
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newQuantity
        };
        return newCart;
      }

      // Add new item only if quantity is positive
      if (quantityChange > 0 && product.contractPrice && product.ltaId) {
        // Preserve scroll position before state change
        scrollPositionRef.current = window.scrollY;
        return [...prevCart, {
          productId: product.id,
          productSku: product.sku,
          productNameEn: product.nameEn,
          productNameAr: product.nameAr,
          quantity: quantityChange,
          price: product.contractPrice,
          currency: product.currency || 'ILS',
          ltaId: product.ltaId,
        }];
      }

      // No change to cart, don't set scroll ref
      return prevCart;
    });

    if (!activeLtaId && quantityChange > 0) {
      setActiveLtaId(product.ltaId);
    }
  }, [cart, activeLtaId, toast, language, setCart, setActiveLtaId]);

  const handleSubmitOrder = useCallback(() => {
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
      ltaId: item.ltaId,
      sku: item.productSku,
    }));

    submitOrderMutation.mutate({
      items,
      totalAmount: total.toFixed(2),
      currency: cart[0]?.currency || 'USD',
    });
  }, [cart, toast, language, submitOrderMutation]);

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
    const templateItems = safeJsonParse(templateData.items, []) as any[];
    const newCartItems: CartItem[] = [];

    for (const item of templateItems) {
      if (item && typeof item === 'object' && 'productId' in item && 'quantity' in item) {
        const product = products.find(p => p.id === (item as any).productId);
        if (product && product.contractPrice && product.ltaId) {
          newCartItems.push({
            productId: product.id,
            productNameEn: product.nameEn,
            productNameAr: product.nameAr,
            price: product.contractPrice,
            quantity: (item as any).quantity,
            productSku: product.sku,
            currency: product.currency || 'ILS',
            ltaId: product.ltaId,
          });
        }
      }
    }

    if (newCartItems.length > 0) {
      setCart(newCartItems);
      toast({
        title: t('templateLoaded'),
        description: language === 'ar' ? templateData.nameAr : templateData.nameEn,
      });
    } else {
      toast({
        title: language === 'ar' ? 'خطأ في تحميل القالب' : 'Error loading template',
        description: language === 'ar' ? 'لم يتم العثور على منتجات صالحة في القالب' : 'No valid products found in template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplateMutation.mutate(id);
  };

  const handleAddToPriceRequest = useCallback((product: ProductWithLtaPrice) => {
    setPriceRequestList(prev => {
      // Check if already exists
      if (prev.some(item => item.productId === product.id)) {
        toast({
          description: language === 'ar'
            ? 'المنتج موجود بالفعل في قائمة طلبات الأسعار'
            : 'Product already in price request list'
        });
        return prev;
      }

      toast({
        description: language === 'ar'
          ? `تمت إضافة ${product.nameAr} إلى قائمة طلبات الأسعار`
          : `${product.nameEn} added to price request list`
      });

      return [...prev, {
        productId: product.id,
        productSku: product.sku,
        productNameEn: product.nameEn,
        productNameAr: product.nameAr,
        quantity: 1,
        price: '0',
        currency: 'USD',
        ltaId: '',
      }];
    });
  }, [toast, language]);

  const handleRemoveFromPriceRequest = useCallback((productId: string) => {
    setPriceRequestList(prev => prev.filter(item => item.productId !== productId));
    toast({
      description: language === 'ar' ? 'تمت إزالة المنتج' : 'Product removed'
    });
  }, [toast, language]);

  const handleSubmitPriceRequest = async () => {
    if (priceRequestList.length === 0) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? 'يرجى إضافة منتجات لطلب السعر'
          : 'Please add products to request price'
      });
      return;
    }

    if (!selectedLtaFilter) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? 'يرجى اختيار اتفاقية'
          : 'Please select an LTA'
      });
      return;
    }

    try {
      const productIds = priceRequestList.map(item => item.productId);

      const res = await apiRequest('POST', '/api/price-requests', {
        ltaId: selectedLtaFilter,
        products: priceRequestList.map(item => ({
          productId: item.productId,
          quantity: item.quantity || 1
        })),
        notes: priceRequestMessage || undefined
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit price request');
      }

      const data = await res.json();

      toast({
        title: language === 'ar' ? 'تم إرسال الطلب' : 'Request Sent',
        description: data.messageAr && language === 'ar' ? data.messageAr : data.message,
      });

      setPriceRequestList([]);
      setPriceRequestMessage('');
      setPriceRequestDialogOpen(false);

      // Invalidate both notifications and products to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/client/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    } catch (error: any) {
      console.error('Price request error:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل إرسال الطلب' : 'Failed to submit request'),
      });
    }
  };

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCategories([]); // Clear multi-select
    setPriceRange([0, 10000]); // Reset price range
  }, []);

  // Use memoized product filters - must be after all hooks
  const { filteredProducts, categories } = useProductFilters(
    products || [],
    searchQuery,
    selectedCategory, // This will need to be adjusted for multi-select
    selectedLtaFilter
  );

  const handleReorder = (formattedOrder: { id: string; createdAt: Date; itemCount: number; totalAmount: string; status: string; currency: string }) => {
    const originalOrder = orders.find(o => o.id === formattedOrder.id);
    if (!originalOrder) return;

    const orderItems = safeJsonParse(originalOrder.items, []) as any[];
    const newCartItems: CartItem[] = [];

    for (const item of orderItems) {
      if (item && typeof item === 'object' && 'productId' in item && 'quantity' in item) {
        const product = products.find(p => p.id === (item as any).productId);
        if (product && product.contractPrice && product.ltaId) {
          newCartItems.push({
            productId: product.id,
            productNameEn: product.nameEn,
            productNameAr: product.nameAr,
            price: product.contractPrice,
            quantity: (item as any).quantity,
            productSku: product.sku,
            currency: product.currency || 'ILS',
            ltaId: product.ltaId,
          });
        }
      }
    }

    if (newCartItems.length > 0) {
      setCart(newCartItems);
      toast({
        title: language === 'ar' ? 'تم تحميل الطلب إلى السلة' : 'Order loaded to cart',
      });
    } else {
      toast({
        title: language === 'ar' ? 'خطأ في تحميل الطلب' : 'Error loading order',
        description: language === 'ar' ? 'لم يتم العثور على منتجات صالحة في الطلب' : 'No valid products found in order',
        variant: 'destructive',
      });
    }
  };

  const handleViewOrderDetails = (formattedOrder: { id: string; createdAt: Date; itemCount: number; totalAmount: string; status: string; currency: string }) => {
    const originalOrder = orders.find(o => o.id === formattedOrder.id);
    if (originalOrder) {
      setSelectedOrder(originalOrder);
      setOrderDetailsDialogOpen(true);
    }
  };

  const cartItemCount = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const formattedOrders = useMemo(() => orders.map(order => {
    const orderItems = safeJsonParse(order.items, []) as any[];
    return {
      id: order.id,
      createdAt: new Date(order.createdAt),
      itemCount: orderItems.length,
      totalAmount: order.totalAmount,
      status: order.status,
      currency: orderItems[0]?.currency || order.currency || 'ILS',
    };
  }), [orders]);

  const formattedTemplates = useMemo(() => templates.map(template => {
    const templateItems = safeJsonParse(template.items, []);
    return {
      id: template.id,
      nameEn: template.nameEn,
      nameAr: template.nameAr,
      items: template.items,
      itemCount: templateItems.length,
      createdAt: new Date(template.createdAt),
    };
  }), [templates]);

  // Convert cart items to match ShoppingCart component interface
  const shoppingCartItems = useMemo(() => cart.map(item => ({
    productId: item.productId,
    nameEn: item.productNameEn,
    nameAr: item.productNameAr,
    price: item.price,
    quantity: item.quantity,
    sku: item.productSku,
  })), [cart]);

  function ProductCard({ product }: { product: ProductWithLtaPrice }) {
    const primaryName = language === 'ar' ? product.nameAr : product.nameEn;
    const secondaryName = language === 'ar' ? product.nameEn : product.nameAr;
    const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
    const cartItem = cart.find(item => item.productId === product.id);
    const isDifferentLta = activeLtaId !== null && activeLtaId !== product.ltaId;
    const inPriceRequest = priceRequestList.some(item => item.productId === product.id);
    const [, setLocation] = useLocation();
    const [quantityType, setQuantityType] = useState<'pcs' | 'box'>('pcs');
    // const [customQuantity, setCustomQuantity] = useState(1); // Already defined above

    const productSlug = product.nameEn?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
    const categorySlug = (product.category?.trim() || 'products').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'products';
    const productUrl = `/products/${categorySlug}/${productSlug}`;

    const handleCardClick = () => {
      setLocation(productUrl);
    };

    // Function to handle quantity changes directly from the card
    const handleQuantityChange = (change: number) => {
      handleAddToCart(product, change);
    };

    // Calculate final quantity based on type
    const getFinalQuantity = (qty: number) => {
      if (quantityType === 'box' && product.unitPerBox) {
        return qty * parseInt(product.unitPerBox);
      }
      return qty;
    };

    const handleAddWithQuantity = () => {
      const finalQty = getFinalQuantity(customQuantity);
      handleAddToCart(product, finalQty);
      setCustomQuantity(1); // Reset after adding
    };

    return (
      <Card
        className={cn(
          "group flex flex-col overflow-hidden transition-all duration-500 ease-out " +
          "bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm " +
          "border-border/50 dark:border-[#d4af37]/20 " +
          "hover:border-primary dark:hover:border-[#d4af37] " +
          "hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 " +
          "animate-fade-in",
          isDifferentLta && "opacity-50 pointer-events-none"
        )}
        data-testid={`card-product-${product.id}`}
      >
        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

        {/* Product Image */}
        <div
          className="relative w-full aspect-square bg-gradient-to-br from-muted/30 to-muted/60 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handleCardClick}
        >
          <div className="w-full h-full">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={primaryName}
                className="w-full h-full object-cover"
                data-testid={`img-product-${product.id}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
              </div>
            )}
          </div>
        </div>

          {/* Badges */}
          <div className="absolute top-2 end-2 flex flex-col gap-2">
            {cartItem && (
              <Badge
                className="bg-primary text-primary-foreground shadow-lg backdrop-blur-sm"
                data-testid={`badge-in-cart-${product.id}`}
              >
                {cartItem.quantity} {language === 'ar' ? 'في السلة' : 'in cart'}
              </Badge>
            )}
            {product.category && (
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm text-xs"
              >
                {product.category}
              </Badge>
            )}
          </div>

        {/* Product Info */}
        <CardContent className="flex-1 p-4 space-y-3 relative z-10">
          <div>
            <h3
              className="font-semibold text-base line-clamp-2 text-card-foreground hover:text-primary transition-colors cursor-pointer"
              data-testid={`text-product-name-${product.id}`}
              onClick={handleCardClick}
            >
              {primaryName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {secondaryName}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</p>
            {product.unitPerBox && (
              <Badge variant="outline" className="text-xs">
                📦 {product.unitPerBox} {language === 'ar' ? 'قطع/صندوق' : 'pcs/box'}
              </Badge>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {description}
            </p>
          )}

          {/* Pricing Section */}
          <div className="pt-2 border-t border-border/50">
            {product.hasPrice && product.contractPrice ? (
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-primary" data-testid={`text-price-${product.id}`}>
                  {product.contractPrice} <span className="text-sm font-normal">{product.currency}</span>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {language === 'ar' ? 'سعر العقد' : 'Contract Price'}
                </p>
              </div>
            ) : product.sellingPricePiece ? (
              <div className="space-y-1">
                <p className="text-xl font-bold font-mono text-muted-foreground" data-testid={`text-price-${product.id}`}>
                  {product.sellingPricePiece} <span className="text-sm font-normal">{language === 'ar' ? 'ش' : 'ILS'}</span>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'ar' ? 'سعر القطعة (مرجعي)' : 'Reference Price'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'ar' ? 'السعر غير متوفر' : 'Price not available'}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Action Buttons */}
        <CardFooter className="p-4 pt-0 gap-2 relative z-20 flex-col">
          {product.hasPrice ? (
            <>
              {cartItem ? (
                <div className="flex items-center gap-2 w-full">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full h-8 w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(-1);
                    }}
                    disabled={isDifferentLta}
                    data-testid={`button-decrement-cart-${product.id}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-center flex-1">{cartItem.quantity} {language === 'ar' ? 'في السلة' : 'in cart'}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full h-8 w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(1);
                    }}
                    disabled={isDifferentLta}
                    data-testid={`button-increment-cart-${product.id}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-full space-y-2">
                  {/* Quantity Type Selector (only if product has unitPerBox) */}
                  {product.unitPerBox && (
                    <div className="flex gap-1 p-1 bg-muted rounded-lg">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuantityType('pcs');
                        }}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                          quantityType === 'pcs'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        data-testid={`button-select-pcs-${product.id}`}
                      >
                        {language === 'ar' ? 'قطع' : 'Pieces'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuantityType('box');
                        }}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                          quantityType === 'box'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        data-testid={`button-select-box-${product.id}`}
                      >
                        📦 {language === 'ar' ? 'صناديق' : 'Boxes'}
                      </button>
                    </div>
                  )}

                  {/* Quantity Selector and Add Button */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-lg flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCustomQuantity(Math.max(1, customQuantity - 1));
                        }}
                        className="p-2 hover:bg-muted transition-colors"
                        data-testid={`button-decrease-qty-${product.id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={customQuantity}
                        onChange={(e) => {
                          e.stopPropagation();
                          const val = parseInt(e.target.value) || 1;
                          setCustomQuantity(Math.max(1, val));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-12 text-center border-x bg-transparent focus:outline-none font-semibold"
                        data-testid={`input-quantity-${product.id}`}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCustomQuantity(customQuantity + 1);
                        }}
                        className="p-2 hover:bg-muted transition-colors"
                        data-testid={`button-increase-qty-${product.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddWithQuantity();
                      }}
                      disabled={isDifferentLta}
                      className="flex-1 transition-all duration-300 shadow-sm hover:shadow-md"
                      data-testid={`button-add-to-cart-${product.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 me-2" />
                      <span className="truncate">
                        {isDifferentLta
                          ? (language === 'ar' ? 'عقد مختلف' : 'Different Contract')
                          : (language === 'ar' ? 'أضف' : 'Add')
                        }
                      </span>
                    </Button>
                  </div>

                  {/* Show total pieces when box is selected */}
                  {quantityType === 'box' && product.unitPerBox && customQuantity > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      = {getFinalQuantity(customQuantity)} {language === 'ar' ? 'قطعة' : 'pieces'}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToPriceRequest(product);
              }}
              variant={inPriceRequest
                ? 'secondary'
                : 'outline'
              }
              className="w-full transition-all duration-300 shadow-sm hover:shadow-md"
              size="lg"
              data-testid={`button-add-to-price-request-${product.id}`}
            >
              <Heart className={`w-4 h-4 me-2 ${inPriceRequest ? 'fill-current' : ''}`} />
              <span>
                {inPriceRequest
                  ? (language === 'ar' ? 'في قائمة الأسعار' : 'In Price List')
                  : (language === 'ar' ? 'طلب عرض سعر' : 'Request Quote')
                }
              </span>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Check for empty state or loading states
  if (ltasLoading || productsLoading || templatesLoading || ordersLoading) {
    return (
      <>
        <SEO
          title={isArabic ? "الطلبات" : "Orders"}
          description={isArabic ? "إدارة طلباتك وسلة التسوق" : "Manage your orders and shopping cart"}
          noIndex={true}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={isArabic ? "الطلبات" : "Orders"}
        description={isArabic ? "إدارة طلباتك وسلة التسوق" : "Manage your orders and shopping cart"}
        noIndex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black" dir={isArabic ? 'rtl' : 'ltr'}>
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
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 h-14 sm:h-16 lg:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Section - Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <img
              src="/logo.png"
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'}
              className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
            />
            <div className="min-w-0 hidden xs:block">
              <h1 className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                {language === 'ar' ? 'بوابة القاضي' : 'AlQadi Gate'}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden md:block truncate">
                {language === 'ar' ? 'مرحباً' : 'Welcome'}, {language === 'ar' ? user?.nameAr : user?.nameEn}
              </p>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
            {/* Price Request Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-primary/10 hover:border-primary transition-all duration-300 shadow-sm touch-manipulation active:scale-95"
              onClick={() => setPriceRequestDialogOpen(true)}
              data-testid="button-price-request"
            >
              <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
              {priceRequestList.length > 0 && (
                <span
                  className="absolute -top-0.5 -end-0.5 sm:-top-1 sm:-end-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold bg-destructive text-destructive-foreground shadow-lg animate-pulse ring-2 ring-background"
                  data-testid="badge-price-request-count"
                >
                  {priceRequestList.length > 9 ? '9+' : priceRequestList.length}
                </span>
              )}
            </Button>

            {/* Cart Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-primary/10 hover:border-primary transition-all duration-300 shadow-sm touch-manipulation active:scale-95"
              onClick={() => setCartOpen(true)}
              data-testid="button-open-cart"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {cartItemCount > 0 && (
                <span
                  className="absolute -top-0.5 -end-0.5 sm:-top-1 sm:-end-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold bg-primary text-primary-foreground shadow-lg animate-pulse ring-2 ring-background"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Button>

            {/* Notifications */}
            <NotificationCenter />

            {/* Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-primary/10 hover:border-primary transition-all duration-300 shadow-sm touch-manipulation active:scale-95"
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'left' : 'right'} className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col h-full">
                  {/* User Info Header */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">
                        {language === 'ar' ? user?.nameAr : user?.nameEn}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 py-4 space-y-1">
                    <Link href="/profile">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 text-sm"
                        data-testid="sidebar-profile"
                      >
                        <User className="h-4 w-4" />
                        <span>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                      </Button>
                    </Link>

                    {user?.isAdmin && (
                      <Link href="/admin">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-11 text-sm"
                          data-testid="sidebar-admin"
                        >
                          <Settings className="h-4 w-4" />
                          <span>{language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}</span>
                        </Button>
                      </Link>
                    )}

                    <div className="py-2">
                      <Separator />
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-1">
                      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {language === 'ar' ? 'الإعدادات' : 'Settings'}
                      </p>

                      <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded-md transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 flex items-center justify-center text-base">
                            🌐
                          </div>
                          <span className="text-sm">{language === 'ar' ? 'اللغة' : 'Language'}</span>
                        </div>
                        <LanguageToggle />
                      </div>

                      <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded-md transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 flex items-center justify-center text-base">
                            🎨
                          </div>
                          <span className="text-sm">{language === 'ar' ? 'المظهر' : 'Theme'}</span>
                        </div>
                        <ThemeToggle />
                      </div>
                    </div>
                  </nav>

                  {/* Logout Button */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-3 h-11 text-sm touch-manipulation active:scale-95"
                      onClick={() => window.location.href = '/api/logout'}
                      data-testid="sidebar-logout"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

        {/* Main Content */}
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 relative z-10">
          {/* Welcome Section */}
          <div className="mb-8 animate-slide-down">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {language === 'ar' ? 'لوحة الطلبات' : 'Ordering Dashboard'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'إدارة طلباتك وسلة التسوق من مكان واحد'
                : 'Manage your orders and shopping cart from one place'}
            </p>
          </div>

          {/* Catalog Link Banner */}
          <Card className="mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 hover:border-primary/40 transition-all duration-300 animate-fade-in">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                  <div className="p-2 sm:p-3 rounded-xl bg-primary/10 flex-shrink-0">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1">
                      {language === 'ar' ? 'تصفح كتالوج المنتجات' : 'Browse Product Catalog'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {language === 'ar'
                        ? 'استكشف جميع المنتجات المتاحة واطلب عروض الأسعار'
                        : 'Explore all available products and request price quotes'}
                    </p>
                  </div>
                </div>
                <Button asChild size="default" className="w-full sm:w-auto sm:flex-shrink-0">
                  <Link href="/catalog">
                    <Boxes className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'عرض الكتالوج' : 'View Catalog'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="lta-products" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8 h-11 sm:h-12" data-testid="tabs-list">
              <TabsTrigger value="lta-products" className="text-sm sm:text-base" data-testid="tab-lta-products">
                <Package className="h-4 w-4 me-1 sm:me-2" />
                <span className="hidden xs:inline">{language === 'ar' ? 'اتفاقياتي' : 'My LTAs'}</span>
                <span className="xs:hidden">{language === 'ar' ? 'اتفاقياتي' : 'LTAs'}</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-sm sm:text-base" data-testid="tab-templates">
                <FileText className="h-4 w-4 me-1 sm:me-2" />
                <span className="hidden xs:inline">{t('templates')}</span>
                <span className="xs:hidden">{language === 'ar' ? 'قوالب' : 'Temp'}</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm sm:text-base" data-testid="tab-history">
                <History className="h-4 w-4 me-1 sm:me-2" />
                <span className="hidden xs:inline">{t('history')}</span>
                <span className="xs:hidden">{language === 'ar' ? 'سجل' : 'Hist'}</span>
              </TabsTrigger>
            </TabsList>

            {/* LTA Products Tab - Shows only LTA-filtered products */}
            <TabsContent value="lta-products" className="mt-0">
              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                {/* LTA Tabs */}
                {clientLtas.length > 0 ? (
                  <div className="bg-card/50 rounded-lg p-3 sm:p-4 border border-border/50">
                    <Tabs value={selectedLtaFilter || clientLtas[0]?.id || ''} onValueChange={setSelectedLtaFilter} className="w-full">
                      <div className="relative">
                        <TabsList className="w-full inline-flex items-center justify-start h-auto gap-2 p-1 bg-muted rounded-md overflow-x-auto flex-nowrap">
                          {clientLtas.map(lta => (
                            <TabsTrigger
                              key={lta.id}
                              value={lta.id}
                              className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-[120px]"
                              data-testid={`tab-lta-${lta.id}`}
                            >
                              {language === 'ar' ? lta.nameAr : lta.nameEn}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>
                    </Tabs>
                  </div>
                ) : (
                  <Card className="p-12 text-center border-2 border-dashed">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {language === 'ar' ? 'لا توجد اتفاقيات' : 'No LTA Agreements'}
                      </h3>
                      <p className="text-muted-foreground">
                        {language === 'ar'
                          ? 'لم يتم تعيين أي اتفاقيات طويلة الأجل لحسابك بعد.'
                          : 'No Long-Term Agreements have been assigned to your account yet.'}
                      </p>
                    </div>
                  </Card>
                )}

                <div className="flex flex-col gap-4 sm:gap-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-semibold">
                      {t('ordering.title')}
                    </h2>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {filteredProducts.length}
                    </Badge>
                  </div>

                  {selectedLtaFilter && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            type="search"
                            placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 ps-10 border-2 focus-visible:ring-2"
                            data-testid="input-search-products"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                              onClick={() => setSearchQuery('')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-full sm:w-[220px] h-11 border-2" data-testid="select-category">
                            <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {language === 'ar' ? 'جميع الفئات' : 'All Categories'} ({products.filter(p => selectedLtaFilter === 'all' || p.ltaId === selectedLtaFilter).length})
                            </SelectItem>
                            {categories.filter(c => c !== 'all').map((category) => {
                              const count = products.filter(p =>
                                p.category === category &&
                                (selectedLtaFilter === 'all' || p.ltaId === selectedLtaFilter)
                              ).length;
                              return (
                                <SelectItem key={category} value={category || ''}>
                                  {category || (language === 'ar' ? 'غير مصنف' : 'Uncategorized')} ({count})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Active Filters */}
                      {(searchQuery || selectedCategory !== 'all') && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground">
                            {language === 'ar' ? 'الفلاتر النشطة:' : 'Active filters:'}
                          </span>
                          {searchQuery && (
                            <Badge variant="secondary" className="gap-1">
                              {language === 'ar' ? 'بحث:' : 'Search:'} "{searchQuery}"
                              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                            </Badge>
                          )}
                          {selectedCategory !== 'all' && (
                            <Badge variant="secondary" className="gap-1">
                              {selectedCategory}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('all');
                            }}
                            className="h-6 text-xs"
                          >
                            {language === 'ar' ? 'مسح الكل' : 'Clear all'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {productsLoading ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>
                      {language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Card key={i} className="flex flex-col">
                        <Skeleton className="w-full aspect-square" />
                        <CardContent className="p-4 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-8 w-1/3 mt-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <Card className="p-12 text-center border-2 border-dashed">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {language === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedCategory !== 'all'
                        ? (language === 'ar'
                          ? 'لم نتمكن من العثور على أي منتجات تطابق معايير البحث الخاصة بك.'
                          : 'We couldn\'t find any products matching your search criteria.')
                        : (language === 'ar'
                          ? 'لم يتم تعيين أي منتجات لعقد الاتفاقية الخاص بك بعد.'
                          : 'No products are assigned to your LTA contract yet.')
                      }
                    </p>
                    {(searchQuery || selectedCategory !== 'all') && (
                      <Button onClick={handleClearFilters} variant="outline">
                        {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'عرض' : 'Showing'}{' '}
                      <span className="font-semibold text-foreground">{filteredProducts.length}</span>{' '}
                      {language === 'ar' ? 'منتج' : 'products'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
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
          order={selectedOrder ? {
            ...selectedOrder,
            createdAt: new Date(selectedOrder.createdAt)
          } : null}
        />

        {/* Price Request Dialog */}
        <Dialog open={priceRequestDialogOpen} onOpenChange={setPriceRequestDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'قائمة طلبات الأسعار' : 'Price Request List'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {priceRequestList.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === 'ar'
                      ? 'قائمتك فارغة. أضف منتجات بدون أسعار من صفحة المنتجات أدناه.'
                      : 'Your list is empty. Add products without prices from the products page below.'}
                  </p>
                  <Button onClick={() => setPriceRequestDialogOpen(false)}>
                    <Package className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {priceRequestList.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between gap-2 p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {language === 'ar' ? item.productNameAr : item.productNameEn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.productSku}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFromPriceRequest(item.productId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'ar' ? 'رسالة إضافية (اختياري)' : 'Additional Message (Optional)'}
                    </label>
                    <Textarea
                      value={priceRequestMessage}
                      onChange={(e) => setPriceRequestMessage(e.target.value)}
                      placeholder={language === 'ar'
                        ? 'أضف أي ملاحظات أو تفاصيل إضافية...'
                        : 'Add any notes or additional details...'}
                      rows={4}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPriceRequestDialogOpen(false)}
                data-testid="button-close-price-request-dialog"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
              {priceRequestList.length > 0 && (
                <Button
                  onClick={handleSubmitPriceRequest}
                  disabled={requestPriceMutation.isPending}
                  data-testid="button-send-price-request"
                >
                  {requestPriceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 me-2" />
                  )}
                  {requestPriceMutation.isPending
                    ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                    : (language === 'ar' ? 'إرسال الطلب' : 'Send Request')
                  }
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}