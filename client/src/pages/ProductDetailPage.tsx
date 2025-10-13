import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, ShoppingCart, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@shared/schema';

interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

export default function ProductDetailPage() {
  const [, params] = useRoute('/products/:subCategory/:productName');
  const productName = params?.productName;
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  // Fetch all products and find by name slug
  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithLtaPrice[]>({
    queryKey: ['/api/products/public'],
  });

  const product = products.find(p => {
    const slugifiedName = p.nameEn.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slugifiedName === productName;
  });

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
      window.location.href = '/price-request';
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">
            {language === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}
          </h2>
          <Button asChild>
            <Link href="/">
              {language === 'ar' ? 'العودة إلى الرئيسية' : 'Back to Home'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const name = language === 'ar' ? product.nameAr : product.nameEn;
  const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
  const specifications = language === 'ar' ? product.specificationsAr : '';
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
            "name": product.nameEn,
            "alternateName": product.nameAr,
            "description": product.descriptionEn || product.nameEn,
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
                "priceCurrency": product.currency || "USD",
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
                "name": product.nameEn,
                "item": window.location.href
              }
            ]
          })}
        </script>
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href={user ? '/ordering' : '/'}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            <span className="font-semibold">
              {language === 'ar' ? 'القاضي' : 'Al Qadi'}
            </span>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          {product.mainCategory && (
            <>
              <span className="mx-2">/</span>
              <Link href="/catalog" className="hover:text-foreground">
                {product.mainCategory}
              </Link>
            </>
          )}
          {product.subCategory && (
            <>
              <span className="mx-2">/</span>
              <span className="text-foreground">{product.subCategory}</span>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">{name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={name}
                className="w-full h-full object-cover"
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
                    <Button onClick={handleAddToCart} variant="outline" size="lg" className="w-full">
                      <Heart className="w-5 h-5 me-2" />
                      {language === 'ar' ? 'أضف إلى طلبات الأسعار' : 'Add to Price Request'}
                    </Button>
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
                  const relatedName = language === 'ar' ? relatedProduct.nameAr : relatedProduct.nameEn;
                  const slugifiedName = relatedProduct.nameEn.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                  const slugifiedSubCategory = (relatedProduct.subCategory || 'products').toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                  return (
                    <Link key={relatedProduct.id} href={`/products/${slugifiedSubCategory}/${slugifiedName}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-square bg-muted">
                          {relatedProduct.imageUrl ? (
                            <img
                              src={relatedProduct.imageUrl}
                              alt={relatedName}
                              className="w-full h-full object-cover"
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