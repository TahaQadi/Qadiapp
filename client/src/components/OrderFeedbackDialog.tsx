import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLanguage } from './LanguageProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Separator } from './ui/separator'; // Assuming Separator is in ui/separator
import { useQueryClient } from '@tanstack/react-query'; // Assuming useQueryClient is needed

interface OrderFeedbackDialogProps {
  orderId: string;
  orderReference: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderFeedbackDialog({
  orderId,
  orderReference,
  open,
  onOpenChange,
}: OrderFeedbackDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Initialize useQueryClient
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [orderingProcessRating, setOrderingProcessRating] = useState(0);
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [deliverySpeedRating, setDeliverySpeedRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');
  const [hasIssue, setHasIssue] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // State to track submission status

  // Mocking t object for translations, assuming it comes from a translation hook
  const t = {
    success: language === 'ar' ? 'تم إرسال التقييم' : 'Feedback Submitted',
    thankYou: language === 'ar' ? 'شكرا لك على ملاحظاتك!' : 'Thank you for your feedback!',
    error: language === 'ar' ? 'خطأ' : 'Error',
    tryAgain: language === 'ar' ? 'فشل في إرسال التقييم' : 'Failed to submit feedback',
    overallRating: language === 'ar' ? 'التقييم الإجمالي' : 'Overall Rating',
    orderingProcess: language === 'ar' ? 'عملية الطلب' : 'Ordering Process',
    productQuality: language === 'ar' ? 'جودة المنتجات' : 'Product Quality',
    deliverySpeed: language === 'ar' ? 'سرعة التسليم' : 'Delivery Speed',
    communication: language === 'ar' ? 'التواصل' : 'Communication',
    recommendUs: language === 'ar' ? 'هل توصي بنا؟' : 'Would you recommend us?',
    yes: language === 'ar' ? 'نعم' : 'Yes',
    no: language === 'ar' ? 'لا' : 'No',
    additionalComments: language === 'ar' ? 'تعليقات إضافية (اختياري)' : 'Additional Comments (Optional)',
    placeholderComments: language === 'ar' ? 'أخبرنا المزيد عن تجربتك...' : 'Tell us more about your experience...',
    reportIssue: language === 'ar' ? 'الإبلاغ عن مشكلة في الطلب' : 'Report an issue with this order',
    issueTypeLabel: language === 'ar' ? 'نوع المشكلة' : 'Issue Type',
    selectIssueType: language === 'ar' ? 'اختر نوع المشكلة' : 'Select issue type',
    missingItems: language === 'ar' ? 'عناصر مفقودة' : 'Missing Items',
    wrongItems: language === 'ar' ? 'عناصر خاطئة' : 'Wrong Items',
    damagedItems: language === 'ar' ? 'عناصر تالفة' : 'Damaged Items',
    qualityIssue: language === 'ar' ? 'مشكلة في الجودة' : 'Quality Issue',
    quantityMismatch: language === 'ar' ? 'عدم تطابق الكمية' : 'Quantity Mismatch',
    other: language === 'ar' ? 'أخرى' : 'Other',
    issueTitleLabel: language === 'ar' ? 'عنوان المشكلة' : 'Issue Title',
    placeholderIssueTitle: language === 'ar' ? 'مثال: نقص في الكمية المستلمة' : 'e.g., Received fewer items than ordered',
    issueDescriptionLabel: language === 'ar' ? 'وصف المشكلة' : 'Issue Description',
    placeholderIssueDescription: language === 'ar' ? 'يرجى وصف المشكلة بالتفصيل...' : 'Please describe the issue in detail...',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    submitFeedback: language === 'ar' ? 'إرسال التقييم' : 'Submit Feedback',
    submitting: language === 'ar' ? 'جاري الإرسال...' : 'Submitting...',
  };

  const submitFeedback = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/feedback/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Try to get error message from response body
        let errorMessage = t.tryAgain;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore if response body is not JSON or empty
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.success,
        description: t.thankYou,
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.tryAgain,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setRating(0);
    setOrderingProcessRating(0);
    setProductQualityRating(0);
    setDeliverySpeedRating(0);
    setCommunicationRating(0);
    setWouldRecommend(null);
    setComments('');
    setHasIssue(false);
    setIssueType('');
    setIssueTitle('');
    setIssueDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (rating === 0) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'يرجى تقييم التجربة الإجمالية' : 'Please rate your overall experience',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (wouldRecommend === null) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'يرجى اختيار ما إذا كنت توصي بنا' : 'Please indicate if you would recommend us',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    const feedbackData: any = {
      orderId,
      rating,
      orderingProcessRating: orderingProcessRating || undefined,
      productQualityRating: productQualityRating || undefined,
      deliverySpeedRating: deliverySpeedRating || undefined,
      communicationRating: communicationRating || undefined,
      wouldRecommend,
      comments: comments || undefined,
    };

    // Add issue report if user selected to report an issue and provided details
    if (hasIssue && issueType && issueTitle && issueDescription) {
      feedbackData.issueReport = {
        issueType,
        severity: rating <= 2 ? 'high' : rating <= 3 ? 'medium' : 'low',
        title: issueTitle,
        description: issueDescription,
        browserInfo: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      };
    }

    try {
      const response = await fetch(`/api/feedback/order/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(feedbackData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.tryAgain);
      }

      toast({
        title: t.success,
        description: t.thankYou,
      });

      onOpenChange(false);
      resetForm();
      // Assuming you want to invalidate queries related to orders after feedback submission
      // queryClient.invalidateQueries({ queryKey: ['/api/client/orders'] });
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      toast({
        title: t.error,
        description: error.message || t.tryAgain,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const StarRating = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) => {
    const [hover, setHover] = useState(0);
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hover || value)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'كيف كانت تجربتك؟' : 'How was your experience?'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? `الطلب: ${orderReference}`
              : `Order: ${orderReference}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <StarRating
            value={rating}
            onChange={setRating}
            label={t.overallRating}
          />

          {/* Aspect Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StarRating
              value={orderingProcessRating}
              onChange={setOrderingProcessRating}
              label={t.orderingProcess}
            />
            <StarRating
              value={productQualityRating}
              onChange={setProductQualityRating}
              label={t.productQuality}
            />
            <StarRating
              value={deliverySpeedRating}
              onChange={setDeliverySpeedRating}
              label={t.deliverySpeed}
            />
            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label={t.communication}
            />
          </div>

          {/* Would Recommend */}
          <div className="space-y-2">
            <Label>{t.recommendUs}</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={wouldRecommend === true ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                {t.yes}
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? 'destructive' : 'outline'}
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                {t.no}
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label>{t.additionalComments}</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t.placeholderComments}
              rows={4}
            />
          </div>

          <Separator />

          {/* Issue Reporting Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasIssue"
                checked={hasIssue}
                onChange={(e) => setHasIssue(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="hasIssue" className="cursor-pointer">
                {t.reportIssue}
              </Label>
            </div>

            {hasIssue && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label>{t.issueTypeLabel}</Label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">{t.selectIssueType}</option>
                    <option value="missing_items">{t.missingItems}</option>
                    <option value="wrong_items">{t.wrongItems}</option>
                    <option value="damaged_items">{t.damagedItems}</option>
                    <option value="quality_issue">{t.qualityIssue}</option>
                    <option value="quantity_mismatch">{t.quantityMismatch}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>{t.issueTitleLabel}</Label>
                  <input
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder={t.placeholderIssueTitle}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.issueDescriptionLabel}</Label>
                  <Textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder={t.placeholderIssueDescription}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={submitFeedback.isPending || isSubmitting}>
            {submitFeedback.isPending || isSubmitting
              ? t.submitting
              : t.submitFeedback
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}