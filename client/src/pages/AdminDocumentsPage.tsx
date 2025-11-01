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


  const handleViewHistory = (docId: string) => {
    setSelectedDocumentIdForHistory(docId);
    setIsVersionHistoryDialogOpen(true);
  };

  const handleViewAccessLogs = (docId: string) => {
    setSelectedDocumentIdForLogs(docId);
    setIsAccessLogsDialogOpen(true);
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
                  ? 'إدارة المستندات'
                  : 'Manage documents'}
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
          <TabsList className="grid w-full grid-cols-1 max-w-md">
            <TabsTrigger value="documents" data-testid="tab-documents">
              <FileText className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'المستندات' : 'Documents'}
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
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-total-documents">{documents.length}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {language === 'ar' ? 'إجمالي المستندات' : 'Total Documents'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-800/50 hover:shadow-lg transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="text-storage-used">
                        {formatFileSize(documents.reduce((sum: number, doc: Document) => sum + doc.fileSize, 0))}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {language === 'ar' ? 'المساحة المستخدمة' : 'Storage Used'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800/50 hover:shadow-lg transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="text-total-views">
                        {documents.reduce((sum: number, doc: Document) => sum + (doc.viewCount || 0), 0)}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        {language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-800/50 hover:shadow-lg transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-900 dark:text-orange-100" data-testid="text-filtered-docs">
                        {documents.filter((d: Document) => (documentType && documentType !== 'all') ? d.documentType === documentType : true).length}
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300">
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
            <Button variant="outline" onClick={() => setIsAccessLogsDialogOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
