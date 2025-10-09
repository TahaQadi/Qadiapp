import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Package, ShoppingCart, FileText, BarChart3, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion"; // Import motion for animations

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
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt={isArabic ? 'شعار الشركة' : 'Company Logo'} 
              className="h-14 w-14 object-contain"
            />
            <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
              {isArabic ? 'نظام LTA' : 'LTA System'}
            </h1>
          </div>
          <Button onClick={handleLogin}>
            {isArabic ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img 
            src="/logo.png" 
            alt={isArabic ? 'شعار الشركة' : 'Company Logo'} 
            className="h-32 w-32 mx-auto mb-8 object-contain"
            onError={(e) => {
              console.error('Logo failed to load');
              e.currentTarget.style.display = 'none';
            }}
          />
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            {isArabic ? 'نظام إدارة اتفاقيات الشراء طويلة الأجل' : 'Long Term Agreement Management System'}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {isArabic 
              ? 'منصة شاملة لإدارة العقود والطلبات والمنتجات بكفاءة' 
              : 'A comprehensive platform for efficient contract, order, and product management'}
          </p>
          <Button size="lg" onClick={handleLogin} className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
            {isArabic ? 'ابدأ الآن' : 'Get Started'}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <h2 
          className="text-2xl sm:text-3xl font-semibold mb-8 text-center" 
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          {isArabic ? 'المميزات الرئيسية' : 'Key Features'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={index}
                className="p-6 rounded-xl border bg-card text-card-foreground hover-elevate transition-all duration-200 hover:shadow-md" 
                dir={isArabic ? 'rtl' : 'ltr'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
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
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 
            className="text-3xl sm:text-4xl font-bold mb-12 text-center" 
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {isArabic ? 'لماذا تختارنا؟' : 'Why Choose Us?'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-4"
                dir={isArabic ? 'rtl' : 'ltr'}
                initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CheckCircle className="h-8 w-8 text-primary shrink-0" />
                <p className="text-lg text-muted-foreground">
                  {isArabic ? benefit.ar : benefit.en}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}