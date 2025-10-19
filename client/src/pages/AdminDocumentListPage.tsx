
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
  const [documentType, setDocumentType] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data, isLoading } = useQuery<{ documents: Document[] }>({
    queryKey: ['/api/documents', searchTerm, documentType, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (documentType) params.append('documentType', documentType);
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

  const documents = data?.documents || [];

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
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'}
              />

              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'}
              />
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
                      <TableCell colSpan={6} className="text-center">
                        {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                      </TableCell>
                    </TableRow>
                  ) : documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        {language === 'ar' ? 'لا توجد مستندات' : 'No documents found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
