import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, ChevronRight, ShoppingCart, Heart, Package } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@shared/schema';
import { SEO } from "@/components/SEO";
import { useToast } from '@/hooks/use-toast';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

export default function CatalogPage() {
  const [, params] = useRoute('/catalog/:category');
  const category = params?.category;
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery<ProductWithLtaPrice[]>({
    queryKey: user ? ['/api/products'] : ['/api/products/public'],
  });

  const handleAddToCart = (product: ProductWithLtaPrice) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        description: language === 'ar' ? 'يرجى تسجيل الدخول لإضافة المنتجات' : 'Please login to add products',
      });
      return;
    }

    sessionStorage.setItem('addToCart', JSON.stringify({
      productId: product.id,
      sku: product.sku,
    }));
    window.location.href = '/ordering';
  };

  const handleRequestPrice = (product: ProductWithLtaPrice) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        description: language === 'ar' ? 'يرجى تسجيل الدخول لطلب الأسعار' : 'Please login to request prices',
      });
      return;
    }

    // Get existing price request list from sessionStorage
    const existingList = sessionStorage.getItem('priceRequestList');
    const priceRequestList = existingList ? JSON.parse(existingList) : [];

    // Check if product already exists
    const exists = priceRequestList.some((item: any) => item.productId === product.id);

    if (exists) {
      toast({
        description: language === 'ar' 
          ? 'المنتج موجود بالفعل في قائمة طلبات الأسعار' 
          : 'Product already in price request list'
      });
      return;
    }

    // Add new product to list
    priceRequestList.push({
      productId: product.id,
      productSku: product.sku,
      productNameEn: product.nameEn,
      productNameAr: product.nameAr,
    });

    // Save updated list to sessionStorage
    sessionStorage.setItem('priceRequestList', JSON.stringify(priceRequestList));

    toast({
      description: language === 'ar'
        ? `تمت إضافة ${product.nameAr} إلى قائمة طلبات الأسعار`
        : `${product.nameEn} added to price request list`
    });
  };

  // Extract unique main categories and subcategories
  const mainCategories = Array.from(new Set(products.map(p => p.mainCategory).filter(Boolean)));

  const getSubCategories = (mainCat: string) => {
    return Array.from(new Set(products
      .filter(p => p.mainCategory === mainCat)
      .map(p => p.subCategory)
      .filter(Boolean)));
  };


  // Filter products based on search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === '' || 
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameAr.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedSubCategory) {
      return matchesSearch && p.subCategory === selectedSubCategory;
    }
    if (selectedMainCategory) {
      return matchesSearch && p.mainCategory === selectedMainCategory;
    }
    return matchesSearch;
  });

  const pageTitle = category && category !== 'all' 
    ? `${category} - ${language === 'ar' ? 'الكتالوج' : 'Catalog'}`
    : (language === 'ar' ? 'الكتالوج' : 'Product Catalog');

  const pageDescription = `Browse our ${category || 'product'} catalog. Find products related to ${category || 'all categories'}.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      <SEO 
        title={pageTitle}
        description={pageDescription}
        keywords={`${category || 'products'}, catalog, shop, ${language === 'ar' ? 'منتجات، كتالوج، تسوق' : 'products, catalog, shop'}`}
      />
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

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
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <img 
              src="/logo.png" 
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'} 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                {language === 'ar' ? 'الكتالوج' : 'Product Catalog'}
              </h1>
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-down">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {language === 'ar' ? 'كتالوج المنتجات' : 'Product Catalog'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'تصفح منتجاتنا واختر ما تحتاجه' 
              : 'Browse our products and find what you need'}
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10 h-11 border-2 focus-visible:ring-2"
              data-testid="input-search-products"
            />
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {(selectedMainCategory || selectedSubCategory) && (
          <div className="mb-6 flex items-center gap-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedMainCategory(null);
                setSelectedSubCategory(null);
              }}
              className="h-auto p-0 hover:underline"
            >
              {language === 'ar' ? 'جميع الفئات' : 'All Categories'}
            </Button>
            {selectedMainCategory && (
              <>
                <ChevronRight className="h-4 w-4" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSubCategory(null)}
                  className="h-auto p-0 hover:underline"
                >
                  {selectedMainCategory}
                </Button>
              </>
            )}
            {selectedSubCategory && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium">{selectedSubCategory}</span>
              </>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Main Categories Grid */}
            {!selectedMainCategory && !searchQuery && (
              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <h2 className="text-xl font-semibold mb-6">
                  {language === 'ar' ? 'الفئات الرئيسية' : 'Main Categories'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  {mainCategories.map((mainCat, index) => {
                    const IconComponent = getCategoryIcon(mainCat);
                    return (
                      <Card
                        key={mainCat}
                        className="relative overflow-hidden cursor-pointer group
                          bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm 
                          border-border/50 dark:border-[#d4af37]/20 
                          hover:border-primary dark:hover:border-[#d4af37] 
                          hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 
                          transition-all duration-500 ease-out
                          hover:scale-105 hover:-translate-y-2
                          animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => setSelectedMainCategory(mainCat)}
                      >
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 
                          group-hover:from-blue-500/30 group-hover:to-cyan-500/20
                          transition-all duration-500 opacity-0 group-hover:opacity-100" />

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[140px] relative z-10">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10
                            group-hover:scale-110 group-hover:rotate-6
                            transition-all duration-500 flex-shrink-0
                            border border-white/10 mb-3">
                            <IconComponent className="h-8 w-8 text-primary dark:text-[#d4af37]
                              group-hover:text-primary dark:group-hover:text-[#f9c800]
                              transition-colors duration-300" />
                          </div>
                          <h3 className="font-semibold text-lg text-foreground dark:text-white mb-1">{mainCat}</h3>
                          <p className="text-sm text-muted-foreground dark:text-gray-400">
                            {products.filter(p => p.mainCategory === mainCat).length}{' '}
                            {language === 'ar' ? 'منتج' : 'products'}
                          </p>
                        </CardContent>

                        {/* Bottom accent line */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 
                          bg-gradient-to-r from-transparent via-primary dark:via-[#d4af37] to-transparent
                          transition-all duration-500
                          opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100" />
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Products Grid */}
            {(selectedMainCategory || selectedSubCategory || searchQuery) && filteredProducts.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {filteredProducts.length} {language === 'ar' ? 'منتج' : 'products'}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product, index) => {
                    const name = language === 'ar' ? product.nameAr : product.nameEn;
                    const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
                    const slugifiedName = product.nameEn.toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    const slugifiedSubCategory = (product.subCategory || 'products').toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    return (
                      <Link key={product.id} href={`/products/${slugifiedSubCategory}/${slugifiedName}`}>
                        <Card className="h-full relative overflow-hidden cursor-pointer group
                          bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm 
                          border-border/50 dark:border-[#d4af37]/20 
                          hover:border-primary dark:hover:border-[#d4af37] 
                          hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 
                          transition-all duration-500 ease-out
                          hover:scale-105 hover:-translate-y-2
                          animate-fade-in" 
                          style={{ animationDelay: `${index * 50}ms` }}
                          data-testid={`card-product-${product.id}`}>

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/10 
                            group-hover:from-green-500/30 group-hover:to-emerald-500/20
                            transition-all duration-500 opacity-0 group-hover:opacity-100" />

                          {/* Shimmer Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                          <div className="relative aspect-square bg-muted overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                                data-testid={`img-product-${product.id}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                <Package className="w-12 h-12 text-muted-foreground/30" />
                              </div>
                            )}
                            {product.subCategory && (
                              <Badge className="absolute top-2 left-2 text-xs bg-background/80 backdrop-blur-sm" variant="secondary">
                                {product.subCategory}
                              </Badge>
                            )}
                            {product.hasPrice && product.contractPrice && (
                              <Badge className="absolute top-2 right-2 text-xs bg-primary/90 hover:bg-primary backdrop-blur-sm">
                                {product.contractPrice} {product.currency}
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-3 space-y-1 relative z-10">
                            <h3 className="font-medium text-sm line-clamp-2 leading-tight text-foreground dark:text-white" data-testid={`text-product-name-${product.id}`}>
                              {name}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono">
                              SKU: {product.sku}
                            </p>
                            {description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {description}
                              </p>
                            )}
                            {product.unitType && (
                              <Badge variant="outline" className="text-xs">
                                {product.unitType}
                              </Badge>
                            )}
                          </CardContent>

                          {user && (
                            <CardFooter className="p-3 pt-0">
                              {product.hasPrice && product.contractPrice ? (
                                <Button
                                  size="sm"
                                  className="w-full"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                  }}
                                >
                                  <ShoppingCart className="h-3 w-3 me-2" />
                                  {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRequestPrice(product);
                                  }}
                                >
                                  <Heart className="h-3 w-3 me-2" />
                                  {language === 'ar' ? 'طلب سعر' : 'Request Price'}
                                </Button>
                              )}
                            </CardFooter>
                          )}

                          {/* Bottom accent line */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 
                            bg-gradient-to-r from-transparent via-primary dark:via-[#d4af37] to-transparent
                            transition-all duration-500
                            opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100" />
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* No Products Found */}
            {filteredProducts.length === 0 && (selectedSubCategory || searchQuery) && (
              <Card className="p-12 text-center bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm 
                border-border/50 dark:border-[#d4af37]/20 
                hover:border-primary dark:hover:border-[#d4af37] 
                hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 
                transition-all duration-500 animate-fade-in">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2 text-foreground dark:text-white">
                  {language === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'جرب البحث بكلمات مختلفة' : 'Try searching with different keywords'}
                </p>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}