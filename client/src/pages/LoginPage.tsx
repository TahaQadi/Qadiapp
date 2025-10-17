import { useState } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { queryClient } from '@/lib/queryClient';

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <LogIn className="h-6 w-6" />
            <CardTitle className="text-2xl">
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </CardTitle>
          </div>
          <CardDescription>
            {language === 'ar' 
              ? 'أدخل بريدك الإلكتروني وكلمة المرور للدخول' 
              : 'Enter your email and password to login'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={language === 'ar' ? 'example@company.com' : 'example@company.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                data-testid="input-email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-password"
                required
              />
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                disabled={isLoading}
                data-testid="checkbox-remember-me"
              />
              <Label 
                htmlFor="rememberMe" 
                className="text-sm font-normal cursor-pointer"
              >
                {language === 'ar' ? 'تذكرني' : 'Remember me'}
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </>
              ) : (
                language === 'ar' ? 'تسجيل الدخول' : 'Login'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
              <Link href="/onboarding" className="text-primary hover:underline" data-testid="link-signup">
                {language === 'ar' ? 'إنشاء حساب جديد' : 'Sign up'}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
