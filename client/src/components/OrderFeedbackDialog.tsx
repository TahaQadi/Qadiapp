
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
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [orderingProcessRating, setOrderingProcessRating] = useState(0);
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [deliverySpeedRating, setDeliverySpeedRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');

  const submitFeedback = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/feedback/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.feedbackSubmitted || 'Feedback Submitted',
        description: t.feedbackThankYou || 'Thank you for your feedback!',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: t.error || 'Error',
        description: t.feedbackError || 'Failed to submit feedback',
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
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: t.error || 'Error',
        description: language === 'ar' ? 'يرجى تقييم التجربة الإجمالية' : 'Please rate your overall experience',
        variant: 'destructive',
      });
      return;
    }

    if (wouldRecommend === null) {
      toast({
        title: t.error || 'Error',
        description: language === 'ar' ? 'يرجى اختيار ما إذا كنت توصي بنا' : 'Please indicate if you would recommend us',
        variant: 'destructive',
      });
      return;
    }

    submitFeedback.mutate({
      orderId,
      rating,
      orderingProcessRating: orderingProcessRating || undefined,
      productQualityRating: productQualityRating || undefined,
      deliverySpeedRating: deliverySpeedRating || undefined,
      communicationRating: communicationRating || undefined,
      wouldRecommend,
      comments: comments || undefined,
    });
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
            label={language === 'ar' ? 'التقييم الإجمالي' : 'Overall Rating'}
          />

          {/* Aspect Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StarRating
              value={orderingProcessRating}
              onChange={setOrderingProcessRating}
              label={language === 'ar' ? 'عملية الطلب' : 'Ordering Process'}
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
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'هل توصي بنا؟' : 'Would you recommend us?'}</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={wouldRecommend === true ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'نعم' : 'Yes'}
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? 'destructive' : 'outline'}
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'لا' : 'No'}
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'تعليقات إضافية (اختياري)' : 'Additional Comments (Optional)'}</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={language === 'ar' ? 'أخبرنا المزيد عن تجربتك...' : 'Tell us more about your experience...'}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel || 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={submitFeedback.isPending}>
            {submitFeedback.isPending
              ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
              : (language === 'ar' ? 'إرسال التقييم' : 'Submit Feedback')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
