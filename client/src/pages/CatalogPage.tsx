import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Package, Search, ChevronRight, Laptop, Printer, Monitor, Keyboard, Mouse, Headphones, Cable, Speaker, Camera, Smartphone, Tablet, Watch, HardDrive, Cpu, MemoryStick, Wifi, Router, Boxes } from 'lucide-react';
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
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery<ProductWithLtaPrice[]>({
    queryKey: ['/api/products/public'],
  });

  // Extract unique main categories and subcategories
  const mainCategories = [...new Set(products.map(p => p.mainCategory).filter(Boolean))];

  const getSubCategories = (mainCat: string) => {
    return [...new Set(products
      .filter(p => p.mainCategory === mainCat)
      .map(p => p.subCategory)
      .filter(Boolean))];
  };

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('computer') || categoryLower.includes('laptop')) return Laptop;
    if (categoryLower.includes('printer')) return Printer;
    if (categoryLower.includes('monitor') || categoryLower.includes('display')) return Monitor;
    if (categoryLower.includes('keyboard')) return Keyboard;
    if (categoryLower.includes('mouse')) return Mouse;
    if (categoryLower.includes('headphone') || categoryLower.includes('audio')) return Headphones;
    if (categoryLower.includes('cable') || categoryLower.includes('wire')) return Cable;
    if (categoryLower.includes('speaker')) return Speaker;
    if (categoryLower.includes('camera')) return Camera;
    if (categoryLower.includes('phone') || categoryLower.includes('mobile')) return Smartphone;
    if (categoryLower.includes('tablet')) return Tablet;
    if (categoryLower.includes('watch')) return Watch;
    if (categoryLower.includes('storage') || categoryLower.includes('drive')) return HardDrive;
    if (categoryLower.includes('processor') || categoryLower.includes('cpu')) return Cpu;
    if (categoryLower.includes('memory') || categoryLower.includes('ram')) return MemoryStick;
    if (categoryLower.includes('network') || categoryLower.includes('wifi')) return Wifi;
    if (categoryLower.includes('router')) return Router;
    return Package;
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
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
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
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  {language === 'ar' ? 'الفئات الرئيسية' : 'Main Categories'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {mainCategories.map((mainCat) => {
                    const IconComponent = getCategoryIcon(mainCat);
                    return (
                      <Card
                        key={mainCat}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedMainCategory(mainCat)}
                      >
                        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[140px]">
                          <IconComponent className="h-12 w-12 mb-3 text-primary" />
                          <h3 className="font-semibold text-lg">{mainCat}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {products.filter(p => p.mainCategory === mainCat).length}{' '}
                            {language === 'ar' ? 'منتج' : 'products'}
                          </p>
                        </CardContent>
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
                  {filteredProducts.map((product) => {
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
                        <Card className="h-full hover:shadow-lg transition-all cursor-pointer group" data-testid={`card-product-${product.id}`}>
                          <div className="relative aspect-square bg-muted overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                data-testid={`img-product-${product.id}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                <Package className="w-12 h-12 text-muted-foreground/30" />
                              </div>
                            )}
                            {product.subCategory && (
                              <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                                {product.subCategory}
                              </Badge>
                            )}
                            {product.hasPrice && product.contractPrice && (
                              <Badge className="absolute top-2 right-2 text-xs bg-primary/90 hover:bg-primary">
                                {product.contractPrice} {product.currency}
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-3 space-y-1">
                            <h3 className="font-medium text-sm line-clamp-2 leading-tight" data-testid={`text-product-name-${product.id}`}>
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
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* No Products Found */}
            {filteredProducts.length === 0 && (selectedSubCategory || searchQuery) && (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">
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