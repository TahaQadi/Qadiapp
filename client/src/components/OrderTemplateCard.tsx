import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useLanguage } from './LanguageProvider';
import { FileText, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface OrderTemplateCardProps {
  id: string;
  name: string;
  itemCount: number;
  createdAt: Date;
  onLoad: () => void;
  onDelete: () => void;
}

export function OrderTemplateCard({
  name,
  itemCount,
  createdAt,
  onLoad,
  onDelete,
}: OrderTemplateCardProps): JSX.Element {
  const { language } = useLanguage();

  const formattedDate = format(createdAt, language === 'ar' ? 'dd/MM/yyyy' : 'MMM dd, yyyy');

  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md">
      <CardContent className="flex-1 p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 truncate">{name}</h3>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? `${itemCount} عنصر` : `${itemCount} items`}
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {language === 'ar' ? 'تم الإنشاء:' : 'Created:'} {formattedDate}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onLoad}
          className="flex-1"
        >
          <Loader2 className="h-4 w-4 me-2" />
          {language === 'ar' ? 'تحميل' : 'Load'}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="flex-1"
        >
          <Trash2 className="h-4 w-4 me-2" />
          {language === 'ar' ? 'حذف' : 'Delete'}
        </Button>
      </CardFooter>
    </Card>
  );
}

