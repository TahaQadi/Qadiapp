
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/components/LanguageProvider';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MicroFeedbackWidgetProps {
  touchpoint: string;
  context?: Record<string, any>;
  onDismiss?: () => void;
  compact?: boolean;
}

export function MicroFeedbackWidget({ 
  touchpoint, 
  context, 
  onDismiss,
  compact = false 
}: MicroFeedbackWidgetProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: {
      touchpoint: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      quickResponse?: string;
      context?: Record<string, any>;
    }) => {
      return apiRequest('POST', '/api/feedback/micro', data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: language === 'ar' ? 'شكراً!' : 'Thank you!',
        description: language === 'ar' 
          ? 'تم إرسال ملاحظاتك بنجاح' 
          : 'Your feedback has been submitted',
      });
      setTimeout(() => {
        onDismiss?.();
      }, 2000);
    },
  });

  const handleSentiment = (value: 'positive' | 'negative') => {
    setSentiment(value);
    if (value === 'positive') {
      // Auto-submit positive feedback
      submitMutation.mutate({
        touchpoint,
        sentiment: value,
        context,
      });
    } else {
      // Ask for details on negative feedback
      setShowFeedback(true);
    }
  };

  const handleSubmitFeedback = () => {
    if (!sentiment) return;
    
    submitMutation.mutate({
      touchpoint,
      sentiment,
      quickResponse: feedback,
      context,
    });
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
        <div className="text-green-600 dark:text-green-400">✓</div>
        <span className="text-sm text-green-800 dark:text-green-200">
          {language === 'ar' ? 'شكراً لملاحظاتك!' : 'Thanks for your feedback!'}
        </span>
      </div>
    );
  }

  if (showFeedback && sentiment === 'negative') {
    return (
      <div className="p-4 bg-card border border-border rounded-lg shadow-sm animate-slide-down">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium">
            {language === 'ar' 
              ? 'كيف يمكننا التحسين؟' 
              : 'How can we improve?'}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => {
              setShowFeedback(false);
              setSentiment(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={language === 'ar' 
            ? 'أخبرنا المزيد...' 
            : 'Tell us more...'}
          className="mb-3 min-h-[80px]"
        />
        <Button
          onClick={handleSubmitFeedback}
          disabled={submitMutation.isPending}
          size="sm"
          className="w-full"
        >
          {submitMutation.isPending 
            ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...') 
            : (language === 'ar' ? 'إرسال' : 'Submit')}
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] hover:bg-green-100 dark:hover:bg-green-900/20"
          onClick={() => handleSentiment('positive')}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] hover:bg-red-100 dark:hover:bg-red-900/20"
          onClick={() => handleSentiment('negative')}
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium">
          {language === 'ar' 
            ? 'هل كان هذا مفيداً؟' 
            : 'Was this helpful?'}
        </p>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => handleSentiment('positive')}
        >
          <ThumbsUp className="h-4 w-4" />
          {language === 'ar' ? 'نعم' : 'Yes'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => handleSentiment('negative')}
        >
          <ThumbsDown className="h-4 w-4" />
          {language === 'ar' ? 'لا' : 'No'}
        </Button>
      </div>
    </div>
  );
}
