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
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20',
        'bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm transition-all',
        scrolled && 'shadow-md'
      )}
    >
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src="/logo.png"
            alt={isArabic ? 'شعار الشركة' : 'Company Logo'}
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
          />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
              {isArabic ? 'بوابة القاضي' : 'AlQadi Gate'}
            </h1>
            {userName && (
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden md:block truncate">
                {isArabic ? 'مرحباً' : 'Welcome'}, {userName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-primary/10 hover:border-primary transition-all duration-300 shadow-sm touch-manipulation active:scale-95"
            onClick={onCartOpen}
            data-testid="button-open-cart"
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            {cartItemCount > 0 && (
              <span
                className="absolute -top-0.5 -end-0.5 sm:-top-1 sm:-end-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold bg-primary text-primary-foreground shadow-lg animate-pulse ring-2 ring-background"
                data-testid="badge-cart-count"
              >
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </Button>

          <NotificationCenter />
        </div>
      </div>
    </header>
  );
}
