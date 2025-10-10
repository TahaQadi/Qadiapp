
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ShoppingCart, Package, Share2, Heart, User, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@shared/schema';

interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

export default function ProductDetailPage() {
  const { sku } = useParams<{ sku: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<ProductWithLtaPrice>({
    queryKey: [`/api/products/${sku}`],
    enabled: !!sku,
  });

  // SEO Meta Tags
  useEffect(() => {
    if (product) {
      const name = language === 'ar' ? product.nameAr : product.nameEn;
      const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
      
      // Update page title
      document.title = `${name} | ${language === 'ar' ? 'نظام الطلبات' : 'Ordering System'}`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description || name);

      // Open Graph tags for social sharing
      const ogTags = [
        { property: 'og:title', content: name },
        { property: 'og:description', content: description || name },
        { property: 'og:type', content: 'product' },
        { property: 'og:url', content: window.location.href },
        { property: 'og:image', content: product.imageUrl || '/logo.png' },
        { property: 'product:price:amount', content: product.contractPrice || '' },
        { property: 'product:price:currency', content: product.currency || 'USD' },
      ];

      ogTags.forEach(({ property, content }) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      });

      // Twitter Card tags
      const twitterTags = [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: name },
        { name: 'twitter:description', content: description || name },
        { name: 'twitter:image', content: product.imageUrl || '/logo.png' },
      ];

      twitterTags.forEach(({ name, content }) => {
        let tag = document.querySelector(`meta[name="${name}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('name', name);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      });

      // Structured Data (JSON-LD) for Google Rich Results
      const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: name,
        description: description || name,
        sku: product.sku,
        image: product.imageUrl || '/logo.png',
        brand: {
          '@type': 'Brand',
          name: language === 'ar' ? 'القاضي' : 'Al Qadi'
        },
        ...(product.hasPrice && product.contractPrice ? {
          offers: {
            '@type': 'Offer',
            price: product.contractPrice,
            priceCurrency: product.currency || 'USD',
            availability: 'https://schema.org/InStock',
            url: window.location.href
          }
        } : {})
      };

      let scriptTag = document.querySelector('script[type="application/ld+json"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function
    return () => {
      document.title = language === 'ar' ? 'نظام الطلبات' : 'Ordering System';
    };
  }, [product, language]);

  const handleShare = async () => {
    const name = language === 'ar' ? product?.nameAr : product?.nameEn;
    const shareData = {
      title: name,
      text: language === 'ar' ? product?.descriptionAr : product?.descriptionEn,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        description: language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard',
      });
    }
  };

  const handleAddToWishlist = () => {
    setLocation('/wishlist');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/ordering">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}
          </h1>
          <Button asChild>
            <Link href="/ordering">
              {language === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const name = language === 'ar' ? product.nameAr : product.nameEn;
  const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
  const specifications = product.specificationsAr;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/ordering">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-md">
              {name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/wishlist">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
                {user.isAdmin && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin">
                      <Settings className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
                <NotificationCenter />
              </>
            )}
            <LanguageToggle />
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = '/api/logout'}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
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
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 me-2" />
                {language === 'ar' ? 'مشاركة' : 'Share'}
              </Button>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="font-mono">
                  SKU: {product.sku}
                </Badge>
                {product.category && (
                  <Badge variant="secondary">{product.category}</Badge>
                )}
                {!product.hasPrice && (
                  <Badge variant="outline">
                    {language === 'ar' ? 'بدون سعر' : 'No Price'}
                  </Badge>
                )}
              </div>
            </div>

            {description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </div>
            )}

            {product.hasPrice && product.contractPrice && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-primary">
                      {product.contractPrice}
                    </span>
                    <span className="text-xl text-muted-foreground">
                      {product.currency}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ar' ? 'سعر العقد' : 'Contract Price'}
                  </p>
                </CardContent>
              </Card>
            )}

            {specifications && (
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {language === 'ar' ? 'المواصفات' : 'Specifications'}
                </h2>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground whitespace-pre-line">
                      {specifications}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Product Details Grid */}
            <div>
              <h2 className="text-lg font-semibold mb-3">
                {language === 'ar' ? 'تفاصيل المنتج' : 'Product Details'}
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    {product.unitType && (
                      <>
                        <dt className="font-medium text-muted-foreground">
                          {language === 'ar' ? 'نوع الوحدة' : 'Unit Type'}
                        </dt>
                        <dd className="font-mono">{product.unitType}</dd>
                      </>
                    )}
                    {product.unit && (
                      <>
                        <dt className="font-medium text-muted-foreground">
                          {language === 'ar' ? 'الوحدة' : 'Unit'}
                        </dt>
                        <dd className="font-mono">{product.unit}</dd>
                      </>
                    )}
                    {product.unitPerBox && (
                      <>
                        <dt className="font-medium text-muted-foreground">
                          {language === 'ar' ? 'وحدة لكل صندوق' : 'Unit Per Box'}
                        </dt>
                        <dd className="font-mono">{product.unitPerBox}</dd>
                      </>
                    )}
                    {product.mainCategory && (
                      <>
                        <dt className="font-medium text-muted-foreground">
                          {language === 'ar' ? 'الفئة الرئيسية' : 'Main Category'}
                        </dt>
                        <dd>{product.mainCategory}</dd>
                      </>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {product.hasPrice ? (
                <Button size="lg" className="w-full" asChild>
                  <Link href="/ordering">
                    <ShoppingCart className="h-5 w-5 me-2" />
                    {language === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="w-full" onClick={handleAddToWishlist}>
                  <Heart className="h-5 w-5 me-2" />
                  {language === 'ar' ? 'أضف إلى قائمة الرغبات' : 'Add to Wishlist'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
