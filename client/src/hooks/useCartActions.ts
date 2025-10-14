
import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { useLanguage } from '@/components/LanguageProvider';

export interface CartItem {
  productId: string;
  productSku: string;
  productNameEn: string;
  productNameAr: string;
  quantity: number;
  price: string;
  currency: string;
  ltaId: string;
}

export function useCartActions() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeLtaId, setActiveLtaId] = useState<string | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.productId !== productId));
    } else {
      setCart(prev => prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.productId !== productId);
      if (newCart.length === 0) {
        setActiveLtaId(null);
      }
      return newCart;
    });

    toast({
      description: language === 'ar' ? 'تمت إزالة العنصر من السلة' : 'Item removed from cart'
    });
  }, [toast, language]);

  const handleClearCart = useCallback(() => {
    setCart([]);
    setActiveLtaId(null);
    toast({
      description: language === 'ar' ? 'تم مسح السلة' : 'Cart cleared'
    });
  }, [toast, language]);

  return {
    cart,
    setCart,
    activeLtaId,
    setActiveLtaId,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart
  };
}
