import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, ShoppingCart, Heart, Home, Grid3x3, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LazyImage } from '@/components/LazyImage';
import { getProductUrl } from '@/lib/productLinks';
import type { Product } from '@shared/schema';

interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

export default function ProductDetailPage() {
  const [, params] = useRoute('/products/:sku');
  const skuParam = params?.sku;
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [priceRequestList, setPriceRequestList] = useState<string[]>([]);

  // Load price request list from sessionStorage on mount
  useState(() => {
    const existingList = sessionStorage.getItem('priceRequestList');
    if (existingList) {
      try {
        const parsed = JSON.parse(existingList);
        setPriceRequestList(parsed.map((item: any) => item.productId));
      } catch (e) {
        console.error('Failed to parse price request list:', e);
      }
    }
  });

  // Fetch all products and find by SKU
  // Use authenticated endpoint if user is logged in to get LTA prices
  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithLtaPrice[]>({
    queryKey: user ? ['/api/products'] : ['/api/products/public'],
  });

  // Find product by SKU (decoded from URL)
  const product = skuParam ? products.find(p => {
    try {
      const decodedSku = decodeURIComponent(skuParam);
      return p.sku === decodedSku;
    } catch {
      return p.sku === skuParam;
    }
  }) : undefined;

  // Show loading only if products are still loading AND we haven't found the product yet
  const isLoading = productsLoading && !product;

  const { data: relatedProducts = [] } = useQuery<ProductWithLtaPrice[]>({
    queryKey: ['/api/products/category', product?.category],
    enabled: !!product?.category,
  });

  const handleAddToCart = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        description: language === 'ar' ? 'يرجى تسجيل الدخول لإضافة المنتجات إلى السلة' : 'Please login to add products to cart',
      });
      return;
    }

    if (!product?.hasPrice) {
      // Add to price request list in sessionStorage
      const existingList = sessionStorage.getItem('priceRequestList');
      const currentList = existingList ? JSON.parse(existingList) : [];

      // Check if product already exists
      const exists = currentList.some((item: any) => item.productId === product?.id);

      if (exists) {
        toast({
          description: language === 'ar'
            ? 'المنتج موجود بالفعل في قائمة طلبات الأسعار'
            : 'Product already in price request list'
        });
        return;
      }

      // Add new product to list
      currentList.push({
        productId: product?.id,
        productSku: product?.sku,
        productName: product?.name,
      });

      // Save updated list to sessionStorage
      sessionStorage.setItem('priceRequestList', JSON.stringify(currentList));

      // Update local state to trigger re-render
      if (product?.id) {
        setPriceRequestList(prev => [...prev, product.id]);
      }

      toast({
        description: language === 'ar'
          ? `تمت إضافة ${product?.name} إلى قائمة طلبات الأسعار`
          : `${product?.name} added to price request list`
      });
      return;
    }

    // Store product in session and redirect to ordering page
    sessionStorage.setItem('addToCart', JSON.stringify({
      productId: product.id,
      sku: product.sku,
    }));
    window.location.href = '/ordering';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product && !productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black flex items-center justify-center">
        <Card className="max-w-md mx-4 text-center">
          <CardContent className="pt-6 pb-6">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              {language === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'ar' 
                ? 'عذراً، لم نتمكن من العثور على المنتج الذي تبحث عنه'
                : 'Sorry, we couldn\'t find the product you\'re looking for'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="default">
                <Link href="/catalog">
                  {language === 'ar' ? 'تصفح الكتالوج' : 'Browse Catalog'}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  {language === 'ar' ? 'الرئيسية' : 'Home'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = product.name;
  const description = product.description;
  const specifications = '';
  const pageTitle = `${name} - ${product.sku}`;
  const pageDescription = description || `${name} - ${product.sku}`;

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

      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="product" />
        {product.imageUrl && <meta property="og:image" content={product.imageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {product.imageUrl && <meta name="twitter:image" content={product.imageUrl} />}

        {/* Product Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "description": product.description || product.name,
            "sku": product.sku,
            "image": product.imageUrl || `${window.location.origin}/logo.png`,
            "category": product.category || '',
            "brand": {
              "@type": "Brand",
              "name": "Al Qadi"
            },
            ...(product.hasPrice && product.contractPrice ? {
              "offers": {
                "@type": "Offer",
                "price": product.contractPrice,
                "priceCurrency": product.currency || "ILS",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Al Qadi Co."
                }
              }
            } : {}),
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "1"
            }
          })}
        </script>

        {/* BreadcrumbList Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": language === 'ar' ? 'الرئيسية' : 'Home',
                "item": window.location.origin
              },
              ...(product.category ? [{
                "@type": "ListItem",
                "position": 2,
                "name": product.category,
                "item": `${window.location.origin}/catalog/${product.category}`
              }] : []),
              {
                "@type": "ListItem",
                "position": product.category ? 3 : 2,
                "name": product.name,
                "item": window.location.href
              }
            ]
          })}
        </script>
      </Helmet>

      {/* Header */}
      <PageHeader
        title={product?.name || (language === 'ar' ? 'القاضي' : 'Al Qadi')}
        backHref={user ? "/catalog" : "/landing"}
        showLogo={true}
        breadcrumbs={[
          { label: language === 'ar' ? 'الرئيسية' : 'Home', href: user ? "/ordering" : "/landing" },
          { label: language === 'ar' ? 'الكتالوج' : 'Catalog', href: "/catalog" },
          ...(product?.category ? [{ label: product.category }] : []),
          ...(product?.name ? [{ label: product.name }] : [])
        ]}
      />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <LazyImage
                src={product.imageUrl}
                alt={name}
                aspectRatio="1/1"
                className="rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{name}</h1>
              <p className="text-muted-foreground">
                SKU: <span className="font-mono">{product.sku}</span>
              </p>
              {product.category && (
                <Badge variant="secondary" className="mt-2">
                  {product.category}
                </Badge>
              )}
            </div>

            {description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            )}

            {specifications && (
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {language === 'ar' ? 'المواصفات' : 'Specifications'}
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {specifications}
                </p>
              </div>
            )}

            {/* Price and Actions */}
            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                {user && product.hasPrice && product.contractPrice ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'ar' ? 'سعر العقد' : 'Contract Price'}
                      </p>
                      <p className="text-3xl font-bold font-mono text-primary">
                        {product.contractPrice} {product.currency}
                      </p>
                    </div>
                    <Button onClick={handleAddToCart} size="lg" className="w-full">
                      <ShoppingCart className="w-5 h-5 me-2" />
                      {language === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'ar' ? 'السعر' : 'Price'}
                      </p>
                      <p className="text-lg text-muted-foreground">
                        {user
                          ? (language === 'ar' ? 'يرجى طلب عرض سعر' : 'Please request a quote')
                          : (language === 'ar' ? 'سجل الدخول لمعرفة الأسعار' : 'Login to view pricing')
                        }
                      </p>
                    </div>
                    {user && (
                      <Button 
                        onClick={handleAddToCart} 
                        variant={priceRequestList.includes(product.id) ? "default" : "outline"}
                        size="lg" 
                        className="w-full"
                        disabled={priceRequestList.includes(product.id)}
                      >
                        <Heart className={`w-5 h-5 me-2 ${priceRequestList.includes(product.id) ? 'fill-current' : ''}`} />
                        {priceRequestList.includes(product.id)
                          ? (language === 'ar' ? 'تمت الإضافة' : 'Added')
                          : (language === 'ar' ? 'أضف إلى طلبات الأسعار' : 'Add to Price Request')
                        }
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            {product.unitType && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.unitType && (
                  <div>
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'نوع الوحدة' : 'Unit Type'}
                    </p>
                    <p className="font-medium">{product.unitType}</p>
                  </div>
                )}
                {product.unit && (
                  <div>
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'الوحدة' : 'Unit'}
                    </p>
                    <p className="font-medium">{product.unit}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.filter(p => p.id !== product.id).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {language === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts
                .filter(p => p.id !== product.id)
                .slice(0, 5)
                .map((relatedProduct) => {
                  const relatedName = relatedProduct.name;
                  return (
                    <Link key={relatedProduct.id} href={getProductUrl(relatedProduct.sku)}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-square bg-muted">
                          {relatedProduct.imageUrl ? (
                            <LazyImage
                              src={relatedProduct.imageUrl}
                              alt={relatedName}
                              aspectRatio="1/1"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">
                            {relatedName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {relatedProduct.sku}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}