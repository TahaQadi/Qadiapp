import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ArrowLeft, User, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Link } from 'wouter';

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { language } = useLanguage();

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
                <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                    <Building2 className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                  </div>
                  {language === 'ar' ? 'معلومات العميل' : 'Client Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      <Building2 className="h-4 w-4" />
                      {language === 'ar' ? 'القسم' : 'Department'}
                    </p>
                    <p className="font-medium text-foreground dark:text-white">{user.department || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {language === 'ar' ? 'الموقع' : 'Location'}
                    </p>
                    <p className="font-medium text-foreground dark:text-white">{user.location || '-'}</p>
                  </div>
                  {user.client?.phone && (
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10 md:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </p>
                      <p className="font-medium text-foreground dark:text-white">{user.client.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}