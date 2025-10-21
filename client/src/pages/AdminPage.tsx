import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { LogOut, User, Users, Package, FileText, Truck, ChevronRight, ShoppingCart, Menu, Settings, Edit, ClipboardList } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useState } from 'react';

export default function AdminPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const dashboardCards = [
    {
      id: 'ltas',
      path: '/admin/ltas',
      icon: FileText,
      titleEn: 'LTA Management',
      titleAr: 'إدارة الاتفاقيات',
      descEn: 'Manage contracts, products, and clients',
      descAr: 'إدارة العقود والمنتجات والعملاء',
      gradient: 'from-blue-500/20 to-cyan-500/10',
      hoverGradient: 'from-blue-500/30 to-cyan-500/20',
      testId: 'card-manage-ltas'
    },
    {
      id: 'clients',
      path: '/admin/clients',
      icon: Users,
      titleEn: 'Client Management',
      titleAr: 'إدارة العملاء',
      descEn: 'Manage client information and users',
      descAr: 'إدارة معلومات العملاء والمستخدمين',
      gradient: 'from-purple-500/20 to-pink-500/10',
      hoverGradient: 'from-purple-500/30 to-pink-500/20',
      testId: 'card-manage-clients'
    },
    {
      id: 'products',
      path: '/admin/products',
      icon: Package,
      titleEn: 'Product Catalog',
      titleAr: 'كتالوج المنتجات',
      descEn: 'Manage product catalog',
      descAr: 'إدارة كتالوج المنتجات',
      gradient: 'from-[#d4af37]/20 to-[#f9c800]/10',
      hoverGradient: 'from-[#d4af37]/30 to-[#f9c800]/20',
      testId: 'card-manage-products'
    },
    {
      id: 'vendors',
      path: '/admin/vendors',
      icon: Truck,
      titleEn: 'Vendor Management',
      titleAr: 'إدارة الموردين',
      descEn: 'Manage vendor information',
      descAr: 'إدارة معلومات الموردين',
      gradient: 'from-green-500/20 to-emerald-500/10',
      hoverGradient: 'from-green-500/30 to-emerald-500/20',
      testId: 'card-manage-vendors'
    },
    {
      id: 'price-management',
      path: '/admin/price-management',
      icon: FileText,
      titleEn: 'Price Management',
      titleAr: 'إدارة الأسعار',
      descEn: 'Manage price requests and offers',
      descAr: 'إدارة طلبات وعروض الأسعار',
      gradient: 'from-orange-500/20 to-purple-500/10',
      hoverGradient: 'from-orange-500/30 to-purple-500/20',
      testId: 'card-price-management'
    },
    {
      id: 'orders',
      path: '/admin/orders',
      icon: ClipboardList,
      titleEn: 'Order Management',
      titleAr: 'إدارة الطلبات',
      descEn: 'View orders, manage modifications & cancellations',
      descAr: 'عرض الطلبات وإدارة التعديلات والإلغاءات',
      gradient: 'from-indigo-500/20 to-blue-500/10',
      hoverGradient: 'from-indigo-500/30 to-blue-500/20',
      testId: 'card-orders'
    },
    {
      id: 'reports',
      path: '/admin/reports',
      icon: Settings,
      titleEn: 'System Reports',
      titleAr: 'تقارير النظام',
      descEn: 'Security audit and performance metrics',
      descAr: 'فحص الأمان ومقاييس الأداء',
      gradient: 'from-violet-500/20 to-fuchsia-500/10',
      hoverGradient: 'from-violet-500/30 to-fuchsia-500/20',
      testId: 'card-reports'
    },
    {
      id: 'templates',
      path: '/admin/templates/documents',
      icon: Edit,
      titleEn: 'Document Templates',
      titleAr: 'مكتبة المستندات',
      descEn: 'Design and manage document templates',
      descAr: 'إدارة المستندات والقوالب',
      gradient: 'from-teal-500/20 to-cyan-500/10',
      hoverGradient: 'from-teal-500/30 to-cyan-500/20',
      testId: 'card-templates'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img 
              src="/logo.png" 
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'} 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                {language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {language === 'ar' ? 'مرحباً' : 'Welcome'}, {language === 'ar' ? user?.nameAr : user?.nameEn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
              data-testid="button-ordering"
            >
              <Link href="/ordering">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>

            {/* Sidebar Menu for Secondary Actions */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'left' : 'right'} className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {language === 'ar' ? user?.nameAr : user?.nameEn}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <nav className="flex-1 py-4 space-y-1">
                    <Link href="/profile">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        data-testid="sidebar-profile"
                      >
                        <User className="h-5 w-5" />
                        <span>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                      </Button>
                    </Link>

                    <Link href="/ordering">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        data-testid="sidebar-ordering"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <span>{language === 'ar' ? 'نظام الطلبات' : 'Ordering System'}</span>
                      </Button>
                    </Link>

                    <div className="py-2">
                      <Separator />
                    </div>

                    <div className="space-y-1">
                      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                        {language === 'ar' ? 'الإعدادات' : 'Settings'}
                      </p>

                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 flex items-center justify-center">
                            🌐
                          </div>
                          <span className="text-sm">{language === 'ar' ? 'اللغة' : 'Language'}</span>
                        </div>
                        <LanguageToggle />
                      </div>

                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 flex items-center justify-center">
                            🎨
                          </div>
                          <span className="text-sm">{language === 'ar' ? 'المظهر' : 'Theme'}</span>
                        </div>
                        <ThemeToggle />
                      </div>
                    </div>
                  </nav>

                  <div className="pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                    >
                      <Link href="/logout">
                        <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-down">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {language === 'ar' ? 'لوحة التحكم الرئيسية' : 'Main Control Panel'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'إدارة جميع جوانب النظام من مكان واحد' 
              : 'Manage all aspects of the system from one place'}
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;
            const isHovered = hoveredCard === card.id;

            return (
              <Card 
                key={card.id}
                className={`
                  relative overflow-hidden cursor-pointer group
                  bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm 
                  border-border/50 dark:border-[#d4af37]/20 
                  hover:border-primary dark:hover:border-[#d4af37] 
                  hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 
                  transition-all duration-500 ease-out
                  ${isHovered ? 'scale-105 -translate-y-2' : 'scale-100'}
                  animate-fade-in
                `}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setLocation(card.path)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                data-testid={card.testId}
              >
                {/* Gradient Overlay */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${isHovered ? card.hoverGradient : card.gradient}
                  transition-all duration-500 opacity-0 group-hover:opacity-100
                `} />

                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <CardHeader className="p-4 sm:p-6 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`
                        p-3 rounded-xl 
                        bg-gradient-to-br ${card.gradient}
                        group-hover:scale-110 group-hover:rotate-6
                        transition-all duration-500 flex-shrink-0
                        border border-white/10
                      `}>
                        <Icon className={`
                          h-6 w-6 text-primary dark:text-[#d4af37]
                          group-hover:text-primary dark:group-hover:text-[#f9c800]
                          transition-colors duration-300
                        `} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg text-foreground dark:text-white mb-1">
                          {language === 'ar' ? card.titleAr : card.titleEn}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 line-clamp-2">
                          {language === 'ar' ? card.descAr : card.descEn}
                        </p>
                        {(card as any).subItems && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {(card as any).subItems.map((subItem: any) => {
                              const SubIcon = subItem.icon;
                              return (
                                <Link 
                                  key={subItem.path} 
                                  href={subItem.path}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Badge 
                                    variant="outline" 
                                    className="gap-1.5 px-2 py-1 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-colors cursor-pointer"
                                    data-testid={`badge-${subItem.path.split('/').pop()}`}
                                  >
                                    <SubIcon className="h-3 w-3" />
                                    <span className="text-xs">
                                      {language === 'ar' ? subItem.titleAr : subItem.titleEn}
                                    </span>
                                  </Badge>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`
                      h-5 w-5 text-muted-foreground flex-shrink-0
                      transition-all duration-300
                      ${isHovered ? 'translate-x-1 text-primary dark:text-[#d4af37]' : ''}
                    `} />
                  </div>
                </CardHeader>

                {/* Bottom accent line */}
                <div className={`
                  absolute bottom-0 left-0 right-0 h-1 
                  bg-gradient-to-r from-transparent via-primary dark:via-[#d4af37] to-transparent
                  transition-all duration-500
                  ${isHovered ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}
                `} />
              </Card>
            );
          })}
        </div>

        {/* Quick Stats Section (Optional) */}
        <div className="mt-12 pt-8 border-t border-border/50 dark:border-[#d4af37]/10 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? 'جميع أدوات الإدارة في متناول يدك' 
                : 'All management tools at your fingertips'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}