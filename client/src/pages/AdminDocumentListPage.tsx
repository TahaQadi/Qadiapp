
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Download, FileText, Calendar as CalendarIcon, Filter, X, Search, User, FileCode } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  documentType: 'price_offer' | 'order' | 'invoice' | 'contract' | 'lta_document';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  viewCount: number;
  createdAt: string;
  metadata?: {
    templateId?: string;
    templateName?: string;
    clientName?: string;
    clientId?: string;
    generatedBy?: string;
    generatedAt?: string;
  };
}

interface Template {
  id: string;
  name: string;
  nameAr: string;
  documentType: string;
}

export default function AdminDocumentListPage() {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Fetch documents
  const { data: documentsResponse, isLoading: loadingDocuments } = useQuery<{ documents: Document[] }>({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const response = await fetch('/api/documents', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });
  const documents = documentsResponse?.documents || [];

  // Fetch templates for filter
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['/api/admin/templates'],
  });

  // Extract unique clients from documents
  const uniqueClients = useMemo(() => {
    const clients = new Map<string, string>();
    documents.forEach(doc => {
      if (doc.metadata?.clientId && doc.metadata?.clientName) {
        clients.set(doc.metadata.clientId, doc.metadata.clientName);
      }
    });
    return Array.from(clients.entries()).map(([id, name]) => ({ id, name }));
  }, [documents]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Search filter (filename or client name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesFileName = doc.fileName.toLowerCase().includes(query);
        const matchesClient = doc.metadata?.clientName?.toLowerCase().includes(query);
        if (!matchesFileName && !matchesClient) return false;
      }

      // Type filter
      if (selectedType !== 'all' && doc.documentType !== selectedType) {
        return false;
      }

      // Client filter
      if (selectedClient !== 'all' && doc.metadata?.clientId !== selectedClient) {
        return false;
      }

      // Template filter
      if (selectedTemplate !== 'all' && doc.metadata?.templateId !== selectedTemplate) {
        return false;
      }

      // Date range filter
      if (dateFrom) {
        const docDate = new Date(doc.createdAt);
        if (docDate < dateFrom) return false;
      }
      if (dateTo) {
        const docDate = new Date(doc.createdAt);
        if (docDate > dateTo) return false;
      }

      return true;
    });
  }, [documents, searchQuery, selectedType, selectedClient, selectedTemplate, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedClient('all');
    setSelectedTemplate('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedType !== 'all') count++;
    if (selectedClient !== 'all') count++;
    if (selectedTemplate !== 'all') count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [searchQuery, selectedType, selectedClient, selectedTemplate, dateFrom, dateTo]);

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(doc.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast({
        title: language === 'ar' ? 'تم التنزيل' : 'Downloaded',
        description: language === 'ar' 
          ? 'تم تنزيل المستند بنجاح' 
          : 'Document downloaded successfully',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'فشل تنزيل المستند' 
          : 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      price_offer: { en: 'Price Offer', ar: 'عرض سعر' },
      order: { en: 'Order', ar: 'طلب' },
      invoice: { en: 'Invoice', ar: 'فاتورة' },
      contract: { en: 'Contract', ar: 'عقد' },
      lta_document: { en: 'LTA Document', ar: 'وثيقة اتفاقية' },
    };
    return language === 'ar' ? labels[type]?.ar : labels[type]?.en;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      price_offer: 'bg-blue-500',
      order: 'bg-green-500',
      invoice: 'bg-purple-500',
      contract: 'bg-orange-500',
      lta_document: 'bg-pink-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loadingDocuments) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={language === 'ar' ? 'المستندات المُنشأة' : 'Generated Documents'}
        subtitle={language === 'ar' 
          ? `${filteredDocuments.length} من ${documents.length} مستند` 
          : `${filteredDocuments.length} of ${documents.length} documents`}
        showLogo={true}
        actions={
          <>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {language === 'ar' ? 'الفلاتر' : 'Filters'}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <LanguageToggle />
            <ThemeToggle />
          </>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 relative z-10">

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {language === 'ar' ? 'تصفية المستندات' : 'Filter Documents'}
              </CardTitle>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  {language === 'ar' ? 'مسح الكل' : 'Clear All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {language === 'ar' ? 'البحث' : 'Search'}
              </Label>
              <Input
                placeholder={language === 'ar' ? 'اسم الملف أو العميل...' : 'Filename or client...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {language === 'ar' ? 'نوع المستند' : 'Document Type'}
              </Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'ar' ? 'جميع الأنواع' : 'All Types'}
                  </SelectItem>
                  <SelectItem value="price_offer">{getDocumentTypeLabel('price_offer')}</SelectItem>
                  <SelectItem value="order">{getDocumentTypeLabel('order')}</SelectItem>
                  <SelectItem value="invoice">{getDocumentTypeLabel('invoice')}</SelectItem>
                  <SelectItem value="contract">{getDocumentTypeLabel('contract')}</SelectItem>
                  <SelectItem value="lta_document">{getDocumentTypeLabel('lta_document')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {language === 'ar' ? 'العميل' : 'Client'}
              </Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'ar' ? 'جميع العملاء' : 'All Clients'}
                  </SelectItem>
                  {uniqueClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                {language === 'ar' ? 'القالب' : 'Template'}
              </Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'ar' ? 'جميع القوالب' : 'All Templates'}
                  </SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {language === 'ar' ? template.nameAr : template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {language === 'ar' ? 'من تاريخ' : 'From Date'}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PPP') : (
                      <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {language === 'ar' ? 'إلى تاريخ' : 'To Date'}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PPP') : (
                      <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {language === 'ar' ? 'لا توجد مستندات' : 'No documents found'}
            </p>
            <p className="text-muted-foreground mt-1">
              {activeFiltersCount > 0
                ? (language === 'ar' ? 'جرب تعديل الفلاتر' : 'Try adjusting your filters')
                : (language === 'ar' ? 'لم يتم إنشاء أي مستندات بعد' : 'No documents have been generated yet')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {document.fileName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {formatDate(document.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge className={getDocumentTypeColor(document.documentType)}>
                    {getDocumentTypeLabel(document.documentType)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Metadata */}
                <div className="space-y-2 text-sm">
                  {document.metadata?.clientName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="truncate">{document.metadata.clientName}</span>
                    </div>
                  )}
                  {document.metadata?.templateName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileCode className="h-4 w-4" />
                      <span className="truncate">{document.metadata.templateName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span>{document.viewCount} {language === 'ar' ? 'مشاهدة' : 'views'}</span>
                  </div>
                </div>

                {/* Actions */}
                <Button
                  onClick={() => handleDownload(document)}
                  className="w-full gap-2"
                >
                  <Download className="h-4 w-4" />
                  {language === 'ar' ? 'تنزيل' : 'Download'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </PageLayout>
  );
}
