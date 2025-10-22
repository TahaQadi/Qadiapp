import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
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
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الرجاء تحديد تقييم' : 'Please select a rating',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          rating,
          comment: comment.trim() || undefined,
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
      setComment("");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              {language === 'ar' ? 'التقييم' : 'Rating'}
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">
              {language === 'ar' ? 'تعليق (اختياري)' : 'Comment (Optional)'}
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
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
            {submitting
              ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
              : (language === 'ar' ? 'إرسال' : 'Submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { OrderFeedbackDialog };
export default OrderFeedbackDialog;