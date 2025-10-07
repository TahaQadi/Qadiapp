import { LanguageProvider } from '../LanguageProvider';
import { LanguageToggle as LanguageToggleComponent } from '../LanguageToggle';
import '../../../lib/i18n';

export default function LanguageToggleExample() {
  return (
    <LanguageProvider>
      <div className="p-4">
        <LanguageToggleComponent />
      </div>
    </LanguageProvider>
  );
}
