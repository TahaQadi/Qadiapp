
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Package, X } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { useState } from 'react';
import type { Product } from '@shared/schema';

interface ProductWithLtaPrice extends Product {
  contractPrice?: string;
  currency?: string;
  ltaId?: string;
  hasPrice: boolean;
}

interface ProductQuickViewProps {
  product: ProductWithLtaPrice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: ProductWithLtaPrice, quantity: number) => void;
}

export function ProductQuickView({ product, open, onOpenChange, onAddToCart }: ProductQuickViewProps) {
  const { language } = useLanguage();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const name = product.name;
  const description = product.description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{name}</span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                SKU: <span className="font-mono">{product.sku}</span>
              </p>
              {product.category && (
                <Badge variant="secondary">{product.category}</Badge>
              )}
            </div>

            {description && (
              <div>
                <h3 className="font-semibold mb-2">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            )}

            {product.hasPrice && product.contractPrice && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'ar' ? 'السعر' : 'Price'}
                </p>
                <p className="text-2xl font-bold font-mono">
                  {product.contractPrice} {product.currency}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'الكمية' : 'Quantity'}
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center border rounded-md p-2"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <Button
                className="w-full"
                onClick={() => {
                  onAddToCart(product, quantity);
                  onOpenChange(false);
                }}
              >
                <ShoppingCart className="h-4 w-4 me-2" />
                {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
              </Button>
              <Button variant="outline" className="w-full">
                <Heart className="h-4 w-4 me-2" />
                {language === 'ar' ? 'طلب سعر' : 'Request Price'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
