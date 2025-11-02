import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  ShoppingCart, 
  Users, 
  Package, 
  FileText, 
  DollarSign,
  Clock,
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Truck,
  Settings,
  Edit,
  AlertTriangle,
  TrendingUp as TrendingUpIcon,
  Menu,
  User,
  LogOut,
  Palette
} from 'lucide-react';
import { Link } from 'wouter';
import { formatDateLocalized } from '@/lib/dateUtils';
import { apiRequest } from '@/lib/queryClient';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    activeClients: number;
    totalProducts: number;
    activeLtas: number;
    pendingPriceRequests: number;
    pendingDemoRequests: number;
  };
  trends: {
    revenue: Array<{ date: string; revenue: number }>;
    orders: Array<{ date: string; count: number }>;
  };
  distributions: {
    orderStatus: Array<{ status: string; count: number }>;
    topProducts: Array<{ nameEn: string; nameAr: string; orderCount: number; revenue: number }>;
    topClients: Array<{ clientName: string; orderCount: number; revenue: number }>;
  };
  recentOrders: Array<{
    id: string;
    clientId: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    ltaId: string | null;
  }>;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-purple-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
  modification_requested: 'bg-orange-500',
};

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  processing: { en: 'Processing', ar: 'قيد المعالجة' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  delivered: { en: 'Delivered', ar: 'تم التسليم' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
  modification_requested: { en: 'Modification Requested', ar: 'طلب تعديل' },
};

export default function AdminDashboardPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: stats, isLoading, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard/stats', timeRange],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/admin/dashboard/stats?range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    return formatDateLocalized(new Date(dateStr), language as 'ar' | 'en');
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_LABELS[status] || { en: status, ar: status };
    const color = STATUS_COLORS[status] || 'bg-gray-500';
    return (
      <Badge className={`${color} text-white`}>
        {language === 'ar' ? config.ar : config.en}
      </Badge>
    );
  };

  // Calculate trend indicators
  const calculateTrend = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  // Get revenue trend
  const revenueTrend = stats?.trends.revenue.length
    ? (() => {
        const rev = stats.trends.revenue;
        const firstHalf = rev.slice(0, Math.floor(rev.length / 2));
        const secondHalf = rev.slice(Math.floor(rev.length / 2));
        const firstAvg = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length;
        return calculateTrend(secondAvg, firstAvg);
      })()
    : { value: 0, isPositive: true };

  // Get orders trend
  const ordersTrend = stats?.trends.orders.length
    ? (() => {
        const ord = stats.trends.orders;
        const firstHalf = ord.slice(0, Math.floor(ord.length / 2));
        const secondHalf = ord.slice(Math.floor(ord.length / 2));
        const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;
        return calculateTrend(secondAvg, firstAvg);
      })()
    : { value: 0, isPositive: true };

  // Calculate pending orders count
  const pendingOrdersCount = stats?.distributions.orderStatus.find(s => s.status === 'pending')?.count || 0;
  const modificationRequestsCount = stats?.distributions.orderStatus.find(s => s.status === 'modification_requested')?.count || 0;
  const totalPendingOrders = pendingOrdersCount + modificationRequestsCount;

  // Other features for expandable section (excluding the 3 quick links)
  const otherFeatures = [
    {
      id: 'ltas',
      path: '/admin/ltas',
      icon: FileText,
      titleEn: 'LTA Management',
      titleAr: 'إدارة الاتفاقيات',
      descEn: 'Manage contracts, products, and clients',
      descAr: 'إدارة العقود والمنتجات والعملاء',
      gradient: 'from-blue-500/20 to-cyan-500/10',
      hoverGradient: 'from-blue-500/30 to-cyan-500/20',
    },
    {
      id: 'clients',
      path: '/admin/clients',
      icon: Users,
      titleEn: 'Client Management',
      titleAr: 'إدارة العملاء',
      descEn: 'Manage client information and users',
      descAr: 'إدارة معلومات العملاء والمستخدمين',
      gradient: 'from-purple-500/20 to-pink-500/10',
      hoverGradient: 'from-purple-500/30 to-pink-500/20',
    },
    {
      id: 'products',
      path: '/admin/products',
      icon: Package,
      titleEn: 'Product Catalog',
      titleAr: 'كتالوج المنتجات',
      descEn: 'Manage product catalog',
      descAr: 'إدارة كتالوج المنتجات',
      gradient: 'from-[#d4af37]/20 to-[#f9c800]/10',
      hoverGradient: 'from-[#d4af37]/30 to-[#f9c800]/20',
    },
    {
      id: 'vendors',
      path: '/admin/vendors',
      icon: Truck,
      titleEn: 'Vendor Management',
      titleAr: 'إدارة الموردين',
      descEn: 'Manage vendor information',
      descAr: 'إدارة معلومات الموردين',
      gradient: 'from-green-500/20 to-emerald-500/10',
      hoverGradient: 'from-green-500/30 to-emerald-500/20',
    },
    {
      id: 'reports',
      path: '/admin/reports',
      icon: Settings,
      titleEn: 'System Reports',
      titleAr: 'تقارير النظام',
      descEn: 'Security audit and performance metrics',
      descAr: 'فحص الأمان ومقاييس الأداء',
      gradient: 'from-violet-500/20 to-fuchsia-500/10',
      hoverGradient: 'from-violet-500/30 to-fuchsia-500/20',
    },
    {
      id: 'templates',
      path: '/admin/documents',
      icon: Edit,
      titleEn: 'Document Templates',
      titleAr: 'مكتبة المستندات',
      descEn: 'Design and manage document templates',
      descAr: 'إدارة المستندات والقوالب',
      gradient: 'from-teal-500/20 to-cyan-500/10',
      hoverGradient: 'from-teal-500/30 to-cyan-500/20',
    },
    {
      id: 'error-logs',
      path: '/admin/error-logs',
      icon: AlertTriangle,
      titleEn: 'Error Logs',
      titleAr: 'سجلات الأخطاء',
      descEn: 'View system error logs',
      descAr: 'عرض سجلات أخطاء النظام',
      gradient: 'from-red-500/20 to-orange-500/10',
      hoverGradient: 'from-red-500/30 to-orange-500/20',
    },
    {
      id: 'feedback-analytics',
      path: '/admin/feedback',
      icon: TrendingUpIcon,
      titleEn: 'Feedback & Analytics',
      titleAr: 'الملاحظات والتحليلات',
      descEn: 'Customer feedback, analytics, ratings & issue management',
      descAr: 'ملاحظات العملاء والتحليلات والتقييمات وإدارة المشاكل',
      gradient: 'from-emerald-500/20 to-teal-500/10',
      hoverGradient: 'from-emerald-500/30 to-teal-500/20',
    },
    {
      id: 'design-system',
      path: '/admin/design-system',
      icon: Palette,
      titleEn: 'Design System',
      titleAr: 'نظام التصميم',
      descEn: 'Design reference, user flows, and wireframes',
      descAr: 'مرجع التصميم وسير المستخدم والأسلاك',
      gradient: 'from-pink-500/20 to-rose-500/10',
      hoverGradient: 'from-pink-500/30 to-rose-500/20',
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error Loading Data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} className="w-full">
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'left' : 'right'} className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle>{language === 'ar' ? 'القائمة' : 'Menu'}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full mt-6">
                  {user && (
                    <div className="flex items-center gap-3 pb-4 border-b mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-sm">
                          {user?.name || user?.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  )}

                  <nav className="flex-1 py-4 space-y-1">
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <Settings className="h-5 w-5" />
                        <span>{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
                      </Button>
                    </Link>

                    <Link href="/admin/demo-requests" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <PlayCircle className="h-5 w-5" />
                        <span>{language === 'ar' ? 'طلبات العروض' : 'Demo Requests'}</span>
                      </Button>
                    </Link>

                    <Link href="/admin/orders" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <ClipboardList className="h-5 w-5" />
                        <span>{language === 'ar' ? 'إدارة الطلبات' : 'Orders'}</span>
                      </Button>
                    </Link>

                    <Link href="/admin/price-management" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <FileText className="h-5 w-5" />
                        <span>{language === 'ar' ? 'إدارة الأسعار' : 'Price Management'}</span>
                      </Button>
                    </Link>

                    <Link href="/admin/ltas" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <FileText className="h-5 w-5" />
                        <span>{language === 'ar' ? 'الاتفاقيات' : 'LTAs'}</span>
                      </Button>
                    </Link>

                    <Link href="/admin/clients" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <Users className="h-5 w-5" />
                        <span>{language === 'ar' ? 'العملاء' : 'Clients'}</span>
                      </Button>
                    </Link>

                    <Link href="/admin/products" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <Package className="h-5 w-5" />
                        <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
                      </Button>
                    </Link>

                    <Separator className="my-4" />

                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <User className="h-5 w-5" />
                        <span>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                      </Button>
                    </Link>

                    <Link href="/ordering" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <ShoppingCart className="h-5 w-5" />
                        <span>{language === 'ar' ? 'إنشاء طلب' : 'Create Order'}</span>
                      </Button>
                    </Link>

                    <Separator className="my-4" />

                    <div className="space-y-2 px-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm">{language === 'ar' ? 'اللغة' : 'Language'}</span>
                        <LanguageToggle />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm">{language === 'ar' ? 'المظهر' : 'Theme'}</span>
                        <ThemeToggle />
                      </div>
                    </div>
                  </nav>

                  <div className="pt-4 border-t">
                    <Link href="/logout" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                        <LogOut className="h-5 w-5" />
                        <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold truncate">
                {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                {language === 'ar' ? 'نظرة عامة على النظام' : 'System Overview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              asChild
              size="sm"
              className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-4"
            >
              <Link href="/ordering">
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">{language === 'ar' ? 'إنشاء طلب' : 'Create Order'}</span>
              </Link>
            </Button>

            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
              <SelectTrigger className="w-[100px] sm:w-[140px] h-9 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{language === 'ar' ? '7 أيام' : '7 Days'}</SelectItem>
                <SelectItem value="30d">{language === 'ar' ? '30 يوم' : '30 Days'}</SelectItem>
                <SelectItem value="90d">{language === 'ar' ? '90 يوم' : '90 Days'}</SelectItem>
                <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard/stats'] });
                refetch();
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Quick Links Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Demo Requests */}
          <Link href="/admin/demo-requests">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/10">
                      <PlayCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {language === 'ar' ? 'طلبات العروض التوضيحية' : 'Demo Requests'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {language === 'ar' ? 'إدارة طلبات العروض التوضيحية من العملاء' : 'Manage demo requests from clients'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="destructive" className="ml-auto">
                    {isLoading ? '...' : (stats?.summary.pendingDemoRequests || 0)}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Order Management */}
          <Link href="/admin/orders">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/10">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {language === 'ar' ? 'إدارة الطلبات' : 'Order Management'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {language === 'ar' ? 'عرض الطلبات وإدارة التعديلات والإلغاءات' : 'View orders, manage modifications & cancellations'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="destructive" className="ml-auto">
                    {isLoading ? '...' : totalPendingOrders}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Price Management */}
          <Link href="/admin/price-management">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-purple-500/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {language === 'ar' ? 'إدارة الأسعار' : 'Price Management'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {language === 'ar' ? 'إدارة طلبات وعروض الأسعار' : 'Manage price requests and offers'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="destructive" className="ml-auto">
                    {isLoading ? '...' : (stats?.summary.pendingPriceRequests || 0)}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Other Features - Expandable Section */}
        <Collapsible open={isFeaturesOpen} onOpenChange={setIsFeaturesOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isFeaturesOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle>
                        {language === 'ar' ? 'ميزات أخرى' : 'Other Features'}
                      </CardTitle>
                      <CardDescription>
                        {language === 'ar' ? 'إدارة جميع جوانب النظام الأخرى' : 'Manage all other aspects of the system'}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {otherFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <Link key={feature.id} href={feature.path}>
                        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                          <CardHeader className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.gradient}`}>
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm mb-1">
                                  {language === 'ar' ? feature.titleAr : feature.titleEn}
                                </CardTitle>
                                <CardDescription className="text-xs line-clamp-2">
                                  {language === 'ar' ? feature.descAr : feature.descEn}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.summary.totalOrders || 0}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {ordersTrend.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span>{ordersTrend.value.toFixed(1)}%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.summary.totalRevenue || 0)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {revenueTrend.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span>{revenueTrend.value.toFixed(1)}%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'العملاء النشطون' : 'Active Clients'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.summary.activeClients || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Total Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.summary.totalProducts || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Active LTAs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'الاتفاقيات النشطة' : 'Active LTAs'}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.summary.activeLtas || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Pending Price Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'طلبات الأسعار المعلقة' : 'Pending Price Requests'}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.summary.pendingPriceRequests || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Pending Demo Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'طلبات العروض المعلقة' : 'Pending Demo Requests'}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.summary.pendingDemoRequests || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'اتجاه الإيرادات' : 'Revenue Trend'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'الإيرادات اليومية' : 'Daily Revenue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] sm:h-[300px] w-full" />
              ) : (
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={250} minHeight={250}>
                    <LineChart data={stats?.trends.revenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      }}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(value) => formatDate(value)}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      name={language === 'ar' ? 'الإيرادات' : 'Revenue'}
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'اتجاه الطلبات' : 'Orders Trend'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'عدد الطلبات اليومية' : 'Daily Order Count'}
              </CardDescription>
            </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            ) : (
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={250} minHeight={250}>
                  <LineChart data={stats?.trends.orders || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => value}
                      labelFormatter={(value) => formatDate(value)}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name={language === 'ar' ? 'الطلبات' : 'Orders'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'توزيع حالات الطلبات' : 'Order Status Distribution'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'توزيع الطلبات حسب الحالة' : 'Orders by Status'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] sm:h-[300px] w-full" />
              ) : (
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={250} minHeight={250}>
                  <PieChart>
                    <Pie
                      data={stats?.distributions.orderStatus || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => {
                        const config = STATUS_LABELS[status] || { en: status, ar: status };
                        return `${language === 'ar' ? config.ar : config.en}: ${count}`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(stats?.distributions.orderStatus || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'أفضل المنتجات' : 'Top Products'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'المنتجات الأكثر طلباً' : 'Most Ordered Products'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] sm:h-[300px] w-full" />
              ) : (
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={250} minHeight={250}>
                  <BarChart 
                    data={stats?.distributions.topProducts.slice(0, 10) || []}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey={language === 'ar' ? 'nameAr' : 'nameEn'} 
                      type="category"
                      width={120}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="orderCount" 
                      fill="hsl(var(--chart-1))"
                      name={language === 'ar' ? 'عدد الطلبات' : 'Order Count'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{language === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'}</CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'آخر 10 طلبات' : 'Last 10 Orders'}
                </CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/orders">
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                  {language === 'ar' ? (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowLeft className="ml-2 h-4 w-4" />
                  )}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'معرف الطلب' : 'Order ID'}</TableHead>
                    <TableHead>{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentOrders.length ? (
                    stats.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                        <TableCell>{formatCurrency(parseFloat(order.totalAmount))}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/orders`}>
                              {language === 'ar' ? 'عرض' : 'View'}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

