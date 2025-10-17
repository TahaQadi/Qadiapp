import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/LanguageProvider';

export function EmailTestPanel() {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email Required',
        description: language === 'ar' ? 'يرجى إدخال عنوان بريد إلكتروني للاختبار' : 'Please enter an email address to test',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: data.message });
        toast({
          title: language === 'ar' ? 'نجح' : 'Success',
          description: data.message,
        });
      } else {
        setTestResult({ success: false, message: data.message });
        toast({
          title: language === 'ar' ? 'فشل الاختبار' : 'Test Failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTestResult({ success: false, message: errorMessage });
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {language === 'ar' ? 'إعدادات خدمة البريد الإلكتروني' : 'Email Service Configuration'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' ? 'اختبار إعدادات البريد الإلكتروني SMTP' : 'Test your SMTP email configuration'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">
            {language === 'ar' ? 'عنوان البريد الإلكتروني للاختبار' : 'Test Email Address'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="test-email"
              type="email"
              placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني للاختبار' : 'Enter email to test'}
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={isLoading}
            />
            <Button onClick={handleTestEmail} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {testResult && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            testResult.success ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {testResult.success 
                  ? (language === 'ar' ? 'نجح الاختبار' : 'Test Successful')
                  : (language === 'ar' ? 'فشل الاختبار' : 'Test Failed')
                }
              </p>
              <p className="text-sm mt-1">{testResult.message}</p>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">
            {language === 'ar' ? 'متغيرات البيئة المطلوبة:' : 'Required Environment Variables:'}
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• SMTP_HOST ({language === 'ar' ? 'مثال: smtp.gmail.com' : 'e.g., smtp.gmail.com'})</li>
            <li>• SMTP_PORT ({language === 'ar' ? 'مثال: 587' : 'e.g., 587'})</li>
            <li>• SMTP_USER ({language === 'ar' ? 'بريدك الإلكتروني' : 'your email'})</li>
            <li>• SMTP_PASSWORD ({language === 'ar' ? 'كلمة مرور التطبيق' : 'app password'})</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}