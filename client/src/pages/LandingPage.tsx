import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Package, ShoppingCart, FileText, BarChart3, ArrowRight, CheckCircle, MessageSquare, TrendingUp, LogIn, PlayCircle, Sparkles, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { DemoRequestDialog } from "@/components/DemoRequestDialog";

export default function LandingPage() {
  const { language, setLanguage } = useLanguage();
  const isArabic = language === 'ar';
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Al Qadi Co.",
    "alternateName": isArabic ? "شركة القاضي" : "Al Qadi Company",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo.png`,
    "description": isArabic
      ? "شركة القاضي للتوريدات - نظام متكامل لإدارة الطلبات والعقود"
      : "Al Qadi Supplies - Complete order and contract management system",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": isArabic ? "البيرة - أم الشرايط بالقرب من المدرسة التركية" : "Albierh - UmAlshrayt near Turkish school",
      "addressCountry": "PS"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+970-59-255-5532",
      "contactType": "customer service",
      "email": "taha@qadi.ps",
      "availableLanguage": ["en", "ar"]
    },
    "sameAs": [
      `https://wa.me/970592555532`
    ]
  };
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    window.location.href = '/login';
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
      implemented: true
    },
    {
      icon: Package,
      titleEn: "Live Order Tracking",
      titleAr: "تتبع مباشر للطلبات",
      implemented: true
    },
    {
      icon: ShoppingCart,
      titleEn: "Order & Invoice History",
      titleAr: "سجل الطلبات والفواتير",
      implemented: true
    },
    {
      icon: BarChart3,
      titleEn: "Analytics Dashboard",
      titleAr: "لوحة التحليلات",
      implemented: true
    },
    {
      icon: MessageSquare,
      titleEn: "Price Request System",
      titleAr: "نظام طلب الأسعار",
      implemented: true
    },
    {
      icon: TrendingUp,
      titleEn: "Multi-Location Management",
      titleAr: "إدارة مواقع متعددة",
      implemented: true
    }
  ];

  const benefits = [
    { en: "Automated Price Management", ar: "إدارة آلية للأسعار" },
    { en: "Multi-Location Support", ar: "دعم المواقع المتعددة" },
    { en: "Complete Order Templates", ar: "قوالب طلبات كاملة" },
    { en: "24/7 Access Anytime, Anywhere", ar: "وصول على مدار الساعة" },
    { en: "Contract-Based Pricing", ar: "أسعار حسب العقود" },
    { en: "Detailed Order History", ar: "سجل طلبات مفصل" }
  ];

  return (
    <>
      <SEO
        title={isArabic ? "الصفحة الرئيسية" : "Home"}
        description={isArabic 
          ? "نظام إدارة الطلبات من القاضي - تحكم بعقودك، قدّم طلباتك، وتابع تنفيذها بسهولة ووضوح"
          : "Al Qadi Order Management System - Manage your contracts, submit orders, and track execution with ease and clarity"}
        keywords={isArabic
          ? "القاضي, نظام طلبات, إدارة عقود, أسعار مخصصة, توريدات, فلسطين, البيرة"
          : "Al Qadi, order management, contract management, custom pricing, supplies, Palestine, Ramallah"}
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/95 backdrop-blur-xl border-b border-[#d4af37]/20' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f9c800] rounded-xl blur-lg opacity-50"></div>
              <img 
                src="/logo.png" 
                alt={isArabic ? 'شعار القاضي' : 'Al Qadi Logo'} 
                className="relative h-10 w-10 sm:h-14 sm:w-14 object-contain"
              />
            </div>
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent">
              {isArabic ? 'بوابة القاضي' : 'Al Qadi Portal'}
            </h1>
          </motion.div>
          <motion.div
            className="flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="border-2 border-primary/50 bg-black/50 text-primary hover:bg-primary/10 hover:border-primary hover:text-primary backdrop-blur-sm transition-all duration-300 text-sm font-sans font-semibold pl-[3px] pr-[3px]"
            >
              {language === 'en' ? 'العربية' : 'En'}
            </Button>
            <Button 
              onClick={handleLogin}
              size="sm"
              className="bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-semibold shadow-lg hover:shadow-[#d4af37]/50 transition-all duration-300 text-xs sm:text-sm"
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20 min-h-screen flex items-center">
        <div className="w-full" dir={isArabic ? 'rtl' : 'ltr'}>
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative inline-block mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f9c800] rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <img 
                src="/logo.png" 
                alt={isArabic ? 'شعار القاضي' : 'Al Qadi Logo'} 
                className="relative h-40 w-40 sm:h-64 sm:w-64 mx-auto object-contain drop-shadow-2xl"
              />
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 sm:mb-6 leading-tight px-4">
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f9c800] to-[#d4af37] bg-clip-text text-transparent text-[52px]">
                {isArabic ? 'إدارة طلباتك أسهل' : 'Order Management Made Easy'}
              </span>
              <br />
              <span className="text-white/90">
                {isArabic ? 'مع منصة القاضي' : 'with Al Qadi Portal'}
              </span>
            </h2>

            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              {isArabic 
                ? 'تحكم بعقودك، قدّم طلباتك، وتابع تنفيذها بسهولة ووضوح' 
                : 'Manage your contracts, submit orders, and track execution with ease and clarity'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 max-w-lg sm:max-w-none mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button 
                  size="lg" 
                  onClick={handleLogin} 
                  className="w-full sm:w-auto gap-2 text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-4 sm:py-5 lg:py-6 bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-bold shadow-2xl hover:shadow-[#d4af37]/50 transition-all duration-300"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = '/catalog'}
                  className="w-full sm:w-auto gap-2 text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-4 sm:py-5 lg:py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300"
                >
                  {isArabic ? 'تصفح الكتالوج' : 'Browse Catalog'}
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setDemoDialogOpen(true)}
                  className="w-full sm:w-auto gap-2 text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-4 sm:py-5 lg:py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300"
                >
                  {isArabic ? 'طلب عرض توضيحي' : 'Request Demo'}
                  <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
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
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 sm:mb-16 text-center px-4" 
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
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 sm:mb-16 text-center px-4" 
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
                  {feature.implemented && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                  
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

      {/* Coming Soon Features */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 sm:mb-16 text-center px-4" 
            dir={isArabic ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent">
              {isArabic ? 'قريباً' : 'Coming Soon'}
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Sparkles,
                titleEn: "Advanced Analytics & Reports",
                titleAr: "تقارير وتحليلات متقدمة",
                descEn: "Detailed consumption reports and predictive analytics",
                descAr: "تقارير استهلاك مفصلة وتحليلات تنبؤية"
              },
              {
                icon: MessageSquare,
                titleEn: "Real-time Notifications",
                titleAr: "إشعارات فورية",
                descEn: "Instant updates on order status and important events",
                descAr: "تحديثات فورية عن حالة الطلبات والأحداث المهمة"
              },
              {
                icon: Phone,
                titleEn: "WhatsApp Integration",
                titleAr: "تكامل واتساب",
                descEn: "Automated order confirmations and updates via WhatsApp",
                descAr: "تأكيدات وتحديثات تلقائية عبر واتساب"
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={index}
                  className="group relative p-8 rounded-2xl bg-[#222222]/50 border border-[#d4af37]/10 hover:border-[#d4af37]/30 transition-all duration-300"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
                      {isArabic ? 'قريباً' : 'Soon'}
                    </span>
                  </div>
                  
                  <div className="mb-4 inline-flex p-4 rounded-xl bg-gradient-to-br from-[#d4af37]/10 to-[#f9c800]/10 transition-all duration-300">
                    <Icon className="h-8 w-8 text-[#d4af37]/70" />
                  </div>

                  <h3 className="font-bold text-xl text-white mb-2">
                    {isArabic ? feature.titleAr : feature.titleEn}
                  </h3>
                  
                  <p className="text-gray-400 text-sm">
                    {isArabic ? feature.descAr : feature.descEn}
                  </p>
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
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-8 sm:mb-12 px-4" dir={isArabic ? 'rtl' : 'ltr'}>
              <span className="bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent">
                {isArabic ? 'وفّر وقتك، وركز على عملك' : 'Save Time, Focus on Your Business'}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                  <p className="text-base font-semibold text-white">
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
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-white px-4" dir={isArabic ? 'rtl' : 'ltr'}>
              {isArabic ? 'ابدأ الآن وجرّب الراحة في إدارة مشترياتك' : 'Start Now and Experience Easy Procurement Management'}
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mt-8 max-w-lg sm:max-w-none mx-auto px-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  onClick={handleLogin}
                  className="w-full sm:w-auto gap-2 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-bold shadow-2xl hover:shadow-[#d4af37]/50 transition-all duration-300"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = '/catalog'}
                  className="w-full sm:w-auto gap-2 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300"
                >
                  {isArabic ? 'تصفح الكتالوج' : 'Browse Catalog'}
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setDemoDialogOpen(true)}
                  className="w-full sm:w-auto gap-2 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300"
                >
                  {isArabic ? 'طلب عرض توضيحي' : 'Request Demo'}
                  <PlayCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Request Dialog */}
      <DemoRequestDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} />

      {/* Footer */}
      <footer className="relative border-t border-[#d4af37]/30 bg-black backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 sm:gap-8" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt={isArabic ? 'شعار القاضي' : 'Al Qadi Logo'} 
                className="h-12 w-12 object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
              />
              <div>
                <p className="text-sm text-white/90 font-medium">© 2025 Al Qadi Co.</p>
                <p className="text-xs text-white/60">{isArabic ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
              </div>
            </div>

            <div className="text-sm space-y-3">
              <h3 className="font-semibold text-[#d4af37] mb-3 text-base">
                {isArabic ? 'تواصل معنا' : 'Contact Us'}
              </h3>
              <p className="text-white/70">
                <span className="font-medium text-[#f9c800]">
                  {isArabic ? 'البريد الإلكتروني:' : 'Email:'}
                </span>{' '}
                <a href="mailto:taha@qadi.ps" className="text-[#d4af37] hover:text-[#f9c800] transition-colors underline-offset-4 hover:underline">
                  taha@qadi.ps
                </a>
              </p>
              <p className="text-white/70">
                <span className="font-medium text-[#f9c800]">
                  {isArabic ? 'الهاتف:' : 'Phone:'}
                </span>{' '}
                <a href="tel:+970592555532" className="text-[#d4af37] hover:text-[#f9c800] transition-colors underline-offset-4 hover:underline">
                  +970 59 255 5532
                </a>
              </p>
              <p className="text-white/70">
                <span className="font-medium text-[#f9c800]">
                  {isArabic ? 'العنوان:' : 'Address:'}
                </span>{' '}
                {isArabic ? 'البيرة - أم الشرايط بالقرب من المدرسة التركية' : 'Albierh - UmAlshrayt near Turkish school'}
              </p>
              <a 
                href="https://wa.me/970592555532" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-[#25D366]/50"
              >
                <Phone className="h-5 w-5" />
                {isArabic ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}