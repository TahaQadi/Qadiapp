import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  sku: string;
}

interface MiniCartPreviewProps {
  items: CartItem[];
  total: string;
  currency: string;
  onViewCart: () => void;
}

export function MiniCartPreview({ items, total, currency, onViewCart }: MiniCartPreviewProps): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className={cn("w-80 p-0", isArabic && "text-right")}>
      {items.length === 0 ? (
        <div className="p-6 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'السلة فارغة' : 'Cart is empty'}
          </p>
        </div>
      ) : (
        <>
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm">
              {isArabic ? 'آخر العناصر المضافة' : 'Recently Added'}
            </h3>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="p-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors",
                    isArabic && "flex-row-reverse"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? 'الكمية' : 'Qty'}: {item.quantity} • {currency} {item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">
                {isArabic ? 'المجموع' : 'Total'}
              </span>
              <span className="font-mono font-bold text-lg">
                {currency} {total}
              </span>
            </div>
            <Button
              onClick={onViewCart}
              className="w-full"
              size="sm"
            >
              {isArabic ? 'عرض السلة' : 'View Cart'}
              <ArrowRight className={cn("h-4 w-4", isArabic ? "mr-2 rotate-180" : "ml-2")} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

