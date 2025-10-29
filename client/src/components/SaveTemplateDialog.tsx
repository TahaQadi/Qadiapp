import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export function SaveTemplateDialog({ open, onOpenChange, onSave }: SaveTemplateDialogProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name);
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('saveTemplate')}</DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'قم بإعطاء قالبك اسمًا'
              : 'Give your template a name'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">
              {language === 'ar' ? 'اسم القالب' : 'Template Name'}
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'ar' ? 'مستلزمات مكتبية أسبوعية' : 'Weekly Office Supplies'}
              data-testid="input-template-name"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-template"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            data-testid="button-confirm-save-template"
          >
            {t('saveTemplate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
