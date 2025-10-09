
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Package, ShoppingCart, FileText, BarChart3, ArrowRight, CheckCircle, Sparkles, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";

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
      titleEn: "Smart Ordering",
      titleAr: "نظام الطلبات الذكي",
      descEn: "Intelligent cart with order templates and automation",
      descAr: "سلة ذكية مع قوالب الطلبات والأتمتة"
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
    { icon: Zap, en: "Lightning-fast order processing", ar: "معالجة الطلبات فائقة السرعة" },
    { icon: Shield, en: "Enterprise-grade security", ar: "أمان على مستوى المؤسسات" },
    { icon: Sparkles, en: "Automated workflow management", ar: "إدارة سير العمل التلقائي" },
    { icon: CheckCircle, en: "Real-time inventory tracking", ar: "تتبع المخزون في الوقت الفعلي" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-50"></div>
              <img 
                src="/logo.png" 
                alt={isArabic ? 'شعار الشركة' : 'Company Logo'} 
                className="relative h-14 w-14 object-contain"
              />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isArabic ? 'نظام LTA' : 'LTA System'}
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              onClick={handleLogin}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isArabic ? 'تسجيل الدخول' : 'Login'}
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <img 
              src="/logo.png" 
              alt={isArabic ? 'شعار الشركة' : 'Company Logo'} 
              className="relative h-32 w-32 mx-auto object-contain drop-shadow-2xl"
              onError={(e) => {
                console.error('Logo failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          <h2 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            {isArabic ? 'نظام إدارة اتفاقيات الشراء' : 'Long Term Agreement'}
            <br />
            {isArabic ? 'طويلة الأجل' : 'Management System'}
          </h2>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {isArabic 
              ? 'منصة شاملة لإدارة العقود والطلبات والمنتجات بكفاءة عالية' 
              : 'A comprehensive platform for efficient contract, order, and product management'}
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              onClick={handleLogin} 
              className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300"
            >
              {isArabic ? 'ابدأ الآن' : 'Get Started'}
              <ArrowRight className="h-6 w-6" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20">
        <div className="w-full max-w-6xl mx-auto px-4">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" 
            dir={isArabic ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {isArabic ? 'المميزات الرئيسية' : 'Key Features'}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={index}
                  className="group relative p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 overflow-hidden" 
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative mb-4 inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300">
                    <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  
                  <h3 className="relative font-bold text-xl mb-3 text-slate-800 dark:text-slate-100">
                    {isArabic ? feature.titleAr : feature.titleEn}
                  </h3>
                  
                  <p className="relative text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isArabic ? feature.descAr : feature.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl sm:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" 
            dir={isArabic ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {isArabic ? 'لماذا تختارنا؟' : 'Why Choose Us?'}
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div 
                  key={index}
                  className="flex items-center gap-4 p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                    {isArabic ? benefit.ar : benefit.en}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">
              {isArabic ? 'جاهز للبدء؟' : 'Ready to Get Started?'}
            </h3>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
              {isArabic ? 'انضم إلى النظام الآن وابدأ في إدارة عقودك بكفاءة' : 'Join the system now and start managing your contracts efficiently'}
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                {isArabic ? 'تسجيل الدخول الآن' : 'Login Now'}
                <ArrowRight className="h-6 w-6" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
