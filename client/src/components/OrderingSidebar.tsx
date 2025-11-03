import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { useTranslation } from 'react-i18next';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { User, Settings, LogOut, Package, FileText, History, FolderOpen, DollarSign, Moon } from 'lucide-react';

interface OrderingSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  cartItemCount?: number;
  ordersCount?: number;
  templatesCount?: number;
  priceOffersCount?: number;
  ltaDocumentsCount?: number;
}

export function OrderingSidebar({
  activeTab,
  onTabChange,
  cartItemCount = 0,
  ordersCount = 0,
  templatesCount = 0,
  priceOffersCount = 0,
  ltaDocumentsCount = 0,
}: OrderingSidebarProps): JSX.Element {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const isArabic = language === 'ar';

  const handleTabClick = (tab: string): void => {
    onTabChange?.(tab);
  };

  return (
    <Sidebar variant="inset" collapsible="icon" side="right">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-2 py-4">
          <img
            src="/logo.png"
            alt={isArabic ? 'شعار الشركة' : 'Company Logo'}
            className="h-8 w-8 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0"
          />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-bold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
              {isArabic ? 'بوابة القاضي' : 'AlQadi Gate'}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {isArabic ? 'مرحباً' : 'Welcome'}, {user?.name}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>{isArabic ? 'الوحدات' : 'Modules'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'lta-products'}
                  onClick={() => handleTabClick('lta-products')}
                  tooltip={isArabic ? 'منتجات الاتفاقيات' : 'LTA Products'}
                >
                  <Package className="h-4 w-4" />
                  <span>{isArabic ? 'منتجات الاتفاقيات' : 'LTA Products'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'templates'}
                  onClick={() => handleTabClick('templates')}
                  tooltip={t('templates')}
                >
                  <FileText className="h-4 w-4" />
                  <span>{t('templates')}</span>
                  {templatesCount > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">{templatesCount}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'price-offers'}
                  onClick={() => handleTabClick('price-offers')}
                  tooltip={isArabic ? 'عروض الأسعار' : 'Price Offers'}
                >
                  <DollarSign className="h-4 w-4" />
                  <span>{isArabic ? 'عروض الأسعار' : 'Price Offers'}</span>
                  {priceOffersCount > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">{priceOffersCount}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'history'}
                  onClick={() => handleTabClick('history')}
                  tooltip={t('history')}
                >
                  <History className="h-4 w-4" />
                  <span>{t('history')}</span>
                  {ordersCount > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">{ordersCount}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'lta-documents'}
                  onClick={() => handleTabClick('lta-documents')}
                  tooltip={isArabic ? 'مستندات الاتفاقيات' : 'LTA Documents'}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>{isArabic ? 'مستندات الاتفاقيات' : 'LTA Documents'}</span>
                  {ltaDocumentsCount > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">{ltaDocumentsCount}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Account Section */}
        <SidebarGroup>
          <SidebarGroupLabel>{isArabic ? 'الحساب' : 'Account'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={isArabic ? 'الملف الشخصي' : 'Profile'}>
                  <Link href="/profile">
                    <User className="h-4 w-4" />
                    <span>{isArabic ? 'الملف الشخصي' : 'Profile'}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={isArabic ? 'لوحة الإدارة' : 'Admin Panel'}>
                    <Link href="/admin">
                      <Settings className="h-4 w-4" />
                      <span>{isArabic ? 'لوحة الإدارة' : 'Admin Panel'}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel>{isArabic ? 'الإعدادات' : 'Settings'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌐</span>
                    <span className="text-sm">{isArabic ? 'اللغة' : 'Language'}</span>
                  </div>
                  <LanguageToggle />
                </div>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <span className="text-sm">{isArabic ? 'الوضع الليلي' : 'Dark Mode'}</span>
                  </div>
                  <ThemeToggle />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={isArabic ? 'تسجيل الخروج' : 'Logout'}>
              <Link href="/logout">
                <LogOut className="h-4 w-4" />
                <span>{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
