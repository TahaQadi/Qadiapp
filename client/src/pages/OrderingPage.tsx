import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/LanguageProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { OrderingCartSheet } from '@/components/OrderingCartSheet';
import { SaveTemplateDialog } from '@/components/SaveTemplateDialog';
import { OrderTemplateCard } from '@/components/OrderTemplateCard';
import { OrderHistoryTable } from '@/components/OrderHistoryTable';
import { OrderDetailsDialog } from '@/components/OrderDetailsDialog';
import { OrderConfirmationDialog } from '@/components/OrderConfirmationDialog';
import { OrderFeedbackDialog } from '@/components/OrderFeedbackDialog';
import { IssueReportDialog } from '@/components/IssueReportDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { getProductUrl } from '@/lib/productLinks';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Heart, Package, Trash2, Send, X, ShoppingCart, FileText, Loader2, Search, History, DollarSign, AlertCircle, Minus, Plus, Boxes, ArrowRight, Star, AlertTriangle, Calendar, Check, Save, Eye, Download, FolderOpen, Menu, User, LogOut, Settings, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import type { Product, Lta } from '@shared/schema';
import { SEO } from "@/components/SEO";
import { safeJsonParse } from '@/lib/safeJson';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCartActions } from '@/hooks/useCartActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { MicroFeedbackWidget } from '@/components/MicroFeedbackWidget';
import { EmptyState } from '@/components/EmptyState';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

export interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

interface Template {
  id: string;
  name: string;
  items: string;
  createdAt: string;
}

interface Order {
  id: string;
  items: string;
  totalAmount: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  currency: string;
  pipefyCardId?: string;
}

interface LtaDocument {
  id: string;
  ltaId: string;
  ltaName?: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
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

export default function OrderingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [issueReportDialogOpen, setIssueReportDialogOpen] = useState(false);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState<string | null>(null);
  const [selectedOrderForIssue, setSelectedOrderForIssue] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showOrderPlacementFeedback, setShowOrderPlacementFeedback] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Price offer creation states
  const [createOfferDialogOpen, setCreateOfferDialogOpen] = useState(false);
  const [selectedPriceRequestId, setSelectedPriceRequestId] = useState<string | null>(null);
  const [offerItems, setOfferItems] = useState<Map<string, { quantity: number; price: string }>>(new Map());
  const [offerNotes, setOfferNotes] = useState('');
  const [offerValidityDays, setOfferValidityDays] = useState('30');
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState<any | null>(null); // State to hold the selected price request for offer creation

  // State for active view (dashboard card clicked) - default to LTA products
  const [activeView, setActiveView] = useState<string | null>('lta-products');

  // Fetch price offers for client
  const { data: priceOffers = [], isLoading: priceOffersLoading } = useQuery<any[]>({
    queryKey: ['/api/price-offers'],
    enabled: !!user,
  });

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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearchFocus: () => {
      searchInputRef.current?.focus();
    },
    onCartToggle: () => {
      setCartOpen(prev => !prev);
    },
    onEscape: () => {
      // Close modals/dialogs
      if (cartOpen) setCartOpen(false);
      if (saveTemplateDialogOpen) setSaveTemplateDialogOpen(false);
      if (orderDetailsDialogOpen) setOrderDetailsDialogOpen(false);
      if (orderConfirmationOpen) setOrderConfirmationOpen(false);
      if (feedbackDialogOpen) setFeedbackDialogOpen(false);
      if (issueReportDialogOpen) setIssueReportDialogOpen(false);
      if (createOfferDialogOpen) setCreateOfferDialogOpen(false);
    },
  });

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

  const { data: ltaDocuments = [], isLoading: ltaDocumentsLoading } = useQuery<LtaDocument[]>({
    queryKey: ['/api/client/ltas/documents'],
    enabled: !!user,
  });

  const { data: priceRequests = [], isLoading: priceRequestsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/price-requests'],
    enabled: user?.isAdmin || false,
  });

  // Check if admin is creating an offer from price request (must be after priceRequests query)
  useEffect(() => {
    const requestId = sessionStorage.getItem('createOfferRequestId');
    if (requestId && user?.isAdmin && priceRequests.length > 0) {
      sessionStorage.removeItem('createOfferRequestId');
      // Small delay to ensure data is loaded
      setTimeout(() => {
        // Find the request and open the dialog
        const request = priceRequests.find((r: any) => r.id === requestId);
        if (request) {
          setSelectedRequestForOffer(request);
          handleOpenCreateOffer(request.id);
        }
      }, 500);
    }
  }, [user?.isAdmin, priceRequests]);

  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest('POST', '/api/client/orders', orderData);
      return await res.json();
    },
    onSuccess: (newOrder) => { // Changed to capture newOrder
      toast({
        title: language === 'ar' ? 'تم إنشاء الطلب بنجاح' : 'Order created successfully',
        description: language === 'ar'
          ? `معرف الطلب: ${newOrder.id}`
          : `Order ID: ${newOrder.id}`,
      });

      // Show micro-feedback after 3 seconds
      setTimeout(() => {
        setShowOrderPlacementFeedback(true);
      }, 3000);

      setCart([]); // Clear cart here
      setActiveLtaId(null); // Clear active LTA ID
      setCartOpen(false); // Close cart
      queryClient.invalidateQueries({ queryKey: ['/api/client/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
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

  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/price-offers', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إنشاء عرض السعر' : 'Offer Created',
        description: language === 'ar' ? 'تم إنشاء عرض السعر بنجاح' : 'Price offer created successfully',
      });
      setCreateOfferDialogOpen(false);
      setOfferItems(new Map());
      setOfferNotes('');
      setOfferValidityDays('30');
      setSelectedPriceRequestId(null);
      setSelectedRequestForOffer(null); // Clear selected request
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل إنشاء عرض السعر' : 'Failed to create offer'),
      });
    },
  });

  // Optimized add to cart handler - must be before conditional logic
  const handleAddToCart = useCallback((product: ProductWithLtaPrice, quantityChange: number = 1) => {
    if (!product.hasPrice || !product.contractPrice || !product.ltaId) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'No Price Available' : 'السعر غير متوفر',
        description: language === 'en'
          ? 'Please request a price offer for this product first.'
          : 'الرجاء طلب عرض سعر لهذا المنتج أولاً.',
      });
      return;
    }

    if (activeLtaId && activeLtaId !== product.ltaId) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Different Contract' : 'عقد مختلف',
        description: language === 'en'
          ? 'This product is from a different LTA contract. Please complete or clear your current order first.'
          : 'هذا المنتج من عقد اتفاقية طويل الأجل مختلف. الرجاء إكمال أو مسح طلبك الحالي أولاً.',
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
          productNameEn: product.name || '',
          productNameAr: product.name || '',
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
          : 'يجب أن تكون جميع العناصر من نفس عقد الاتفاقية طويل الأجل',
      });
      return;
    }

    // Show confirmation dialog instead of submitting directly
    setOrderConfirmationOpen(true);
    setCartOpen(false);
  }, [cart, toast, language]);

  const handleConfirmOrder = useCallback(() => {
    // Calculate total - prices already include tax
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
      currency: cart[0]?.currency || 'ILS',
    });
    setOrderConfirmationOpen(false);
  }, [cart, submitOrderMutation]);

  const handleSaveTemplate = (name: string) => {
    const items = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    saveTemplateMutation.mutate({
      name,
      items,
    });
    setSaveTemplateDialogOpen(false);
  };

  const handleLoadTemplate = (templateData: { id: string; name: string; items: string; createdAt: Date }) => {
    const templateItems = safeJsonParse(templateData.items, []) as any[];
    const newCartItems: CartItem[] = [];

    for (const item of templateItems) {
      if (item && typeof item === 'object' && 'productId' in item && 'quantity' in item) {
        const product = products.find(p => p.id === (item as any).productId);
        if (product && product.contractPrice && product.ltaId) {
          newCartItems.push({
            productId: product.id,
            productSku: product.sku,
          productNameEn: product.name || '',
          productNameAr: product.name || '',
          quantity: (item as any).quantity,
          price: product.contractPrice,
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
        description: templateData.name,
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

  const handleOpenCreateOffer = (requestId: string) => {
    setSelectedPriceRequestId(requestId);
    const request = priceRequests.find((r: any) => r.id === requestId);
    if (request) {
      const requestProducts = typeof request.products === 'string' ? JSON.parse(request.products) : request.products;
      const newMap = new Map();
      requestProducts.forEach((p: any) => {
        newMap.set(p.productId, { quantity: p.quantity, price: '' });
      });
      setOfferItems(newMap);
      setSelectedRequestForOffer(request); // Set the selected request
    }
    setCreateOfferDialogOpen(true);
  };

  const handleUpdateOfferItemPrice = (productId: string, price: string) => {
    const newMap = new Map(offerItems);
    const current = newMap.get(productId);
    if (current) {
      newMap.set(productId, { ...current, price });
    }
    setOfferItems(newMap);
  };

  const handleUpdateOfferItemQuantity = (productId: string, delta: number) => {
    const newMap = new Map(offerItems);
    const current = newMap.get(productId);
    if (current) {
      const newQty = Math.max(1, current.quantity + delta);
      newMap.set(productId, { ...current, quantity: newQty });
    }
    setOfferItems(newMap);
  };

  const handleSubmitOffer = () => {
    if (!selectedPriceRequestId || offerItems.size === 0) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الرجاء إضافة منتجات وأسعار' : 'Please add products and prices',
      });
      return;
    }

    const missingPrices = Array.from(offerItems.entries()).filter(([_, data]) => !data.price || parseFloat(data.price) <= 0);
    if (missingPrices.length > 0) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? `الرجاء إدخال أسعار صالحة لجميع المنتجات (${missingPrices.length} عنصرًا ينقصه السعر)`
          : `Please enter valid prices for all products (${missingPrices.length} items missing prices)`,
      });
      return;
    }

    const request = selectedRequestForOffer; // Use the state variable here
    if (!request) return;

    const items = Array.from(offerItems.entries()).map(([productId, data]) => {
      const product = products.find((p) => p.id === productId);
      return {
        productId,
        sku: product?.sku || '',
        name: product?.name || '',
        quantity: data.quantity,
        price: data.price,
      };
    });

    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(offerValidityDays || '30'));

    createOfferMutation.mutate({
      requestId: selectedPriceRequestId,
      clientId: request.clientId,
      ltaId: request.ltaId,
      items,
      subtotal: total.toFixed(2),
      tax: '0.00',
      total: total.toFixed(2),
      notes: offerNotes || undefined,
      validUntil: validUntil.toISOString(),
    });
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
            productSku: product.sku,
          productNameEn: product.name || '',
          productNameAr: product.name || '',
          quantity: (item as any).quantity,
          price: product.contractPrice,
            currency: product.currency || 'ILS',
            ltaId: product.ltaId,
          });
        }
      }
    }

    if (newCartItems.length > 0) {
      setCart(newCartItems);
      toast({
        title: language === 'ar' ? 'تم تحميل الطلب إلى عربة التسوق' : 'Order loaded to cart',
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

  const cartTotalAmount = useMemo(() => {
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    return total.toFixed(2);
  }, [cart]);

  const formattedOrders = useMemo(() => orders.map(order => {
    const orderItems = safeJsonParse(order.items, []) as any[];
    // Calculate total quantity of all items
    const totalQuantity = orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    return {
      id: order.id,
      createdAt: new Date(order.createdAt),
      items: order.items,
      itemCount: totalQuantity,
      totalAmount: order.totalAmount,
      status: order.status,
      currency: order.currency || 'ILS',
    };
  }), [orders]);

  const formattedTemplates = useMemo(() => templates.map(template => {
    const templateItems = safeJsonParse(template.items, []);
    return {
      id: template.id,
      name: template.name,
      items: template.items,
      itemCount: templateItems.length,
      createdAt: new Date(template.createdAt),
    };
  }), [templates]);

  // Convert cart items to match OrderingCartSheet component interface
  const shoppingCartItemsForSheet = useMemo(() => cart.map(item => ({
    productId: item.productId,
    productSku: item.productSku,
    productName: language === 'ar' ? item.productNameAr : item.productNameEn,
    quantity: item.quantity,
    price: item.price,
    currency: item.currency,
    ltaId: item.ltaId,
  })), [cart, language]);

  function ProductCard({ product }: { product: ProductWithLtaPrice }) {
    const primaryName = product.name;
    const description = product.description;
    const cartItem = cart.find(item => item.productId === product.id);
    const isDifferentLta = activeLtaId !== null && activeLtaId !== product.ltaId;
    const [, setLocation] = useLocation();
    const [quantityType, setQuantityType] = useState<'pcs' | 'box'>('pcs');
    const [isSuccess, setIsSuccess] = useState(false);
    // const [customQuantity, setCustomQuantity] = useState(1); // Already defined above

    const productUrl = getProductUrl(product.sku);

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
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    };

    return (
      <Card
        className={cn(
          "group flex flex-col overflow-hidden transition-all duration-500 ease-out relative " +
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
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              product.imageUrl && "hidden"
            )}>
              <Package className="w-12 h-12 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
            </div>
          </div>
        </div>

          {/* Badges */}
          <div className={cn(
            "absolute top-1.5 flex flex-col gap-1",
            isArabic ? "start-1.5" : "end-1.5"
          )}>
            {cartItem && (
              <Badge
                className="bg-primary text-primary-foreground shadow-lg backdrop-blur-sm text-xs px-1.5 py-0.5"
                data-testid={`badge-in-cart-${product.id}`}
              >
                {cartItem.quantity} {language === 'ar' ? 'في العربية' : 'in cart'}
              </Badge>
            )}
            {product.category && (
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0.5"
              >
                {product.category}
              </Badge>
            )}
          </div>

        {/* Product Info */}
        <CardContent className="p-3 space-y-1 relative z-10">
          <div>
            <h3
              className="font-semibold text-sm line-clamp-2 leading-tight text-card-foreground hover:text-primary transition-colors cursor-pointer"
              data-testid={`text-product-name-${product.id}`}
              onClick={handleCardClick}
            >
              {primaryName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-muted-foreground font-mono">{product.sku}</p>
            {product.unitPerBox && (
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {language === 'ar' ? `${product.unitPerBox} قطعة/صندوق` : `${product.unitPerBox} pcs/box`}
              </Badge>
            )}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="pt-1 border-t border-border/50">
            {product.hasPrice && product.contractPrice ? (
              <p className="text-base font-bold font-mono text-primary" data-testid={`text-price-${product.id}`}>
                  {product.contractPrice} <span className="text-xs font-normal">{product.currency}</span>
                </p>
            ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  {language === 'ar' ? 'السعر غير متوفر' : 'Price not available'}
                </p>
            )}
          </div>
        </CardContent>

        {/* Action Buttons */}
        <CardFooter className="p-3 pt-0 gap-1 relative z-20 flex-col mt-auto">
          {product.hasPrice ? (
            <>
              {cartItem ? (
                <div className="flex items-center gap-1.5 w-full">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full flex-shrink-0 h-9 w-9"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(-1);
                    }}
                    disabled={isDifferentLta}
                    data-testid={`button-decrement-cart-${product.id}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="font-semibold text-xs text-center flex-1">{cartItem.quantity} {language === 'ar' ? 'في السلة' : 'in cart'}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full flex-shrink-0 h-9 w-9"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(1);
                    }}
                    disabled={isDifferentLta}
                    data-testid={`button-increment-cart-${product.id}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="w-full space-y-1.5">
                  {/* Quantity Type Selector (only if product has unitPerBox) */}
                  {product.unitPerBox && (
                    <div className="flex gap-0.5 p-0.5 bg-muted rounded">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuantityType('pcs');
                        }}
                        className={cn(
                          "flex-1 px-2 font-medium rounded transition-colors min-h-[44px] py-2 text-xs",
                          quantityType === 'pcs' ? "bg-primary text-primary-foreground" : "bg-background"
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
                          "flex-1 px-2 font-medium rounded transition-colors min-h-[44px] py-2 text-xs",
                          quantityType === 'box' ? "bg-primary text-primary-foreground" : "bg-background"
                        )}
                        data-testid={`button-select-box-${product.id}`}
                      >
                        {language === 'ar' ? `علب ${product.unitPerBox}` : `Boxes ${product.unitPerBox}`}
                      </button>
                    </div>
                  )}

                  {/* Quantity Selector and Add Button */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCustomQuantity(Math.max(1, customQuantity - 1));
                        }}
                        className="hover:bg-muted transition-colors min-h-[44px] min-w-[44px] p-2"
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
                        className="w-12 text-center text-sm border-x bg-transparent focus:outline-none font-semibold py-2 min-h-[44px]"
                        data-testid={`input-quantity-${product.id}`}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCustomQuantity(customQuantity + 1);
                        }}
                        className="hover:bg-muted transition-colors min-h-[44px] min-w-[44px] p-2"
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
                      isSuccess={isSuccess}
                      className="w-full transition-all duration-300 shadow-sm hover:shadow-md h-9 min-h-[36px] text-xs px-2"
                      data-testid={`button-add-to-cart-${product.id}`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 me-1.5" />
                      <span className="truncate">
                        {isDifferentLta
                          ? (language === 'ar' ? 'عقد مختلف' : 'Different Contract')
                          : (language === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart')
                        }
                      </span>
                    </Button>
                  </div>

                  {/* Show total pieces when box is selected */}
                  {quantityType === 'box' && product.unitPerBox && customQuantity > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center">
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
                // Redirect to catalog page for price requests
                window.location.href = '/catalog';
              }}
              variant="outline"
              className="w-full transition-all duration-300 shadow-sm hover:shadow-md h-11 min-h-[44px] text-sm"
              data-testid={`button-request-price-${product.id}`}
            >
              <Heart className="w-4 h-4 me-2" />
              <span>
                {language === 'ar' ? 'طلب عرض سعر' : 'Request Quote'}
              </span>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Check for empty state or loading states
  if (ltasLoading || productsLoading || templatesLoading || ordersLoading || priceRequestsLoading) {
    return (
      <>
        <SEO
          title={isArabic ? "الطلبات" : "Orders"}
          description={isArabic ? "إدارة الطلبات وسلة التسوق" : "Manage your orders and shopping cart"}
          noIndex={true}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'جار التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </>
    );
  }

// This file will be used to replace the broken OrderingPage.tsx
// Keeping only the essential JSX from line 1024 onwards

  return (
    <>
      <SEO
        title={isArabic ? "الطلبات" : "Orders"}
        description={isArabic ? "إدارة الطلبات وسلة التسوق" : "Manage your orders and shopping cart"}
        noIndex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black relative" dir={isArabic ? 'rtl' : 'ltr'}>
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-primary/20 rounded-full animate-float"></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

        {/* Header */}
              <PageHeader
                title={user?.name || (language === 'ar' ? 'لوحة الطلبات' : 'Ordering Dashboard')}
                subtitle={language === 'ar' ? 'إدارة الطلبات وسلة التسوق من مكان واحد' : 'Manage your orders and shopping cart from one place'}
                showLogo={true}
                showUserMenu={true}
                showNotifications={true}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 relative"
                      onClick={() => setCartOpen(true)}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {cartItemCount}
                        </Badge>
                      )}
                    </Button>
                    <LanguageToggle />
                    <ThemeToggle />
                  </>
                }
              />

            {/* Main Content */}
        <main className="container mx-auto px-4 py-8 relative z-10">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{language === 'ar' ? 'اتفاقيات نشطة' : 'Active LTAs'}</p>
                    <p className="text-xl font-bold">{clientLtas.length}</p>
                  </div>
                  <Package className="h-6 w-6 text-primary/60" />
                  </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{language === 'ar' ? 'في السلة' : 'In Cart'}</p>
                    <p className="text-xl font-bold">{cartItemCount}</p>
                </div>
                  <ShoppingCart className="h-6 w-6 text-primary/60" />
              </div>
            </CardContent>
          </Card>
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{language === 'ar' ? 'طلبات حديثة' : 'Recent Orders'}</p>
                    <p className="text-xl font-bold">{orders.length}</p>
              </div>
                  <History className="h-6 w-6 text-primary/60" />
            </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{language === 'ar' ? 'قوالب محفوظة' : 'Saved Templates'}</p>
                    <p className="text-xl font-bold">{templates.length}</p>
                      </div>
                  <FileText className="h-6 w-6 text-primary/60" />
                  </div>
              </CardContent>
                  </Card>
                  </div>

          {/* Back Button (shown when view is active) */}
          {activeView && (
            <Button
              variant="ghost"
              onClick={() => setActiveView(null)}
              className="mb-4 -ml-2"
            >
              <ArrowRight className={cn("h-4 w-4", isArabic ? "" : "rotate-180")} />
              <span className="ml-2">{language === 'ar' ? 'العودة للوحة القيادة' : 'Back to Dashboard'}</span>
            </Button>
          )}

          {/* Dashboard Action Cards - Accordion Style */}
          <div className="space-y-4">
            {/* LTA Products Card */}
            <div>
              <Card 
                className={cn(
                  "border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300 cursor-pointer",
                  activeView === 'lta-products' && "ring-2 ring-primary dark:ring-[#d4af37] shadow-lg"
                )}
                onClick={() => setActiveView(activeView === 'lta-products' ? null : 'lta-products')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                        <Package className="h-6 w-6 text-primary dark:text-[#d4af37]" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {language === 'ar' ? 'تصفح منتجات الاتفاقيات' : 'Browse LTA Products'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {language === 'ar' ? `${products.length} منتج متاح` : `${products.length} products available`}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-300",
                      activeView === 'lta-products' && "rotate-90"
                    )} />
                  </div>
                </CardHeader>
              </Card>
              
              {/* LTA Products Content */}
              {activeView === 'lta-products' && (
            <div className="mt-4 space-y-6">
                {/* LTA Tabs */}
                {clientLtas.length > 0 ? (
                <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <Tabs value={selectedLtaFilter || clientLtas[0]?.id || ''} onValueChange={setSelectedLtaFilter} className="w-full">
                      <TabsList className="w-full inline-flex items-center justify-start h-auto gap-2 p-1 bg-muted rounded-md overflow-x-auto">
                          {clientLtas.map(lta => (
                            <TabsTrigger
                              key={lta.id}
                              value={lta.id}
                              className="whitespace-nowrap flex-shrink-0 font-medium min-w-[120px] text-xs sm:text-sm px-3 sm:px-4 py-2 min-h-[44px]"
                            >
                              {lta.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                    </Tabs>
                  </CardContent>
                </Card>
                ) : (
                  <Card className="p-12 text-center border-2 border-dashed">
                  <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                        <Package className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {language === 'ar' ? 'لا توجد اتفاقيات' : 'No LTA Agreements'}
                      </h3>
                      <p className="text-muted-foreground">
                    {language === 'ar' ? 'لم يتم تعيين أي اتفاقيات لحسابك' : 'No agreements assigned to your account yet'}
                      </p>
                  </Card>
                )}

              {/* Search and Filters */}
                  {selectedLtaFilter && (
                <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className={cn(
                            "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none",
                            isArabic ? "right-3" : "left-3"
                          )} />
                          <Input
                            ref={searchInputRef}
                            type="search"
                            placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                            "w-full border-2 h-12 min-h-[44px]",
                              isArabic ? "pe-10 ps-4" : "ps-10 pe-4"
                            )}
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                              "absolute top-1/2 transform -translate-y-1/2 h-11 w-11",
                                isArabic ? "left-2" : "right-2"
                              )}
                              onClick={() => setSearchQuery('')}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[220px] border-2 h-12 min-h-[44px]">
                            <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                            {language === 'ar' ? 'كل الفئات' : 'All Categories'}
                            </SelectItem>
                          {categories.filter(c => c !== 'all').map((category) => (
                                <SelectItem key={category} value={category || ''}>
                              {category || (language === 'ar' ? 'غير مصنف' : 'Uncategorized')}
                                </SelectItem>
                          ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(searchQuery || selectedCategory !== 'all') && (
                        <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'عوامل التصفية:' : 'Filters:'}
                          </span>
                          {searchQuery && (
                            <Badge variant="secondary" className="gap-1">
                              {language === 'ar' ? `بحث: "${searchQuery}"` : `Search: "${searchQuery}"`}
                            <button onClick={() => setSearchQuery('')} className="ml-1">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )}
                          {selectedCategory !== 'all' && (
                            <Badge variant="secondary" className="gap-1">
                              {selectedCategory}
                            <button onClick={() => setSelectedCategory('all')} className="ml-1">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                          onClick={handleClearFilters}
                          className="h-8"
                          >
                            {language === 'ar' ? 'مسح الكل' : 'Clear all'}
                          </Button>
                        </div>
                      )}
                  </CardContent>
                </Card>
                  )}

              {/* Products Grid */}
              {productsLoading ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Card key={i} className="flex flex-col">
                        <Skeleton className="w-full aspect-square" />
                        <CardContent className="p-4 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <Card className="p-12 text-center border-2 border-dashed">
                  <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                      <Package className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                  <h3 className="text-xl font-semibold mb-2">
                      {language === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}
                    </h3>
                  <p className="text-muted-foreground mb-4">
                      {searchQuery || selectedCategory !== 'all'
                      ? (language === 'ar' ? 'لم نعثر على منتجات' : 'No products match your filters')
                      : (language === 'ar' ? 'لا توجد منتجات متاحة' : 'No products available')}
                    </p>
                    {(searchQuery || selectedCategory !== 'all') && (
                      <Button onClick={handleClearFilters} variant="outline">
                      {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                      </Button>
                    )}
                </Card>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'عرض' : 'Showing'}{' '}
                      <span className="font-semibold text-foreground">{filteredProducts.length}</span>{' '}
                      {language === 'ar' ? 'منتج' : 'products'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
              )}
            </div>

            {/* Templates Card */}
            <div>
              <Card 
                className={cn(
                  "border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300 cursor-pointer",
                  activeView === 'templates' && "ring-2 ring-primary dark:ring-[#d4af37] shadow-lg"
                )}
                onClick={() => setActiveView(activeView === 'templates' ? null : 'templates')}
              >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                      <FileText className="h-6 w-6 text-primary dark:text-[#d4af37]" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {language === 'ar' ? 'قوالبي' : 'My Templates'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {language === 'ar' ? `${templates.length} قالب محفوظ` : `${templates.length} saved templates`}
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-300",
                    activeView === 'templates' && "rotate-90"
                  )} />
                </div>
              </CardHeader>
              </Card>
              
              {/* Templates Content */}
              {activeView === 'templates' && (
            <div className="mt-4">
              {templates.length === 0 ? (
                <Card className="border-border/50 dark:border-[#d4af37]/20">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold mb-2">
                      {isArabic ? 'لا توجد قوالب' : 'No Templates'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isArabic ? 'قم بإنشاء قالب من عربة التسوق' : 'Create a template from your cart to save recurring orders'}
                    </p>
                    <Button onClick={() => setCartOpen(true)}>
                      {isArabic ? 'افتح السلة' : 'Open Cart'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formattedTemplates.map((template) => (
                    <OrderTemplateCard
                      key={template.id}
                      id={template.id}
                      name={template.name}
                      itemCount={template.itemCount}
                      createdAt={template.createdAt}
                      onLoad={() => handleLoadTemplate(template)}
                      onDelete={() => handleDeleteTemplate(template.id)}
                    />
                  ))}
                </div>
              )}
                  </div>
              )}
            </div>

            {/* Price Offers Card */}
            <div>
              <Card 
                className={cn(
                  "border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300 cursor-pointer",
                  activeView === 'price-offers' && "ring-2 ring-primary dark:ring-[#d4af37] shadow-lg"
                )}
                onClick={() => setActiveView(activeView === 'price-offers' ? null : 'price-offers')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                        <DollarSign className="h-6 w-6 text-primary dark:text-[#d4af37]" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {language === 'ar' ? 'عروض الأسعار' : 'Price Offers'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {language === 'ar' ? `${priceOffers.length} عرض` : `${priceOffers.length} offers`}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-300",
                      activeView === 'price-offers' && "rotate-90"
                    )} />
                  </div>
                </CardHeader>
              </Card>
              
              {/* Price Offers Content */}
              {activeView === 'price-offers' && (
            <div className="mt-4">
              {priceOffers.length === 0 ? (
                <Card className="border-border/50 dark:border-[#d4af37]/20">
                  <CardContent className="py-12 text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold mb-2">
                      {isArabic ? 'لا توجد عروض أسعار' : 'No Price Offers'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic ? 'لم يتم إنشاء أي عروض أسعار بعد' : 'No price offers have been created yet'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {priceOffers.map((offer: any) => (
                    <Card key={offer.id} className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm">
                        <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                              <CardTitle className="text-lg">{offer.offerNumber}</CardTitle>
                            <CardDescription>
                              {new Date(offer.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                              </CardDescription>
                            </div>
                          <Badge>{offer.status}</Badge>
                          </div>
                        </CardHeader>
                      <CardContent>
                        <p className="text-lg font-bold">
                          {offer.total} {offer.currency || 'ILS'}
                        </p>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              )}
            </div>
              )}
            </div>

            {/* Order History Card */}
            <div>
              <Card 
                className={cn(
                  "border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300 cursor-pointer",
                  activeView === 'history' && "ring-2 ring-primary dark:ring-[#d4af37] shadow-lg"
                )}
                onClick={() => setActiveView(activeView === 'history' ? null : 'history')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                        <History className="h-6 w-6 text-primary dark:text-[#d4af37]" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {language === 'ar' ? 'سجل الطلبات' : 'Order History'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {language === 'ar' ? `${orders.length} طلب` : `${orders.length} orders`}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-300",
                      activeView === 'history' && "rotate-90"
                    )} />
                  </div>
                </CardHeader>
              </Card>
              
              {/* Order History Content */}
              {activeView === 'history' && (
            <div className="mt-4">
              {orders.length === 0 ? (
                <Card className="border-border/50 dark:border-[#d4af37]/20">
                  <CardContent className="py-12 text-center">
                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold mb-2">
                      {isArabic ? 'لا توجد طلبات' : 'No Orders Yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic ? 'لم تقم بإنشاء أي طلبات بعد' : 'You haven\'t created any orders yet'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <OrderHistoryTable
                  orders={formattedOrders as any}
                  onViewDetails={handleViewOrderDetails}
                  onReorder={handleReorder}
                />
              )}
                </div>
              )}
            </div>

            {/* LTA Documents Card */}
            <div>
              <Card 
                className={cn(
                  "border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300 cursor-pointer",
                  activeView === 'lta-documents' && "ring-2 ring-primary dark:ring-[#d4af37] shadow-lg"
                )}
                onClick={() => setActiveView(activeView === 'lta-documents' ? null : 'lta-documents')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                        <FolderOpen className="h-6 w-6 text-primary dark:text-[#d4af37]" />
              </div>
                      <div>
                        <CardTitle className="text-base">
                          {language === 'ar' ? 'مستندات الاتفاقيات' : 'LTA Documents'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {language === 'ar' ? `${ltaDocuments.length} مستند` : `${ltaDocuments.length} documents`}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-300",
                      activeView === 'lta-documents' && "rotate-90"
                    )} />
                  </div>
                </CardHeader>
              </Card>
              
              {/* LTA Documents Content */}
              {activeView === 'lta-documents' && (
            <div className="mt-4">
              {ltaDocuments.length === 0 ? (
                <Card className="border-border/50 dark:border-[#d4af37]/20">
                  <CardContent className="py-12 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold mb-2">
                      {isArabic ? 'لا توجد مستندات' : 'No Documents'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic ? 'لا توجد مستندات متاحة' : 'No documents available'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    ltaDocuments.reduce((acc: Record<string, any[]>, doc: any) => {
                      if (!acc[doc.ltaId]) acc[doc.ltaId] = [];
                      acc[doc.ltaId].push(doc);
                      return acc;
                    }, {})
                  ).map(([ltaId, docs]: [string, any[]]) => {
                    const lta = clientLtas.find(l => l.id === ltaId);
                    return (
                      <Card key={ltaId} className="border-border/50 dark:border-[#d4af37]/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                            {lta?.name || docs[0]?.ltaName}
                          </CardTitle>
                          <CardDescription>
                            {docs.length} {language === 'ar' ? 'مستند' : 'documents'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {docs.map((doc: any) => (
                              <Card key={doc.id} className="border-border/50 dark:border-[#d4af37]/20">
                                  <CardContent className="p-4">
                                  <div className="flex items-center justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{doc.name}</p>
                                      <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                                      </div>
                                      <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(doc.fileUrl, '_blank')}
                                        className="flex-shrink-0"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
              )}
            </div>

            {/* Catalog Link Card */}
            <Link href="/catalog">
              <Card 
                className="mt-6 border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300 cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                      <Boxes className="h-6 w-6 text-primary dark:text-[#d4af37]" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {language === 'ar' ? 'تصفح الكتالوج' : 'Browse Catalog'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {language === 'ar' ? 'جميع المنتجات المتاحة' : 'All available products'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
            </main>

        {/* Bottom Sheet Cart */}
        <OrderingCartSheet
          items={cart.map(item => ({
            productId: item.productId,
            productSku: item.productSku,
            productName: language === 'ar' ? item.productNameAr : item.productNameEn,
            quantity: item.quantity,
            price: item.price,
            currency: item.currency,
            ltaId: item.ltaId,
          }))}
          open={cartOpen}
          onOpenChange={setCartOpen}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onSubmitOrder={handleSubmitOrder}
          onSaveTemplate={() => setSaveTemplateDialogOpen(true)}
          currency={cart[0]?.currency || 'ILS'}
        />

        {/* Dialogs */}
        <SaveTemplateDialog
          open={saveTemplateDialogOpen}
          onOpenChange={setSaveTemplateDialogOpen}
          onSave={handleSaveTemplate}
        />

        <OrderDetailsDialog
          open={orderDetailsDialogOpen}
          onOpenChange={setOrderDetailsDialogOpen}
          order={selectedOrder ? {
            ...selectedOrder,
            createdAt: new Date(selectedOrder.createdAt),
            clientId: (selectedOrder as any).clientId,
            ltaId: (selectedOrder as any).ltaId || null
              } : null}
            />

        <OrderConfirmationDialog
          open={orderConfirmationOpen}
          onOpenChange={setOrderConfirmationOpen}
          items={cart.map(item => ({
            productId: item.productId,
            name: language === 'ar' ? item.productNameAr : item.productNameEn,
            sku: item.productSku,
            quantity: item.quantity,
            price: item.price,
          }))}
          totalAmount={parseFloat(cartTotalAmount)}
          currency={cart[0]?.currency || 'ILS'}
          ltaName={clientLtas.find(lta => lta.id === activeLtaId)?.name}
          onConfirm={handleConfirmOrder}
          onEdit={() => {
            setOrderConfirmationOpen(false);
            setCartOpen(true);
          }}
              isSubmitting={submitOrderMutation.isPending}
            />

        {selectedOrderForFeedback && (
          <OrderFeedbackDialog
            orderId={selectedOrderForFeedback}
            open={feedbackDialogOpen}
            onOpenChange={(open) => {
              setFeedbackDialogOpen(open);
              if (!open) setSelectedOrderForFeedback(null);
              }}
            />
        )}

        <IssueReportDialog
          orderId={selectedOrderForIssue || undefined}
          open={issueReportDialogOpen}
          onOpenChange={(open) => {
            setIssueReportDialogOpen(open);
            if (!open) setSelectedOrderForIssue(null);
              }}
            />

        {showOrderPlacementFeedback && (
          <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-slide-up">
            <MicroFeedbackWidget
              touchpoint="order_placement"
              context={{ hasLta: !!activeLtaId }}
              onDismiss={() => setShowOrderPlacementFeedback(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}
