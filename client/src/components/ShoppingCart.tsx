import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, ShoppingCart as CartIcon, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useRef } from 'react';

export interface CartItem {
  productId: string;
  nameEn: string;
  nameAr: string;
  price: string;
  quantity: number;
  sku: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSubmitOrder: () => void;
  onSaveTemplate: () => void;
  currency: string;
}

function CartItemCard({ 
  item, 
  currency, 
  onUpdateQuantity, 
  onRemoveItem 
}: { 
  item: CartItem; 
  currency: string; 
  onUpdateQuantity: (id: string, qty: number) => void; 
  onRemoveItem: (id: string) => void; 
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Only allow left swipe (negative values)
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (swipeOffset < -60) {
      onRemoveItem(item.productId);
    }
    setSwipeOffset(0);
  };

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid={`cart-item-${item.sku}`}
    >
      {/* Delete background */}
      <div className="absolute inset-0 bg-destructive flex items-center justify-end px-6">
        <Trash2 className="h-5 w-5 text-destructive-foreground" />
      </div>

      {/* Main content */}
      <div
        className="flex gap-3 bg-background transition-transform duration-200"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {language === 'ar' ? item.nameAr : item.nameEn}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('sku')}: {item.sku}
          </p>
          <p className="font-mono text-sm mt-1">
            {currency} {item.price}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className={isMobile ? "h-11 w-11 active-elevate-2" : "h-8 w-8 active-elevate-2"}
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            data-testid={`button-decrease-${item.sku}`}
          >
            <Minus className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
          </Button>
          <div className={isMobile ? "w-12 text-center font-medium text-base transition-all" : "w-10 text-center font-medium transition-all"} data-testid={`text-quantity-${item.sku}`}>
            <span className="inline-block animate-scale-in">{item.quantity}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className={isMobile ? "h-11 w-11" : "h-8 w-8"}
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            data-testid={`button-increase-${item.sku}`}
          >
            <Plus className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={isMobile ? "h-11 w-11 shrink-0" : "h-8 w-8 shrink-0"}
          onClick={() => onRemoveItem(item.productId)}
          data-testid={`button-remove-${item.sku}`}
        >
          <Trash2 className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
        </Button>
      </div>
    </div>
  );
}

export function ShoppingCart({
  items,
  open,
  onOpenChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
  onSaveTemplate,
  currency,
}: ShoppingCartProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const tax = subtotal * 0.15; // 15% tax
  const total = subtotal + tax;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <CartIcon className="h-5 w-5" />
              {t('yourCart')}
            </SheetTitle>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCart}
                data-testid="button-clear-cart"
              >
                {t('clearCart')}
              </Button>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
            <CartIcon className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">{t('emptyCart')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('startShopping')}</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 pb-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.productId}
                    item={item}
                    currency={currency}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 pt-4 border-t space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span className="font-mono" data-testid="text-subtotal">
                    {currency} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('tax')}</span>
                  <span className="font-mono" data-testid="text-tax">
                    {currency} {tax.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>{t('total')}</span>
                  <span className="font-mono text-lg" data-testid="text-total">
                    {currency} {total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className={isMobile ? "w-full min-h-[48px] text-base" : "w-full"}
                  onClick={onSubmitOrder}
                  data-testid="button-submit-order"
                >
                  {t('submitOrder')}
                </Button>
                <Button
                  variant="outline"
                  className={isMobile ? "w-full min-h-[48px] text-base" : "w-full"}
                  onClick={onSaveTemplate}
                  data-testid="button-save-template"
                >
                  {t('saveAsTemplate')}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
