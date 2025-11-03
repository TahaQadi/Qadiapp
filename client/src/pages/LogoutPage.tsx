
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/components/LanguageProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

export default function LogoutPage() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'logging_out' | 'success'>('logging_out');

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Wait a moment to show the message
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Perform logout
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
        });

        setStatus('success');

        // Preserve user preferences before clearing storage
        const theme = localStorage.getItem('theme');
        const userLanguage = localStorage.getItem('language');
        
        // Clear all cached data
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore user preferences
        if (theme) localStorage.setItem('theme', theme);
        if (userLanguage) localStorage.setItem('language', userLanguage);

        // Clear React Query cache
        queryClient.clear();

        // Redirect to landing after showing success message
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLocation('/landing');
      } catch (error) {
        // Even on error, redirect to landing
        setLocation('/landing');
      }
    };

    performLogout();
  }, [setLocation]);

  const messages = {
    logging_out: {
      en: "Logging you out safely...",
      ar: "جارٍ تسجيل الخروج بأمان..."
    },
    success: {
      en: "Successfully logged out!",
      ar: "تم تسجيل الخروج بنجاح!"
    },
    subtitle_logging_out: {
      en: "Securing your session and clearing your data",
      ar: "تأمين جلستك ومسح بياناتك"
    },
    subtitle_success: {
      en: "Redirecting you to login page...",
      ar: "إعادة توجيهك إلى صفحة تسجيل الدخول..."
    }
  };

  return (
    <PageLayout>
      {/* Main content */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md border-border/50 dark:border-[#d4af37]/20 shadow-lg dark:shadow-[#d4af37]/5 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className={`p-4 rounded-full transition-all duration-500 ${
                status === 'logging_out' 
                  ? 'bg-primary/10 dark:bg-[#d4af37]/10 animate-pulse' 
                  : 'bg-green-500/10'
              }`}>
                {status === 'logging_out' ? (
                  <Loader2 className="h-12 w-12 text-primary dark:text-[#d4af37] animate-spin" />
                ) : (
                  <CheckCircle2 className="h-12 w-12 text-green-500 animate-bounce" />
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">
                  {status === 'logging_out' 
                    ? messages.logging_out[language]
                    : messages.success[language]
                  }
                </h2>
                <p className="text-sm text-muted-foreground">
                  {status === 'logging_out'
                    ? messages.subtitle_logging_out[language]
                    : messages.subtitle_success[language]
                  }
                </p>
              </div>

              {/* Security tips */}
              {status === 'logging_out' && (
                <div className="w-full mt-4 p-4 rounded-lg bg-muted/50 border border-border/50 text-left">
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? (
                      <>
                        <strong>نصيحة أمنية:</strong> تأكد دائمًا من تسجيل الخروج عند استخدام جهاز مشترك
                      </>
                    ) : (
                      <>
                        <strong>Security Tip:</strong> Always logout when using a shared device
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Success message */}
              {status === 'success' && (
                <div className="w-full mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-left">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {language === 'ar' 
                      ? 'شكراً لاستخدامك بوابة القاضي. نراك قريباً!'
                      : 'Thank you for using Al Qadi Portal. See you soon!'
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
