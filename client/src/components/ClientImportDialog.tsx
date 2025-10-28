import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/LanguageProvider';
import { apiRequest } from '@/lib/queryClient';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  parseCSVFile, 
  processCSVData, 
  downloadCSVTemplate, 
  type ImportResult,
  type ClientImportData 
} from '@/lib/csvImport';

interface ClientImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ClientImportDialog({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: ClientImportDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const importMutation = useMutation({
    mutationFn: async (data: ClientImportData[]) => {
      const res = await apiRequest('POST', '/api/admin/clients/bulk-import', { clients: data });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Import failed');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'تم الاستيراد بنجاح' : 'Import Successful',
        description: language === 'ar' 
          ? `تم استيراد ${data.successCount} عميل بنجاح` 
          : `Successfully imported ${data.successCount} clients`,
      });
      onImportComplete();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في الاستيراد' : 'Import Error',
        description: error.message || (language === 'ar' ? 'فشل في استيراد البيانات' : 'Failed to import data'),
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: language === 'ar' ? 'نوع ملف غير صحيح' : 'Invalid File Type',
        description: language === 'ar' ? 'يرجى اختيار ملف CSV' : 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setImportResult(null);

    try {
      const csvData = await parseCSVFile(selectedFile);
      const result = processCSVData(csvData);
      setImportResult(result);
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: language === 'ar' ? 'خطأ في معالجة الملف' : 'File Processing Error',
        description: language === 'ar' ? 'فشل في قراءة ملف CSV' : 'Failed to read CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
    toast({
      title: language === 'ar' ? 'تم تحميل القالب' : 'Template Downloaded',
      description: language === 'ar' ? 'تم تحميل قالب الاستيراد' : 'Import template downloaded',
    });
  };

  const handleImport = () => {
    if (!importResult || !importResult.success) return;
    
    importMutation.mutate(importResult.data);
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setIsProcessing(false);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const event = {
        target: {
          files: [droppedFile]
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'استيراد العملاء من CSV' : 'Import Clients from CSV'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'قم بتحميل ملف CSV لاستيراد العملاء بشكل مجمع. يمكنك تحميل القالب أولاً لمعرفة التنسيق المطلوب.'
              : 'Upload a CSV file to bulk import clients. You can download the template first to see the required format.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {language === 'ar' ? 'قالب الاستيراد' : 'Import Template'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'ar' 
                  ? 'قم بتحميل القالب لمعرفة التنسيق المطلوب لملف CSV'
                  : 'Download the template to see the required CSV format'}
              </p>
              <Button 
                variant="outline" 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تحميل القالب' : 'Download Template'}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {language === 'ar' ? 'رفع ملف CSV' : 'Upload CSV File'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {language === 'ar' ? 'اسحب ملف CSV هنا أو انقر للاختيار' : 'Drag CSV file here or click to select'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'ar' 
                    ? 'يدعم الملفات بصيغة CSV فقط'
                    : 'Supports CSV files only'}
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  {language === 'ar' ? 'اختيار ملف' : 'Choose File'}
                </Button>
              </div>

              {file && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="secondary">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{language === 'ar' ? 'جاري معالجة الملف...' : 'Processing file...'}</span>
                </div>
                <Progress value={importProgress} className="mt-2" />
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  {language === 'ar' ? 'نتائج التحقق' : 'Validation Results'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{importResult.totalRows}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'إجمالي الصفوف' : 'Total Rows'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.validRows}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'صالح' : 'Valid'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.invalidRows}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'غير صالح' : 'Invalid'}
                    </div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">
                      {language === 'ar' ? 'أخطاء التحقق:' : 'Validation Errors:'}
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                          {language === 'ar' 
                            ? `الصف ${error.row}: ${error.message}`
                            : `Row ${error.row}: ${error.message}`}
                        </div>
                      ))}
                    </div>
                    {importResult.errors.length > 10 && (
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' 
                          ? `و ${importResult.errors.length - 10} أخطاء أخرى...`
                          : `And ${importResult.errors.length - 10} more errors...`}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          {importResult && importResult.success && (
            <Button 
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="flex items-center gap-2"
            >
              {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {language === 'ar' ? 'استيراد العملاء' : 'Import Clients'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
