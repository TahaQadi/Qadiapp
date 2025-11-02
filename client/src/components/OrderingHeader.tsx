import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderingHeaderProps {
  cartItemCount: number;
  onCartOpen: () => void;
  userName?: string;
}

export function OrderingHeader({ cartItemCount, onCartOpen, userName }: OrderingHeaderProps): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-primary/10 hover:border-primary transition-all duration-300 shadow-sm touch-manipulation active:scale-95 flex-shrink-0"
        onClick={onCartOpen}
        data-testid="button-open-cart"
      >
        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
        {cartItemCount > 0 && (
          <span
            className="absolute -top-0.5 -end-0.5 sm:-top-1 sm:-end-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold bg-primary text-primary-foreground shadow-lg animate-pulse ring-2 ring-offset-2 ring-offset-background"
            data-testid="badge-cart-count"
          >
            {cartItemCount > 9 ? '9+' : cartItemCount}
          </span>
        )}
      </Button>

      <NotificationCenter />
    </>
  );
}