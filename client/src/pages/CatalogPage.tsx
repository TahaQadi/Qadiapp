import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Package, Search } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@shared/schema';
import { SEO } from "@/components/SEO";

interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

export default function CatalogPage() {
  const [, params] = useRoute('/catalog/:category');
  const category = params?.category;
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products = [], isLoading } = useQuery<ProductWithLtaPrice[]>({
    queryKey: ['/api/products/public'],
  });

  const categoryProducts = products.filter(p => 
    (!category || category === 'all' || p.category === category) &&
    (searchQuery === '' || 
     p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.nameAr.includes(searchQuery) ||
     p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const pageTitle = category && category !== 'all' 
    ? `${category} - ${language === 'ar' ? 'الكتالوج' : 'Catalog'}`
    : (language === 'ar' ? 'الكتالوج' : 'Product Catalog');

  const pageDescription = `Browse our ${category || 'product'} catalog. Find products related to ${category || 'all categories'}.`;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={pageTitle}
        description={pageDescription}
        keywords={`${category || 'products'}, catalog, shop, ${language === 'ar' ? 'منتجات، كتالوج، تسوق' : 'products, catalog, shop'}`}
        pathname={`/catalog/${category || ''}`}
      />
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            <span className="font-semibold">
              {language === 'ar' ? 'الكتالوج' : 'Catalog'}
            </span>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <Link href={`/catalog/${cat}`}>
                  {cat === 'all' 
                    ? (language === 'ar' ? 'الكل' : 'All')
                    : cat
                  }
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categoryProducts.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground">
                {categoryProducts.length} {language === 'ar' ? 'منتج' : 'products'}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoryProducts.map((product) => {
                const name = language === 'ar' ? product.nameAr : product.nameEn;
                return (
                  <Link key={product.id} href={`/products/${product.sku}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative aspect-square bg-muted">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground/40" />
                          </div>
                        )}
                        {product.category && (
                          <Badge className="absolute top-2 left-2" variant="secondary">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1">
                          {name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {product.sku}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}
            </h3>
          </Card>
        )}
      </main>
    </div>
  );
}