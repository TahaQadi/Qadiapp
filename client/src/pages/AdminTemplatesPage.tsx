
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, FileText, Edit, Trash2, Copy, ArrowLeft, Loader2, Upload, Download,
  Search, Filter, Eye, BarChart3, Globe, FileCheck, Power
} from 'lucide-react';
import { Link } from 'wouter';
import { useIsMobile } from '@/hooks/use-mobile';
import { TemplateEditor } from '@/components/TemplateEditor';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/EmptyState';
import { PaginationControls } from '@/components/PaginationControls';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Template {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  category: string;
  language: string;
  sections: any[];
  variables: string[];
  styles: any;
  isActive: boolean;
  createdAt: string;
}

interface CategoryConfig {
  value: string;
  labelEn: string;
  labelAr: string;
  color: string;
  icon: typeof FileText;
}

const CATEGORIES: CategoryConfig[] = [
  { value: 'all', labelEn: 'All Templates', labelAr: 'جميع القوالب', color: 'bg-slate-500', icon: FileText },
  { value: 'price_offer', labelEn: 'Price Offers', labelAr: 'عروض الأسعار', color: 'bg-blue-500', icon: FileText },
  { value: 'order', labelEn: 'Orders', labelAr: 'الطلبات', color: 'bg-green-500', icon: FileText },
  { value: 'invoice', labelEn: 'Invoices', labelAr: 'الفواتير', color: 'bg-orange-500', icon: FileText },
  { value: 'contract', labelEn: 'Contracts', labelAr: 'العقود', color: 'bg-purple-500', icon: FileText },
  { value: 'report', labelEn: 'Reports', labelAr: 'التقارير', color: 'bg-pink-500', icon: FileText },
  { value: 'other', labelEn: 'Other', labelAr: 'أخرى', color: 'bg-gray-500', icon: FileText },
];

export default function AdminTemplatesPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/admin/templates', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === 'all'
        ? '/api/admin/templates'
        : `/api/admin/templates?category=${selectedCategory}`;
      const res = await apiRequest('GET', url);
      return res.json();
    },
  });

  // Ensure templates is always an array
  const templates = Array.isArray(templatesData) ? templatesData : [];

  // Computed values with useMemo for performance
  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    inactive: templates.filter(t => !t.isActive).length,
    bilingual: templates.filter(t => t.language === 'both').length,
    byCategory: CATEGORIES.reduce((acc, cat) => {
      if (cat.value !== 'all') {
        acc[cat.value] = templates.filter(t => t.category === cat.value).length;
      }
      return acc;
    }, {} as Record<string, number>)
  }), [templates]);

  // Filter and paginate templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = searchTerm === '' || 
        template.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.nameAr.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [templates, searchTerm]);

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTemplates.slice(start, start + itemsPerPage);
  }, [filteredTemplates, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);

  // Mutations
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
      setEditingTemplate(null);
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
      setCreateDialogOpen(false);
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

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/templates/import', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Import failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setImportResults(data);
      toast({
        title: language === 'ar' ? 'تم الاستيراد' : 'Import Completed',
        description: language === 'ar'
          ? `تم استيراد ${data.success} قالب بنجاح`
          : `Successfully imported ${data.success} template(s)`,
      });
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

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest('PUT', `/api/admin/templates/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
    },
  });

  const downloadTemplateStructure = () => {
    const sampleTemplate = {
      nameEn: 'Sample Template',
      nameAr: 'قالب نموذجي',
      descriptionEn: 'Sample template description',
      descriptionAr: 'وصف القالب النموذجي',
      category: 'price_offer',
      language: 'both',
      sections: [
        {
          type: 'header',
          order: 0,
          content: {
            showLogo: true,
            titleAr: 'عنوان المستند',
            titleEn: 'Document Title',
            companyInfoAr: {
              name: '{{companyName}}',
              address: '{{companyAddress}}',
              phone: '{{companyPhone}}',
              email: '{{companyEmail}}'
            }
          }
        }
      ],
      variables: ['companyName', 'companyAddress', 'companyPhone', 'companyEmail'],
      styles: {
        primaryColor: '#1a365d',
        secondaryColor: '#2d3748',
        accentColor: '#d4af37',
        fontSize: 11,
        fontFamily: 'Noto Sans Arabic',
        headerHeight: 140,
        footerHeight: 80,
        margins: { top: 160, bottom: 100, left: 50, right: 50 }
      },
      isActive: true,
      version: 1,
      tags: ['sample']
    };

    const blob = new Blob([JSON.stringify(sampleTemplate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-structure-sample.json';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImport = () => {
    if (!importFile) {
      toast({
        variant: 'destructive',
        description: language === 'ar' ? 'يرجى اختيار ملف' : 'Please select a file',
      });
      return;
    }
    importMutation.mutate(importFile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">
                  {language === 'ar' ? 'إدارة القوالب' : 'Template Management'}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {language === 'ar' ? 'تصميم وإدارة قوالب المستندات' : 'Design and manage document templates'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="hidden sm:flex"
            >
              <Upload className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'استيراد' : 'Import'}
            </Button>
            <Button 
              onClick={() => {
                setEditingTemplate(null);
                setCreateDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'قالب جديد' : 'New Template'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">
                {language === 'ar' ? 'إجمالي القوالب' : 'Total Templates'}
              </CardDescription>
              <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">
                {language === 'ar' ? 'نشطة' : 'Active'}
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-green-600">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">
                {language === 'ar' ? 'غير نشطة' : 'Inactive'}
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-orange-600">{stats.inactive}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">
                {language === 'ar' ? 'ثنائية اللغة' : 'Bilingual'}
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600">{stats.bilingual}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'ar' ? 'بحث في القوالب...' : 'Search templates...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                className="sm:hidden"
              >
                <Upload className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'استيراد' : 'Import'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50">
            {CATEGORIES.map(cat => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <cat.icon className="h-4 w-4" />
                <span>{language === 'ar' ? cat.labelAr : cat.labelEn}</span>
                {cat.value !== 'all' && stats.byCategory[cat.value] > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.byCategory[cat.value]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <LoadingSkeleton key={i} type="card" />
                ))}
              </div>
            ) : paginatedTemplates.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={language === 'ar' ? 'لا توجد قوالب' : 'No templates found'}
                description={language === 'ar' 
                  ? 'قم بإنشاء قالب جديد للبدء' 
                  : 'Create a new template to get started'}
                action={
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'إنشاء قالب' : 'Create Template'}
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedTemplates.map((template) => {
                    const categoryConfig = CATEGORIES.find(c => c.value === template.category);
                    return (
                      <Card
                        key={template.id}
                        className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg ${categoryConfig?.color || 'bg-gray-500'} bg-opacity-10`}>
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate">
                                  {language === 'ar' ? template.nameAr : template.nameEn}
                                </CardTitle>
                                <CardDescription className="text-xs truncate mt-1">
                                  {language === 'ar' ? template.descriptionAr : template.descriptionEn}
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleActiveMutation.mutate({ 
                                id: template.id, 
                                isActive: !template.isActive 
                              })}
                              className={template.isActive ? 'text-green-600' : 'text-gray-400'}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant={template.isActive ? 'default' : 'secondary'} className="text-xs">
                              {template.isActive
                                ? (language === 'ar' ? 'نشط' : 'Active')
                                : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.language === 'both' 
                                ? (language === 'ar' ? 'ثنائي اللغة' : 'Bilingual')
                                : template.language === 'ar' ? 'عربي' : 'English'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setEditingTemplate(template);
                                setCreateDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              {language === 'ar' ? 'تعديل' : 'Edit'}
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
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteMutation.mutate(template.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredTemplates.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) {
          setImportFile(null);
          setImportResults(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'استيراد القوالب' : 'Import Templates'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'قم بتحميل ملف JSON يحتوي على بيانات القالب'
                : 'Upload a JSON file containing template data'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {language === 'ar' ? 'تنزيل هيكل القالب' : 'Download Template Structure'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'احصل على ملف نموذجي يوضح البنية المطلوبة للقالب'
                    : 'Get a sample file showing the required template structure'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={downloadTemplateStructure} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'تنزيل النموذج' : 'Download Sample'}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              {importFile && (
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الملف المحدد: ' : 'Selected file: '}
                  {importFile.name}
                </p>
              )}
            </div>

            {importResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {language === 'ar' ? 'نتائج الاستيراد' : 'Import Results'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-green-600">
                    ✓ {language === 'ar' ? 'نجح: ' : 'Success: '}{importResults.success}
                  </p>
                  {importResults.errors?.length > 0 && (
                    <div>
                      <p className="text-sm text-red-600 mb-1">
                        ✗ {language === 'ar' ? 'أخطاء: ' : 'Errors: '}{importResults.errors.length}
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                        {importResults.errors.map((error: string, i: number) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setImportFile(null);
                setImportResults(null);
              }}
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الاستيراد...' : 'Importing...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'استيراد' : 'Import'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          setEditingTemplate(null);
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
            }}
            onCancel={() => {
              setCreateDialogOpen(false);
              setEditingTemplate(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
