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
  SidebarRail,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { User, Settings, LogOut, Package, FileText, History, FolderOpen, DollarSign, ShoppingCart, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <Sidebar variant="inset" collapsible="icon" side={isArabic ? 'left' : 'right'}>
      <SidebarHeader className="border-b">
        {user && (
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="font-semibold truncate text-sm">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        )}
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
                  className="h-11"
                >
                  <Package className="h-5 w-5" />
                  <span>{isArabic ? 'منتجات الاتفاقيات' : 'LTA Products'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === 'templates'}
                  onClick={() => handleTabClick('templates')}
                  tooltip={t('templates')}
                  className="h-11"
                >
                  <FileText className="h-5 w-5" />
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
                  className="h-11"
                >
                  <DollarSign className="h-5 w-5" />
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
                  className="h-11"
                >
                  <History className="h-5 w-5" />
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
                  className="h-11"
                >
                  <FolderOpen className="h-5 w-5" />
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
                <SidebarMenuButton asChild tooltip={isArabic ? 'الملف الشخصي' : 'Profile'} className="h-11">
                  <Link href="/profile">
                    <User className="h-5 w-5" />
                    <span>{isArabic ? 'الملف الشخصي' : 'Profile'}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={isArabic ? 'لوحة الإدارة' : 'Admin Panel'} className="h-11">
                    <Link href="/admin">
                      <Settings className="h-5 w-5" />
                      <span>{isArabic ? 'لوحة الإدارة' : 'Admin Panel'}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={isArabic ? 'الكتالوج' : 'Catalog'} className="h-11">
                  <Link href="/catalog">
                    <Boxes className="h-5 w-5" />
                    <span>{isArabic ? 'الكتالوج' : 'Catalog'}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={isArabic ? 'الطلبات' : 'Orders'} className="h-11">
                  <Link href="/orders">
                    <ShoppingCart className="h-5 w-5" />
                    <span>{isArabic ? 'الطلبات' : 'Orders'}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="space-y-2 px-3 py-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">{isArabic ? 'اللغة' : 'Language'}</span>
                <LanguageToggle />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">{isArabic ? 'المظهر' : 'Theme'}</span>
                <ThemeToggle />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={isArabic ? 'تسجيل الخروج' : 'Logout'} className="h-11">
              <Link href="/logout">
                <LogOut className="h-5 w-5" />
                <span>{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
