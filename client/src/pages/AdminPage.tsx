import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Users, Package, FileText } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function AdminPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1a1a] to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#d4af37]/20 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'} 
              className="h-10 w-10 object-contain filter drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]"
            />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent">
              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hover:bg-[#d4af37]/10 hover:text-[#d4af37] transition-all duration-300"
              data-testid="button-profile"
            >
              <Link href="/profile">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hover:bg-[#d4af37]/10 hover:text-[#d4af37] transition-all duration-300"
              data-testid="button-ordering"
            >
              <Link href="/">
                <Package className="h-5 w-5" />
              </Link>
            </Button>
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
              className="hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            className="bg-[#222222]/50 backdrop-blur-sm border-[#d4af37]/20 hover:border-[#d4af37] hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all duration-300 cursor-pointer group" 
            onClick={() => setLocation('/admin/ltas')}
            data-testid="card-manage-ltas"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/10 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/20 transition-all duration-300">
                  <FileText className="h-6 w-6 text-[#d4af37]" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">
                    {language === 'ar' ? 'إدارة الاتفاقيات' : 'LTA Management'}
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {language === 'ar' ? 'إدارة العقود والمنتجات والعملاء' : 'Manage contracts, products, and clients'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="bg-[#222222]/50 backdrop-blur-sm border-[#d4af37]/20 hover:border-[#d4af37] hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all duration-300 cursor-pointer group" 
            onClick={() => setLocation('/admin/clients')}
            data-testid="card-manage-clients"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/10 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/20 transition-all duration-300">
                  <Users className="h-6 w-6 text-[#d4af37]" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">
                    {language === 'ar' ? 'إدارة العملاء' : 'Client Management'}
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {language === 'ar' ? 'إدارة معلومات العملاء والمستخدمين' : 'Manage client information and users'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="bg-[#222222]/50 backdrop-blur-sm border-[#d4af37]/20 hover:border-[#d4af37] hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all duration-300 cursor-pointer group" 
            onClick={() => setLocation('/admin/products')}
            data-testid="card-manage-products"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/10 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/20 transition-all duration-300">
                  <Package className="h-6 w-6 text-[#d4af37]" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">
                    {language === 'ar' ? 'إدارة المنتجات' : 'Manage Products'}
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {language === 'ar' ? 'إدارة كتالوج المنتجات' : 'Manage product catalog'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}