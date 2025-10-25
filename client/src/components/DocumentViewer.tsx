import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Download, 
  Eye, 
  Loader2, 
  AlertCircle,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';

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

interface DocumentViewerProps {
  relatedId?: string;
  relatedType?: 'order' | 'priceOffer' | 'lta';
  showTitle?: boolean;
  className?: string;
}

export function DocumentViewer({ 
  relatedId, 
  relatedType, 
  showTitle = true, 
  className = '' 
}: DocumentViewerProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Build query parameters based on related entity
  const queryParams = new URLSearchParams();
  if (relatedId && relatedType) {
    switch (relatedType) {
      case 'order':
        queryParams.append('orderId', relatedId);
        break;
      case 'priceOffer':
        queryParams.append('priceOfferId', relatedId);
        break;
      case 'lta':
        queryParams.append('ltaId', relatedId);
        break;
    }
  }

  // Fetch documents
  const { data: documentsData, isLoading } = useQuery<{
    documents: Document[];
    totalCount: number;
  }>({
    queryKey: ['/api/documents', relatedId, relatedType],
    queryFn: async () => {
      const response = await fetch(`/api/documents?${queryParams}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    enabled: !!relatedId && !!relatedType
  });

  const documents = documentsData?.documents || [];

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Get download token
      const tokenResponse = await fetch(`/api/documents/${documentId}/token`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get download token');
      }

      const { token } = await tokenResponse.json();
      
      // Download the file
      const downloadUrl = `/api/documents/${documentId}/download?token=${token}`;
      window.open(downloadUrl, '_blank');
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم بدء التنزيل' : 'Download Started',
        description: language === 'ar' ? 'سيبدأ تنزيل المستند قريباً' : 'Document download will start shortly'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل تنزيل المستند' : 'Failed to download document'),
        variant: 'destructive'
      });
    }
  });

  const handleDownload = (document: Document) => {
    downloadMutation.mutate(document.id);
  };

  const handlePreview = (document: Document) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
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

  if (!relatedId || !relatedType) {
    return null;
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            {language === 'ar' ? 'المستندات المرتبطة' : 'Related Documents'}
          </h3>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-6 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === 'ar' ? 'لا توجد مستندات مرتبطة' : 'No related documents found'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{doc.fileName}</h4>
                      <Badge variant="outline" className={getDocumentTypeColor(doc.documentType)}>
                        {getDocumentTypeLabel(doc.documentType)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                      </span>
                      {doc.viewCount && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {doc.viewCount}
                        </span>
                      )}
                    </div>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadMutation.isPending}
                    title={language === 'ar' ? 'تنزيل' : 'Download'}
                  >
                    {downloadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleDownload(selectedDocument)}
                      disabled={downloadMutation.isPending}
                      className="w-full"
                    >
                      {downloadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'ar' ? 'جاري التنزيل...' : 'Downloading...'}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'تنزيل المستند' : 'Download Document'}
                        </>
                      )}
                    </Button>
                  </div>
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