import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface OrderTemplateCardProps {
  id: string;
  nameEn: string;
  nameAr: string;
  itemCount: number;
  createdAt: Date;
  onLoad: () => void;
  onDelete: () => void;
}

export function OrderTemplateCard({
  id,
  nameEn,
  nameAr,
  itemCount,
  createdAt,
  onLoad,
  onDelete,
}: OrderTemplateCardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const name = language === 'ar' ? nameAr : nameEn;
  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS,
  });

  return (
    <Card className="p-4" data-testid={`card-template-${id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="font-medium text-sm truncate">{name}</h3>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {itemCount} {t('items')}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={onLoad}
            data-testid={`button-load-template-${id}`}
          >
            {t('loadTemplate')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDelete}
            data-testid={`button-delete-template-${id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
