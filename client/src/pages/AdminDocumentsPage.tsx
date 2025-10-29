import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Download, Search, Calendar, History, Eye, ArrowLeft, Plus, Edit, Trash2, Copy, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient as globalQueryClient } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { TemplateEditor } from '@/components/TemplateEditor';
import { Link } from 'wouter';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/EmptyState';
import { PaginationControls } from '@/components/PaginationControls';

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  clientId?: string;
  ltaId?: string;
  orderId?: string;
  priceOfferId?: string;
  fileSize: number;
  viewCount?: number;
  createdAt: string;
  lastViewedAt?: string;
  checksum?: string;
  metadata?: any;
}

interface Version {
  id: string;
  versionNumber: number;
  createdAt: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  checksum: string;
}

interface AccessLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

export default function AdminDocumentsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Tab state
  const [activeTab, setActiveTab] = useState('documents');

  // Documents state
  const [searchTerm, setSearchTerm] = useState('');
  const [documentType, setDocumentType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state for documents
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isVersionHistoryDialogOpen, setIsVersionHistoryDialogOpen] = useState(false);
  const [selectedDocumentIdForHistory, setSelectedDocumentIdForHistory] = useState<string | null>(null);

  const [isAccessLogsDialogOpen, setIsAccessLogsDialogOpen] = useState(false);
  const [selectedDocumentIdForLogs, setSelectedDocumentIdForLogs] = useState<string | null>(null);

  // Templates state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Documents queries
  const { data, isLoading } = useQuery<{ documents: Document[] }>({
    queryKey: ['/api/documents', searchTerm, documentType, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (documentType && documentType !== 'all') params.append('documentType', documentType);
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/documents?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  const documents = data?.documents || [];

  // Pagination logic
  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = documents.slice(startIndex, endIndex);

  const { data: versions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ['/api/admin/documents', selectedDocumentIdForHistory, 'versions'],
    enabled: !!selectedDocumentIdForHistory,
    initialData: [],
  });

  const { data: accessLogsData, isLoading: isLoadingAccessLogs } = useQuery<{ logs: AccessLog[] }>({
    queryKey: ['/api/documents', selectedDocumentIdForLogs, 'logs'],
    enabled: !!selectedDocumentIdForLogs,
    queryFn: async () => {
      if (!selectedDocumentIdForLogs) return { logs: [] };
      const response = await fetch(`/api/documents/${selectedDocumentIdForLogs}/logs`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch access logs');
      return response.json();
    }
  });

  const accessLogs = accessLogsData?.logs || [];

  // Templates queries
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/admin/templates', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === 'all'
        ? '/api/admin/templates'
        : `/api/admin/templates?category=${selectedCategory}`;
      const res = await apiRequest('GET', url);
      return res.json();
    },
  });

  const templates = templatesData?.templates || [];

  // Template mutations
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

  const handleDownload = async (doc: Document) => {
    try {
      const tokenResponse = await fetch(`/api/documents/${doc.id}/token`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get download token');
      }

      const { token } = await tokenResponse.json();
      window.open(`/api/documents/${doc.id}/download?token=${token}`, '_blank');
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تنزيل المستند' : 'Failed to download document',
        variant: 'destructive'
      });
    }
  };

  const handleViewHistory = (docId: string) => {
    setSelectedDocumentIdForHistory(docId);
    setIsVersionHistoryDialogOpen(true);
  };

  const handleViewAccessLogs = (docId: string) => {
    setSelectedDocumentIdForLogs(docId);
    setIsAccessLogsDialogOpen(true);
  };

  // Helper functions for document table
  const handleDownloadDocument = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      handleDownload(doc);
    }
  };

  const handleViewDocument = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      window.open(doc.fileUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      price_offer: { en: 'Price Offer', ar: 'عرض سعر' },
      order: { en: 'Order', ar: 'طلب' },
      invoice: { en: 'Invoice', ar: 'فاتورة' },
      contract: { en: 'Contract', ar: 'عقد' },
      lta_document: { en: 'LTA Document', ar: 'مستند اتفاقية' },
    };
    return labels[type]?.[language] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      price_offer: 'bg-blue-500/10 text-blue-700 border-blue-200',
      order: 'bg-green-500/10 text-green-700 border-green-200',
      invoice: 'bg-purple-500/10 text-purple-700 border-purple-200',
      contract: 'bg-orange-500/10 text-orange-700 border-orange-200',
      lta_document: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-700 border-gray-200';
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 sm:h-10 sm:w-10"
              data-testid="button-back"
            >
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                {language === 'ar' ? 'مكتبة المستندات' : 'Document Library'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {language === 'ar'
                  ? 'إدارة المستندات والقوالب'
                  : 'Manage documents and templates'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="documents" data-testid="tab-documents">
              <FileText className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'المستندات' : 'Documents'}
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <Edit className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'القوالب' : 'Templates'}
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  {language === 'ar' ? 'إدارة المستندات' : 'Document Management'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search"
                    />
                  </div>

                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue placeholder={language === 'ar' ? 'نوع المستند' : 'Document Type'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                      <SelectItem value="price_offer">{getDocumentTypeLabel('price_offer')}</SelectItem>
                      <SelectItem value="order">{getDocumentTypeLabel('order')}</SelectItem>
                      <SelectItem value="invoice">{getDocumentTypeLabel('invoice')}</SelectItem>
                      <SelectItem value="contract">{getDocumentTypeLabel('contract')}</SelectItem>
                      <SelectItem value="lta_document">{getDocumentTypeLabel('lta_document')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'}
                      data-testid="input-start-date"
                    />
                  </div>

                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                    data-testid="input-end-date"
                  />
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:shadow-lg transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold" data-testid="text-total-documents">{documents.length}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'إجمالي المستندات' : 'Total Documents'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:shadow-lg transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold" data-testid="text-storage-used">
                        {formatFileSize(documents.reduce((sum: number, doc: Document) => sum + doc.fileSize, 0))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'المساحة المستخدمة' : 'Storage Used'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:shadow-lg transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold" data-testid="text-total-views">
                        {documents.reduce((sum: number, doc: Document) => sum + (doc.viewCount || 0), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:shadow-lg transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold" data-testid="text-filtered-docs">
                        {documents.filter((d: Document) => (documentType && documentType !== 'all') ? d.documentType === documentType : true).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'المستندات المفلترة' : 'Filtered Docs'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Documents Table/List */}
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <LoadingSkeleton key={i} variant="card" />
                    ))}
                  </div>
                ) : documents.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={language === 'ar' ? 'لا توجد مستندات' : 'No documents found'}
                    description={language === 'ar' ? 'جرب تعديل الفلاتر الخاصة بك.' : 'Try adjusting your filters'}
                  />
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedDocuments.map((doc: Document) => (
                        <Card key={doc.id} className="p-4 hover:bg-muted/50" data-testid={`row-document-${doc.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                <h3 className="font-medium truncate">{doc.fileName.split('/').pop()}</h3>
                                <Badge variant="outline" className={getDocumentTypeColor(doc.documentType)}>
                                  {getDocumentTypeLabel(doc.documentType)}
                                </Badge>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                <p>{language === 'ar' ? 'النوع' : 'Type'}: {getDocumentTypeLabel(doc.documentType)}</p>
                                <p>{language === 'ar' ? 'معرف الطلب' : 'Order ID'}: {doc.orderId || 'N/A'}</p>
                                <p>{language === 'ar' ? 'العميل' : 'Client'}: {doc.clientId || 'N/A'}</p>
                                <p>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}: {format(new Date(doc.createdAt), 'PPp')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                title={language === 'ar' ? 'تنزيل' : 'Download'}
                                data-testid={`button-download-${doc.id}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewHistory(doc.id)}
                                title={language === 'ar' ? 'سجل الإصدارات' : 'Version History'}
                                data-testid={`button-history-${doc.id}`}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAccessLogs(doc.id)}
                                title={language === 'ar' ? 'سجلات الوصول' : 'Access Logs'}
                                data-testid={`button-logs-${doc.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      itemsPerPage={itemsPerPage}
                      totalItems={documents.length}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {language === 'ar' ? 'إدارة القوالب' : 'Template Management'}
                </h2>
                <p className="text-muted-foreground">
                  {language === 'ar'
                    ? 'تصميم وتخصيص قوالب المستندات الاحترافية'
                    : 'Design and customize professional document templates'}
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingTemplate(null);
                  setCreateDialogOpen(true);
                }}
                size={isMobile ? "sm" : "default"}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                data-testid="button-new-template"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                {!isMobile && (language === 'ar' ? 'قالب جديد' : 'New Template')}
              </Button>
            </div>

            {/* Template Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold" data-testid="text-total-templates">
                    {templates?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي القوالب' : 'Total Templates'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold" data-testid="text-active-templates">
                    {templates?.filter((t: any) => t.isActive).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'قوالب نشطة' : 'Active Templates'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold" data-testid="text-category-count">
                    {selectedCategory === 'all' 
                      ? categories.length - 1 
                      : templates?.filter((t: any) => t.category === selectedCategory).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCategory === 'all' 
                      ? (language === 'ar' ? 'التصنيفات' : 'Categories')
                      : (language === 'ar' ? 'في هذا التصنيف' : 'In Category')}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold" data-testid="text-default-templates">
                    {templates?.filter((t: any) => t.isDefault).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'القوالب الافتراضية' : 'Default Templates'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-muted/50">
                {categories.map(cat => (
                  <TabsTrigger
                    key={cat.value}
                    value={cat.value}
                    className="text-xs sm:text-sm whitespace-nowrap min-h-[44px] px-3 sm:px-4"
                    data-testid={`tab-category-${cat.value}`}
                  >
                    {language === 'ar' ? cat.labelAr : cat.labelEn}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {cat.value === 'all' 
                        ? templates?.length || 0
                        : templates?.filter((t: any) => t.category === cat.value).length || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {isLoadingTemplates ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'جاري تحميل القوالب...' : 'Loading templates...'}
                    </p>
                  </div>
                </div>
              ) : !templates || templates.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={language === 'ar' ? 'لا توجد قوالب' : 'No templates found'}
                  description={
                    language === 'ar'
                      ? 'ابدأ بإنشاء قالب جديد لمستنداتك'
                      : 'Start by creating a new template for your documents'
                  }
                  actionLabel={language === 'ar' ? 'إنشاء قالب' : 'Create Template'}
                  onAction={() => {
                    setEditingTemplate(null);
                    setCreateDialogOpen(true);
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {templates?.map((template: any, index: number) => (
                    <Card
                      key={template.id}
                      className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                      data-testid={`card-template-${template.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-primary/10">
                                <FileText className="h-4 w-4 text-primary shrink-0" />
                              </div>
                              <CardTitle className="text-sm sm:text-base truncate font-semibold">
                                {template.name}
                              </CardTitle>
                            </div>
                            <CardDescription className="text-xs line-clamp-2 mt-1">
                              {template.description}
                            </CardDescription>
                            {/* Template metadata */}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Badge
                                variant={template.isActive ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {template.isActive
                                  ? (language === 'ar' ? 'نشط' : 'Active')
                                  : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                              </Badge>
                              {template.language && (
                                <Badge variant="outline" className="text-xs">
                                  {template.language === 'both' 
                                    ? (language === 'ar' ? 'ثنائي اللغة' : 'Bilingual')
                                    : template.language === 'ar' ? 'عربي' : 'English'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-h-[44px]"
                            onClick={() => {
                              setPreviewTemplate(template);
                              setPreviewDialogOpen(true);
                            }}
                            data-testid={`button-preview-${template.id}`}
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">{language === 'ar' ? 'معاينة' : 'Preview'}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-h-[44px]"
                            onClick={() => {
                              setEditingTemplate(template);
                              setCreateDialogOpen(true);
                            }}
                            data-testid={`button-edit-${template.id}`}
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                          </Button>
                        </div>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-h-[44px]"
                            onClick={() => {
                              const newName = `${template.name} (نسخة)`;
                              duplicateMutation.mutate({ id: template.id, name: newName });
                            }}
                            data-testid={`button-duplicate-${template.id}`}
                          >
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">{language === 'ar' ? 'نسخ' : 'Copy'}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] min-w-[44px] hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => deleteMutation.mutate(template.id)}
                            data-testid={`button-delete-${template.id}`}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Version History Dialog */}
      <Dialog open={isVersionHistoryDialogOpen} onOpenChange={setIsVersionHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'سجل إصدارات المستند' : 'Document Version History'}</DialogTitle>
            <DialogDescription>{language === 'ar' ? 'عرض جميع الإصدارات لهذا المستند.' : 'View all versions of this document.'}</DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'رقم الإصدار' : 'Version'}</TableHead>
                <TableHead>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</TableHead>
                <TableHead>{language === 'ar' ? 'اسم الملف' : 'File Name'}</TableHead>
                <TableHead>{language === 'ar' ? 'الحجم' : 'Size'}</TableHead>
                <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingVersions ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32">
                    {language === 'ar' ? 'جاري تحميل الإصدارات...' : 'Loading versions...'}
                  </TableCell>
                </TableRow>
              ) : versions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32">
                    {language === 'ar' ? 'لا توجد سجلات إصدارات لهذا المستند.' : 'No version history found for this document.'}
                  </TableCell>
                </TableRow>
              ) : (
                versions.map((version: Version) => (
                  <TableRow key={version.id}>
                    <TableCell>{version.versionNumber}</TableCell>
                    <TableCell>{format(new Date(version.createdAt), 'PPp')}</TableCell>
                    <TableCell className="max-w-xs truncate">{version.fileName.split('/').pop()}</TableCell>
                    <TableCell>{formatFileSize(version.fileSize)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/api/pdf/download/${version.fileUrl}`, '_blank')} title={language === 'ar' ? 'تنزيل' : 'Download'}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVersionHistoryDialogOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Logs Dialog */}
      <Dialog open={isAccessLogsDialogOpen} onOpenChange={setIsAccessLogsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'سجلات وصول المستند' : 'Document Access Logs'}</DialogTitle>
            <DialogDescription>{language === 'ar' ? 'عرض جميع سجلات الوصول لهذا المستند.' : 'View all access logs for this document.'}</DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                <TableHead>{language === 'ar' ? 'الإجراء' : 'Action'}</TableHead>
                <TableHead>{language === 'ar' ? 'التاريخ والوقت' : 'Timestamp'}</TableHead>
                <TableHead>{language === 'ar' ? 'عنوان IP' : 'IP Address'}</TableHead>
                <TableHead>{language === 'ar' ? 'وكيل المستخدم' : 'User Agent'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAccessLogs ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32">
                    {language === 'ar' ? 'جاري تحميل السجلات...' : 'Loading logs...'}
                  </TableCell>
                </TableRow>
              ) : accessLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32">
                    {language === 'ar' ? 'لا توجد سجلات وصول لهذا المستند.' : 'No access logs found for this document.'}
                  </TableCell>
                </TableRow>
              ) : (
                accessLogs.map((log: AccessLog) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{format(new Date(log.timestamp), 'PPp')}</TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.userAgent}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessLogsDialogOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'معاينة القالب' : 'Template Preview'}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate && previewTemplate.name}
            </DialogDescription>
          </DialogHeader>

          {previewTemplate ? (
            <div className="space-y-6">
              {/* Template Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {language === 'ar' ? 'معلومات أساسية' : 'Basic Information'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">{language === 'ar' ? 'الاسم:' : 'Name:'}</span>
                      <span className="font-medium">{previewTemplate.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">{language === 'ar' ? 'التصنيف:' : 'Category:'}</span>
                      <Badge variant="outline">{previewTemplate.category || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">{language === 'ar' ? 'اللغة:' : 'Language:'}</span>
                      <Badge variant="outline">
                        {previewTemplate.language === 'both' 
                          ? (language === 'ar' ? 'ثنائي اللغة' : 'Bilingual')
                          : previewTemplate.language === 'ar' ? 'عربي' : 'English'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
                      <Badge variant={previewTemplate.isActive ? 'default' : 'secondary'}>
                        {previewTemplate.isActive
                          ? (language === 'ar' ? 'نشط' : 'Active')
                          : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground font-medium block mb-1">
                        {language === 'ar' ? 'الوصف:' : 'Description:'}
                      </span>
                      <p className="text-sm bg-muted/50 p-2 rounded">
                        {previewTemplate.description || (language === 'ar' ? 'لا يوجد وصف' : 'No description')}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Template Structure */}
              {previewTemplate.structure && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {language === 'ar' ? 'بنية القالب' : 'Template Structure'}
                  </h4>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <pre className="text-xs overflow-auto max-h-[400px] bg-background p-3 rounded border">
                        {JSON.stringify(
                          typeof previewTemplate.structure === 'string'
                            ? JSON.parse(previewTemplate.structure)
                            : previewTemplate.structure,
                          null,
                          2
                        )}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Template Styles */}
              {previewTemplate.styles && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {language === 'ar' ? 'التنسيقات' : 'Styles'}
                  </h4>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <pre className="text-xs overflow-auto max-h-[200px] bg-background p-3 rounded border">
                        {JSON.stringify(
                          typeof previewTemplate.styles === 'string'
                            ? JSON.parse(previewTemplate.styles)
                            : previewTemplate.styles,
                          null,
                          2
                        )}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ar' ? 'لا توجد بيانات للمعاينة' : 'No preview data available'}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
            {previewTemplate && (
              <Button
                onClick={() => {
                  setPreviewDialogOpen(false);
                  setEditingTemplate(previewTemplate);
                  setCreateDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تعديل القالب' : 'Edit Template'}
              </Button>
            )}
          </DialogFooter>
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