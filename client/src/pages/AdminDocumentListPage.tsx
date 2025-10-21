
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Search, Filter, Eye, Trash2, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  clientId?: string;
  fileSize: number;
  viewCount?: number;
  createdAt: string;
}

export default function AdminDocumentListPage() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [documentType, setDocumentType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch clients for client filter
  const { data: clientsData } = useQuery({
    queryKey: ['/api/admin/clients'],
    queryFn: async () => {
      const response = await fetch('/api/admin/clients', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    }
  });

  // Fetch templates for template filter
  const { data: templatesData } = useQuery({
    queryKey: ['/api/admin/templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/templates', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  const { data, isLoading } = useQuery<{ documents: Document[] }>({
    queryKey: ['/api/documents', searchTerm, documentType, startDate, endDate, clientFilter, statusFilter, templateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (documentType && documentType !== 'all') params.append('documentType', documentType);
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (clientFilter && clientFilter !== 'all') params.append('clientId', clientFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (templateFilter && templateFilter !== 'all') params.append('templateId', templateFilter);

      const response = await fetch(`/api/documents?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف المستند بنجاح' : 'Document deleted successfully',
      });
    }
  });

  const allDocuments = data?.documents || [];
  const clients = clientsData || [];
  const templates = templatesData || [];
  
  // Client-side filtering for additional criteria
  const documents = allDocuments.filter(doc => {
    // Client filter
    if (clientFilter !== 'all' && doc.clientId !== clientFilter) return false;
    
    // Status filter (if metadata contains status)
    if (statusFilter !== 'all' && doc.metadata) {
      const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
      if (metadata.status !== statusFilter) return false;
    }
    
    // Template filter (if metadata contains templateId)
    if (templateFilter !== 'all' && doc.metadata) {
      const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
      if (metadata.templateId !== templateFilter) return false;
    }
    
    return true;
  });
  
  // Pagination
  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const paginatedDocuments = documents.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Reset to page 1 when filters change
  const resetPage = () => setPage(1);
  
  // Count active filters
  const activeFiltersCount = [
    searchTerm,
    documentType !== 'all',
    startDate,
    endDate,
    clientFilter !== 'all',
    statusFilter !== 'all',
    templateFilter !== 'all'
  ].filter(Boolean).length;

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = async (doc: Document) => {
    try {
      const tokenResponse = await fetch(`/api/documents/${doc.id}/token`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!tokenResponse.ok) throw new Error('Failed to get download token');

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'إدارة المستندات' : 'Document Management'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {language === 'ar' ? 'جميع المستندات' : 'All Documents'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {language === 'ar' ? 'الفلاتر' : 'Filters'}
                </h3>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setDocumentType('all');
                      setStartDate('');
                      setEndDate('');
                      setClientFilter('all');
                      setStatusFilter('all');
                      setTemplateFilter('all');
                      resetPage();
                    }}
                  >
                    {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'} ({activeFiltersCount})
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      resetPage();
                    }}
                  />
                </div>

                {/* Document Type */}
                <Select value={documentType} onValueChange={(value) => {
                  setDocumentType(value);
                  resetPage();
                }}>
                  <SelectTrigger>
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

                {/* Client Filter */}
                <Select value={clientFilter} onValueChange={(value) => {
                  setClientFilter(value);
                  resetPage();
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'العميل' : 'Client'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع العملاء' : 'All Clients'}</SelectItem>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {language === 'ar' ? client.nameAr : client.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Template Filter */}
                <Select value={templateFilter} onValueChange={(value) => {
                  setTemplateFilter(value);
                  resetPage();
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'القالب' : 'Template'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع القوالب' : 'All Templates'}</SelectItem>
                    {templates.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {language === 'ar' ? template.nameAr : template.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Range - Start */}
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    resetPage();
                  }}
                  placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'}
                />

                {/* Date Range - End */}
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    resetPage();
                  }}
                  placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                />

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  resetPage();
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
                    <SelectItem value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                    <SelectItem value="sent">{language === 'ar' ? 'مرسل' : 'Sent'}</SelectItem>
                    <SelectItem value="viewed">{language === 'ar' ? 'تمت المشاهدة' : 'Viewed'}</SelectItem>
                    <SelectItem value="accepted">{language === 'ar' ? 'مقبول' : 'Accepted'}</SelectItem>
                    <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Documents Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'اسم الملف' : 'File Name'}</TableHead>
                    <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الحجم' : 'Size'}</TableHead>
                    <TableHead>{language === 'ar' ? 'المشاهدات' : 'Views'}</TableHead>
                    <TableHead>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
                    <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        {language === 'ar' ? 'لا توجد مستندات' : 'No documents found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.fileName.split('/').pop()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getDocumentTypeLabel(doc.documentType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                        <TableCell>{doc.viewCount || 0}</TableCell>
                        <TableCell>
                          {format(new Date(doc.createdAt), 'PPp')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? `عرض ${(page - 1) * itemsPerPage + 1}-${Math.min(page * itemsPerPage, documents.length)} من ${documents.length}`
                    : `Showing ${(page - 1) * itemsPerPage + 1}-${Math.min(page * itemsPerPage, documents.length)} of ${documents.length}`
                  }
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <div key={p} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={page === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(p)}
                            className="min-w-[2.5rem]"
                          >
                            {p}
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    {language === 'ar' ? 'التالي' : 'Next'}
                  </Button>
                </div>
              </div>
            )}

            {/* Stats */}
            {!isLoading && documents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{documents.length}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'إجمالي المستندات' : 'Total Documents'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {documents.reduce((sum, doc) => sum + (doc.viewCount || 0), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {documents.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'المستندات المفلترة' : 'Filtered Documents'}
                      {activeFiltersCount > 0 && (
                        <span className="ms-1">({activeFiltersCount} {language === 'ar' ? 'فلتر' : 'filters'})</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
