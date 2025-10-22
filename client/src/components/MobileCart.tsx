
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { cn } from '@/lib/utils';

interface MobileCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  total: number;
}

export function MobileCart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  total,
}: MobileCartProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side={isRTL ? 'left' : 'right'}
        className="w-full sm:max-w-md flex flex-col p-0 safe-top safe-bottom"
      >
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-mobile-lg">
              {t('cart.title')} ({items.length})
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="touch-target-large -mr-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 smooth-scroll">
          <div className="p-4 space-y-4">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-mobile-base">
                  {t('cart.empty')}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-muted/50 rounded-lg p-3 space-y-3">
                  <div className="flex gap-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-mobile-sm line-clamp-2">
                        {isRTL ? item.nameAr : item.nameEn}
                      </h4>
                      <p className="text-mobile-xs text-muted-foreground mt-1">
                        {item.sku}
                      </p>
                      <p className="text-primary font-bold text-mobile-base mt-2">
                        ${parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-background rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="touch-target h-10 w-10"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium text-mobile-base">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="touch-target h-10 w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.id)}
                      className="touch-target-large text-destructive"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-mobile-sm text-muted-foreground">
                      {t('cart.subtotal')}
                    </span>
                    <span className="font-bold text-mobile-base">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3 bg-card">
            <div className="flex justify-between items-center">
              <span className="font-bold text-mobile-lg">{t('cart.total')}</span>
              <span className="font-bold text-primary text-mobile-xl">
                ${total.toFixed(2)}
              </span>
            </div>
            <Button
              onClick={onCheckout}
              className="w-full touch-target-large text-mobile-base font-bold"
              size="lg"
            >
              {t('cart.checkout')}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
