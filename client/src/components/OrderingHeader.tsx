import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MiniCartPreview } from '@/components/MiniCartPreview';
import { useIsMobile } from '@/hooks/use-mobile';

interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  sku: string;
}

interface OrderingHeaderProps {
  cartItemCount: number;
  onCartOpen: () => void;
  userName?: string;
  cartItems?: CartItem[];
  cartTotal?: string;
  currency?: string;
}

export function OrderingHeader({ 
  cartItemCount, 
  onCartOpen, 
  userName,
  cartItems = [],
  cartTotal = '0.00',
  currency = 'ILS'
}: OrderingHeaderProps): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Only show popover on desktop and when cart has items
  if (isMobile || cartItemCount === 0) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full hover:bg-primary/10 hover:border-primary transition-all duration-300 shadow-sm touch-manipulation active:scale-95 flex-shrink-0"
          onClick={onCartOpen}
          data-testid="button-open-cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItemCount > 0 && (
            <span
              className="absolute -top-1 -end-1 h-5 w-5 flex items-center justify-center rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-lg animate-pulse ring-2 ring-offset-2 ring-offset-background"
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

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full hover:bg-primary/10 hover:border-primary transition-all duration-300 shadow-sm touch-manipulation active:scale-95 flex-shrink-0"
            data-testid="button-open-cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span
                className="absolute -top-1 -end-1 h-5 w-5 flex items-center justify-center rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-lg animate-pulse ring-2 ring-offset-2 ring-offset-background"
                data-testid="badge-cart-count"
              >
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0" 
          align={isArabic ? "start" : "end"}
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <MiniCartPreview
            items={cartItems.slice(0, 3)}
            total={cartTotal}
            currency={currency}
            onViewCart={onCartOpen}
          />
        </PopoverContent>
      </Popover>

      <NotificationCenter />
    </>
  );
}