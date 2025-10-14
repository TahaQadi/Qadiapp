
import { useMemo } from 'react';
import { ProductWithLtaPrice } from '@/pages/OrderingPage';

export function useProductFilters(
  products: ProductWithLtaPrice[],
  searchQuery: string,
  selectedCategory: string,
  selectedLtaFilter: string
) {
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesLta = selectedLtaFilter === 'all' || p.ltaId === selectedLtaFilter;
      const matchesSearch = searchQuery === '' ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameAr.includes(searchQuery) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesLta && matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory, selectedLtaFilter]);

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  }, [products]);

  return { filteredProducts, categories };
}
