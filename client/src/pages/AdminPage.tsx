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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
            </h1>
            <Badge variant="secondary" className="hidden md:flex">
              {language === 'ar' ? user?.nameAr : user?.nameEn}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
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
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            className="hover-elevate cursor-pointer" 
            onClick={() => setLocation('/admin/ltas')}
            data-testid="card-manage-ltas"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'إدارة الاتفاقيات' : 'LTA Management'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ar' ? 'إدارة العقود والمنتجات والعملاء' : 'Manage contracts, products, and clients'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="hover-elevate cursor-pointer" 
            onClick={() => setLocation('/admin/clients')}
            data-testid="card-manage-clients"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'إدارة العملاء' : 'Client Management'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ar' ? 'إدارة معلومات العملاء والمستخدمين' : 'Manage client information and users'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="hover-elevate cursor-pointer" 
            onClick={() => setLocation('/admin/products')}
            data-testid="card-manage-products"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'إدارة المنتجات' : 'Manage Products'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
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
