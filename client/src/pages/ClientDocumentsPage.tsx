import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Calendar, 
  Eye, 
  ArrowLeft, 
  User, 
  LogOut, 
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationCenter } from '@/components/NotificationCenter';
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

interface DocumentRequest {
  documentType: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export default function ClientDocumentsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [documentType, setDocumentType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [requestForm, setRequestForm] = useState<DocumentRequest>({
    documentType: 'price_offer',
    description: '',
    priority: 'medium'
  });

  // Fetch documents
  const { data: documentsData, isLoading, error } = useQuery<{
    documents: Document[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>({
    queryKey: ['/api/documents', searchTerm, documentType, startDate, endDate, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (documentType && documentType !== 'all') params.append('type', documentType);
      if (searchTerm) params.append('search', searchTerm);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', currentPage.toString());
      params.append('pageSize', itemsPerPage.toString());

      const response = await fetch(`/api/documents?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  const documents = documentsData?.documents || [];
  const totalCount = documentsData?.totalCount || 0;
  const totalPages = documentsData?.totalPages || 1;


  // Document request mutation
  const requestMutation = useMutation({
    mutationFn: async (data: DocumentRequest) => {
      const res = await apiRequest('POST', '/api/documents/request', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إرسال الطلب' : 'Request Sent',
        description: language === 'ar' ? 'تم إرسال طلب المستند بنجاح' : 'Document request sent successfully'
      });
      setRequestDialogOpen(false);
      setRequestForm({
        documentType: 'price_offer',
        description: '',
        priority: 'medium'
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل إرسال الطلب' : 'Failed to send request'),
        variant: 'destructive'
      });
    }
  });


  const handlePreview = (document: Document) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
  };

  const handleRequestDocument = () => {
    if (!requestForm.description.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال وصف للمستند المطلوب' : 'Please enter a description for the requested document',
        variant: 'destructive'
      });
      return;
    }
    requestMutation.mutate(requestForm);
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

  const documentTypes = [
    { value: 'all', labelEn: 'All Documents', labelAr: 'جميع المستندات' },
    { value: 'price_offer', labelEn: 'Price Offers', labelAr: 'عروض الأسعار' },
    { value: 'order', labelEn: 'Orders', labelAr: 'الطلبات' },
    { value: 'invoice', labelEn: 'Invoices', labelAr: 'الفواتير' },
    { value: 'contract', labelEn: 'Contracts', labelAr: 'العقود' },
    { value: 'lta_document', labelEn: 'LTA Documents', labelAr: 'مستندات الاتفاقية' },
  ];

  const requestTypes = [
    { value: 'price_offer', labelEn: 'Price Offer', labelAr: 'عرض سعر' },
    { value: 'order', labelEn: 'Order Confirmation', labelAr: 'تأكيد الطلب' },
    { value: 'invoice', labelEn: 'Invoice', labelAr: 'فاتورة' },
    { value: 'contract', labelEn: 'Contract', labelAr: 'عقد' },
    { value: 'lta_document', labelEn: 'LTA Document', labelAr: 'مستند اتفاقية' },
    { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
  ];

  const priorityLevels = [
    { value: 'low', labelEn: 'Low', labelAr: 'منخفض', color: 'text-green-600' },
    { value: 'medium', labelEn: 'Medium', labelAr: 'متوسط', color: 'text-yellow-600' },
    { value: 'high', labelEn: 'High', labelAr: 'عالي', color: 'text-red-600' },
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
              className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-all duration-300"
              title={language === 'ar' ? 'العودة للطلبات' : 'Back to Ordering'}
            >
              <Link href="/ordering">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                {language === 'ar' ? 'مستنداتي' : 'My Documents'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {language === 'ar'
                  ? 'عرض وتنزيل المستندات الخاصة بك'
                  : 'View and download your documents'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
              asChild
            >
              <Link href="/profile">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
              asChild
            >
              <Link href="/logout">
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'المستندات' : 'Documents'}
            </TabsTrigger>
            <TabsTrigger value="request">
              <AlertCircle className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'طلب مستند' : 'Request Document'}
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  {language === 'ar' ? 'مستنداتي' : 'My Documents'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'عرض وتنزيل جميع المستندات المتاحة لك'
                    : 'View and download all documents available to you'}
                </CardDescription>
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
                    />
                  </div>

                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'نوع المستند' : 'Document Type'} />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === 'ar' ? type.labelAr : type.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'}
                    />
                  </div>

                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                  />
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{totalCount}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'إجمالي المستندات' : 'Total Documents'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {documents.reduce((sum, doc) => sum + (doc.viewCount || 0), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {formatFileSize(documents.reduce((sum, doc) => sum + doc.fileSize, 0))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'المساحة المستخدمة' : 'Storage Used'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {documents.filter(d => d.documentType === documentType || documentType === 'all').length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'المستندات المفلترة' : 'Filtered Docs'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Documents List */}
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <LoadingSkeleton key={i} variant="card" />
                    ))}
                  </div>
                ) : error ? (
                  <EmptyState
                    icon={AlertCircle}
                    title={language === 'ar' ? 'خطأ في التحميل' : 'Loading Error'}
                    description={language === 'ar' ? 'حدث خطأ أثناء تحميل المستندات' : 'An error occurred while loading documents'}
                    actionLabel={language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                    onAction={() => queryClient.invalidateQueries({ queryKey: ['/api/documents'] })}
                  />
                ) : documents.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={language === 'ar' ? 'لا توجد مستندات' : 'No documents found'}
                    description={language === 'ar' ? 'جرب تعديل الفلاتر الخاصة بك.' : 'Try adjusting your filters.'}
                  />
                ) : (
                  <>
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <Card key={doc.id} className="p-4 hover:bg-muted/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                <h3 className="font-medium truncate">{doc.fileName}</h3>
                                <Badge variant="outline" className={getDocumentTypeColor(doc.documentType)}>
                                  {getDocumentTypeLabel(doc.documentType)}
                                </Badge>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                <p>{language === 'ar' ? 'النوع' : 'Type'}: {getDocumentTypeLabel(doc.documentType)}</p>
                                <p>{language === 'ar' ? 'الحجم' : 'Size'}: {formatFileSize(doc.fileSize)}</p>
                                <p>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}: {format(new Date(doc.createdAt), 'PPp')}</p>
                                {doc.viewCount && (
                                  <p>{language === 'ar' ? 'المشاهدات' : 'Views'}: {doc.viewCount}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(doc)}
                                title={language === 'ar' ? 'معاينة' : 'Preview'}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={totalCount}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Request Document Tab */}
          <TabsContent value="request" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-6 w-6" />
                  {language === 'ar' ? 'طلب مستند جديد' : 'Request New Document'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'اطلب مستنداً جديداً من فريق الإدارة'
                    : 'Request a new document from the admin team'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {language === 'ar' ? 'نوع المستند' : 'Document Type'}
                    </label>
                    <Select
                      value={requestForm.documentType}
                      onValueChange={(value) => setRequestForm(prev => ({ ...prev, documentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {requestTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {language === 'ar' ? type.labelAr : type.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {language === 'ar' ? 'الأولوية' : 'Priority'}
                    </label>
                    <Select
                      value={requestForm.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        setRequestForm(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <span className={level.color}>
                              {language === 'ar' ? level.labelAr : level.labelEn}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {language === 'ar' ? 'وصف المستند المطلوب' : 'Description of Required Document'}
                  </label>
                  <textarea
                    className="w-full min-h-[100px] p-3 border border-input rounded-md resize-none"
                    placeholder={language === 'ar' 
                      ? 'يرجى وصف المستند المطلوب بالتفصيل...' 
                      : 'Please describe the required document in detail...'}
                    value={requestForm.description}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleRequestDocument}
                  disabled={requestMutation.isPending || !requestForm.description.trim()}
                  className="w-full"
                >
                  {requestMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'إرسال الطلب' : 'Send Request'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'معاينة المستند' : 'Document Preview'}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.fileName}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {language === 'ar' ? 'معلومات المستند' : 'Document Information'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">{language === 'ar' ? 'النوع:' : 'Type:'}</span>
                      <Badge variant="outline">{getDocumentTypeLabel(selectedDocument.documentType)}</Badge>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">{language === 'ar' ? 'الحجم:' : 'Size:'}</span>
                      <span className="font-medium">{formatFileSize(selectedDocument.fileSize)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">{language === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'}</span>
                      <span className="font-medium">{format(new Date(selectedDocument.createdAt), 'PPp')}</span>
                    </div>
                    {selectedDocument.viewCount && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">{language === 'ar' ? 'المشاهدات:' : 'Views:'}</span>
                        <span className="font-medium">{selectedDocument.viewCount}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    {language === 'ar' ? 'الإجراءات' : 'Actions'}
                  </h4>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}