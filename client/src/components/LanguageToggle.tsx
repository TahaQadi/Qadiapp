import { Button } from '@/components/ui/button';
import { useLanguage } from './LanguageProvider';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      data-testid="button-language-toggle"
      className="font-sans"
    >
      {language === 'en' ? 'العربية' : 'English'}
    </Button>
  );
}
