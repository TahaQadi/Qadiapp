
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/components/LanguageProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2, Mail, Lock } from 'lucide-react';
import { Link } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function LoginPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' 
          : 'Please enter email and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password, rememberMe }),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Login failed');
      }

      const userData = await res.json();
      
      // Invalidate auth query to refresh user data
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: language === 'ar' ? 'نجح تسجيل الدخول' : 'Login successful',
        description: language === 'ar' ? 'مرحباً بك!' : 'Welcome back!',
      });
      
      // Redirect based on user role
      if (userData.isAdmin) {
        setLocation('/admin');
      } else {
        setLocation('/ordering');
      }
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
          : 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      {/* Main content */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md border-border/50 dark:border-[#d4af37]/20 shadow-lg dark:shadow-[#d4af37]/5 animate-fade-in">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                <LogIn className="h-6 w-6 text-primary dark:text-[#d4af37]" />
              </div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
                {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </CardTitle>
            </div>
            <CardDescription className="text-center">
              {language === 'ar' 
                ? 'أدخل بريدك الإلكتروني وكلمة المرور للدخول' 
                : 'Enter your email and password to login'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={language === 'ar' ? 'example@company.com' : 'example@company.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    data-testid="input-email"
                    required
                    className="pl-10 h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37] transition-colors"
                  />
                </div>
              </div>
              
              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    data-testid="input-password"
                    required
                    className="pl-10 h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37] transition-colors"
                  />
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border/50 dark:border-[#d4af37]/20 text-primary dark:text-[#d4af37] focus:ring-primary dark:focus:ring-[#d4af37] transition-colors"
                  disabled={isLoading}
                  data-testid="checkbox-remember-me"
                />
                <Label 
                  htmlFor="rememberMe" 
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  {language === 'ar' ? 'تذكرني' : 'Remember me'}
                </Label>
              </div>

              {/* Login button */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 dark:bg-[#d4af37] dark:hover:bg-[#d4af37]/90 text-primary-foreground dark:text-black font-medium shadow-sm hover:shadow-md transition-all" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </>
                )}
              </Button>

              {/* Sign up link */}
              <div className="text-center text-sm text-muted-foreground pt-2">
                {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                <Link 
                  href="/onboarding" 
                  className="text-primary dark:text-[#d4af37] hover:underline font-medium transition-colors" 
                  data-testid="link-signup"
                >
                  {language === 'ar' ? 'إنشاء حساب جديد' : 'Sign up'}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
