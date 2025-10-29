
import { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, MoveUp, MoveDown, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TemplatePreview } from './TemplatePreview';

interface Section {
  type: string;
  content: any;
  order: number;
}

interface TemplateEditorProps {
  initialTemplate?: any;
  onSave: (template: any) => void;
  onCancel: () => void;
}

export function TemplateEditor({ initialTemplate, onSave, onCancel }: TemplateEditorProps) {
  const { language } = useLanguage();
  const [name, setName] = useState(initialTemplate?.name || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [category, setCategory] = useState(initialTemplate?.category || 'other');
  const [sections, setSections] = useState<Section[]>(initialTemplate?.sections || []);
  const [variables, setVariables] = useState<string[]>(initialTemplate?.variables || []);
  const [primaryColor, setPrimaryColor] = useState(initialTemplate?.styles?.primaryColor || '#2563eb');
  const [secondaryColor, setSecondaryColor] = useState(initialTemplate?.styles?.secondaryColor || '#64748b');
  const [accentColor, setAccentColor] = useState(initialTemplate?.styles?.accentColor || '#10b981');
  const [fontSize, setFontSize] = useState(initialTemplate?.styles?.fontSize || 10);
  const [showPreview, setShowPreview] = useState(false);

  const sectionTypes = [
    { value: 'header', labelEn: 'Header', labelAr: 'رأس الصفحة' },
    { value: 'body', labelEn: 'Body Text', labelAr: 'نص أساسي' },
    { value: 'table', labelEn: 'Table', labelAr: 'جدول' },
    { value: 'divider', labelEn: 'Divider', labelAr: 'فاصل' },
    { value: 'spacer', labelEn: 'Spacer', labelAr: 'مسافة' },
    { value: 'terms', labelEn: 'Terms & Conditions', labelAr: 'الشروط والأحكام' },
    { value: 'signature', labelEn: 'Signature', labelAr: 'التوقيع' },
    { value: 'footer', labelEn: 'Footer', labelAr: 'تذييل' },
  ];

  const addSection = (type: string) => {
    const newSection: Section = {
      type,
      content: getDefaultContent(type),
      order: sections.length
    };
    setSections([...sections, newSection]);
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'header':
        return { companyName: '{{companyName}}', address: '{{companyAddress}}', phone: '{{companyPhone}}', logo: true };
      case 'body':
        return { title: 'Section Title', text: 'Section content here...' };
      case 'table':
        return { headers: ['Column 1', 'Column 2'], rows: [], showBorders: true };
      case 'divider':
        return {};
      case 'spacer':
        return { height: 20 };
      case 'terms':
        return { title: 'Terms & Conditions', items: ['Term 1', 'Term 2'] };
      case 'signature':
        return { label: 'Authorized Signature', party1Label: 'Supplier', party2Label: 'Client' };
      case 'footer':
        return { text: 'Footer text', pageNumbers: true };
      default:
        return {};
    }
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    newSections.forEach((section, i) => section.order = i);
    setSections(newSections);
  };

  const updateSectionContent = (index: number, key: string, value: any) => {
    const newSections = [...sections];
    newSections[index].content[key] = value;
    setSections(newSections);
  };

  const handleSave = () => {
    const template = {
      name,
      description,
      category,
      language: 'ar', // Always Arabic
      sections,
      variables,
      styles: {
        primaryColor,
        secondaryColor,
        accentColor,
        fontSize,
        fontFamily: 'Helvetica',
        headerHeight: 120,
        footerHeight: 70,
        margins: { top: 140, bottom: 90, left: 50, right: 50 }
      },
      isActive: true
    };
    onSave(template);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder={language === 'ar' ? 'اسم القالب' : 'Template name'}
          />
        </div>
        <div>
          <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
          <Input 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder={language === 'ar' ? 'وصف القالب' : 'Template description'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>{language === 'ar' ? 'التصنيف' : 'Category'}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_offer">{language === 'ar' ? 'عرض سعر' : 'Price Offer'}</SelectItem>
              <SelectItem value="order">{language === 'ar' ? 'طلب' : 'Order'}</SelectItem>
              <SelectItem value="invoice">{language === 'ar' ? 'فاتورة' : 'Invoice'}</SelectItem>
              <SelectItem value="contract">{language === 'ar' ? 'عقد' : 'Contract'}</SelectItem>
              <SelectItem value="report">{language === 'ar' ? 'تقرير' : 'Report'}</SelectItem>
              <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label>{language === 'ar' ? 'اللون الأساسي' : 'Primary Color'}</Label>
          <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
        </div>
        <div>
          <Label>{language === 'ar' ? 'اللون الثانوي' : 'Secondary Color'}</Label>
          <Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
        </div>
        <div>
          <Label>{language === 'ar' ? 'لون التمييز' : 'Accent Color'}</Label>
          <Input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
        </div>
        <div>
          <Label>{language === 'ar' ? 'حجم الخط' : 'Font Size'}</Label>
          <Input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} min={8} max={16} />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{language === 'ar' ? 'الأقسام' : 'Sections'}</h3>
          <Select onValueChange={addSection}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={language === 'ar' ? 'إضافة قسم' : 'Add Section'} />
            </SelectTrigger>
            <SelectContent>
              {sectionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {language === 'ar' ? type.labelAr : type.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">
                    {sectionTypes.find(t => t.value === section.type)?.[language === 'ar' ? 'labelAr' : 'labelEn']}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => moveSection(index, 'up')} disabled={index === 0}>
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1}>
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeSection(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea
                  value={JSON.stringify(section.content, null, 2)}
                  onChange={(e) => {
                    try {
                      const newContent = JSON.parse(e.target.value);
                      const newSections = [...sections];
                      newSections[index].content = newContent;
                      setSections(newSections);
                    } catch {}
                  }}
                  rows={4}
                  className="font-mono text-xs"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Label>{language === 'ar' ? 'المتغيرات (مفصولة بفاصلة)' : 'Variables (comma-separated)'}</Label>
        <Input
          value={variables.join(', ')}
          onChange={(e) => setVariables(e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
          placeholder="companyName, clientName, date, ..."
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setShowPreview(true)}>
          <Eye className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'معاينة' : 'Preview'}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave}>
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'معاينة القالب' : 'Template Preview'}</DialogTitle>
          </DialogHeader>
          <TemplatePreview template={{
            name,
            styles: { primaryColor, secondaryColor, accentColor, fontSize },
            sections
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
