import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Package, ShoppingCart, FileText, BarChart3 } from "lucide-react";

export default function LandingPage() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4" dir={isArabic ? 'rtl' : 'ltr'}>
              {isArabic ? 'نظام إدارة اتفاقيات الإمداد طويلة الأجل' : 'LTA Contract Fulfillment System'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" dir={isArabic ? 'rtl' : 'ltr'}>
              {isArabic 
                ? 'منصة شاملة لإدارة العقود والطلبات والعملاء بكفاءة'
                : 'A comprehensive platform for managing contracts, orders, and clients efficiently'}
            </p>
          </div>

          <div className="mb-12">
            <Button 
              size="lg"
              onClick={handleLogin}
              className="text-lg px-8 py-6"
              data-testid="button-login"
            >
              {isArabic ? 'تسجيل الدخول' : 'Log In'}
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 w-full max-w-5xl">
            <div className="p-6 rounded-lg border bg-card text-card-foreground" dir={isArabic ? 'rtl' : 'ltr'}>
              <Package className="h-10 w-10 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">
                {isArabic ? 'إدارة المنتجات' : 'Product Management'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'كتالوج رئيسي مع الصور والبيانات الوصفية المخصصة'
                  : 'Master catalog with images and custom metadata'}
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card text-card-foreground" dir={isArabic ? 'rtl' : 'ltr'}>
              <FileText className="h-10 w-10 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">
                {isArabic ? 'عقود LTA' : 'LTA Contracts'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'إدارة العقود مع تعيين العملاء والمنتجات'
                  : 'Manage contracts with client and product assignments'}
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card text-card-foreground" dir={isArabic ? 'rtl' : 'ltr'}>
              <ShoppingCart className="h-10 w-10 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">
                {isArabic ? 'نظام الطلبات' : 'Ordering System'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'سلة ذكية مع قوالب الطلبات وتكامل Pipefy'
                  : 'Smart cart with order templates and Pipefy integration'}
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card text-card-foreground" dir={isArabic ? 'rtl' : 'ltr'}>
              <BarChart3 className="h-10 w-10 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">
                {isArabic ? 'لوحة الإدارة' : 'Admin Dashboard'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'إدارة كاملة للعملاء والمنتجات والعقود'
                  : 'Complete control over clients, products, and contracts'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
