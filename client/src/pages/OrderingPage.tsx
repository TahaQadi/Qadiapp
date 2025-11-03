import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/LanguageProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ShoppingCart as ShoppingCartComponent } from '@/components/ShoppingCart';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { SaveTemplateDialog } from '@/components/SaveTemplateDialog';
import { OrderTemplateCard } from '@/components/OrderTemplateCard';
import { OrderHistoryTable } from '@/components/OrderHistoryTable';
import { OrderDetailsDialog } from '@/components/OrderDetailsDialog';
import { OrderConfirmationDialog } from '@/components/OrderConfirmationDialog';
import { OrderFeedbackDialog } from '@/components/OrderFeedbackDialog';
import { IssueReportDialog } from '@/components/IssueReportDialog';
import { OrderingSidebar } from '@/components/OrderingSidebar';
import { OrderingHeader } from '@/components/OrderingHeader';
import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Heart, Package, Trash2, Send, X, ShoppingCart, FileText, Loader2, Search, History, DollarSign, AlertCircle, Minus, Plus, Boxes, ArrowRight, Star, AlertTriangle, Calendar, Check, Save, Eye, Download, FolderOpen } from 'lucide-react';
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
import { QuickAddMenu } from '@/components/QuickAddMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

export interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

export interface CartItem {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  price: string;
  currency: string;
  ltaId: string;
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Price offer creation states
  const [createOfferDialogOpen, setCreateOfferDialogOpen] = useState(false);
  const [selectedPriceRequestId, setSelectedPriceRequestId] = useState<string | null>(null);
  const [offerItems, setOfferItems] = useState<Map<string, { quantity: number; price: string }>>(new Map());
  const [offerNotes, setOfferNotes] = useState('');
  const [offerValidityDays, setOfferValidityDays] = useState('30');
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState<any | null>(null); // State to hold the selected price request for offer creation

  // State for active tab
  const [activeTab, setActiveTab] = useState('lta-products'); // Default to 'lta-products'

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
          productName: product.name,
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
            productName: product.name,
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
            productName: product.name,
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

  // Convert cart items to match ShoppingCart component interface
  const shoppingCartItems = useMemo(() => cart.map(item => ({
    productId: item.productId,
    name: item.productName,
    price: item.price,
    quantity: item.quantity,
    sku: item.productSku,
  })), [cart]);

  function ProductCard({ product }: { product: ProductWithLtaPrice }) {
    const primaryName = product.name;
    const description = product.description;
    const cartItem = cart.find(item => item.productId === product.id);
    const isDifferentLta = activeLtaId !== null && activeLtaId !== product.ltaId;
    const [, setLocation] = useLocation();
    const [quantityType, setQuantityType] = useState<'pcs' | 'box'>('pcs');
    const [isHovered, setIsHovered] = useState(false);
    const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    // const [customQuantity, setCustomQuantity] = useState(1); // Already defined above

    const productSlug = product.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
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
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    };

    const handleQuickAdd = (qty: number) => {
      handleAddToCart(product, qty);
      setIsHovered(false);
      setShowQuickAddMenu(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    };

    // Mobile swipe-right gesture handler
    const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

      // Long press detection
      longPressTimerRef.current = setTimeout(() => {
        if (product.hasPrice && !isDifferentLta) {
          setShowQuickAddMenu(true);
        }
      }, 500);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      // Cancel long press if user moves finger
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      // Cancel long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Handle swipe-right gesture
      if (touchStartRef.current && product.hasPrice && !isDifferentLta) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        const deltaTime = Date.now() - touchStartRef.current.time;

        // Swipe right: deltaX > 50px, horizontal movement > vertical, quick gesture (< 500ms)
        if (deltaX > 50 && deltaX > deltaY && deltaTime < 500) {
          e.preventDefault();
          e.stopPropagation();
          handleQuickAdd(1);
        }
      }

      touchStartRef.current = null;
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }
      };
    }, []);

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
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Quick-add overlay (desktop hover) */}
        {!isMobile && isHovered && product.hasPrice && !isDifferentLta && (
          <QuickAddMenu
            onAdd={handleQuickAdd}
            disabled={isDifferentLta}
          />
        )}

        {/* Quick-add menu (mobile long-press) */}
        {showQuickAddMenu && product.hasPrice && !isDifferentLta && (
          <>
            <div 
              className="fixed inset-0 z-20" 
              onClick={() => setShowQuickAddMenu(false)}
            />
            <QuickAddMenu
              onAdd={handleQuickAdd}
              disabled={isDifferentLta}
              className="z-30"
            />
          </>
        )}
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
        <CardContent className="flex-1 p-3 space-y-1.5 relative z-10">
          <div>
            <h3
              className="font-semibold text-sm line-clamp-2 leading-tight text-card-foreground hover:text-primary transition-colors cursor-pointer"
              data-testid={`text-product-name-${product.id}`}
              onClick={handleCardClick}
            >
              {primaryName}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {product.sku}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-muted-foreground font-mono">SKU: {product.sku}</p>
            {product.unitPerBox && (
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {language === 'ar' ? `${product.unitPerBox} قطعة/صندوق` : `${product.unitPerBox} pcs/box`}
              </Badge>
            )}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {description}
            </p>
          )}

          {/* Pricing Section */}
          <div className="pt-1.5 border-t border-border/50">
            {product.hasPrice && product.contractPrice ? (
              <div className="space-y-0.5">
                <p className="text-lg font-bold font-mono text-primary" data-testid={`text-price-${product.id}`}>
                  {product.contractPrice} <span className="text-xs font-normal">{product.currency}</span>
                </p>
              </div>
            ) : product.sellingPricePiece ? (
              <div className="space-y-0.5">
                <p className="text-base font-bold font-mono text-muted-foreground" data-testid={`text-price-${product.id}`}>
                  {product.sellingPricePiece} <span className="text-xs font-normal">{language === 'ar' ? ' شيكل' : 'ILS'}</span>
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  {language === 'ar' ? 'سعر مرجعي (تقريبي)' : 'Reference Price'}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  {language === 'ar' ? 'السعر غير متوفر' : 'Price not available'}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Action Buttons */}
        <CardFooter className="p-3 pt-0 gap-1.5 relative z-20 flex-col">
          {product.hasPrice ? (
            <>
              {cartItem ? (
                <div className="flex items-center gap-2 w-full">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full flex-shrink-0 h-11 w-11 min-h-[44px] min-w-[44px]"
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
                  <span className="font-semibold text-sm text-center flex-1">{cartItem.quantity} {language === 'ar' ? 'في العربية' : 'in cart'}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full flex-shrink-0 h-11 w-11 min-h-[44px] min-w-[44px]"
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
                      className="w-full transition-all duration-300 shadow-sm hover:shadow-md h-11 min-h-[44px] text-sm"
                      data-testid={`button-add-to-cart-${product.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 me-2" />
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

  return (
    <>
      <SEO
        title={isArabic ? "الطلبات" : "Orders"}
        description={isArabic ? "إدارة الطلبات وسلة التسوق" : "Manage your orders and shopping cart"}
        noIndex={true}
      />
      <PageLayout showAnimatedBackground={false}>
        <SidebarProvider defaultOpen={false}>
          <div className="min-h-screen" dir={isArabic ? 'rtl' : 'ltr'} data-testid="page-ordering">
            {/* Animated background elements - Optimized for mobile */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 sm:top-1/3 left-1/4 sm:left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 dark:bg-[#d4af37]/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 sm:bottom-1/3 right-1/4 sm:right-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 dark:bg-[#d4af37]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

              {/* Floating particles - hidden on mobile */}
              <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-primary/20 dark:bg-[#d4af37]/30 rounded-full animate-float hidden sm:block"></div>
              <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary/20 dark:bg-[#d4af37]/30 rounded-full animate-float hidden sm:block" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 dark:bg-[#d4af37]/30 rounded-full animate-float hidden sm:block" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Sidebar */}
            <OrderingSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              cartItemCount={cartItemCount}
              ordersCount={orders.length}
              templatesCount={templates.length}
              priceOffersCount={priceOffers.length}
              ltaDocumentsCount={ltaDocuments.length}
            />

            {/* Main Content Area */}
            <SidebarInset>
              {/* Header - Using PageHeader */}
              <PageHeader
                title={language === 'ar' ? 'لوحة الطلبات' : 'Ordering Dashboard'}
                subtitle={language === 'ar' ? 'بوابة القاضي' : 'AlQadi Gate'}
                showLogo={false}
                actions={
                  <>
                    <OrderingHeader
                      cartItemCount={cartItemCount}
                      onCartOpen={() => setCartOpen(true)}
                      userName={user?.name}
                      cartItems={shoppingCartItems}
                      cartTotal={cartTotalAmount}
                      currency={cart[0]?.currency || 'ILS'}
                    />
                    <SidebarTrigger className="flex-shrink-0 !h-11 !w-11 min-h-[44px] min-w-[44px] hover:bg-primary/10 dark:hover:bg-[#d4af37]/20 rounded-lg transition-colors" />
                  </>
                }
              />

            {/* Main Content */}
            <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 relative z-10 safe-bottom">
          {/* Welcome Section - Mobile Optimized */}
          <div className="mb-3 sm:mb-6 lg:mb-8 animate-slide-down">
            <h2 className="text-base sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-2 bg-gradient-to-r from-foreground to-foreground/80 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent">
              {language === 'ar' ? 'لوحة الطلبات' : 'Ordering Dashboard'}
            </h2>
            <p className="text-xs sm:text-base text-muted-foreground dark:text-[#d4af37]/70">
              {language === 'ar'
                ? 'إدارة الطلبات وسلة التسوق من مكان واحد'
                : 'Manage your orders and shopping cart from one place'}
            </p>
          </div>

          {/* Catalog Link Banner - Mobile Optimized with Enhanced Branding */}
          <Card className="mb-3 sm:mb-6 lg:mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-background dark:from-[#d4af37]/15 dark:via-[#d4af37]/5 dark:to-background border-primary/30 dark:border-[#d4af37]/40 hover:border-primary/50 dark:hover:border-[#d4af37]/60 hover:shadow-lg dark:hover:shadow-[#d4af37]/20 transition-all duration-300 animate-fade-in">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                <div className="flex items-start gap-2.5 sm:gap-4 flex-1 min-w-0 w-full">
                  <div className="p-2.5 sm:p-3.5 rounded-xl bg-primary/15 dark:bg-[#d4af37]/20 flex-shrink-0 ring-2 ring-primary/20 dark:ring-[#d4af37]/30">
                    <Package className="h-4 w-4 sm:h-6 sm:w-6 text-primary dark:text-[#d4af37]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-xs sm:text-base lg:text-lg mb-0.5 sm:mb-1 text-foreground dark:text-[#d4af37]">
                      {language === 'ar' ? 'تصفح كتالوج المنتجات' : 'Browse Product Catalog'}
                    </h3>
                    <p className="text-[10px] sm:text-sm text-muted-foreground dark:text-[#d4af37]/70 line-clamp-2">
                      {language === 'ar'
                        ? 'استكشف جميع المنتجات المتاحة واطلب عروض الأسعار'
                        : 'Explore all available products and request price quotes'}
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="w-full sm:w-auto sm:flex-shrink-0 min-h-[44px] font-semibold shadow-md hover:shadow-lg dark:bg-[#d4af37] dark:hover:bg-[#f9c800] dark:text-black transition-all text-xs sm:text-sm">
                  <Link href="/catalog">
                    <Boxes className="h-4 w-4 sm:h-5 sm:w-5 me-1.5 sm:me-2" />
                    {language === 'ar' ? 'عرض الكتالوج' : 'View Catalog'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 sm:space-y-4 lg:space-y-6">
            <div className="sticky z-40 -mx-2 sm:-mx-6 px-2 sm:px-6 py-2 sm:py-3 bg-background/98 dark:bg-black/95 backdrop-blur-xl border-b border-border/50 dark:border-[#d4af37]/30 shadow-sm dark:shadow-[#d4af37]/5 safe-top top-16">
              <div className="overflow-x-auto scrollbar-hide smooth-scroll -mx-2 px-2 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex justify-start bg-card/60 dark:bg-card/40 backdrop-blur-sm border border-border/50 dark:border-[#d4af37]/30 h-auto p-1 sm:p-1.5 gap-1 rounded-xl w-max sm:w-full">
                  <TabsTrigger
                    value="lta-products"
                    className="min-h-[44px] min-w-[44px] px-3 sm:px-5 lg:px-6 flex-shrink-0 data-[state=active]:bg-primary/15 dark:data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-primary dark:data-[state=active]:text-[#d4af37] data-[state=active]:shadow-md dark:data-[state=active]:shadow-[#d4af37]/20 transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap font-medium rounded-lg"
                    data-testid="tab-lta-products"
                  >
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="hidden xs:inline ms-1.5 sm:ms-2">{language === 'ar' ? 'الاتفاقيات' : 'LTAs'}</span>
                    {clientLtas.length > 0 && (
                      <Badge variant="secondary" className="ms-1 sm:ms-2 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs dark:bg-[#d4af37]/30 dark:text-[#d4af37]">
                        {clientLtas.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="templates" 
                    className="min-h-[44px] min-w-[44px] px-3 sm:px-5 lg:px-6 flex-shrink-0 data-[state=active]:bg-primary/15 dark:data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-primary dark:data-[state=active]:text-[#d4af37] data-[state=active]:shadow-md dark:data-[state=active]:shadow-[#d4af37]/20 transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap font-medium rounded-lg" 
                    data-testid="tab-templates"
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="hidden xs:inline ms-1.5 sm:ms-2">{language === 'ar' ? 'قوالب' : 'Templates'}</span>
                    {templates.length > 0 && (
                      <Badge variant="secondary" className="ms-1 sm:ms-2 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs dark:bg-[#d4af37]/30 dark:text-[#d4af37]">
                        {templates.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="price-offers" 
                    className="min-h-[44px] min-w-[44px] px-3 sm:px-5 lg:px-6 flex-shrink-0 data-[state=active]:bg-primary/15 dark:data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-primary dark:data-[state=active]:text-[#d4af37] data-[state=active]:shadow-md dark:data-[state=active]:shadow-[#d4af37]/20 transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap font-medium rounded-lg" 
                    data-testid="tab-price-offers"
                  >
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="hidden xs:inline ms-1.5 sm:ms-2">{language === 'ar' ? 'عروض' : 'Offers'}</span>
                    {priceOffers.length > 0 && (
                      <Badge variant="secondary" className="ms-1 sm:ms-2 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs dark:bg-[#d4af37]/30 dark:text-[#d4af37]">
                        {priceOffers.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="min-h-[44px] min-w-[44px] px-3 sm:px-5 lg:px-6 flex-shrink-0 data-[state=active]:bg-primary/15 dark:data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-primary dark:data-[state=active]:text-[#d4af37] data-[state=active]:shadow-md dark:data-[state=active]:shadow-[#d4af37]/20 transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap font-medium rounded-lg" 
                    data-testid="tab-history"
                  >
                    <History className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="hidden xs:inline ms-1.5 sm:ms-2">{language === 'ar' ? 'سجل' : 'History'}</span>
                    {orders.length > 0 && (
                      <Badge variant="secondary" className="ms-1 sm:ms-2 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs dark:bg-[#d4af37]/30 dark:text-[#d4af37]">
                        {orders.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="lta-documents" 
                    className="min-h-[44px] min-w-[44px] px-3 sm:px-5 lg:px-6 flex-shrink-0 data-[state=active]:bg-primary/15 dark:data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-primary dark:data-[state=active]:text-[#d4af37] data-[state=active]:shadow-md dark:data-[state=active]:shadow-[#d4af37]/20 transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap font-medium rounded-lg" 
                    data-testid="tab-lta-documents"
                  >
                    <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="hidden xs:inline ms-1.5 sm:ms-2">{language === 'ar' ? 'مستندات' : 'Docs'}</span>
                    {ltaDocuments.length > 0 && (
                      <Badge variant="secondary" className="ms-1 sm:ms-2 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs dark:bg-[#d4af37]/30 dark:text-[#d4af37]">
                        {ltaDocuments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* LTA Products Tab - Shows only LTA-filtered products */}
            <TabsContent value="lta-products" className="mt-0">
              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                {/* LTA Tabs */}
                {clientLtas.length > 0 ? (
                  <div className="bg-card/50 rounded-lg p-3 sm:p-4 border border-border/50">
                    <Tabs value={selectedLtaFilter || clientLtas[0]?.id || ''} onValueChange={setSelectedLtaFilter} className="w-full">
                      <div className="relative">
                        <TabsList className={cn(
                          "w-full inline-flex items-center justify-start h-auto gap-2 p-1 bg-muted rounded-md overflow-x-auto flex-nowrap smooth-scroll scrollbar-hide",
                          isMobile ? "gap-1.5" : "gap-2"
                        )}>
                          {clientLtas.map(lta => (
                            <TabsTrigger
                              key={lta.id}
                              value={lta.id}
                              className="whitespace-nowrap flex-shrink-0 font-medium min-w-[120px] text-xs sm:text-sm px-3 sm:px-4 py-2 min-h-[44px]"
                              data-testid={`tab-lta-${lta.id}`}
                            >
                              {lta.name}
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
                        {language === 'ar' ? 'لا توجد اتفاقيات طويلة الأجل' : 'No LTA Agreements'}
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
                              "w-full border-2 focus-visible:ring-2 h-12 min-h-[44px] text-base",
                              isArabic ? "pe-10 ps-4" : "ps-10 pe-4"
                            )}
                            data-testid="input-search-products"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "absolute top-1/2 transform -translate-y-1/2 h-11 w-11 min-h-[44px] min-w-[44px]",
                                isArabic ? "left-2" : "right-2"
                              )}
                              onClick={() => setSearchQuery('')}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-full sm:w-[220px] border-2 h-12 min-h-[44px] text-base" data-testid="select-category">
                            <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {language === 'ar' ? `كل الفئات (${products.filter(p => selectedLtaFilter === 'all' || p.ltaId === selectedLtaFilter).length})` : `All Categories (${products.filter(p => selectedLtaFilter === 'all' || p.ltaId === selectedLtaFilter).length})`}
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
                          <span className={cn(
                            "text-muted-foreground",
                            isMobile ? "text-sm" : "text-sm"
                          )}>
                            {language === 'ar' ? 'عوامل التصفية النشطة:' : 'Active filters:'}
                          </span>
                          {searchQuery && (
                            <Badge variant="secondary" className="gap-1">
                              {language === 'ar' ? `بحث: "${searchQuery}"` : `Search: "${searchQuery}"`}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchQuery('');
                                }}
                                className="min-h-[32px] min-w-[32px] p-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )}
                          {selectedCategory !== 'all' && (
                            <Badge variant="secondary" className="gap-1">
                              {selectedCategory}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategory('all');
                                }}
                                className="min-h-[32px] min-w-[32px] p-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('all');
                            }}
                            className="h-11 min-h-[44px] text-sm px-3"
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>
                      {language === 'ar' ? 'جارٍ تحميل المنتجات...' : 'Loading products...'}
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
                          ? 'لم يتم تعيين أي منتجات لعقد الاتفاقية طويل الأجل الخاص بك بعد.'
                          : 'No products are assigned to your LTA contract yet.')
                      }
                    </p>
                    {(searchQuery || selectedCategory !== 'all') && (
                      <Button onClick={handleClearFilters} variant="outline">
                        {language === 'ar' ? 'مسح عوامل التصفية' : 'Clear Filters'}
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
                      {language === 'ar' ? 'منتجات' : 'products'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4 sm:space-y-6">
              {templates.length === 0 ? (
                <Card className="border-border/50 dark:border-[#d4af37]/20">
                  <CardContent className="py-8 sm:py-12">
                    <EmptyState
                      icon={FileText}
                      title={isArabic ? 'لا توجد قوالب' : 'No Templates'}
                      description={isArabic ? 'قم بإنشاء قالب من عربة التسوق الخاصة بك لحفظ الطلبات المتكررة' : 'Create a template from your cart to save recurring orders'}
                      actionLabel={isArabic ? 'العودة إلى عربة التسوق' : 'Back to Cart'}
                      onAction={() => setActiveTab('cart')} // Assuming 'cart' is a valid tab value or a way to show cart
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            </TabsContent>

            {/* Price Offers Tab */}
            <TabsContent value="price-offers" className="space-y-4 sm:space-y-6">
              {priceOffersLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>
                      {language === 'ar' ? 'جارٍ تحميل عروض الأسعار...' : 'Loading offers...'}
                    </span>
                  </div>
                </div>
              ) : priceOffers.length === 0 ? (
                <Card className="border-border/50 dark:border-[#d4af37]/20">
                  <CardContent className="py-8 sm:py-12">
                    <EmptyState
                      icon={FileText}
                      title={isArabic ? 'لا توجد عروض أسعار' : 'No Price Offers'}
                      description={isArabic ? 'لم تتلق أي عروض أسعار بعد' : 'You have not received any price offers yet'}
                      actionLabel={isArabic ? 'طلب عرض سعر' : 'Request Quote'}
                      onAction={() => window.location.href = '/catalog'}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {priceOffers.map((offer) => {
                    const items = typeof offer.items === 'string' ? JSON.parse(offer.items) : offer.items;
                    const isExpired = new Date(offer.validUntil) < new Date();
                    const canRespond = (offer.status === 'sent' || offer.status === 'viewed') && !isExpired;

                    return (
                      <Card key={offer.id} className={cn("border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-xl dark:hover:shadow-[#d4af37]/30 transition-all duration-300 bg-card/50 dark:bg-card/30 backdrop-blur-sm", isExpired && "opacity-60")}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg">{offer.offerNumber}</CardTitle>
                              <CardDescription className="text-sm mt-1">
                                {new Date(offer.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </CardDescription>
                            </div>
                            <Badge variant={
                              offer.status === 'accepted' ? 'default' :
                              offer.status === 'rejected' ? 'destructive' :
                              isExpired ? 'secondary' : 
                              offer.status === 'draft' ? 'outline' : 'outline'
                            }>
                              {language === 'ar' ? 
                                (offer.status === 'draft' ? 'مسودة' :
                                 offer.status === 'sent' ? 'مرسل' :
                                 offer.status === 'viewed' ? 'تمت المشاهدة' :
                                 offer.status === 'accepted' ? 'مقبول' :
                                 offer.status === 'rejected' ? 'مرفوض' :
                                 isExpired ? 'منتهي الصلاحية' : offer.status) :
                                (isExpired ? 'Expired' : offer.status.charAt(0).toUpperCase() + offer.status.slice(1))
                              }
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {language === 'ar' ? 'المنتجات' : 'Products'}
                            </span>
                            <span className="font-medium">{items?.length || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {language === 'ar' ? 'الإجمالي' : 'Total'}
                            </span>
                            <span className="font-bold text-lg">${offer.total || '0.00'}</span>
                          </div>
                          {offer.validUntil && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {language === 'ar' ? 'صالح حتى' : 'Valid Until'}
                              </span>
                              <span className={cn("font-medium", isExpired && "text-destructive")}>
                                {new Date(offer.validUntil).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                              </span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.location.href = '/price-offers'}
                          >
                            <Eye className="h-4 w-4 me-2" />
                            {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 sm:space-y-6">
              {orders.length === 0 ? (
                <Card className="border-border/50 dark:border-[#d4af37]/20">
                  <CardContent className="py-8 sm:py-12">
                    <EmptyState
                      icon={Package}
                      title={isArabic ? 'لم يتم تقديم طلبات بعد' : 'No Orders Yet'}
                      description={isArabic ? 'ابدأ التسوق لإنشاء طلبك الأول' : 'Start shopping to create your first order'}
                      actionLabel={isArabic ? 'تصفح المنتجات' : 'Browse Products'}
                      onAction={() => window.location.href = '/catalog'}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {formattedOrders.map((order) => {
                    const orderItems = safeJsonParse(order.items, []) as any[];
                    const itemCount = orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

                    return (
                      <Card
                        key={order.id}
                        className="border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-xl dark:hover:shadow-[#d4af37]/30 transition-all duration-300 bg-card/50 dark:bg-card/30 backdrop-blur-sm group overflow-hidden"
                      >
                        {/* Status Bar */}
                        <div className={`h-1 w-full ${
                          order.status === 'delivered' ? 'bg-green-500' :
                          order.status === 'shipped' ? 'bg-blue-500' :
                          order.status === 'processing' ? 'bg-purple-500' :
                          order.status === 'confirmed' ? 'bg-indigo-500' :
                          order.status === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />

                        <CardHeader className="pb-3 sm:pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 dark:bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0">
                                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary dark:text-[#d4af37]" />
                                </div>
                                <span className="truncate">#{order.id.substring(0, 8)}</span>
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1.5 text-xs sm:text-sm">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">
                                  {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                order.status === 'delivered' ? 'default' :
                                order.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              }
                              className="flex-shrink-0 text-xs"
                            >
                              {language === 'ar' ?
                                (order.status === 'pending' ? 'قيد الانتظار' :
                                 order.status === 'confirmed' ? 'تم التأكيد' :
                                 order.status === 'processing' ? 'قيد المعالجة' :
                                 order.status === 'shipped' ? 'تم الشحن' :
                                 order.status === 'delivered' ? 'تم التسليم' :
                                 order.status === 'cancelled' ? 'ملغى' : order.status) :
                                order.status.charAt(0).toUpperCase() + order.status.slice(1)
                              }
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 dark:bg-muted/30">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {itemCount} {language === 'ar' ? 'عناصر' : 'items'}
                              </span>
                            </div>
                            <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent">
                              {order.totalAmount} {order.currency}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Details Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const originalOrder = orders.find(o => o.id === order.id);
                                if (originalOrder) {
                                  setSelectedOrder(originalOrder);
                                  setOrderDetailsDialogOpen(true);
                                }
                              }}
                              className="flex-1 border-primary/20 hover:bg-primary/10 hover:border-primary transition-all duration-300 min-h-[44px] px-3 text-sm"
                              data-testid={`button-view-details-${order.id}`}
                            >
                              <FileText className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'التفاصيل' : 'Details'}
                            </Button>

                            {/* Issue Report Icon Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrderForIssue(order.id);
                                setIssueReportDialogOpen(true);
                              }}
                              data-testid={`button-report-issue-${order.id}`}
                              className="border-orange-200 hover:bg-orange-50 hover:border-orange-300 dark:border-orange-900 dark:hover:bg-orange-950 min-h-[44px] min-w-[44px] px-3"
                              title={language === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report Issue'}
                            >
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                            </Button>

                            {/* Feedback Icon Button - Only for delivered/cancelled */}
                            {['delivered', 'cancelled'].includes(order.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrderForFeedback(order.id);
                                  setFeedbackDialogOpen(true);
                                }}
                                data-testid={`button-submit-feedback-${order.id}`}
                                className="border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-900 dark:hover:bg-green-950 min-h-[44px] min-w-[44px] px-3"
                                title={language === 'ar' ? 'تقديم ملاحظات' : 'Submit Feedback'}
                              >
                                <Star className="h-5 w-5 text-yellow-500" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* LTA Documents Tab */}
            <TabsContent value="lta-documents" className="space-y-4 sm:space-y-6">
              {ltaDocumentsLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>
                      {language === 'ar' ? 'جارٍ تحميل المستندات...' : 'Loading documents...'}
                    </span>
                  </div>
                </div>
              ) : ltaDocuments.length === 0 ? (
                <Card className="border-border/50 dark:border-[#d4af37]/20">
                  <CardContent className="py-8 sm:py-12">
                    <EmptyState
                      icon={FolderOpen}
                      title={language === 'ar' ? 'لا توجد مستندات اتفاقيات طويلة الأجل' : 'No LTA Documents'}
                      description={language === 'ar' ? 'لم يتم تحميل أي مستندات لاتفاقياتك طويلة الأجل بعد' : 'No documents have been uploaded for your LTAs yet'}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Group documents by LTA */}
                  {Object.entries(
                    ltaDocuments.reduce((acc, doc) => {
                      const ltaId = doc.ltaId;
                      if (!acc[ltaId]) {
                        acc[ltaId] = [];
                      }
                      acc[ltaId].push(doc);
                      return acc;
                    }, {} as Record<string, LtaDocument[]>)
                  ).map(([ltaId, docs]) => {
                    const lta = clientLtas.find(l => l.id === ltaId);
                    const ltaName = docs[0]?.ltaName || lta?.name || '';

                    return (
                      <Card key={ltaId} className="border-border/50 dark:border-[#d4af37]/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                            {ltaName}
                          </CardTitle>
                          <CardDescription>
                            {docs.length} {language === 'ar' ? `مستند${docs.length !== 1 ? 'ات' : ''}` : `document${docs.length !== 1 ? 's' : ''}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {docs.map((doc) => {
                              const formatFileSize = (bytes: number): string => {
                                if (bytes === 0) return '0 Bytes';
                                const k = 1024;
                                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                                const i = Math.floor(Math.log(bytes) / Math.log(k));
                                return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
                              };

                              return (
                                <Card
                                  key={doc.id}
                                  className="border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-lg transition-all duration-300 bg-card/50 dark:bg-card/30 backdrop-blur-sm"
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="h-4 w-4 text-primary dark:text-[#d4af37] flex-shrink-0" />
                                          <h4 className="font-semibold text-sm truncate">
                                            {doc.name}
                                          </h4>
                                        </div>
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                          <div className="flex items-center gap-2">
                                            <span>{doc.fileName}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span>{formatFileSize(doc.fileSize)}</span>
                                            <span>?</span>
                                            <span>{doc.fileType}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                              {new Date(doc.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                              })}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          window.open(doc.fileUrl, '_blank');
                                        }}
                                        className="flex-shrink-0"
                                        title={language === 'ar' ? 'تنزيل المستند' : 'Download document'}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
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
              currency={cart[0]?.currency || 'ILS'}
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
            createdAt: new Date(selectedOrder.createdAt),
            clientId: (selectedOrder as any).clientId,
            ltaId: (selectedOrder as any).ltaId || null
              } : null}
            />

            {/* Order Confirmation Dialog */}
            <OrderConfirmationDialog
          open={orderConfirmationOpen}
          onOpenChange={setOrderConfirmationOpen}
          items={cart.map(item => ({
            productId: item.productId,
            name: item.productName,
            sku: item.productSku,
            quantity: item.quantity,
            price: item.price,
          }))}
          totalAmount={cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)}
          currency={cart[0]?.currency || 'ILS'}
          ltaName={clientLtas.find(lta => lta.id === activeLtaId)?.name}
          onConfirm={handleConfirmOrder}
          onEdit={() => {
            setOrderConfirmationOpen(false);
            setCartOpen(true);
          }}
              isSubmitting={submitOrderMutation.isPending}
            />

            {/* Feedback Dialog */}
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

            {/* Issue Report Dialog */}
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

            {/* Price Offer Creation Dialog */}
            {user?.isAdmin && (
              <Dialog open={createOfferDialogOpen} onOpenChange={setCreateOfferDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="create-offer-description">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إنشاء عرض سعر' : 'Create Price Offer'}
                </DialogTitle>
              </DialogHeader>
              <p id="create-offer-description" className="sr-only">
                {language === 'ar'
                  ? 'نموذج لإنشاء عرض سعر جديد للعميل'
                  : 'Form to create a new price offer for the client'}
              </p>
              <div className="space-y-4">
                {selectedRequestForOffer && offerItems.size > 0 ? (
                  <>
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{language === 'ar' ? 'المنتجات والتسعير' : 'Products & Pricing'}</h4>
                        <span className="text-sm text-muted-foreground">
                          {language === 'ar' ? `${offerItems.size} عنصر` : `${offerItems.size} items`}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground pb-2 border-b">
                          <div className="col-span-5">{language === 'ar' ? 'المنتج' : 'Product'}</div>
                          <div className="col-span-2 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</div>
                          <div className="col-span-3">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</div>
                          <div className="col-span-2 text-right">{language === 'ar' ? 'الإجمالي' : 'Total'}</div>
                        </div>

                        {Array.from(offerItems.entries()).map(([productId, data]) => {
                          const product = products.find((p) => p.id === productId);
                          if (!product) return null;

                          const itemTotal = data.price ? (parseFloat(data.price) * data.quantity).toFixed(2) : "0.00";

                          return (
                            <div key={productId} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="col-span-5">
                                <div className="font-medium text-sm">
                                  {product.name}
                                </div>
                                <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                              </div>

                              <div className="col-span-2 flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleUpdateOfferItemQuantity(productId, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <div className="w-12 text-center font-medium">{data.quantity}</div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleUpdateOfferItemQuantity(productId, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="col-span-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={data.price}
                                    onChange={(e) => handleUpdateOfferItemPrice(productId, e.target.value)}
                                    className="h-9"
                                  />
                                </div>
                              </div>

                              <div className="col-span-2 text-right font-semibold">
                                ${itemTotal}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t space-y-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>{language === 'ar' ? 'الإجمالي (شامل الضريبة):' : 'Total (Tax Included)'}:</span>
                          <span className="text-primary">
                            ${Array.from(offerItems.entries()).reduce((sum, [_, data]) => {
                              return sum + (data.price ? parseFloat(data.price) * data.quantity : 0);
                            }, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{language === 'ar' ? 'الصلاحية (أيام)' : 'Validity (Days)'}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={offerValidityDays}
                          onChange={(e) => setOfferValidityDays(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</Label>
                        <Input
                          type="text"
                          value={new Date(Date.now() + parseInt(offerValidityDays || '30') * 24 * 60 * 60 * 1000).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>{language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}</Label>
                      <Textarea
                        value={offerNotes}
                        onChange={(e) => setOfferNotes(e.target.value)}
                        rows={3}
                        placeholder={language === 'ar' ? 'أضف أي ملاحظات إضافية...' : 'Add any additional notes...'}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium text-foreground mb-4">
                      {language === 'ar' ? 'لم يتم تحديد طلب سعر' : 'No Price Request Selected'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      {language === 'ar' ? 'الرجاء تحديد طلب سعر من القائمة لإنشاء عرض سعر.' : 'Please select a price request from the list to create an offer.'}
                    </p>
                    <Button onClick={() => setCreateOfferDialogOpen(false)}>
                      {language === 'ar' ? 'فهمت' : 'Got it'}
                    </Button>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateOfferDialogOpen(false);
                    setOfferItems(new Map());
                    setOfferNotes('');
                    setOfferValidityDays('30');
                    setSelectedPriceRequestId(null);
                    setSelectedRequestForOffer(null); // Clear selected request
                  }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSubmitOffer}
                  disabled={createOfferMutation.isPending || offerItems.size === 0}
                >
                  {createOfferMutation.isPending
                    ? (language === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...')
                    : (language === 'ar' ? 'إنشاء عرض سعر' : 'Create Offer')
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            )}
          </SidebarInset>

          {/* Floating Submit Order Button */}
          <FloatingActionButton
            cartItemCount={cartItemCount}
            totalAmount={cartTotalAmount}
            currency={cart[0]?.currency || 'ILS'}
            onSubmitOrder={handleSubmitOrder}
            disabled={submitOrderMutation.isPending || cart.length === 0}
          />
          </div>
        </SidebarProvider>
      </PageLayout>
    </>
  );
}