
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Search, Filter, Eye, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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

export default function AdminDocumentsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/admin/documents/search', { searchTerm, documentType, startDate, endDate }],
  });

  const trackViewMutation = useMutation({
    mutationFn: async (docId: string) => {
      const doc = documents.find((d: Document) => d.id === docId);
      if (!doc) return;

      await fetch(`/api/admin/documents/${docId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          metadata: {
            ...doc.metadata,
            viewCount: (doc.viewCount || 0) + 1,
            lastViewedAt: new Date().toISOString()
          }
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents/search'] });
    }
  });

  const handleDownload = async (doc: Document) => {
    try {
      trackViewMutation.mutate(doc.id);
      window.open(`/api/pdf/download/${doc.fileUrl}`, '_blank');
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تنزيل المستند' : 'Failed to download document',
        variant: 'destructive'
      });
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
    <div className="container mx-auto p-6 max-w-7xl">
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
              />
            </div>
            
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'نوع المستند' : 'Document Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
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
                <div className="text-2xl font-bold">{documents.length}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي المستندات' : 'Total Documents'}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {formatFileSize(documents.reduce((sum: number, doc: Document) => sum + doc.fileSize, 0))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'المساحة المستخدمة' : 'Storage Used'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {documents.reduce((sum: number, doc: Document) => sum + (doc.viewCount || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {documents.filter((d: Document) => documentType ? d.documentType === documentType : true).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'المستندات المفلترة' : 'Filtered Docs'}
                </div>
              </CardContent>
            </Card>
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
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32">
                      {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-muted-foreground">
                        {language === 'ar' ? 'لا توجد مستندات' : 'No documents found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc: Document) => (
                    <TableRow key={doc.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium max-w-xs truncate">
                        {doc.fileName.split('/').pop()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getDocumentTypeColor(doc.documentType)}>
                          {getDocumentTypeLabel(doc.documentType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          {doc.viewCount || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(doc.createdAt), 'PPp')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            title={language === 'ar' ? 'تنزيل' : 'Download'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
