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
  onSave: (nameEn: string, nameAr: string) => void;
}

export function SaveTemplateDialog({ open, onOpenChange, onSave }: SaveTemplateDialogProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');

  const handleSave = () => {
    if (nameEn.trim() && nameAr.trim()) {
      onSave(nameEn, nameAr);
      setNameEn('');
      setNameAr('');
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
              ? 'قم بإعطاء قالبك اسمًا بكلتا اللغتين'
              : 'Give your template a name in both languages'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name-en">English Name</Label>
            <Input
              id="name-en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Weekly Office Supplies"
              data-testid="input-template-name-en"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name-ar">الاسم بالعربية</Label>
            <Input
              id="name-ar"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مستلزمات مكتبية أسبوعية"
              data-testid="input-template-name-ar"
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
            disabled={!nameEn.trim() || !nameAr.trim()}
            data-testid="button-confirm-save-template"
          >
            {t('saveTemplate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
