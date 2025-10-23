
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  MessageSquare,
  AlertTriangle,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
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

interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  npsScore: number;
  wouldRecommendPercent: number;
  aspectRatings: {
    orderingProcess: number;
    productQuality: number;
    deliverySpeed: number;
    communication: number;
  };
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
  trendData: {
    date: string;
    rating: number;
    count: number;
  }[];
  topIssues: {
    type: string;
    count: number;
  }[];
  recentFeedback: {
    id: string;
    orderId: string;
    rating: number;
    comments: string;
    createdAt: string;
    clientName: string;
  }[];
}

export default function FeedbackDashboardPage() {
  const { language } = useLanguage();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: stats, isLoading, error, refetch } = useQuery<FeedbackStats>({
    queryKey: ['/api/feedback/analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/feedback/analytics?range=${timeRange}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to fetch analytics');
      }
      return response.json();
    },
    retry: 2,
    retryDelay: 1000
  });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const exportData = () => {
    if (!stats) return;

    const csv = [
      'Metric,Value',
      `Total Feedback,${stats.totalFeedback}`,
      `Average Rating,${stats.averageRating.toFixed(2)}`,
      `NPS Score,${stats.npsScore}`,
      `Would Recommend,${stats.wouldRecommendPercent}%`,
      '',
      'Aspect Ratings',
      `Ordering Process,${stats.aspectRatings.orderingProcess.toFixed(2)}`,
      `Product Quality,${stats.aspectRatings.productQuality.toFixed(2)}`,
      `Delivery Speed,${stats.aspectRatings.deliverySpeed.toFixed(2)}`,
      `Communication,${stats.aspectRatings.communication.toFixed(2)}`
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error Loading Data'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'ar' 
                ? 'حدث خطأ أثناء تحميل تحليلات الملاحظات. يرجى المحاولة مرة أخرى.'
                : 'An error occurred while loading feedback analytics. Please try again.'
              }
            </p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
            >
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
            {error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  {language === 'ar' ? 'تفاصيل الخطأ' : 'Error Details'}
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {language === 'ar' ? 'لا توجد بيانات' : 'No Data Available'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'لا توجد ملاحظات متاحة للعرض حالياً.'
                : 'No feedback data is available to display at the moment.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getRatingTrend = () => {
    if (stats.trendData.length < 2) return 'neutral';
    const recent = stats.trendData[stats.trendData.length - 1].rating;
    const previous = stats.trendData[stats.trendData.length - 2].rating;
    return recent > previous ? 'up' : recent < previous ? 'down' : 'neutral';
  };

  const ratingTrend = getRatingTrend();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
              data-testid="button-back-admin"
            >
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                {language === 'ar' ? 'تحليلات الملاحظات' : 'Feedback Analytics'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {language === 'ar' ? 'رؤى شاملة حول تجربة العملاء' : 'Comprehensive insights into customer experience'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Mobile Header */}
          <div className="block sm:hidden">
            <p className="text-muted-foreground text-sm">
              {language === 'ar' ? 'رؤى شاملة حول تجربة العملاء' : 'Comprehensive insights into customer experience'}
            </p>
          {stats.isEmpty && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {language === 'ar' 
                  ? 'لا توجد ملاحظات في الفترة المحددة. جرب تغيير نطاق الوقت أو انتظر حتى يتم إرسال ملاحظات جديدة.'
                  : 'No feedback data available for the selected time range. Try changing the time range or wait for new feedback to be submitted.'
                }
              </p>
            </div>
          )}
        </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">{language === 'ar' ? '7 أيام' : '7 Days'}</SelectItem>
                  <SelectItem value="30d">{language === 'ar' ? '30 يوماً' : '30 Days'}</SelectItem>
                  <SelectItem value="90d">{language === 'ar' ? '90 يوماً' : '90 Days'}</SelectItem>
                  <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All Time'}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportData} variant="outline" className="min-h-[44px]">
                <Download className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
            </div>
          </div>
        </div>

      {/* Key Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'متوسط التقييم' : 'Average Rating'}
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalFeedback > 0 ? stats.averageRating.toFixed(2) : 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {stats.totalFeedback > 0 && ratingTrend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {stats.totalFeedback > 0 && ratingTrend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
              <span>{language === 'ar' ? 'من 5.00' : 'out of 5.00'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'نقاط NPS' : 'NPS Score'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalFeedback > 0 ? stats.npsScore : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFeedback > 0 ? (
                stats.npsScore >= 50 ? (language === 'ar' ? 'ممتاز' : 'Excellent') :
                stats.npsScore >= 30 ? (language === 'ar' ? 'جيد' : 'Good') :
                stats.npsScore >= 0 ? (language === 'ar' ? 'مقبول' : 'Fair') :
                (language === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement')
              ) : (
                language === 'ar' ? 'لا توجد بيانات' : 'No Data'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'سيوصي' : 'Would Recommend'}
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalFeedback > 0 ? `${stats.wouldRecommendPercent}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'من العملاء' : 'of customers'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي الملاحظات' : 'Total Feedback'}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'مراجعات مقدمة' : 'reviews submitted'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
        {/* Rating Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {language === 'ar' ? 'اتجاه التقييم' : 'Rating Trend'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'متوسط التقييم مع مرور الوقت' : 'Average rating over time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#10b981" 
                    name={language === 'ar' ? 'التقييم' : 'Rating'}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {language === 'ar' ? 'لا توجد بيانات للعرض' : 'No data to display'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {language === 'ar' ? 'توزيع التقييمات' : 'Rating Distribution'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'عدد المراجعات لكل تقييم' : 'Number of reviews per rating'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.ratingDistribution.some(r => r.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6" 
                    name={language === 'ar' ? 'العدد' : 'Count'}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {language === 'ar' ? 'لا توجد بيانات للعرض' : 'No data to display'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aspect Ratings & Top Issues */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
        {/* Aspect Ratings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {language === 'ar' ? 'تقييمات الجوانب' : 'Aspect Ratings'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'متوسط التقييم لكل جانب' : 'Average rating per aspect'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'orderingProcess', labelEn: 'Ordering Process', labelAr: 'عملية الطلب' },
              { key: 'productQuality', labelEn: 'Product Quality', labelAr: 'جودة المنتج' },
              { key: 'deliverySpeed', labelEn: 'Delivery Speed', labelAr: 'سرعة التوصيل' },
              { key: 'communication', labelEn: 'Communication', labelAr: 'التواصل' }
            ].map(aspect => {
              const value = stats.aspectRatings[aspect.key as keyof typeof stats.aspectRatings];
              const percentage = (value / 5) * 100;
              return (
                <div key={aspect.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {language === 'ar' ? aspect.labelAr : aspect.labelEn}
                    </span>
                    <span className="text-sm font-bold">{value.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {language === 'ar' ? 'أهم المشاكل' : 'Top Issues'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'المشاكل الأكثر شيوعاً' : 'Most common issues reported'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topIssues.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.topIssues}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats.topIssues.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {language === 'ar' ? 'لا توجد مشاكل مُبلغ عنها' : 'No issues reported'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {language === 'ar' ? 'أحدث الملاحظات' : 'Recent Feedback'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'آخر المراجعات المقدمة' : 'Latest submitted reviews'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentFeedback.map(feedback => (
              <div key={feedback.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < feedback.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <Badge variant="outline">
                        {language === 'ar' ? `طلب #${feedback.orderId.slice(0, 8)}` : `Order #${feedback.orderId.slice(0, 8)}`}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{feedback.clientName}</p>
                    {feedback.comments && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {feedback.comments}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(feedback.createdAt).toLocaleDateString(
                      language === 'ar' ? 'ar-SA' : 'en-US',
                      { month: 'short', day: 'numeric' }
                    )}
                  </span>
                </div>
              </div>
            ))}
            {stats.recentFeedback.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'ar' ? 'لا توجد ملاحظات حتى الآن' : 'No feedback yet'}
              </div>
            )}
          </div>
        </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
}
