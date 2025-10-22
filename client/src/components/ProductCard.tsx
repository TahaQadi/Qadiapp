import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';

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
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Placeholder for useOptimizedImage hook if it's not directly available in this context
  // In a real scenario, this would fetch optimized image URLs.
  // For now, we'll simulate its behavior or assume it's handled by getOptimizedImageUrl.
  const isLoading = false; // Simulate no loading for simplicity here

  const name = language === 'ar' ? nameAr : nameEn;
  const description = language === 'ar' ? descriptionAr : descriptionEn;

  // Lazy load images when card becomes visible
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, []);

  // Simulate isInView for the animation effect, as the original code didn't provide it.
  // In a real-world scenario, you'd use a hook like `useInView` from 'react-intersection-observer'.
  const isInView = isVisible;

  return (
    <Card
      ref={cardRef}
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02]",
        "touch-manipulation", // Improves touch responsiveness
        "h-full flex flex-col", // Ensure consistent card heights
        isInView && "animate-in fade-in-50 slide-in-from-bottom-4"
      )} data-testid={`card-product-${sku}`}>

      <div className={cn("relative overflow-hidden", isMobile ? "w-full h-48" : "aspect-square")}>
          {!isVisible || isLoading ? (
            <div className="w-full h-full bg-muted animate-pulse" />
          ) : (
            <img
              src={getOptimizedImageUrl(imageUrl || '/placeholder-product.png', { width: 300, height: 300, quality: 85 })}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
          )}
      </div>

      <div className="flex-1 flex flex-col gap-2 p-4">
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
            className="min-h-[44px]"
          >
            <Plus className="h-4 w-4 me-1" />
            {t('addToCart')}
          </Button>
        </div>
      </div>
    </Card>
  );
}