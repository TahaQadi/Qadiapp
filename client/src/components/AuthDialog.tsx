import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2, Mail, Lock, UserPlus } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'signup';
}

export function AuthDialog({ open, onOpenChange, defaultTab = 'login' }: AuthDialogProps): JSX.Element {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update active tab when defaultTab prop changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
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
      
      onOpenChange(false);
      
      // Redirect based on user role
      if (userData.isAdmin) {
        setLocation('/admin');
      } else {
        setLocation('/ordering');
      }
    } catch (error: unknown) {
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

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean): void => {
    if (!newOpen) {
      setEmail('');
      setPassword('');
      setRememberMe(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center">
            {language === 'ar' ? 'تسجيل الدخول أو إنشاء حساب' : 'Sign In or Sign Up'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'ar' 
              ? 'اختر الطريقة المناسبة للدخول إلى النظام' 
              : 'Choose the appropriate way to access the system'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="h-4 w-4" />
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </TabsTrigger>
            <TabsTrigger value="signup" className="gap-2">
              <UserPlus className="h-4 w-4" />
              {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6 space-y-5">
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
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6 space-y-5">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                  <UserPlus className="h-8 w-8 text-primary dark:text-[#d4af37]" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">
                {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'للبدء، يرجى إكمال عملية التسجيل عبر صفحة التسجيل المتخصصة' 
                  : 'To get started, please complete the registration process through our dedicated sign-up page'}
              </p>
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  setLocation('/onboarding');
                }}
                className="w-full h-11 bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-medium shadow-sm hover:shadow-md transition-all"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'بدء التسجيل' : 'Start Registration'}
              </Button>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' 
                  ? 'ستتمكن من إدخال معلومات الشركة والموقع والمزيد' 
                  : 'You\'ll be able to enter company information, location, and more'}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

