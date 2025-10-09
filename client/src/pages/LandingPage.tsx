
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Package, ShoppingCart, FileText, BarChart3, ArrowRight, CheckCircle, MessageSquare, TrendingUp, LogIn, PlayCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const steps = [
    {
      icon: LogIn,
      titleEn: "Create Account",
      titleAr: "إنشاء الحساب",
      descEn: "Access your company account with approved contract prices",
      descAr: "الدخول إلى حساب الشركة بمعلومات العقد والأسعار المعتمدة"
    },
    {
      icon: ShoppingCart,
      titleEn: "Smart Ordering",
      titleAr: "الطلب الذكي",
      descEn: "Add items or use recurring order templates",
      descAr: "إضافة الأصناف أو استخدام قوالب الطلبات المتكررة"
    },
    {
      icon: Package,
      titleEn: "Track & Deliver",
      titleAr: "التتبع والتسليم",
      descEn: "View order status, invoices, and supply history in one dashboard",
      descAr: "عرض حالة الطلب والفواتير وسجل التوريد في لوحة واحدة"
    }
  ];

  const features = [
    {
      icon: FileText,
      titleEn: "Custom Contracts & Pricing",
      titleAr: "عقود وأسعار مخصصة",
    },
    {
      icon: Package,
      titleEn: "Live Order Tracking",
      titleAr: "تتبع مباشر للطلبات",
    },
    {
      icon: ShoppingCart,
      titleEn: "Order & Invoice History",
      titleAr: "سجل الطلبات والفواتير",
    },
    {
      icon: BarChart3,
      titleEn: "Analytics & Insights",
      titleAr: "تحليلات ومؤشرات استهلاك",
    },
    {
      icon: MessageSquare,
      titleEn: "Direct Communication",
      titleAr: "تواصل مباشر مع فريق القاضي",
    }
  ];

  const benefits = [
    { en: "Save Time & Focus on Your Business", ar: "وفّر وقتك وركز على عملك" },
    { en: "Precision & Accuracy in Every Order", ar: "دقة في كل طلب" },
    { en: "24/7 Access Anytime, Anywhere", ar: "وصول على مدار الساعة" }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated gold particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#f9c800]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d4af37]/3 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/95 backdrop-blur-xl border-b border-[#d4af37]/20' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f9c800] rounded-xl blur-lg opacity-50"></div>
              <img 
                src="/logo.png" 
                alt={isArabic ? 'شعار القاضي' : 'Al Qadi Logo'} 
                className="relative h-14 w-14 object-contain"
              />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent">
              {isArabic ? 'بوابة القاضي' : 'Al Qadi Portal'}
            </h1>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button 
              onClick={handleLogin}
              className="bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-semibold shadow-lg hover:shadow-[#d4af37]/50 transition-all duration-300"
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-32 pb-20 min-h-screen flex items-center">
        <div className="w-full" dir={isArabic ? 'rtl' : 'ltr'}>
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f9c800] rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <img 
                src="/logo.png" 
                alt={isArabic ? 'شعار القاضي' : 'Al Qadi Logo'} 
                className="relative h-32 w-32 mx-auto object-contain drop-shadow-2xl"
              />
            </div>
            
            <h2 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f9c800] to-[#d4af37] bg-clip-text text-transparent">
                {isArabic ? 'إدارة طلباتك أصبحت أسهل' : 'Order Management Made Easy'}
              </span>
              <br />
              <span className="text-white/90">
                {isArabic ? 'مع بوابة القاضي' : 'with Al Qadi Portal'}
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              {isArabic 
                ? 'تحكم بعقودك، قدّم طلباتك، وتابع تنفيذها بسهولة ووضوح' 
                : 'Manage your contracts, submit orders, and track execution with ease and clarity'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  onClick={handleLogin} 
                  className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-bold shadow-2xl hover:shadow-[#d4af37]/50 transition-all duration-300"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2 text-lg px-8 py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300"
                >
                  {isArabic ? 'طلب حساب تجريبي' : 'Request Demo'}
                  <PlayCircle className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 bg-gradient-to-b from-transparent via-[#222222]/50 to-transparent">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl sm:text-5xl font-bold mb-16 text-center" 
            dir={isArabic ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent">
              {isArabic ? 'كيف يعمل النظام' : 'How It Works'}
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={index}
                  className="relative p-8 rounded-2xl bg-[#222222] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f9c800] flex items-center justify-center text-black font-bold text-xl">
                    {index + 1}
                  </div>
                  
                  <div className="mt-16 mb-4">
                    <Icon className="h-12 w-12 text-[#d4af37]" />
                  </div>
                  
                  <h3 className="font-bold text-2xl mb-3 text-white">
                    {isArabic ? step.titleAr : step.titleEn}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed">
                    {isArabic ? step.descAr : step.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl sm:text-5xl font-bold mb-16 text-center" 
            dir={isArabic ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent">
              {isArabic ? 'المميزات الرئيسية' : 'Key Features'}
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={index}
                  className="group relative p-8 rounded-2xl bg-[#222222] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <div className="mb-4 inline-flex p-4 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/20 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/30 transition-all duration-300">
                    <Icon className="h-8 w-8 text-[#d4af37]" />
                  </div>
                  
                  <h3 className="font-bold text-xl text-white">
                    {isArabic ? feature.titleAr : feature.titleEn}
                  </h3>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Use It */}
      <section className="relative py-24 bg-gradient-to-b from-transparent via-[#222222]/50 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-12" dir={isArabic ? 'rtl' : 'ltr'}>
              <span className="bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent">
                {isArabic ? 'وفّر وقتك، وركز على عملك' : 'Save Time, Focus on Your Business'}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center gap-3 p-6 rounded-xl bg-[#222222] border border-[#d4af37]/20"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <CheckCircle className="h-6 w-6 text-[#d4af37] flex-shrink-0" />
                  <p className="text-lg font-semibold text-white">
                    {isArabic ? benefit.ar : benefit.en}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-[#d4af37]/10 via-[#f9c800]/10 to-[#d4af37]/10 border border-[#d4af37]/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="h-16 w-16 text-[#d4af37] mx-auto mb-6" />
            <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white" dir={isArabic ? 'rtl' : 'ltr'}>
              {isArabic ? 'ابدأ الآن وجرّب الراحة في إدارة مشترياتك' : 'Start Now and Experience Easy Procurement Management'}
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  onClick={handleLogin}
                  className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-bold shadow-2xl hover:shadow-[#d4af37]/50 transition-all duration-300"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2 text-lg px-8 py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300"
                >
                  {isArabic ? 'طلب عرض توضيحي' : 'Request Demo'}
                  <PlayCircle className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#d4af37]/20 bg-[#222222]/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt={isArabic ? 'شعار القاضي' : 'Al Qadi Logo'} 
                className="h-12 w-12 object-contain"
              />
              <div>
                <p className="text-sm text-gray-400">© 2025 Al Qadi Co.</p>
                <p className="text-xs text-gray-500">{isArabic ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
              </div>
            </div>
            <div className="text-center text-sm text-gray-400">
              <p>{isArabic ? 'تواصل معنا' : 'Contact Us'}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
