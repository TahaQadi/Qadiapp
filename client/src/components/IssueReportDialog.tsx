
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLanguage } from './LanguageProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface IssueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
}

export function IssueReportDialog({ open, onOpenChange, orderId }: IssueReportDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');

  const submitIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/feedback/issue', data);
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إرسال البلاغ' : 'Issue Reported',
        description: language === 'ar' 
          ? 'شكراً لك، سيتم مراجعة البلاغ والرد عليك قريباً'
          : 'Thank you, we will review the issue and respond soon',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/issues'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'فشل في إرسال البلاغ' : 'Failed to submit issue'),
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setIssueType('');
    setDescription('');
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!issueType || !description) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const browserInfo = navigator.userAgent;
    const screenSize = `${window.innerWidth}x${window.innerHeight}`;

    // Auto-determine severity based on issue type
    let severity = 'medium';
    if (issueType === 'damaged_items' || issueType === 'missing_items') {
      severity = 'high';
    } else if (issueType === 'quality_issue') {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // Auto-generate title from issue type
    const issueTypeLabel = issueTypeOptions.find(opt => opt.value === issueType)?.label || issueType;
    const title = language === 'ar' 
      ? `مشكلة: ${issueTypeLabel}`
      : `Issue: ${issueTypeLabel}`;

    submitIssueMutation.mutate({
      orderId: orderId || undefined,
      issueType,
      severity,
      title,
      description,
      browserInfo,
      screenSize,
    });
  };

  const issueTypeOptions = language === 'ar' ? [
    { value: 'missing_items', label: 'عناصر مفقودة' },
    { value: 'wrong_items', label: 'عناصر خاطئة' },
    { value: 'damaged_items', label: 'عناصر تالفة' },
    { value: 'quality_issue', label: 'مشكلة في الجودة' },
    { value: 'quantity_mismatch', label: 'عدم تطابق الكمية' },
    { value: 'delivery_issue', label: 'مشكلة في التوصيل' },
    { value: 'billing_issue', label: 'مشكلة في الفوترة' },
    { value: 'other', label: 'أخرى' },
  ] : [
    { value: 'missing_items', label: 'Missing Items' },
    { value: 'wrong_items', label: 'Wrong Items' },
    { value: 'damaged_items', label: 'Damaged Items' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'quantity_mismatch', label: 'Quantity Mismatch' },
    { value: 'delivery_issue', label: 'Delivery Problem' },
    { value: 'billing_issue', label: 'Billing Issue' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {language === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report an Issue'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'أخبرنا عن أي مشكلة واجهتك وسنعمل على حلها في أقرب وقت'
              : 'Tell us about any problem you encountered and we will work to resolve it soon'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issueType" className="text-base">
              {language === 'ar' ? 'نوع المشكلة' : 'Issue Type'} <span className="text-destructive">*</span>
            </Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger id="issueType" className="w-full" data-testid="select-issue-type">
                <SelectValue placeholder={language === 'ar' ? 'اختر نوع المشكلة' : 'Select issue type'} />
              </SelectTrigger>
              <SelectContent>
                {issueTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base">
              {language === 'ar' ? 'وصف المشكلة' : 'Description'} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ar' ? 'اشرح المشكلة بالتفصيل...' : 'Explain the issue in detail...'}
              rows={6}
              className="resize-none text-base"
              data-testid="textarea-issue-description"
            />
            <p className="text-xs text-muted-foreground">
              {language === 'ar' 
                ? 'كلما كان الوصف أكثر تفصيلاً، كان بإمكاننا مساعدتك بشكل أفضل'
                : 'The more detailed the description, the better we can help you'}
            </p>
          </div>

          {orderId && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">
                  {language === 'ar' ? 'رقم الطلب:' : 'Order ID:'}
                </span> {orderId.slice(0, 8)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitIssueMutation.isPending}
            className="flex-1 sm:flex-none"
            data-testid="button-cancel-issue"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitIssueMutation.isPending}
            className="flex-1 sm:flex-none"
            data-testid="button-submit-issue"
          >
            {submitIssueMutation.isPending ? (
              <>
                <Loader2 className={language === 'ar' ? 'ml-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} />
                {language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
              </>
            ) : (
              language === 'ar' ? 'إرسال البلاغ' : 'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
