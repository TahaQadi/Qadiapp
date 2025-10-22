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
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Star, ThumbsUp, ThumbsDown, Loader2, Sparkles } from 'lucide-react';

interface OrderFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

export function OrderFeedbackDialog({ open, onOpenChange, orderId }: OrderFeedbackDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [orderingProcessRating, setOrderingProcessRating] = useState(0);
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [deliverySpeedRating, setDeliverySpeedRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [comments, setComments] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/feedback/order/${orderId}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'شكراً لك!',
        description: 'تم إرسال تقييمك بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/analytics'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل في إرسال التقييم',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setOrderingProcessRating(0);
    setProductQualityRating(0);
    setDeliverySpeedRating(0);
    setCommunicationRating(0);
    setComments('');
    setWouldRecommend(null);
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى تقييم تجربتك الإجمالية',
        variant: 'destructive',
      });
      return;
    }

    if (wouldRecommend === null) {
      toast({
        title: 'خطأ',
        description: 'يرجى تحديد إذا كنت ستوصي بنا',
        variant: 'destructive',
      });
      return;
    }

    submitFeedbackMutation.mutate({
      rating,
      orderingProcessRating: orderingProcessRating || undefined,
      productQualityRating: productQualityRating || undefined,
      deliverySpeedRating: deliverySpeedRating || undefined,
      communicationRating: communicationRating || undefined,
      comments: comments || undefined,
      wouldRecommend,
    });
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (val: number) => void;
    label: string;
  }) => {
    const [localHover, setLocalHover] = useState(0);

    return (
      <div className="space-y-2">
        <Label className="text-base">{label}</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setLocalHover(star)}
              onMouseLeave={() => setLocalHover(0)}
              className="transition-transform hover:scale-110 active:scale-95 touch-manipulation"
            >
              <Star
                className={`h-8 w-8 sm:h-10 sm:w-10 transition-colors ${
                  star <= (localHover || value)
                    ? 'fill-yellow-500 text-yellow-500'
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            قيّم تجربتك
          </DialogTitle>
          <DialogDescription>
            رأيك يهمنا! ساعدنا في تحسين خدماتنا
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <div className="space-y-3 pb-4 border-b">
            <Label className="text-lg font-semibold">
              التقييم الإجمالي <span className="text-destructive">*</span>
            </Label>
            <div className="flex justify-center gap-3 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 active:scale-95 touch-manipulation"
                >
                  <Star
                    className={`h-10 w-10 sm:h-12 sm:w-12 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 5 && 'ممتاز! 🌟'}
                {rating === 4 && 'جيد جداً! 👍'}
                {rating === 3 && 'جيد 👌'}
                {rating === 2 && 'مقبول 🤔'}
                {rating === 1 && 'يحتاج تحسين 😕'}
              </p>
            )}
          </div>

          {/* Aspect Ratings */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">تقييم جوانب محددة (اختياري)</Label>

            <StarRating
              value={orderingProcessRating}
              onChange={setOrderingProcessRating}
              label="سهولة عملية الطلب"
            />

            <StarRating
              value={productQualityRating}
              onChange={setProductQualityRating}
              label="جودة المنتجات"
            />

            <StarRating
              value={deliverySpeedRating}
              onChange={setDeliverySpeedRating}
              label="سرعة التوصيل"
            />

            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="التواصل والدعم"
            />
          </div>

          {/* Would Recommend */}
          <div className="space-y-3 py-4 border-t">
            <Label className="text-base font-semibold">
              هل ستوصي بنا للآخرين؟ <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-3 justify-center">
              <Button
                type="button"
                variant={wouldRecommend === true ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(true)}
                className="flex-1 sm:flex-none sm:min-w-[120px] h-auto py-4"
              >
                <ThumbsUp className="ml-2 h-5 w-5" />
                نعم، بالتأكيد
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? 'destructive' : 'outline'}
                onClick={() => setWouldRecommend(false)}
                className="flex-1 sm:flex-none sm:min-w-[120px] h-auto py-4"
              >
                <ThumbsDown className="ml-2 h-5 w-5" />
                لا
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-base">
              ملاحظات إضافية (اختياري)
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="شاركنا رأيك أو اقتراحاتك..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitFeedbackMutation.isPending}
            className="flex-1 sm:flex-none"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitFeedbackMutation.isPending}
            className="flex-1 sm:flex-none"
          >
            {submitFeedbackMutation.isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              'إرسال التقييم'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}