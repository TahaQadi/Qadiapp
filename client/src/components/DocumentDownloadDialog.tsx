import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  FileText, 
  Eye, 
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { formatDateLocalized } from "@/lib/dateUtils";

interface DocumentDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  documentType: string;
  createdAt?: string;
  fileSize?: number;
  clientName?: string;
}

export function DocumentDownloadDialog({
  open,
  onOpenChange,
  documentId,
  documentName,
  documentType,
  createdAt,
  fileSize,
  clientName
}: DocumentDownloadDialogProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      price_offer: { en: 'Price Offer', ar: 'عرض سعر' },
      purchase_order: { en: 'Purchase Order', ar: 'أمر شراء' },
      invoice: { en: 'Invoice', ar: 'فاتورة' },
      contract: { en: 'Contract', ar: 'عقد' },
      lta_document: { en: 'LTA Document', ar: 'مستند اتفاقية' },
    };
    const lang = i18n.language === 'ar' ? 'ar' : 'en';
    return labels[type]?.[lang] || type;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Get download token
      const tokenResponse = await fetch(`/api/documents/${documentId}/token`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get download token');
      }

      const { token } = await tokenResponse.json();

      // Download with token
      const downloadUrl = `/api/documents/${documentId}/download?token=${token}`;
      
      // Open in new window to trigger download
      window.open(downloadUrl, '_blank');

      toast({
        title: i18n.language === 'ar' ? 'تم بدء التنزيل' : 'Download Started',
        description: i18n.language === 'ar' 
          ? 'سيتم تنزيل المستند قريباً' 
          : 'The document will be downloaded shortly',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: i18n.language === 'ar' ? 'خطأ' : 'Error',
        description: i18n.language === 'ar' 
          ? 'فشل تنزيل المستند' 
          : 'Failed to download document',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {i18n.language === 'ar' ? 'تفاصيل المستند' : 'Document Details'}
          </DialogTitle>
          <DialogDescription>
            {i18n.language === 'ar' 
              ? 'معلومات وتنزيل المستند' 
              : 'Document information and download'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Type Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {i18n.language === 'ar' ? 'النوع' : 'Type'}
            </span>
            <Badge variant="secondary">
              {getDocumentTypeLabel(documentType)}
            </Badge>
          </div>

          {/* Document Name */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">
                    {i18n.language === 'ar' ? 'اسم الملف' : 'File Name'}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {documentName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* File Size */}
            {fileSize && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium">
                      {i18n.language === 'ar' ? 'الحجم' : 'Size'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatFileSize(fileSize)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Created Date */}
            {createdAt && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium">
                      {i18n.language === 'ar' ? 'التاريخ' : 'Date'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatDateLocalized(createdAt, i18n.language === 'ar' ? 'ar' : 'en')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Client Name */}
          {clientName && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">
                      {i18n.language === 'ar' ? 'العميل' : 'Client'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {clientName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDownloading}
            data-testid="button-cancel-download"
          >
            {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            data-testid="button-confirm-download"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {i18n.language === 'ar' ? 'جارٍ التنزيل...' : 'Downloading...'}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {i18n.language === 'ar' ? 'تنزيل' : 'Download'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
