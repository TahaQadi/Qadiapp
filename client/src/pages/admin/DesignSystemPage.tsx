import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  GitBranch,
  Layout,
  Palette,
  Type,
  Layers,
  Zap,
  Code,
  Sparkles,
  Circle,
  Square,
} from "lucide-react";
import { Link } from "wouter";

export default function DesignSystemPage(): JSX.Element {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
            >
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#d4af37]/60 bg-clip-text text-transparent">
                {language === "ar" ? "نظام التصميم" : "Design System"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === "ar"
                  ? "مرجع التصميم وسير المستخدم والأسلاك"
                  : "Design reference, user flows, and wireframes"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 relative z-10" dir={isRTL ? "rtl" : "ltr"}>
        <Tabs defaultValue="user-flow" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto mb-6 border-border/50 dark:border-[#d4af37]/20">
            <TabsTrigger value="user-flow" className="text-sm sm:text-base min-h-[44px] gap-2 transition-all duration-300 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-[#d4af37]/10">
              <GitBranch className="h-4 w-4" />
              <span>{language === "ar" ? "سير المستخدم" : "User Flow"}</span>
            </TabsTrigger>
            <TabsTrigger value="wireframe" className="text-sm sm:text-base min-h-[44px] gap-2 transition-all duration-300 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-[#d4af37]/10">
              <Layout className="h-4 w-4" />
              <span>{language === "ar" ? "الأسلاك" : "Wireframe"}</span>
            </TabsTrigger>
            <TabsTrigger value="design-reference" className="text-sm sm:text-base min-h-[44px] gap-2 transition-all duration-300 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-[#d4af37]/10">
              <Palette className="h-4 w-4" />
              <span>{language === "ar" ? "مرجع التصميم" : "Design Reference"}</span>
            </TabsTrigger>
          </TabsList>

          {/* User Flow Tab */}
          <TabsContent value="user-flow" className="space-y-6">
            {/* Client Journey */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  {language === "ar" ? "سير العميل" : "Client Journey"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "رحلة العميل من الصفحة الرئيسية إلى تقديم الطلب"
                    : "Client journey from landing page to order submission"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed" dir="ltr">
{`┌─────────────┐
│  Landing     │
│   Page       │
└──────┬───────┘
       │
       ▼
┌─────────────┐
│    Login    │
│   (Auth)    │
└──────┬───────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  Ordering   │────▶│ Select LTA   │
│   Page      │◀────│   (if >1)    │
└──────┬───────┘     └──────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│   Browse    │────▶│  Use Template│
│  Products   │◀────│   (optional) │
└──────┬───────┘     └──────────────┘
       │
       ▼
┌─────────────┐
│ Add to Cart │
│  (Quantity) │
└──────┬───────┘
       │
       ▼
┌─────────────┐
│ Review Cart │
│   Items     │
└──────┬───────┘
       │
       ▼
┌─────────────┐
│  Submit     │
│   Order     │
└──────┬───────┘
       │
       ▼
┌─────────────┐
│ Confirmation│
│   Screen    │
└─────────────┘`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    {language === "ar" ? "نقاط القرار الرئيسية:" : "Key Decision Points:"}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ms-4">
                    <li>
                      {language === "ar"
                        ? "اختيار LTA إذا كان لدى العميل عدة عقود نشطة"
                        : "LTA selection if client has multiple active contracts"}
                    </li>
                    <li>
                      {language === "ar"
                        ? "استخدام قالب طلب سابق أو البدء من جديد"
                        : "Use previous order template or start fresh"}
                    </li>
                    <li>
                      {language === "ar"
                        ? "طلب عرض أسعار للمنتجات غير المدرجة في العقد"
                        : "Request price quote for products not in contract"}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Admin Journey */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {language === "ar" ? "سير المدير" : "Admin Journey"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "رحلة المدير في إدارة النظام والعقود"
                    : "Admin journey for system and contract management"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed" dir="ltr">
{`┌─────────────┐
│  Dashboard   │
│  (Overview)  │
└──────┬───────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐   ┌──────────────┐
│ Manage LTAs │   │ Manage       │
│             │   │ Products     │
└──────┬──────┘   └──────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ Assign      │────▶│ Assign       │
│ Products    │     │ Clients      │
│ to LTA      │◀────│ to LTA       │
└──────┬──────┘     └──────────────┘
       │
       ▼
┌─────────────┐
│ Manage      │
│ Orders      │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐   ┌──────────────┐
│ Process      │   │ Generate     │
│ Modifications│   │ Documents    │
└──────────────┘   └──────────────┘`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    {language === "ar" ? "المهام الرئيسية:" : "Key Tasks:"}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ms-4">
                    <li>
                      {language === "ar"
                        ? "إنشاء وتعديل عقود LTA"
                        : "Create and modify LTA contracts"}
                    </li>
                    <li>
                      {language === "ar"
                        ? "ربط المنتجات والعملاء بالعقود"
                        : "Link products and clients to contracts"}
                    </li>
                    <li>
                      {language === "ar"
                        ? "مراجعة ومعالجة الطلبات"
                        : "Review and process orders"}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Price Management Flow */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {language === "ar" ? "سير إدارة الأسعار" : "Price Management Flow"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "عملية طلب الأسعار وإنشاء العروض"
                    : "Price request and offer creation process"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed" dir="ltr">
{`Client Side:
┌──────────────┐
│ Price Request│
│  (Products)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Pending     │
│  (Waiting)   │
└──────────────┘

Admin Side:
┌──────────────┐     ┌──────────────┐
│ Review        │────▶│ Create Offer │
│ Request       │     │  (Pricing)   │
└──────────────┘     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Generate PDF │
                     │   Document   │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Send to Client│
                     └──────────────┘

Client Response:
┌──────────────┐     ┌──────────────┐
│ View Offer    │────▶│ Accept/Reject│
│   (PDF)       │     │   Offer     │
└──────────────┘     └──────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
            ┌──────────────┐  ┌──────────────┐
            │ Accepted      │  │ Rejected    │
            │ (Order Ready) │  │ (Closed)    │
            └──────────────┘  └──────────────┘`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    {language === "ar" ? "حالات العملية:" : "Process States:"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">pending</Badge>
                    <Badge variant="outline">reviewed</Badge>
                    <Badge variant="outline">offer_created</Badge>
                    <Badge variant="outline">accepted</Badge>
                    <Badge variant="outline">rejected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wireframe Tab */}
          <TabsContent value="wireframe" className="space-y-6">
            {/* Ordering Page Wireframe */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  {language === "ar" ? "صفحة الطلب" : "Ordering Page"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "الهيكل الأساسي لصفحة طلب المنتجات"
                    : "Basic structure of the product ordering page"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed" dir="ltr">
{`┌─────────────────────────────────────────────────────────────────┐
│ Header: Logo | Client Selector | Lang | Cart Icon | User Menu    │
├─────────────────────────────────────────────────────────────────┤
│ Search Bar                              [Template Selector]      │
│ ┌─────────────────────────────────┐  ┌──────────────┐          │
│ │ Search products...                │  │ Templates ▼ │          │
│ └─────────────────────────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│ LTA Tabs: [LTA 1] [LTA 2] [LTA 3]                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Product  │  │ Product  │  │ Product  │  │ Product  │      │
│  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │      │
│  │ │ Image│ │  │ │ Image│ │  │ │ Image│ │  │ │ Image│ │      │
│  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │      │
│  │ Name    │  │ Name    │  │ Name    │  │ Name    │      │
│  │ Price   │  │ Price   │  │ Price   │  │ Price   │      │
│  │ [Qty]   │  │ [Qty]   │  │ [Qty]   │  │ [Qty]   │      │
│  │ [Add]   │  │ [Add]   │  │ [Add]   │  │ [Add]   │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Product  │  │ Product  │  │ Product  │  │ Product  │      │
│  │ ...      │  │ ...      │  │ ...      │  │ ...      │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                                                    
┌────────────────────────┐
│ Cart Sidebar (Right)   │
│ ┌────────────────────┐ │
│ │ Cart Items         │ │
│ │ ┌────────────────┐ │ │
│ │ │ Product 1      │ │ │
│ │ │ Qty: [1] [+][-]│ │ │
│ │ │ Price: $XX.XX  │ │ │
│ │ └────────────────┘ │ │
│ │ ┌────────────────┐ │ │
│ │ │ Product 2      │ │ │
│ │ │ Qty: [2]       │ │ │
│ │ └────────────────┘ │ │
│ ├────────────────────┤ │
│ │ Subtotal: $XXX.XX  │ │
│ │ Tax:      $XX.XX  │ │
│ │ Total:    $XXX.XX │ │
│ ├────────────────────┤ │
│ │ [Submit Order]    │ │
│ │ [Save Template]  │ │
│ └────────────────────┘ │
└────────────────────────┘`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Admin Dashboard Wireframe */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  {language === "ar" ? "لوحة تحكم المدير" : "Admin Dashboard"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "هيكل لوحة التحكم الرئيسية"
                    : "Main dashboard structure"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed" dir="ltr">
{`┌─────────────────────────────────────────────────────────────────┐
│ Header: Logo | Navigation | User Menu                              │
├─────────────────────────────────────────────────────────────────┤
│ Stats Cards (4 columns)                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ Orders    │ │ Revenue │ │ Clients  │ │ Products │            │
│ │ 1,234     │ │ $XX,XXX │ │   56     │ │   234    │            │
│ │ ↗ +12%    │ │ ↗ +5%   │ │ ↗ +3     │ │ ↗ +8     │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────────────────┤
│ Charts Row                                                       │
│ ┌──────────────────────────┐ ┌──────────────────────────┐    │
│ │ Revenue Trend (Line)      │ │ Order Status (Pie)        │    │
│ │                           │ │                           │    │
│ │     ╱╲                    │ │      ╱╲                  │    │
│ │   ╱    ╲                  │ │    ╱  ╲                │    │
│ │ ╱        ╲                │ │   ╱    ╲                │    │
│ └──────────────────────────┘ └──────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│ Recent Orders Table                                             │
│ ┌──────┬────────────┬────────┬──────────┬──────────┐         │
│ │ Order│ Client     │ Status │ Total    │ Actions  │         │
│ ├──────┼────────────┼────────┼──────────┼──────────┤         │
│ │ #123 │ Client A   │ Pending│ $1,234   │ [View]   │         │
│ │ #124 │ Client B   │ Done   │ $2,345   │ [View]   │         │
│ └──────┴────────────┴────────┴──────────┴──────────┘         │
└─────────────────────────────────────────────────────────────────┘`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Product Management Wireframe */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  {language === "ar" ? "إدارة المنتجات" : "Product Management"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "صفحة إدارة المنتجات"
                    : "Product management page"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed" dir="ltr">
{`┌─────────────────────────────────────────────────────────────────┐
│ Header: [← Back] Product Management            [+ Add Product]  │
├─────────────────────────────────────────────────────────────────┤
│ Filters: [Search...] [Category ▼] [Vendor ▼] [Status ▼]        │
├─────────────────────────────────────────────────────────────────┤
│ Products Table                                                  │
│ ┌────┬──────────┬──────────┬────────┬────────┬──────────┐   │
│ │ ID │ Name     │ SKU      │ Price   │ Vendor │ Actions   │   │
│ ├────┼──────────┼──────────┼────────┼────────┼──────────┤   │
│ │ 1  │ Product A│ SKU-001  │ $10.00  │ Vendor1│ [Edit][×] │   │
│ │ 2  │ Product B│ SKU-002  │ $20.00  │ Vendor2│ [Edit][×] │   │
│ │ 3  │ Product C│ SKU-003  │ $15.00  │ Vendor1│ [Edit][×] │   │
│ └────┴──────────┴──────────┴────────┴────────┴──────────┘   │
│                                                                 │
│ Pagination: [← Prev] Page 1 of 5 [Next →]                     │
└─────────────────────────────────────────────────────────────────┘`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design Reference Tab */}
          <TabsContent value="design-reference" className="space-y-6">
            {/* Color Palette */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {language === "ar" ? "لوحة الألوان" : "Color Palette"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "نظام الألوان الكامل للتطبيق"
                    : "Complete color system for the application"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Light Mode Colors */}
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    {language === "ar" ? "الوضع الفاتح" : "Light Mode"}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded border border-border" style={{ backgroundColor: "hsl(45 92% 55%)" }}></div>
                        <div>
                          <p className="font-medium text-sm">Primary</p>
                          <p className="text-xs text-muted-foreground">HSL(45 92% 55%)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded border border-border" style={{ backgroundColor: "hsl(0 0% 98%)" }}></div>
                        <div>
                          <p className="font-medium text-sm">Background</p>
                          <p className="text-xs text-muted-foreground">HSL(0 0% 98%)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded border border-border" style={{ backgroundColor: "hsl(142 76% 36%)" }}></div>
                        <div>
                          <p className="font-medium text-sm">Success</p>
                          <p className="text-xs text-muted-foreground">HSL(142 76% 36%)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded border border-border" style={{ backgroundColor: "hsl(0 84% 60%)" }}></div>
                        <div>
                          <p className="font-medium text-sm">Destructive</p>
                          <p className="text-xs text-muted-foreground">HSL(0 84% 60%)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded border border-border bg-muted"></div>
                        <div>
                          <p className="font-medium text-sm">Muted</p>
                          <p className="text-xs text-muted-foreground">HSL(0 0% 96%)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded border border-border bg-accent"></div>
                        <div>
                          <p className="font-medium text-sm">Accent</p>
                          <p className="text-xs text-muted-foreground">HSL(45 55% 94%)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dark Mode Colors */}
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    {language === "ar" ? "الوضع الداكن" : "Dark Mode"}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded border border-border dark:border-border" style={{ backgroundColor: "hsl(45 92% 55%)" }}></div>
                        <div>
                          <p className="font-medium text-sm">Primary</p>
                          <p className="text-xs text-muted-foreground">HSL(45 92% 55%)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded border border-border" style={{ backgroundColor: "hsl(0 0% 0%)" }}></div>
                        <div>
                          <p className="font-medium text-sm">Background</p>
                          <p className="text-xs text-muted-foreground">HSL(0 0% 0%)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded border border-border" style={{ backgroundColor: "hsl(142 70% 45%)" }}></div>
                        <div>
                          <p className="font-medium text-sm">Success</p>
                          <p className="text-xs text-muted-foreground">HSL(142 70% 45%)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typography */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  {language === "ar" ? "الطباعة" : "Typography"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "نظام الخطوط والمقاييس"
                    : "Font families and type scale"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {language === "ar" ? "عائلات الخطوط" : "Font Families"}
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/50 rounded">
                        <p className="font-sans text-sm mb-1">
                          <span className="font-medium">Inter:</span> {language === "ar" ? "للنص الإنجليزي" : "For English text"}
                        </p>
                        <p className="font-sans" style={{ fontFamily: "Inter, sans-serif" }}>
                          {language === "ar" ? "The quick brown fox jumps over the lazy dog" : "The quick brown fox jumps over the lazy dog"}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded">
                        <p className="font-sans text-sm mb-1">
                          <span className="font-medium">Noto Sans Arabic:</span> {language === "ar" ? "للنص العربي" : "For Arabic text"}
                        </p>
                        <p className="text-lg" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }} dir="rtl">
                          {language === "ar" ? "القاعدة الأساسية في التصميم" : "القاعدة الأساسية في التصميم"}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded">
                        <p className="font-sans text-sm mb-1">
                          <span className="font-medium">JetBrains Mono:</span> {language === "ar" ? "للأرقام والأكواد" : "For numbers and code"}
                        </p>
                        <p className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          123,456.78 SAR
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">
                      {language === "ar" ? "مقياس الخط" : "Type Scale"}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">H1 - 2rem/2.5rem (32px) - semi-bold</p>
                        <h1 className="text-2xl font-semibold">Heading 1</h1>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">H2 - 1.5rem/2rem (24px) - semi-bold</p>
                        <h2 className="text-xl font-semibold">Heading 2</h2>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Body - 0.875rem/1.375rem (14px) - regular</p>
                        <p className="text-sm">Body text for regular content and descriptions.</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Small - 0.75rem/1rem (12px) - metadata, labels</p>
                        <p className="text-xs">Small text for metadata and labels.</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Price Display - 1.125rem (18px) - mono, medium weight</p>
                        <p className="text-lg font-medium font-mono">1,234.56 SAR</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spacing System */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {language === "ar" ? "نظام المسافات" : "Spacing System"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "نظام المسافات القائم على 4 بكسل"
                    : "4px-based spacing system"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === "ar"
                        ? "جميع المسافات تستند إلى وحدة أساسية 4 بكسل لضمان الاتساق"
                        : "All spacing is based on a 4px base unit for consistency"}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-xs font-mono">space-2</div>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary h-4 w-2"></div>
                          <span className="text-xs text-muted-foreground">8px</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-xs font-mono">space-4</div>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary h-4 w-4"></div>
                          <span className="text-xs text-muted-foreground">16px</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-xs font-mono">space-6</div>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary h-4" style={{ width: "24px" }}></div>
                          <span className="text-xs text-muted-foreground">24px</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-xs font-mono">space-8</div>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary h-4" style={{ width: "32px" }}></div>
                          <span className="text-xs text-muted-foreground">32px</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">
                      {language === "ar" ? "أمثلة الاستخدام" : "Usage Examples"}
                    </h4>
                    <div className="space-y-2 text-xs font-mono bg-muted/50 p-3 rounded">
                      <div>Card padding: <code className="bg-background px-1 rounded">p-4</code> to <code className="bg-background px-1 rounded">p-6</code></div>
                      <div>Section spacing: <code className="bg-background px-1 rounded">gap-6</code> to <code className="bg-background px-1 rounded">gap-8</code></div>
                      <div>Page margins: <code className="bg-background px-1 rounded">px-4 md:px-6</code></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Component Library */}
            <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {language === "ar" ? "مكتبة المكونات" : "Component Library"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "المكونات القابلة لإعادة الاستخدام"
                    : "Reusable components"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Buttons */}
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    {language === "ar" ? "الأزرار" : "Buttons"}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                    <code>variant="default|secondary|outline|ghost|destructive"</code>
                  </div>
                </div>

                <Separator />

                {/* Badges */}
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    {language === "ar" ? "الشارات" : "Badges"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>

                <Separator />

                {/* Cards */}
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    {language === "ar" ? "البطاقات" : "Cards"}
                  </h4>
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle>Card Title</CardTitle>
                      <CardDescription>Card description text</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Card content area with padding p-6</p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Layout Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    {language === "ar" ? "النظام الشبكي" : "Grid System"}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      {language === "ar"
                        ? "العرض الأقصى للمحتوى:"
                        : "Max content width:"} <code className="text-xs bg-muted px-1 rounded">max-w-7xl</code>
                    </p>
                    <p>
                      {language === "ar"
                        ? "عرض الشريط الجانبي:"
                        : "Sidebar width:"} <code className="text-xs bg-muted px-1 rounded">w-80</code> (320px)
                    </p>
                    <p>
                      {language === "ar"
                        ? "شبكة المنتجات:"
                        : "Product grid:"} <code className="text-xs bg-muted px-1 rounded">grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4</code>
                    </p>
                  </div>
                </div>

                <Separator />

                {/* RTL Support */}
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    {language === "ar" ? "دعم RTL/LTR" : "RTL/LTR Support"}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ms-4">
                    <li>
                      {language === "ar"
                        ? "انعكاس تلقائي للمسافات الأفقية والهوامش"
                        : "Automatic mirroring of horizontal spacing and margins"}
                    </li>
                    <li>
                      {language === "ar"
                        ? "عكس اتجاهات الأيقونات (السهام، الأسهم)"
                        : "Flip icon directions (chevrons, arrows)"}
                    </li>
                    <li>
                      {language === "ar"
                        ? "الحفاظ على محاذاة الأرقام (أسعار محاذاة لليمين في LTR، لليسار في RTL)"
                        : "Maintain numerical alignment (prices right-aligned in LTR, left in RTL)"}
                    </li>
                  </ul>
                </div>

                <Separator />

                {/* Animation Guidelines */}
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    {language === "ar" ? "إرشادات الرسوم المتحركة" : "Animation Guidelines"}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        {language === "ar" ? "انتقالات الصفحة:" : "Page transitions:"}
                      </span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">200ms ease</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        {language === "ar" ? "انزلاق السلة:" : "Cart slide-in:"}
                      </span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">250ms ease-out</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        {language === "ar" ? "حالات التحميل:" : "Loading states:"}
                      </span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">Shimmer animation</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

