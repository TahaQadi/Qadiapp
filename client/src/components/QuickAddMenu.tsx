import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddMenuProps {
  onAdd: (quantity: number) => void;
  disabled?: boolean;
  className?: string;
}

export function QuickAddMenu({ onAdd, disabled = false, className }: QuickAddMenuProps): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const quickQuantities = [1, 5, 10];

  return (
    <div className={cn(
      "absolute inset-0 bg-background/95 dark:bg-background/95 backdrop-blur-sm flex items-center justify-center gap-2 z-30 rounded-md border border-border/50",
      className
    )}>
      {quickQuantities.map((qty) => (
        <Button
          key={qty}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd(qty);
          }}
          disabled={disabled}
          className="min-w-[60px]"
        >
          <Plus className="h-3 w-3 me-1" />
          {qty}
        </Button>
      ))}
    </div>
  );
}

