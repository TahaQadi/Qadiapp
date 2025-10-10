import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Users, Package, FileText, Truck } from 'lucide-react';
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
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img 
              src="/logo.png" 
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'} 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain filter drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0"
            />
            <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent truncate">
              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card 
            className="bg-[#222222]/50 backdrop-blur-sm border-[#d4af37]/20 hover:border-[#d4af37] hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all duration-300 cursor-pointer group" 
            onClick={() => setLocation('/admin/ltas')}
            data-testid="card-manage-ltas"
          >
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/10 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/20 transition-all duration-300 flex-shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-[#d4af37]" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg text-white">
                    {language === 'ar' ? 'إدارة الاتفاقيات' : 'LTA Management'}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
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
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/10 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/20 transition-all duration-300 flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#d4af37]" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg text-white">
                    {language === 'ar' ? 'إدارة العملاء' : 'Client Management'}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
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
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/10 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/20 transition-all duration-300 flex-shrink-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-[#d4af37]" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg text-white">
                    {language === 'ar' ? 'إدارة المنتجات' : 'Manage Products'}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {language === 'ar' ? 'إدارة كتالوج المنتجات' : 'Manage product catalog'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="bg-[#222222]/50 backdrop-blur-sm border-[#d4af37]/20 hover:border-[#d4af37] hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all duration-300 cursor-pointer group" 
            onClick={() => setLocation('/admin/vendors')}
            data-testid="card-manage-vendors"
          >
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/10 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/20 transition-all duration-300 flex-shrink-0">
                  <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-[#d4af37]" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg text-white">
                    {language === 'ar' ? 'إدارة الموردين' : 'Vendor Management'}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {language === 'ar' ? 'إدارة معلومات الموردين' : 'Manage vendor information'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="bg-[#222222]/50 backdrop-blur-sm border-[#d4af37]/20 hover:border-[#d4af37] hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all duration-300 cursor-pointer group" 
            onClick={() => setLocation('/admin/price-requests')}
            data-testid="card-price-requests"
          >
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/10 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/20 transition-all duration-300 flex-shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-[#d4af37]" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg text-white">
                    {language === 'ar' ? 'طلبات الأسعار' : 'Price Requests'}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {language === 'ar' ? 'إدارة طلبات عروض الأسعار من العملاء' : 'Manage client price quote requests'}
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