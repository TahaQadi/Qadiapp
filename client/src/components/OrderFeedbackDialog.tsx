
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface OrderFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

function OrderFeedbackDialog({ open, onOpenChange, orderId }: OrderFeedbackDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [orderingProcessRating, setOrderingProcessRating] = useState(0);
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [deliverySpeedRating, setDeliverySpeedRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [comments, setComments] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الرجاء تحديد تقييم عام' : 'Please select an overall rating',
      });
      return;
    }

    if (wouldRecommend === null) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الرجاء تحديد ما إذا كنت ستوصي بنا' : 'Please indicate if you would recommend us',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/feedback/order/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          orderingProcessRating: orderingProcessRating || undefined,
          productQualityRating: productQualityRating || undefined,
          deliverySpeedRating: deliverySpeedRating || undefined,
          communicationRating: communicationRating || undefined,
          comments: comments.trim() || undefined,
          wouldRecommend,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      toast({
        title: language === 'ar' ? 'شكراً لك!' : 'Thank you!',
        description: language === 'ar'
          ? 'تم إرسال ملاحظاتك بنجاح'
          : 'Your feedback has been submitted successfully',
      });

      onOpenChange(false);
      setRating(0);
      setOrderingProcessRating(0);
      setProductQualityRating(0);
      setDeliverySpeedRating(0);
      setCommunicationRating(0);
      setComments("");
      setWouldRecommend(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? 'فشل إرسال الملاحظات'
          : 'Failed to submit feedback',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تقييم الطلب' : 'Rate Your Order'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'كيف كانت تجربتك مع هذا الطلب؟'
              : 'How was your experience with this order?'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <StarRating
            value={rating}
            onChange={setRating}
            label={language === 'ar' ? 'التقييم العام *' : 'Overall Rating *'}
          />

          {/* Aspect Ratings */}
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground">
              {language === 'ar' ? 'تقييمات تفصيلية (اختياري)' : 'Detailed Ratings (Optional)'}
            </p>
            
            <StarRating
              value={orderingProcessRating}
              onChange={setOrderingProcessRating}
              label={language === 'ar' ? 'سهولة الطلب' : 'Ordering Process'}
            />
            
            <StarRating
              value={productQualityRating}
              onChange={setProductQualityRating}
              label={language === 'ar' ? 'جودة المنتجات' : 'Product Quality'}
            />
            
            <StarRating
              value={deliverySpeedRating}
              onChange={setDeliverySpeedRating}
              label={language === 'ar' ? 'سرعة التسليم' : 'Delivery Speed'}
            />
            
            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label={language === 'ar' ? 'التواصل' : 'Communication'}
            />
          </div>

          {/* Would Recommend */}
          <div className="space-y-2 border-t pt-4">
            <Label>
              {language === 'ar' ? 'هل توصي بنا؟ *' : 'Would you recommend us? *'}
            </Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={wouldRecommend === true ? "default" : "outline"}
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 me-2" />
                {language === 'ar' ? 'نعم' : 'Yes'}
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? "destructive" : "outline"}
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                <ThumbsDown className="h-4 w-4 me-2" />
                {language === 'ar' ? 'لا' : 'No'}
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="comments">
              {language === 'ar' ? 'تعليقات إضافية (اختياري)' : 'Additional Comments (Optional)'}
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'شاركنا رأيك...'
                  : 'Share your thoughts...'
              }
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
              </>
            ) : (
              language === 'ar' ? 'إرسال' : 'Submit'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { OrderFeedbackDialog };
export default OrderFeedbackDialog;
