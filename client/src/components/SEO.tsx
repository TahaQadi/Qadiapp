
import { Helmet } from 'react-helmet-async';
import { useLanguage } from './LanguageProvider';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  structuredData?: object;
  noIndex?: boolean;
}

export function SEO({
  title,
  description,
  keywords,
  image = '/logo.png',
  url,
  type = 'website',
  structuredData,
  noIndex = false,
}: SEOProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const defaultTitle = isArabic 
    ? 'بوابة القاضي - نظام إدارة الطلبات' 
    : 'Al Qadi Portal - Order Management System';
  
  const defaultDescription = isArabic
    ? 'نظام متكامل لإدارة الطلبات والعقود مع أسعار مخصصة، متابعة الطلبات، وإدارة الفواتير'
    : 'Complete order management system with custom contracts, pricing, order tracking, and invoice management';

  const pageTitle = title ? `${title} | Al Qadi Portal` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const currentUrl = url || window.location.href;
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

  const defaultKeywords = isArabic
    ? 'القاضي, إدارة طلبات, نظام شراء, عقود, أسعار مخصصة, فلسطين'
    : 'Al Qadi, order management, procurement system, contracts, custom pricing, Palestine';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={language} dir={isArabic ? 'rtl' : 'ltr'} />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:locale" content={isArabic ? 'ar_PS' : 'en_US'} />
      <meta property="og:site_name" content="Al Qadi Portal" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Alternate Language Links */}
      <link rel="alternate" hrefLang="en" href={currentUrl.replace(/[?&]lang=ar/, '')} />
      <link rel="alternate" hrefLang="ar" href={currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'lang=ar'} />
      <link rel="alternate" hrefLang="x-default" href={currentUrl.replace(/[?&]lang=ar/, '')} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
