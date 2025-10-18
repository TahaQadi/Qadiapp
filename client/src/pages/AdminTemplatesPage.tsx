import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, FileText, Edit, Trash2, Copy, ArrowLeft, Loader2
} from 'lucide-react';
import { Link } from 'wouter';
import { useIsMobile } from '@/hooks/use-mobile';
import { TemplatePreview } from '@/components/TemplatePreview';
import { TemplateEditor } from '@/components/TemplateEditor';

export default function AdminTemplatesPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
    fontFamily: 'Helvetica',
    isDefault: false,
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
      fontFamily: 'Helvetica',
      isDefault: false,
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
      {/* Animated background particles for dark mode */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none dark:block hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-primary/15 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
            >
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <img
              src="/logo.png"
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'}
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                {language === 'ar' ? 'إدارة القوالب' : 'Template Management'}
              </h1>
              {!isMobile && (
                <p className="text-xs text-muted-foreground truncate">
                  {language === 'ar'
                    ? 'إنشاء وإدارة قوالب المستندات'
                    : 'Create and manage document templates'}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingTemplate(null);
              resetForm();
              setCreateDialogOpen(true);
            }}
            size={isMobile ? "sm" : "default"}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            {!isMobile && (language === 'ar' ? 'قالب جديد' : 'New Template')}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-muted/50">
            {categories.map(cat => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {language === 'ar' ? cat.labelAr : cat.labelEn}
              </TabsTrigger>
            ))}
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {templates?.map((template: any) => (
                <Card
                  key={template.id}
                  className="hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 hover:border-primary/50 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <CardTitle className="text-sm sm:text-base truncate">
                            {language === 'ar' ? template.nameAr : template.nameEn}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-xs line-clamp-2">
                          {language === 'ar' ? template.descriptionAr : template.descriptionEn}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={template.isActive ? 'default' : 'secondary'}
                        className="shrink-0 text-xs"
                      >
                        {template.isActive
                          ? (language === 'ar' ? 'نشط' : 'Active')
                          : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          setEditingTemplate(template);
                          const styles = typeof template.styles === 'string'
                            ? JSON.parse(template.styles)
                            : template.styles;
                          setFormData({
                            nameEn: template.nameEn,
                            nameAr: template.nameAr,
                            descriptionEn: template.descriptionEn || '',
                            descriptionAr: template.descriptionAr || '',
                            category: template.category,
                            language: template.language,
                            primaryColor: styles.primaryColor,
                            secondaryColor: styles.secondaryColor,
                            accentColor: styles.accentColor,
                            fontSize: styles.fontSize,
                            fontFamily: styles.fontFamily || 'Helvetica',
                            isDefault: false,
                          });
                          setCreateDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        {!isMobile && (language === 'ar' ? 'تعديل' : 'Edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          const newName = {
                            en: `${template.nameEn} (Copy)`,
                            ar: `${template.nameAr} (نسخة)`,
                          };
                          duplicateMutation.mutate({ id: template.id, name: newName });
                        }}
                      >
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        {!isMobile && (language === 'ar' ? 'نسخ' : 'Copy')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => deleteMutation.mutate(template.id)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Tabs>
      </div>

      {/* Create/Edit Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          setEditingTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? (language === 'ar' ? 'تعديل القالب' : 'Edit Template')
                : (language === 'ar' ? 'قالب جديد' : 'New Template')}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? (language === 'ar' ? 'تعديل تفاصيل ومحتوى القالب' : 'Edit template details and content')
                : (language === 'ar' ? 'إنشاء قالب مستند جديد' : 'Create a new document template')}
            </DialogDescription>
          </DialogHeader>

          <TemplateEditor
            initialTemplate={editingTemplate ? {
              ...editingTemplate,
              styles: typeof editingTemplate.styles === 'string'
                ? JSON.parse(editingTemplate.styles)
                : (editingTemplate.styles || {})
            } : null}
            onSave={(templateData) => {
              if (editingTemplate) {
                updateMutation.mutate({ id: editingTemplate.id, data: templateData });
              } else {
                createMutation.mutate(templateData);
              }
              setCreateDialogOpen(false);
              setEditingTemplate(null); // Reset editing template after save
            }}
            onCancel={() => {
              setCreateDialogOpen(false);
              setEditingTemplate(null); // Reset editing template on cancel
            }}
          />

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditingTemplate(null);
                resetForm();
              }}
              className="flex-1 sm:flex-none"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={() => {
                // This button is a fallback, the actual save is handled by TemplateEditor's onSave
                // However, we need to trigger the save in TemplateEditor if it has a save button
                // For now, we assume TemplateEditor handles its own save and close logic
              }}
              className="flex-1 sm:flex-none hidden" // Hidden as TemplateEditor will handle saving
            >
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}