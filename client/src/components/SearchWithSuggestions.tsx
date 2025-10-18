
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { Card } from '@/components/ui/card';
import type { Product } from '@shared/schema';

interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

interface SearchWithSuggestionsProps {
  products: ProductWithLtaPrice[];
  value: string;
  onChange: (value: string) => void;
  onProductSelect?: (product: ProductWithLtaPrice) => void;
  placeholder?: string;
}

export function SearchWithSuggestions({ 
  products, 
  value, 
  onChange, 
  onProductSelect,
  placeholder 
}: SearchWithSuggestionsProps) {
  const { language } = useLanguage();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductWithLtaPrice[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const filtered = products
        .filter(p => {
          const searchLower = value.toLowerCase();
          return (
            p.nameEn.toLowerCase().includes(searchLower) ||
            p.nameAr.includes(value) ||
            p.sku.toLowerCase().includes(searchLower) ||
            p.category?.toLowerCase().includes(searchLower)
          );
        })
        .slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, products]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark> : part
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder || (language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="ps-10 pe-10"
        />
        {value && (
          <button
            onClick={() => {
              onChange('');
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-96 overflow-y-auto shadow-lg">
          <div className="p-2">
            {suggestions.map((product) => {
              const name = language === 'ar' ? product.nameAr : product.nameEn;
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 hover:bg-accent rounded-md cursor-pointer transition-colors"
                  onClick={() => {
                    if (onProductSelect) {
                      onProductSelect(product);
                    } else {
                      onChange(name);
                    }
                    setShowSuggestions(false);
                  }}
                >
                  <div className="w-12 h-12 bg-muted rounded flex-shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Search className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {highlightMatch(name, value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {highlightMatch(product.sku, value)}
                    </p>
                    {product.category && (
                      <p className="text-xs text-muted-foreground">
                        {product.category}
                      </p>
                    )}
                  </div>
                  {product.hasPrice && product.contractPrice && (
                    <div className="text-sm font-mono text-primary">
                      {product.contractPrice} {product.currency}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
