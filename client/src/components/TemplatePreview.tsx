
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from './LanguageProvider';

interface TemplatePreviewProps {
  template: {
    nameEn: string;
    nameAr: string;
    styles: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      fontSize: number;
      fontFamily?: string;
    };
    sections: Array<{
      type: string;
      content: any;
    }>;
  };
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const { language } = useLanguage();

  return (
    <Card className="border-2">
      <CardContent className="p-8 space-y-4">
        {/* Header Preview */}
        <div 
          className="p-4 rounded-t-lg text-white"
          style={{ backgroundColor: template.styles.primaryColor }}
        >
          <h3 className="text-lg font-bold">
            {language === 'ar' ? template.nameAr : template.nameEn}
          </h3>
          <p className="text-sm opacity-90">Company Name • Address • Contact</p>
        </div>

        {/* Accent Line */}
        <div 
          className="h-1 rounded"
          style={{ backgroundColor: template.styles.accentColor }}
        />

        {/* Body Preview */}
        <div className="space-y-3">
          <p style={{ fontSize: `${template.styles.fontSize}px` }}>
            {language === 'ar' 
              ? 'هذا مثال على محتوى المستند. سيتم استبدال المتغيرات بالقيم الفعلية عند الإنشاء.'
              : 'This is a sample document content. Variables will be replaced with actual values during generation.'}
          </p>

          {/* Table Preview */}
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: template.styles.primaryColor }}>
                <th className="border p-2 text-white text-sm">Item</th>
                <th className="border p-2 text-white text-sm">Qty</th>
                <th className="border p-2 text-white text-sm">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50">
                <td className="border p-2 text-sm">Sample Product</td>
                <td className="border p-2 text-sm">10</td>
                <td className="border p-2 text-sm">$100</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Preview */}
        <div 
          className="p-3 rounded-b-lg text-white text-center text-xs mt-4"
          style={{ backgroundColor: template.styles.secondaryColor }}
        >
          Footer Text • Terms & Conditions
        </div>
      </CardContent>
    </Card>
  );
}
