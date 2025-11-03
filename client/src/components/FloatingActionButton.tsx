import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { Send, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  cartItemCount: number;
  totalAmount: string;
  currency: string;
  onSubmitOrder: () => void;
  disabled?: boolean;
}

export function FloatingActionButton({
  cartItemCount,
  totalAmount,
  currency,
  onSubmitOrder,
  disabled = false,
}: FloatingActionButtonProps): JSX.Element | null {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const isMobile = useIsMobile();

  // Only show when cart has items
  if (cartItemCount === 0) {
    return null;
  }

  return (
    <Button
      onClick={onSubmitOrder}
      disabled={disabled}
      isLoading={disabled}
      className={cn(
        "fixed z-50 shadow-2xl hover:shadow-3xl transition-all duration-300",
        "min-h-14 min-w-[200px] sm:min-w-[240px]",
        "flex flex-col items-center justify-center gap-0.5",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "border-2 border-primary-border",
        "animate-fade-in",
        // Position: bottom-right for LTR, bottom-left for RTL
        isArabic ? "bottom-6 left-6" : "bottom-6 right-6",
        // Mobile adjustments
        isMobile ? "min-h-[56px] px-4 py-3" : "px-6 py-4"
      )}
      data-testid="floating-submit-order-button"
      aria-label={isArabic ? "إرسال الطلب" : "Submit Order"}
    >
      <div className="flex items-center justify-center gap-2 w-full">
        <Send className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
        <span className="font-semibold text-sm sm:text-base">
          {isArabic ? "إرسال الطلب" : "Submit Order"}
        </span>
      </div>
      <div className="flex items-center justify-center gap-1 text-xs opacity-90">
        <ShoppingCart className="h-3 w-3" />
        <span className="font-mono">
          {cartItemCount} {isArabic ? "عنصر" : "items"} • {currency} {totalAmount}
        </span>
      </div>
    </Button>
  );
}

