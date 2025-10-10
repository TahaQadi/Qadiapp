import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, ArrowLeft, User, Building2, MapPin, Phone, Mail, Edit2, Save, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const updateProfileSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nameEn: user?.client?.nameEn || '',
      nameAr: user?.client?.nameAr || '',
      email: user?.client?.email || '',
      phone: user?.client?.phone || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileForm) => {
      const res = await apiRequest('PUT', '/api/client/profile', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: language === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile Updated',
        description: language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Your changes have been saved successfully',
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile',
      });
    },
  });

  const handleSave = () => {
    form.handleSubmit((data) => {
      updateProfileMutation.mutate(data);
    })();
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'} 
              className="h-10 w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] transition-transform hover:scale-110 duration-300"
            />
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent">
                {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all duration-300"
            >
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
              className="hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 animate-slide-down">
            {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
          </h2>

          <div className="grid gap-6">
            {/* Personal Information Card */}
            <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 transition-all duration-500 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                    <User className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                  </div>
                  {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                    <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}</p>
                    <p className="font-medium text-foreground dark:text-white">{user.nameAr}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                    <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}</p>
                    <p className="font-medium text-foreground dark:text-white">{user.nameEn}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10 md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </p>
                    <p className="font-medium text-foreground dark:text-white">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information Card */}
            <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 transition-all duration-500 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                      <Building2 className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                    </div>
                    {language === 'ar' ? 'معلومات العميل' : 'Client Information'}
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                      data-testid="button-edit-profile"
                    >
                      <Edit2 className="h-4 w-4" />
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="gap-2"
                        data-testid="button-cancel-edit"
                      >
                        <X className="h-4 w-4" />
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="gap-2"
                        data-testid="button-save-profile"
                      >
                        <Save className="h-4 w-4" />
                        {updateProfileMutation.isPending 
                          ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                          : (language === 'ar' ? 'حفظ' : 'Save')
                        }
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nameAr">{language === 'ar' ? 'اسم العميل (عربي)' : 'Client Name (Arabic)'}</Label>
                      <Input
                        id="nameAr"
                        {...form.register('nameAr')}
                        data-testid="input-name-ar"
                      />
                      {form.formState.errors.nameAr && (
                        <p className="text-sm text-destructive">{form.formState.errors.nameAr.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nameEn">{language === 'ar' ? 'اسم العميل (إنجليزي)' : 'Client Name (English)'}</Label>
                      <Input
                        id="nameEn"
                        {...form.register('nameEn')}
                        data-testid="input-name-en"
                      />
                      {form.formState.errors.nameEn && (
                        <p className="text-sm text-destructive">{form.formState.errors.nameEn.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        data-testid="input-email"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...form.register('phone')}
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'اسم العميل (عربي)' : 'Client Name (Arabic)'}</p>
                      <p className="font-medium text-foreground dark:text-white">{user.client?.nameAr || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'اسم العميل (إنجليزي)' : 'Client Name (English)'}</p>
                      <p className="font-medium text-foreground dark:text-white">{user.client?.nameEn || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </p>
                      <p className="font-medium text-foreground dark:text-white">{user.client?.email || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </p>
                      <p className="font-medium text-foreground dark:text-white">{user.client?.phone || '-'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}