
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
  Search, Filter, Eye, BarChart3, Globe, FileCheck, Power, Menu
} from 'lucide-react';
import { Link } from 'wouter';
import { useIsMobile } from '@/hooks/use-mobile';
import { TemplateEditor } from '@/components/TemplateEditor';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/EmptyState';
import { PaginationControls } from '@/components/PaginationControls';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
      <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-primary/5 via-background to-primary/5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Button variant="ghost" size="icon" asChild className="shrink-0">
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold truncate">
                    {language === 'ar' ? 'إدارة القوالب' : 'Templates'}
                  </h1>
                  <p className="text-xs text-muted-foreground hidden md:block truncate">
                    {language === 'ar' ? 'تصميم وإدارة قوالب المستندات' : 'Design and manage document templates'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              {isMobile && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="sm:hidden"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                className="hidden lg:flex"
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
                className="gap-1 sm:gap-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{language === 'ar' ? 'قالب جديد' : 'New'}</span>
                <span className="sm:hidden">{language === 'ar' ? 'جديد' : 'New'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="p-3 sm:pb-3 sm:p-6">
              <CardDescription className="text-xs">
                {language === 'ar' ? 'إجمالي القوالب' : 'Total'}
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-bold">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardHeader className="p-3 sm:pb-3 sm:p-6">
              <CardDescription className="text-xs">
                {language === 'ar' ? 'نشطة' : 'Active'}
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
            <CardHeader className="p-3 sm:pb-3 sm:p-6">
              <CardDescription className="text-xs">
                {language === 'ar' ? 'غير نشطة' : 'Inactive'}
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-bold text-orange-600">{stats.inactive}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardHeader className="p-3 sm:pb-3 sm:p-6">
              <CardDescription className="text-xs">
                {language === 'ar' ? 'ثنائية اللغة' : 'Bilingual'}
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-bold text-blue-600">{stats.bilingual}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'ar' ? 'بحث في القوالب...' : 'Search templates...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 sm:h-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                className="lg:hidden"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'استيراد' : 'Import'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <div className="relative">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/30 p-1 gap-1 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm shrink-0"
                >
                  <cat.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{language === 'ar' ? cat.labelAr : cat.labelEn}</span>
                  <span className="sm:hidden">{language === 'ar' ? cat.labelAr.split(' ')[0] : cat.labelEn.split(' ')[0]}</span>
                  {cat.value !== 'all' && stats.byCategory[cat.value] > 0 && (
                    <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-xs h-4 sm:h-5 px-1 sm:px-1.5">
                      {stats.byCategory[cat.value]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={selectedCategory} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <LoadingSkeleton key={i} variant="card" />
                ))}
              </div>
            ) : paginatedTemplates.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={language === 'ar' ? 'لا توجد قوالب' : 'No templates found'}
                description={language === 'ar' 
                  ? 'قم بإنشاء قالب جديد للبدء' 
                  : 'Create a new template to get started'}
                actionLabel={language === 'ar' ? 'إنشاء قالب' : 'Create Template'}
                onAction={() => setCreateDialogOpen(true)}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {paginatedTemplates.map((template) => {
                    const categoryConfig = CATEGORIES.find(c => c.value === template.category);
                    return (
                      <Card
                        key={template.id}
                        className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/50 overflow-hidden"
                      >
                        <CardHeader className="p-3 sm:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={`p-1.5 sm:p-2 rounded-lg ${categoryConfig?.color || 'bg-gray-500'} bg-opacity-10 shrink-0`}>
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm sm:text-base truncate">
                                  {language === 'ar' ? template.nameAr : template.nameEn}
                                </CardTitle>
                                <CardDescription className="text-xs truncate mt-0.5 sm:mt-1">
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
                              className={`shrink-0 h-8 w-8 ${template.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'}`}
                            >
                              <Power className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-1 sm:gap-2 mt-2 flex-wrap">
                            <Badge variant={template.isActive ? 'default' : 'secondary'} className="text-xs h-5">
                              {template.isActive
                                ? (language === 'ar' ? 'نشط' : 'Active')
                                : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                            </Badge>
                            <Badge variant="outline" className="text-xs h-5">
                              {template.language === 'both' 
                                ? (language === 'ar' ? 'ثنائي' : 'Bilingual')
                                : template.language === 'ar' ? 'عربي' : 'EN'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                          <div className="flex gap-1.5 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                              onClick={() => {
                                setEditingTemplate(template);
                                setCreateDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                              <span className="sm:hidden">{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
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
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => deleteMutation.mutate(template.id)}
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

      {/* Mobile Filters Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-[280px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle>{language === 'ar' ? 'الإعدادات' : 'Settings'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ar' ? 'اللغة' : 'Language'}</label>
              <LanguageToggle />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ar' ? 'المظهر' : 'Theme'}</label>
              <ThemeToggle />
            </div>
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setImportDialogOpen(true);
                  setMobileFiltersOpen(false);
                }}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'استيراد قالب' : 'Import Template'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) {
          setImportFile(null);
          setImportResults(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4 w-[calc(100vw-1rem)] sm:w-auto">
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
