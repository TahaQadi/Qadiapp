
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  clientId?: string;
  ltaId?: string;
  fileSize: number;
  viewCount?: number;
  createdAt: string;
  lastViewedAt?: string;
  metadata?: any;
}

export default function AdminDocumentsPage() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/admin/documents/search', { searchTerm, documentType, startDate, endDate }],
    enabled: true,
  });

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
                  documents.map((doc: Document) => (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/pdf/download/${doc.fileUrl}`, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
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
