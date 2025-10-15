
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, FileText, Edit, Trash2, Copy, Eye, Download, 
  ArrowLeft, Palette, Type, Table, FileSignature 
} from 'lucide-react';
import { Link } from 'wouter';

export default function AdminTemplatesPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    category: 'price_offer',
    language: 'both',
    primaryColor: '#1a365d',
    secondaryColor: '#2d3748',
    accentColor: '#d4af37',
    fontSize: 10,
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/admin/templates', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === 'all' 
        ? '/api/admin/templates'
        : `/api/admin/templates?category=${selectedCategory}`;
      const res = await apiRequest('GET', url);
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/templates', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إنشاء القالب' : 'Template Created',
        description: language === 'ar' ? 'تم إنشاء القالب بنجاح' : 'Template created successfully',
      });
      setCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const res = await apiRequest('PUT', `/api/admin/templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث القالب بنجاح' : 'Template updated successfully',
      });
      setEditingTemplate(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف القالب بنجاح' : 'Template deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({ id, name }: any) => {
      const res = await apiRequest('POST', `/api/admin/templates/${id}/duplicate`, { name });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم النسخ' : 'Duplicated',
        description: language === 'ar' ? 'تم نسخ القالب بنجاح' : 'Template duplicated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
    },
  });

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      category: 'price_offer',
      language: 'both',
      primaryColor: '#1a365d',
      secondaryColor: '#2d3748',
      accentColor: '#d4af37',
      fontSize: 10,
    });
  };

  const handleSave = () => {
    const templateData = {
      nameEn: formData.nameEn,
      nameAr: formData.nameAr,
      descriptionEn: formData.descriptionEn || undefined,
      descriptionAr: formData.descriptionAr || undefined,
      category: formData.category,
      language: formData.language,
      sections: [
        {
          type: 'header',
          content: {
            companyName: '{{company_name}}',
            address: '{{company_address}}',
            contact: '{{company_contact}}',
          },
        },
        {
          type: 'body',
          content: {
            text: '{{body_content}}',
            align: 'justify',
          },
        },
        {
          type: 'footer',
          content: {
            text: '{{footer_text}}',
          },
        },
      ],
      variables: [
        'company_name',
        'company_address',
        'company_contact',
        'body_content',
        'footer_text',
      ],
      styles: {
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        fontSize: formData.fontSize,
      },
      isActive: true,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: templateData });
    } else {
      createMutation.mutate(templateData);
    }
  };

  const categories = [
    { value: 'all', labelEn: 'All Templates', labelAr: 'جميع القوالب' },
    { value: 'price_offer', labelEn: 'Price Offers', labelAr: 'عروض الأسعار' },
    { value: 'order', labelEn: 'Orders', labelAr: 'الطلبات' },
    { value: 'invoice', labelEn: 'Invoices', labelAr: 'الفواتير' },
    { value: 'contract', labelEn: 'Contracts', labelAr: 'العقود' },
    { value: 'report', labelEn: 'Reports', labelAr: 'التقارير' },
    { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {language === 'ar' ? 'إدارة القوالب' : 'Template Management'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'ar' 
                  ? 'إنشاء وإدارة قوالب المستندات' 
                  : 'Create and manage document templates'}
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'قالب جديد' : 'New Template'}
          </Button>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="mb-6">
            {categories.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {language === 'ar' ? cat.labelAr : cat.labelEn}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates?.map((template: any) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {language === 'ar' ? template.nameAr : template.nameEn}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {language === 'ar' ? template.descriptionAr : template.descriptionEn}
                      </CardDescription>
                    </div>
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive 
                        ? (language === 'ar' ? 'نشط' : 'Active')
                        : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingTemplate(template);
                        setFormData({
                          nameEn: template.nameEn,
                          nameAr: template.nameAr,
                          descriptionEn: template.descriptionEn || '',
                          descriptionAr: template.descriptionAr || '',
                          category: template.category,
                          language: template.language,
                          primaryColor: JSON.parse(template.styles).primaryColor,
                          secondaryColor: JSON.parse(template.styles).secondaryColor,
                          accentColor: JSON.parse(template.styles).accentColor,
                          fontSize: JSON.parse(template.styles).fontSize,
                        });
                        setCreateDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const newName = {
                          en: `${template.nameEn} (Copy)`,
                          ar: `${template.nameAr} (نسخة)`,
                        };
                        duplicateMutation.mutate({ id: template.id, name: newName });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Tabs>

        <Dialog open={createDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setEditingTemplate(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate 
                  ? (language === 'ar' ? 'تعديل القالب' : 'Edit Template')
                  : (language === 'ar' ? 'قالب جديد' : 'New Template')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                  <Input
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                  <Textarea
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                  <Textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {language === 'ar' ? cat.labelAr : cat.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'اللغة' : 'Language'}</Label>
                  <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{language === 'ar' ? 'إنجليزي' : 'English'}</SelectItem>
                      <SelectItem value="ar">{language === 'ar' ? 'عربي' : 'Arabic'}</SelectItem>
                      <SelectItem value="both">{language === 'ar' ? 'ثنائي اللغة' : 'Both'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base">{language === 'ar' ? 'ألوان القالب' : 'Template Colors'}</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{language === 'ar' ? 'اللون الأساسي' : 'Primary Color'}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-16"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'اللون الثانوي' : 'Secondary Color'}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-16"
                      />
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'لون التمييز' : 'Accent Color'}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                        className="w-16"
                      />
                      <Input
                        value={formData.accentColor}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>{language === 'ar' ? 'حجم الخط' : 'Font Size'}</Label>
                <Input
                  type="number"
                  value={formData.fontSize}
                  onChange={(e) => setFormData({ ...formData, fontSize: parseInt(e.target.value) })}
                  min={8}
                  max={16}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSave}>
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
