
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { X, Filter } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdvancedFiltersProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  maxPrice: number;
  onClearAll: () => void;
  activeFiltersCount: number;
}

export function AdvancedFilters({
  categories,
  selectedCategories,
  onCategoryToggle,
  priceRange,
  onPriceRangeChange,
  maxPrice,
  onClearAll,
  activeFiltersCount,
}: AdvancedFiltersProps) {
  const { language } = useLanguage();

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">
            {language === 'ar' ? 'الفلاتر المتقدمة' : 'Advanced Filters'}
          </h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-auto p-0 text-xs"
          >
            <X className="h-3 w-3 me-1" />
            {language === 'ar' ? 'مسح الكل' : 'Clear All'}
          </Button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            {language === 'ar' ? 'الفئات' : 'Categories'}
          </h4>
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {categories.filter(c => c !== 'all').map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => onCategoryToggle(category)}
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">
            {language === 'ar' ? 'نطاق السعر' : 'Price Range'}
          </h4>
          <span className="text-xs text-muted-foreground font-mono">
            {priceRange[0]} - {priceRange[1]}
          </span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={(val) => onPriceRangeChange(val as [number, number])}
          max={maxPrice}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>{maxPrice}</span>
        </div>
      </div>
    </Card>
  );
}
