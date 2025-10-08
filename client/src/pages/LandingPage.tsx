
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Package, ShoppingCart, FileText, BarChart3, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const features = [
    {
      icon: Package,
      titleEn: "Product Management",
      titleAr: "إدارة المنتجات",
      descEn: "Master catalog with images and custom metadata",
      descAr: "كتالوج رئيسي مع الصور والبيانات الوصفية المخصصة"
    },
    {
      icon: FileText,
      titleEn: "LTA Contracts",
      titleAr: "عقود LTA",
      descEn: "Manage contracts with client and product assignments",
      descAr: "إدارة العقود مع تعيين العملاء والمنتجات"
    },
    {
      icon: ShoppingCart,
      titleEn: "Ordering System",
      titleAr: "نظام الطلبات",
      descEn: "Smart cart with order templates and Pipefy integration",
      descAr: "سلة ذكية مع قوالب الطلبات وتكامل Pipefy"
    },
    {
      icon: BarChart3,
      titleEn: "Admin Dashboard",
      titleAr: "لوحة الإدارة",
      descEn: "Complete control over clients, products, and contracts",
      descAr: "إدارة كاملة للعملاء والمنتجات والعقود"
    }
  ];

  const benefits = [
    { en: "Streamlined contract fulfillment", ar: "تنفيذ العقود بكفاءة" },
    { en: "Automated order processing", ar: "معالجة الطلبات تلقائياً" },
    { en: "Real-time inventory tracking", ar: "تتبع المخزون في الوقت الفعلي" },
    { en: "Multi-client management", ar: "إدارة عملاء متعددين" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[85vh] text-center py-16">
          <div className="mb-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <CheckCircle className="h-4 w-4" />
              <span>{isArabic ? 'منصة موثوقة وآمنة' : 'Trusted & Secure Platform'}</span>
            </div>
            
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent" 
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {isArabic ? 'نظام إدارة اتفاقيات الإمداد طويلة الأجل' : 'LTA Contract Fulfillment System'}
            </h1>
            
            <p 
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed" 
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {isArabic 
                ? 'منصة شاملة لإدارة العقود والطلبات والعملاء بكفاءة وسهولة'
                : 'A comprehensive platform for managing contracts, orders, and clients efficiently'}
            </p>

            {/* Benefits Pills */}
            <div className="flex flex-wrap gap-3 justify-center mt-8" dir={isArabic ? 'rtl' : 'ltr'}>
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm"
                >
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{isArabic ? benefit.ar : benefit.en}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <Button 
              size="lg"
              onClick={handleLogin}
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-200 group"
              data-testid="button-login"
            >
              {isArabic ? 'تسجيل الدخول' : 'Get Started'}
              <ArrowRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${isArabic ? 'mr-2 group-hover:-translate-x-1' : 'ml-2'}`} />
            </Button>
          </div>

          {/* Features Grid */}
          <div className="w-full max-w-6xl">
            <h2 
              className="text-2xl sm:text-3xl font-semibold mb-8" 
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {isArabic ? 'المميزات الرئيسية' : 'Key Features'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index}
                    className="p-6 rounded-xl border bg-card text-card-foreground hover-elevate transition-all duration-200 hover:shadow-md" 
                    dir={isArabic ? 'rtl' : 'ltr'}
                  >
                    <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {isArabic ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isArabic ? feature.descAr : feature.descEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
