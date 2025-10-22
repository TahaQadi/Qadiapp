
import { memo } from 'react';
import { ProductWithLtaPrice } from '@/pages/OrderingPage';
import { ProductCard } from './ProductCard';
import { Card } from './ui/card';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from './LanguageProvider';

interface ProductGridProps {
  products: ProductWithLtaPrice[];
  searchQuery: string;
  selectedCategory: string;
  onClearFilters: () => void;
}

export const ProductGrid = memo(({ 
  products, 
  searchQuery, 
  selectedCategory,
  onClearFilters 
}: ProductGridProps) => {
  const { language } = useLanguage();

  if (products.length === 0) {
    return (
      <Card className="p-12 text-center border-2 border-dashed">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-muted-foreground/50" />
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
            <Button onClick={onClearFilters} variant="outline">
              {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {language === 'ar' ? 'عرض' : 'Showing'}{' '}
          <span className="font-semibold text-foreground">{products.length}</span>{' '}
          {language === 'ar' ? 'منتج' : 'products'}
        </p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';
