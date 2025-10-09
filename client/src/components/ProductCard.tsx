import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';

interface ProductCardProps {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  price: string;
  currency: string;
  sku: string;
  imageUrl?: string;
  onAddToCart: () => void;
}

export function ProductCard({
  nameEn,
  nameAr,
  descriptionEn,
  descriptionAr,
  price,
  currency,
  sku,
  imageUrl,
  onAddToCart,
}: ProductCardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const name = language === 'ar' ? nameAr : nameEn;
  const description = language === 'ar' ? descriptionAr : descriptionEn;

  return (
    <Card className="group relative overflow-hidden hover-lift animate-fade-in" data-testid={`card-product-${sku}`}>
      {imageUrl && (
        <div className="aspect-square bg-muted rounded-md overflow-hidden">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex-1 flex flex-col gap-2">
        <div>
          <h3 className="font-medium text-sm leading-tight">{name}</h3>
        </div>

        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        )}

        <div className="text-xs text-muted-foreground">
          {t('sku')}: {sku}
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="font-mono text-lg font-medium">
            {currency} {price}
          </div>

          <Button
            size="sm"
            onClick={onAddToCart}
            data-testid={`button-add-to-cart-${sku}`}
          >
            <Plus className="h-4 w-4 me-1" />
            {t('addToCart')}
          </Button>
        </div>
      </div>
    </Card>
  );
}