import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Package, ShoppingCart, FileText, BarChart3, ArrowRight, CheckCircle, MessageSquare, TrendingUp, LogIn, PlayCircle, Sparkles, Phone, Users, Clock, History, DollarSign, Edit, MapPin, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { DemoRequestDialog } from "@/components/DemoRequestDialog";
import { AuthDialog } from "@/components/AuthDialog";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState<'login' | 'signup'>('login');

  // Check URL params for auth dialog
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      setAuthDialogTab(authParam);
      setAuthDialogOpen(true);
      // Clean URL
      window.history.replaceState({}, '', '/landing');
    }
  }, []);

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
  
  // Debounced scroll handler for performance
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Statistics data
  const statistics = [
    { 
      value: 1000, 
      suffix: '+', 
      labelEn: 'Orders Processed', 
      labelAr: 'طلب معالجة',
      icon: ShoppingCart 
    },
    { 
      value: 150, 
      suffix: '+', 
      labelEn: 'Active Clients', 
      labelAr: 'عميل نشط',
      icon: Users 
    },
    { 
      value: 5000, 
      suffix: '+', 
      labelEn: 'Products Available', 
      labelAr: 'منتج متاح',
      icon: Package 
    },
    { 
      value: 24, 
      suffix: 'h', 
      labelEn: 'Avg Delivery Time', 
      labelAr: 'متوسط وقت التسليم',
      icon: Clock 
    }
  ];

  // Animated counter component
  const AnimatedCounter = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        },
        { threshold: 0.5 }
      );

      const element = document.getElementById(`counter-${value}`);
      if (element) observer.observe(element);

      return () => {
        if (element) observer.unobserve(element);
      };
    }, [value, isVisible]);

    useEffect(() => {
      if (!isVisible) return;
      
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [isVisible, value]);

    return (
      <div id={`counter-${value}`} className="text-center">
        <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#d4af37] mb-2">
          {count}{suffix}
        </div>
        <div className="text-sm sm:text-base text-gray-400">{label}</div>
      </div>
    );
  };

  const handleLogin = (): void => {
    setAuthDialogOpen(true);
  };

  const steps = [
    {
      icon: LogIn,
      titleEn: "Access Your LTA Contracts",
      titleAr: "الوصول إلى عقود LTA الخاصة بك",
      descEn: "Log in to view products assigned to your LTA contracts with contract-specific pricing",
      descAr: "سجل الدخول لعرض المنتجات المخصصة لعقود LTA الخاصة بك مع الأسعار المحددة في العقد"
    },
    {
      icon: ShoppingCart,
      titleEn: "Browse & Order",
      titleAr: "التصفح والطلب",
      descEn: "Browse products, add to cart, and place orders. Save frequently used orders as templates for quick reordering",
      descAr: "تصفح المنتجات، أضف إلى السلة، وقدم الطلبات. احفظ الطلبات المتكررة كقوالب للطلب السريع"
    },
    {
      icon: Package,
      titleEn: "Track & Manage",
      titleAr: "التتبع والإدارة",
      descEn: "View order history, track order status, request modifications or cancellations, and download order documents",
      descAr: "عرض سجل الطلبات، تتبع حالة الطلب، طلب التعديلات أو الإلغاءات، وتحميل مستندات الطلب"
    }
  ];

  const features = [
    {
      icon: FileText,
      titleEn: "LTA Contract-Based Access",
      titleAr: "الوصول المبني على عقود LTA",
      implemented: true
    },
    {
      icon: Package,
      titleEn: "Order Status Tracking",
      titleAr: "تتبع حالة الطلبات",
      implemented: true
    },
    {
      icon: History,
      titleEn: "Order Templates & History",
      titleAr: "قوالب الطلبات والسجل",
      implemented: true
    },
    {
      icon: Edit,
      titleEn: "Order Modifications",
      titleAr: "تعديلات الطلبات",
      implemented: true
    },
    {
      icon: DollarSign,
      titleEn: "Price Requests & Offers",
      titleAr: "طلبات الأسعار والعروض",
      implemented: true
    },
    {
      icon: MapPin,
      titleEn: "Multi-Department & Location",
      titleAr: "أقسام ومواقع متعددة",
      implemented: true
    }
  ];

  const benefits = [
    { en: "LTA Contract-Based Product Access", ar: "الوصول للمنتجات حسب عقود LTA" },
    { en: "Contract-Specific Pricing Display", ar: "عرض الأسعار المحددة في العقد" },
    { en: "Save & Reuse Order Templates", ar: "حفظ وإعادة استخدام قوالب الطلبات" },
    { en: "Request Order Modifications", ar: "طلب تعديلات على الطلبات" },
    { en: "Price Request & Offer Management", ar: "إدارة طلبات الأسعار والعروض" },
    { en: "Download Order Documents", ar: "تحميل مستندات الطلبات" }
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
      <PageLayout showAnimatedBackground={false}>
        {/* Animated background elements - optimized */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-1/3 left-1/3 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/3 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>

      {/* Header */}
      <PageHeader
        title={isArabic ? 'بوابة القاضي' : 'Al Qadi Portal'}
        showLogo={true}
        variant="transparent"
        scrollEffect={true}
        className="fixed top-0 left-0 right-0"
        actions={
          <>
            <LanguageToggle />
            <Button 
              onClick={handleLogin}
              size="sm"
              className="bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-semibold shadow-lg hover:shadow-[#d4af37]/50 transition-all duration-300 text-xs sm:text-sm"
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
          </>
        }
      />

      {/* Hero Section */}
      <section className="relative container mx-auto px-3 sm:px-4 md:px-6 pt-20 sm:pt-24 md:pt-32 pb-8 sm:pb-12 md:pb-20 min-h-screen flex items-center">
        <div className="w-full" dir={isArabic ? 'rtl' : 'ltr'}>
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Logo with optimized size */}
            <motion.div 
              className="relative inline-block mb-4 sm:mb-6 md:mb-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Glow layer - blurred logo with gold colorization */}
              <motion.img 
                src="/logo.png" 
                alt=""
                aria-hidden="true"
                loading="eager"
                className="absolute inset-0 h-24 w-24 sm:h-32 sm:w-32 md:h-48 md:w-48 lg:h-64 lg:w-64 mx-auto object-contain pointer-events-none"
                style={{
                  filter: "blur(18px) sepia(1) saturate(2) hue-rotate(15deg) brightness(1.2)",
                  WebkitFilter: "blur(18px) sepia(1) saturate(2) hue-rotate(15deg) brightness(1.2)",
                  opacity: 0.4,
                }}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Second glow layer for more intensity */}
              <motion.img 
                src="/logo.png" 
                alt=""
                aria-hidden="true"
                loading="eager"
                className="absolute inset-0 h-24 w-24 sm:h-32 sm:w-32 md:h-48 md:w-48 lg:h-64 lg:w-64 mx-auto object-contain pointer-events-none"
                style={{
                  filter: "blur(10px) sepia(1) saturate(2) hue-rotate(15deg) brightness(1.1)",
                  WebkitFilter: "blur(10px) sepia(1) saturate(2) hue-rotate(15deg) brightness(1.1)",
                  opacity: 0.5,
                }}
                animate={{
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
              />
              {/* Actual logo image on top */}
              <img 
                src="/logo.png" 
                alt={isArabic ? 'شعار القاضي' : 'Al Qadi Logo'} 
                loading="eager"
                className="relative h-24 w-24 sm:h-32 sm:w-32 md:h-48 md:w-48 lg:h-64 lg:w-64 mx-auto object-contain z-10"
              />
            </motion.div>

            {/* Improved heading with better mobile text sizes */}
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-3 sm:mb-4 md:mb-6 leading-tight px-3 sm:px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f9c800] to-[#d4af37] bg-clip-text text-transparent block mb-1 sm:mb-2">
                {isArabic ? 'إدارة طلباتك أسهل' : 'Order Management Made Easy'}
              </span>
              <span className="text-white/90 block text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                {isArabic ? 'مع منصة القاضي' : 'with Al Qadi Portal'}
              </span>
            </motion.h2>

            {/* Improved description */}
            <motion.p 
              className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 mb-6 sm:mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-3 sm:px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {isArabic 
                ? 'تحكم بعقودك، قدّم طلباتك، وتابع تنفيذها بسهولة ووضوح' 
                : 'Manage your contracts, submit orders, and track execution with ease and clarity'}
            </motion.p>

            {/* Optimized CTA buttons with better mobile spacing */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 justify-center items-stretch sm:items-center px-3 sm:px-4 max-w-lg sm:max-w-none mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button 
                  size="lg" 
                  onClick={handleLogin} 
                  className="w-full sm:w-auto gap-2 text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-bold shadow-2xl hover:shadow-[#d4af37]/50 transition-all duration-300 min-h-[44px] sm:min-h-[48px]"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
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
                  className="w-full sm:w-auto gap-2 text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 lg:py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300 min-h-[44px] sm:min-h-[48px]"
                >
                  {isArabic ? 'تصفح الكتالوج' : 'Browse Catalog'}
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
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
                  className="w-full sm:w-auto gap-2 text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 lg:py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300 min-h-[44px] sm:min-h-[48px]"
                >
                  {isArabic ? 'طلب عرض توضيحي' : 'Request Demo'}
                  <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative py-12 sm:py-16 md:py-24 bg-gradient-to-b from-transparent via-[#222222]/30 to-transparent">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {statistics.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  className="relative p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-[#222222] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300 group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-3 rounded-lg bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/20 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/30 transition-all duration-300">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#d4af37]" />
                  </div>
                  <AnimatedCounter 
                    value={stat.value} 
                    suffix={stat.suffix}
                    label={isArabic ? stat.labelAr : stat.labelEn}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-12 sm:py-16 md:py-24 bg-gradient-to-b from-transparent via-[#222222]/50 to-transparent">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={index}
                  className="relative p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-[#222222] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300 group"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f9c800] flex items-center justify-center text-black font-bold text-lg sm:text-xl group-hover:scale-110 transition-transform duration-300">
                    {index + 1}
                  </div>

                  <div className="mt-12 sm:mt-16 mb-3 sm:mb-4">
                    <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-[#d4af37] group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  <h3 className="font-bold text-xl sm:text-2xl mb-2 sm:mb-3 text-white">
                    {isArabic ? step.titleAr : step.titleEn}
                  </h3>

                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    {isArabic ? step.descAr : step.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-12 sm:py-16 md:py-24">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={index}
                  className="group relative p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-[#222222] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  {feature.implemented && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    </div>
                  )}
                  
                  <div className="mb-3 sm:mb-4 inline-flex p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9c800]/20 group-hover:from-[#d4af37]/30 group-hover:to-[#f9c800]/30 transition-all duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-[#d4af37]" />
                  </div>

                  <h3 className="font-bold text-lg sm:text-xl text-white">
                    {isArabic ? feature.titleAr : feature.titleEn}
                  </h3>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coming Soon Features */}
      <section className="relative py-12 sm:py-16 md:py-24">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
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
                  className="group relative p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-[#222222]/50 border border-[#d4af37]/10 hover:border-[#d4af37]/30 transition-all duration-300"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <span className="px-2 py-1 sm:px-3 sm:py-1 text-xs font-semibold rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
                      {isArabic ? 'قريباً' : 'Soon'}
                    </span>
                  </div>
                  
                  <div className="mb-3 sm:mb-4 inline-flex p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[#d4af37]/10 to-[#f9c800]/10 transition-all duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-[#d4af37]/70" />
                  </div>

                  <h3 className="font-bold text-lg sm:text-xl text-white mb-2">
                    {isArabic ? feature.titleAr : feature.titleEn}
                  </h3>
                  
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {isArabic ? feature.descAr : feature.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Use It */}
      <section className="relative py-12 sm:py-16 md:py-24 bg-gradient-to-b from-transparent via-[#222222]/50 to-transparent">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl bg-[#222222] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300 group"
                  dir={isArabic ? 'rtl' : 'ltr'}
                  initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#d4af37] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {isArabic ? benefit.ar : benefit.en}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-12 sm:py-16 md:py-24">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <motion.div
            className="max-w-4xl mx-auto text-center p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#d4af37]/10 via-[#f9c800]/10 to-[#d4af37]/10 border border-[#d4af37]/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Rocket className="h-12 w-12 sm:h-16 sm:w-16 text-[#d4af37] mx-auto mb-4 sm:mb-6" />
            </motion.div>
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 sm:mb-6 text-white px-3 sm:px-4" dir={isArabic ? 'rtl' : 'ltr'}>
              {isArabic ? 'ابدأ الآن وجرّب الراحة في إدارة مشترياتك' : 'Start Now and Experience Easy Procurement Management'}
            </h3>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 justify-center items-stretch sm:items-center mt-6 sm:mt-8 max-w-lg sm:max-w-none mx-auto px-3 sm:px-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  onClick={handleLogin}
                  className="w-full sm:w-auto gap-2 text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black font-bold shadow-2xl hover:shadow-[#d4af37]/50 transition-all duration-300 min-h-[44px] sm:min-h-[48px]"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = '/catalog'}
                  className="w-full sm:w-auto gap-2 text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 lg:py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300 min-h-[44px] sm:min-h-[48px]"
                >
                  {isArabic ? 'تصفح الكتالوج' : 'Browse Catalog'}
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setDemoDialogOpen(true)}
                  className="w-full sm:w-auto gap-2 text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 lg:py-6 border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300 min-h-[44px] sm:min-h-[48px]"
                >
                  {isArabic ? 'طلب عرض توضيحي' : 'Request Demo'}
                  <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Request Dialog */}
      <DemoRequestDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} />
      
      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} defaultTab={authDialogTab} />

      {/* Footer */}
      <footer className="relative border-t border-[#d4af37]/30 bg-black backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12 mb-8 md:mb-12" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* Company Info */}
            <div className="flex flex-col md:flex-row lg:flex-col items-start gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4">
                <img 
                  src="/logo.png" 
                  alt={isArabic ? 'شعار القاضي' : 'Al Qadi Logo'} 
                  className="h-14 w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] flex-shrink-0"
                />
                <div>
                  <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9c800] bg-clip-text text-transparent mb-1">
                    {isArabic ? 'شركة القاضي' : 'Al Qadi Co.'}
                  </h3>
                  <p className="text-xs md:text-sm text-white/70">
                    {isArabic ? 'للإمدادات والتوريدات' : 'Supplies & Procurement'}
                  </p>
                </div>
              </div>
              <div className="mt-2 md:mt-0 lg:mt-4">
                <p className="text-sm md:text-base text-white/90 font-medium mb-1">© 2025 Al Qadi Co.</p>
                <p className="text-xs md:text-sm text-white/60">{isArabic ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 md:space-y-5">
              <h3 className="font-semibold text-[#d4af37] mb-2 md:mb-4 text-base md:text-lg lg:text-xl">
                {isArabic ? 'تواصل معنا' : 'Contact Us'}
              </h3>
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-start lg:items-center gap-1 sm:gap-2">
                  <span className="font-medium text-[#f9c800] text-sm md:text-base whitespace-nowrap min-w-[80px] md:min-w-[100px]">
                    {isArabic ? 'البريد الإلكتروني:' : 'Email:'}
                  </span>
                  <a 
                    href="mailto:taha@qadi.ps" 
                    className="text-[#d4af37] hover:text-[#f9c800] transition-colors underline-offset-4 hover:underline text-sm md:text-base break-all"
                  >
                    taha@qadi.ps
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-start lg:items-center gap-1 sm:gap-2">
                  <span className="font-medium text-[#f9c800] text-sm md:text-base whitespace-nowrap min-w-[80px] md:min-w-[100px]">
                    {isArabic ? 'الهاتف:' : 'Phone:'}
                  </span>
                  <a 
                    href="tel:+970592555532" 
                    className="text-[#d4af37] hover:text-[#f9c800] transition-colors underline-offset-4 hover:underline text-sm md:text-base"
                  >
                    +970 59 255 5532
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-start lg:items-start gap-1 sm:gap-2">
                  <span className="font-medium text-[#f9c800] text-sm md:text-base whitespace-nowrap min-w-[80px] md:min-w-[100px]">
                    {isArabic ? 'العنوان:' : 'Address:'}
                  </span>
                  <span className="text-white/70 text-sm md:text-base leading-relaxed">
                    {isArabic ? 'البيرة - أم الشرايط بالقرب من المدرسة التركية' : 'Albierh - UmAlshrayt near Turkish school'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 md:space-y-5">
              <h3 className="font-semibold text-[#d4af37] mb-2 md:mb-4 text-base md:text-lg lg:text-xl">
                {isArabic ? 'ابدأ الآن' : 'Get Started'}
              </h3>
              <div className="space-y-3">
                <a 
                  href="https://wa.me/970592555532" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 md:gap-3 px-5 md:px-6 py-2.5 md:py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-[#25D366]/50 hover:scale-105 text-sm md:text-base"
                >
                  <Phone className="h-5 w-5 md:h-6 md:w-6" />
                  {isArabic ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
                </a>
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogin}
                    className="w-full sm:w-auto md:w-full lg:w-auto border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300 text-sm md:text-base px-4 md:px-6"
                  >
                    {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/catalog'}
                    className="w-full sm:w-auto md:w-full lg:w-auto border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300 text-sm md:text-base px-4 md:px-6"
                  >
                    {isArabic ? 'تصفح الكتالوج' : 'Browse Catalog'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 md:pt-8 border-t border-[#d4af37]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs md:text-sm text-white/60" dir={isArabic ? 'rtl' : 'ltr'}>
            <p>
              {isArabic 
                ? 'نظام إدارة الطلبات والعقود المتكامل' 
                : 'Integrated Order & Contract Management System'}
            </p>
            <div className="flex items-center gap-4">
              <span>{isArabic ? 'تم التطوير بـ' : 'Powered by'} Al Qadi</span>
            </div>
          </div>
        </div>
      </footer>
      </PageLayout>
    </>
  );
}