import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from './LanguageProvider';
import { Save } from 'lucide-react';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  onSave,
}: SaveTemplateDialogProps): JSX.Element {
  const { language } = useLanguage();
  const [templateName, setTemplateName] = useState('');

  const handleSave = (): void => {
    if (templateName.trim()) {
      onSave(templateName.trim());
      setTemplateName('');
    }
  };

  const handleCancel = (): void => {
    setTemplateName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'حفظ القالب' : 'Save Template'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'أدخل اسمًا للقالب لحفظ العناصر الحالية في السلة'
              : 'Enter a name for the template to save current cart items'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template-name">
              {language === 'ar' ? 'اسم القالب' : 'Template Name'}
            </Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل اسم القالب' : 'Enter template name'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && templateName.trim()) {
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={!templateName.trim()}>
            <Save className="h-4 w-4 me-2" />
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

