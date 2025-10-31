
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2 } from 'lucide-react';

interface DocumentGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  offerNumber: string;
  onSuccess?: (documentId: string) => void;
}

export default function DocumentGenerationDialog({
  open,
  onOpenChange,
  offerId,
  offerNumber,
  onSuccess
}: DocumentGenerationDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Fetch available templates for price offers
  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/templates', 'price_offer'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/templates?category=price_offer');
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
    enabled: open,
  });

  const generateDocumentMutation = useMutation({
    mutationFn: async (data: { templateId?: string; notes?: string }) => {
      const res = await apiRequest('POST', `/api/admin/price-offers/${offerId}/generate-document`, {
        templateId: data.templateId,
        notes: data.notes,
        force: true, // Force regeneration
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to generate document');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'تم إنشاء المستند' : 'Document Generated',
        description: language === 'ar' 
          ? 'تم إنشاء مستند PDF بنجاح' 
          : 'PDF document generated successfully',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      onSuccess?.(data.documentId);
      onOpenChange(false);
      setTemplateId('');
      setNotes('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل إنشاء المستند' : 'Failed to generate document'),
      });
    },
  });

  const handleGenerate = () => {
    generateDocumentMutation.mutate({
      templateId: templateId || undefined,
      notes: notes || undefined,
    });
  };

  const activeTemplates = templates.filter(t => t.isActive && t.language === 'ar');
  const defaultTemplate = activeTemplates.find(t => t.isDefault);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {language === 'ar' ? 'إنشاء مستند PDF' : 'Generate PDF Document'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? `إنشاء مستند PDF لعرض السعر ${offerNumber}`
              : `Generate PDF document for price offer ${offerNumber}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template-select">
              {language === 'ar' ? 'القالب' : 'Template'}
              {defaultTemplate && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {language === 'ar' ? 'افتراضي' : 'Default'}
                </Badge>
              )}
            </Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder={
                  language === 'ar' 
                    ? 'استخدام القالب الافتراضي' 
                    : 'Use default template'
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  {language === 'ar' ? 'القالب الافتراضي' : 'Default Template'}
                  {defaultTemplate && ` (${defaultTemplate.nameAr || defaultTemplate.nameEn})`}
                </SelectItem>
                {activeTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {language === 'ar' ? template.nameAr : template.nameEn}
                    {template.isDefault && ` (${language === 'ar' ? 'افتراضي' : 'default'})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)'}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'ar' 
                ? 'أدخل أي ملاحظات إضافية للمستند...' 
                : 'Enter any additional notes for the document...'
              }
              rows={3}
            />
          </div>

          {/* Info Message */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                {language === 'ar' 
                  ? 'سيتم إنشاء مستند PDF باللغة العربية باستخدام بيانات عرض السعر الحالية.'
                  : 'A PDF document will be generated in Arabic using the current price offer data.'
                }
              </span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generateDocumentMutation.isPending}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateDocumentMutation.isPending}
          >
            {generateDocumentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إنشاء PDF' : 'Generate PDF'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
