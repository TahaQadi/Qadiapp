import { useState } from 'react';
import { LanguageProvider } from '../LanguageProvider';
import { SaveTemplateDialog as SaveTemplateDialogComponent } from '../SaveTemplateDialog';
import { Button } from '@/components/ui/button';
import '../../lib/i18n';

export default function SaveTemplateDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <LanguageProvider>
      <div className="p-4">
        <Button onClick={() => setOpen(true)}>Open Save Template Dialog</Button>
        <SaveTemplateDialogComponent
          open={open}
          onOpenChange={setOpen}
          onSave={(nameEn, nameAr) => {
          }}
        />
      </div>
    </LanguageProvider>
  );
}
