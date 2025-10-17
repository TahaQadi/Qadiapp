
import { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BatchPdfGeneratorProps {
  requests: any[];
  onComplete: () => void;
}

export function BatchPdfGenerator({ requests, onComplete }: BatchPdfGeneratorProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedLtaId, setSelectedLtaId] = useState('');
  const [progress, setProgress] = useState<{ total: number; completed: number; failed: number; results: any[] }>({
    total: 0,
    completed: 0,
    failed: 0,
    results: []
  });

  const { data: ltas } = useQuery({
    queryKey: ['ltas'],
    queryFn: async () => {
      const res = await fetch('/api/ltas');
      if (!res.ok) throw new Error('Failed to fetch LTAs');
      return res.json();
    }
  });

  const generateBatchMutation = useMutation({
    mutationFn: async () => {
      const total = requests.length;
      setProgress({ total, completed: 0, failed: 0, results: [] });

      const results = [];
      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        try {
          const res = await fetch('/api/admin/price-requests/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notificationId: request.id,
              ltaId: selectedLtaId,
              validityDays: 30,
              notes: ''
            }),
            credentials: 'include'
          });

          if (!res.ok) throw new Error('PDF generation failed');

          results.push({ requestId: request.id, status: 'success' });
          setProgress(p => ({ ...p, completed: p.completed + 1, results: [...p.results, { ...request, status: 'success' }] }));
        } catch (error) {
          results.push({ requestId: request.id, status: 'failed', error: error.message });
          setProgress(p => ({ ...p, failed: p.failed + 1, results: [...p.results, { ...request, status: 'failed' }] }));
        }
      }

      return results;
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'اكتمل' : 'Complete',
        description: language === 'ar' 
          ? `تم إنشاء ${progress.completed} من ${progress.total} ملف PDF`
          : `Generated ${progress.completed} of ${progress.total} PDFs`
      });
      onComplete();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {language === 'ar' ? 'إنشاء PDF دفعة واحدة' : 'Batch PDF Generation'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            {language === 'ar' ? 'اختر الاتفاقية' : 'Select LTA'}
          </label>
          <Select value={selectedLtaId} onValueChange={setSelectedLtaId}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'ar' ? 'اختر...' : 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {ltas?.map((lta: any) => (
                <SelectItem key={lta.id} value={lta.id}>
                  {language === 'ar' ? lta.nameAr : lta.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {progress.total > 0 && (
          <div className="space-y-3">
            <Progress value={(progress.completed + progress.failed) / progress.total * 100} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{language === 'ar' ? 'التقدم:' : 'Progress:'} {progress.completed + progress.failed}/{progress.total}</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {progress.completed}
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  {progress.failed}
                </span>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {progress.results.map((result, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted">
                  <span>{result.clientName || 'Request ' + result.id}</span>
                  {result.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => generateBatchMutation.mutate()}
          disabled={!selectedLtaId || generateBatchMutation.isPending || requests.length === 0}
          className="w-full"
        >
          {generateBatchMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              {language === 'ar' ? `إنشاء ${requests.length} ملف PDF` : `Generate ${requests.length} PDFs`}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
