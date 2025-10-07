import { LanguageProvider } from '../LanguageProvider';
import { OrderTemplateCard as OrderTemplateCardComponent } from '../OrderTemplateCard';
import '../../lib/i18n';

export default function OrderTemplateCardExample() {
  return (
    <LanguageProvider>
      <div className="p-4 max-w-md">
        <OrderTemplateCardComponent
          id="1"
          nameEn="Weekly Office Supplies"
          nameAr="مستلزمات مكتبية أسبوعية"
          itemCount={8}
          createdAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
          onLoad={() => console.log('Template loaded')}
          onDelete={() => console.log('Template deleted')}
        />
      </div>
    </LanguageProvider>
  );
}
