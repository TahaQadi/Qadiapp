
import { useMemo } from 'react';
import { ProductWithLtaPrice } from '@/pages/OrderingPage';

export function useProductFilters(
  products: ProductWithLtaPrice[],
  searchQuery: string,
  selectedCategory: string,
  selectedLtaFilter: string
) {
  // First filter by LTA - this is the base set of products for this contract
  const ltaFilteredProducts = useMemo(() => {
    if (!selectedLtaFilter) return [];
    return products.filter(p => p.ltaId === selectedLtaFilter);
  }, [products, selectedLtaFilter]);

  // Calculate categories from LTA-filtered products only
  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(ltaFilteredProducts.map(p => p.category).filter(Boolean)))];
  }, [ltaFilteredProducts]);

  // Then apply search and category filters on top of LTA filter
  const filteredProducts = useMemo(() => {
    return ltaFilteredProducts.filter(p => {
      const matchesSearch = searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.includes(searchQuery) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [ltaFilteredProducts, searchQuery, selectedCategory]);

  return { filteredProducts, categories };
}
