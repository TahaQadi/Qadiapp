import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { 
  Star, 
  TrendingUp, 
  MessageSquare,
  AlertTriangle,
  Download,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  FileText,
  Minus // Import Minus icon
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  ratingDistribution: { rating: number; count: number; }[];
  trendData: { date: string; rating: number; count: number; }[];
  topIssues: { type: string; count: number; }[];
  recentFeedback: {
    id: string;
    orderId: string;
    rating: number;
    comments: string;
    createdAt: string;
    clientName: string;
    adminResponse?: string;
    adminResponseAt?: string;
    respondedBy?: string;
  }[];
}

interface MicroFeedbackStats {
  sentimentCounts: { positive: number; neutral: number; negative: number; };
  topTouchpoints: { touchpoint: string; count: number; }[];
  recentFeedback: {
    id: string;
    orderId: string;
    rating: number;
    comments: string;
    createdAt: string;
    clientName: string;
    adminResponse?: string;
    adminResponseAt?: string;
    respondedBy?: string;
  }[];
}

interface IssueReport {
  id: string;
  userId: string;
  orderId: string;
  issueType: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  createdAt: string;
  resolvedAt?: string;
  companyName: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CustomerFeedbackPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminResponses, setAdminResponses] = useState<Record<string, string>>({});

  // Fetch analytics data with proper error handling
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<FeedbackStats>({
    queryKey: ['/api/feedback/analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/feedback/analytics?range=${timeRange}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch analytics' }));
        throw new Error(error.message || 'Failed to fetch analytics');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch micro-feedback analytics data
  const { data: microStats, isLoading: microStatsLoading, error: microStatsError } = useQuery<MicroFeedbackStats>({
    queryKey: ['/api/feedback/micro/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/feedback/micro/analytics', {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch micro feedback analytics' }));
        throw new Error(error.message || 'Failed to fetch micro feedback analytics');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 60000,
  });


  // Fetch issues data with proper error handling
  const { data: issues = [], isLoading: issuesLoading, error: issuesError } = useQuery<IssueReport[]>({
    queryKey: ['/api/feedback/issues'],
    queryFn: async () => {
      const response = await fetch('/api/feedback/issues', {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch issues' }));
        throw new Error(error.message || 'Failed to fetch issues');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 60000,
  });

  // Fetch all feedback for the Ratings tab
  const { data: allFeedback = [], isLoading: allFeedbackLoading, error: allFeedbackError } = useQuery<any[]>({
    queryKey: ['/api/feedback/all'],
    queryFn: async () => {
      const response = await fetch('/api/feedback/all', {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch all feedback' }));
        throw new Error(error.message || 'Failed to fetch all feedback');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 60000,
    enabled: false, // Initially disabled, enable when tab is active
  });

  // Update issue status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest('PATCH', `/api/feedback/issues/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/issues'] });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث حالة المشكلة' : 'Issue status updated',
      });
      setDetailsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'فشل في تحديث الحالة' : 'Failed to update status'),
        variant: 'destructive',
      });
    },
  });

  // Update issue priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      return apiRequest('PATCH', `/api/feedback/issues/${id}/priority`, { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/issues'] });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث أولوية المشكلة' : 'Issue priority updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'فشل في تحديث الأولوية' : 'Failed to update priority'),
        variant: 'destructive',
      });
    },
  });

  // Submit admin response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      return apiRequest('POST', `/api/feedback/${id}/respond`, { response });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/all'] }); // Invalidate all feedback query
      // Clear the specific feedback's response
      setAdminResponses(prev => {
        const updated = { ...prev };
        delete updated[variables.id];
        return updated;
      });
      toast({
        title: language === 'ar' ? 'تم الإرسال' : 'Sent',
        description: language === 'ar' ? 'تم إرسال الرد للعميل' : 'Response sent to customer',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'فشل في إرسال الرد' : 'Failed to send response'),
        variant: 'destructive',
      });
    },
  });

  const exportData = () => {
    if (!stats) return;

    const csv = [
      'Metric,Value',
      `Total Feedback,${stats.totalFeedback}`,
      `Average Rating,${stats.averageRating.toFixed(2)}`,
      `NPS Score,${stats.npsScore}`,
      `Would Recommend,${stats.wouldRecommendPercent}%`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: any; variant: any; label: string }> = {
      open: { icon: AlertTriangle, variant: 'destructive', label: language === 'ar' ? 'مفتوح' : 'Open' },
      in_progress: { icon: Clock, variant: 'default', label: language === 'ar' ? 'قيد المعالجة' : 'In Progress' },
      resolved: { icon: CheckCircle, variant: 'default', label: language === 'ar' ? 'تم الحل' : 'Resolved' },
      closed: { icon: XCircle, variant: 'secondary', label: language === 'ar' ? 'مغلق' : 'Closed' },
    };
    const cfg = config[status] || config.open;
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant}>
        <Icon className="w-3 h-3 me-1" />
        {cfg.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      high: { variant: 'destructive', label: language === 'ar' ? 'عالية' : 'High' },
      medium: { variant: 'default', label: language === 'ar' ? 'متوسطة' : 'Medium' },
      low: { variant: 'secondary', label: language === 'ar' ? 'منخفضة' : 'Low' },
    };
    const cfg = config[severity] || config.medium;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  if (statsLoading || issuesLoading || microStatsLoading) {
    return (
      <PageLayout>
        <PageHeader
          title={language === 'ar' ? 'الملاحظات والتحليلات' : 'Feedback & Analytics'}
          backHref="/admin"
          showLogo={true}
        />
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (statsError || issuesError || microStatsError) {
    return (
      <PageLayout>
        <PageHeader
          title={language === 'ar' ? 'الملاحظات والتحليلات' : 'Feedback & Analytics'}
          backHref="/admin"
          showLogo={true}
        />
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error Loading Data'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {statsError && `Analytics: ${(statsError as any)?.message || 'Unknown error'}`}
                <br />
                {issuesError && `Issues: ${(issuesError as any)?.message || 'Unknown error'}`}
                <br />
                {microStatsError && `Micro Feedback Analytics: ${(microStatsError as any)?.message || 'Unknown error'}`}
              </p>
              <Button 
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/feedback/analytics'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/feedback/issues'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/feedback/micro/analytics'] });
                }}
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={language === 'ar' ? 'الملاحظات والتحليلات' : 'Feedback & Analytics'}
        subtitle={language === 'ar' ? 'التحليلات والتقييمات وإدارة المشاكل' : 'Analytics, ratings, and issue management'}
        backHref="/admin"
        showLogo={true}
        actions={
          <>
            <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
              <SelectTrigger className="w-24 sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{language === 'ar' ? '7 أيام' : '7 Days'}</SelectItem>
                <SelectItem value="30d">{language === 'ar' ? '30 يوماً' : '30 Days'}</SelectItem>
                <SelectItem value="90d">{language === 'ar' ? '90 يوماً' : '90 Days'}</SelectItem>
                <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All Time'}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportData} variant="outline" size="sm" className="min-h-[44px]">
              <Download className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'ar' ? 'تصدير' : 'Export'}</span>
            </Button>
            <LanguageToggle />
            <ThemeToggle />
          </>
        }
      />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Mobile Header */}
          <div className="block sm:hidden">
            <p className="text-muted-foreground text-sm">
              {language === 'ar' ? 'التحليلات والتقييمات وإدارة المشاكل' : 'Analytics, ratings, and issue management'}
            </p>
          </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="analytics" className="text-xs sm:text-sm min-h-[44px]">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{language === 'ar' ? 'التحليلات' : 'Analytics'}</span>
            <span className="sm:hidden">{language === 'ar' ? 'تحليل' : 'Analytics'}</span>
          </TabsTrigger>
          <TabsTrigger value="ratings" className="text-xs sm:text-sm min-h-[44px]" onClick={() => queryClient.ensureQueryData({ queryKey: ['/api/feedback/all'] })}>
            <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{language === 'ar' ? 'التقييمات' : 'Ratings'}</span>
            <span className="sm:hidden">{language === 'ar' ? 'تقييم' : 'Ratings'}</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="text-xs sm:text-sm min-h-[44px]">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{language === 'ar' ? 'المشاكل' : 'Issues'}</span>
            <span className="sm:hidden">{language === 'ar' ? 'مشاكل' : 'Issues'}</span>
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <>
              {/* Micro Feedback Summary */}
              {microStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === 'ar' ? 'ملاحظات سريعة' : 'Quick Feedback'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{microStats.sentimentCounts.positive}</div>
                        <div className="text-xs text-muted-foreground">{language === 'ar' ? 'إيجابي' : 'Positive'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{microStats.sentimentCounts.neutral}</div>
                        <div className="text-xs text-muted-foreground">{language === 'ar' ? 'محايد' : 'Neutral'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{microStats.sentimentCounts.negative}</div>
                        <div className="text-xs text-muted-foreground">{language === 'ar' ? 'سلبي' : 'Negative'}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'أهم نقاط التفاعل:' : 'Top touchpoints:'}
                      <ul className="mt-2 space-y-1">
                        {microStats.topTouchpoints.slice(0, 3).map((tp: any) => (
                          <li key={tp.touchpoint}>
                            {tp.touchpoint}: <span className="font-semibold">{tp.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Charts Row */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                {/* Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>{language === 'ar' ? 'اتجاه التقييم' : 'Rating Trend'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="rating" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Rating Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>{language === 'ar' ? 'توزيع التقييمات' : 'Rating Distribution'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.ratingDistribution}
                          dataKey="count"
                          nameKey="rating"
                          cx="50%"
                          cy="50%"
                          label
                        >
                          {stats.ratingDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-4">
          {allFeedbackLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : allFeedbackError ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {language === 'ar' ? 'خطأ في تحميل الملاحظات' : 'Error Loading Feedback'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {(allFeedbackError as any)?.message || 'Unknown error'}
                </p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/feedback/all'] })}>
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'جميع الملاحظات' : 'All Feedback'}</CardTitle>
              </CardHeader>
              <CardContent>
                {allFeedback.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title={language === 'ar' ? 'لا توجد ملاحظات حالياً' : 'No feedback yet'}
                    description={language === 'ar' ? 'سيتم عرض الملاحظات المقدمة من العملاء هنا' : 'Customer feedback will appear here'}
                  />
                ) : (
                  <div className="space-y-4">
                    {allFeedback.map(feedback => (
                      <div key={feedback.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < feedback.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <Badge variant="outline">{feedback.orderId.slice(0, 8)}</Badge>
                            </div>
                            <p className="text-sm font-medium mb-1">{feedback.clientName}</p>
                            {feedback.comments && (
                              <p className="text-sm text-muted-foreground">{feedback.comments}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(feedback.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>

                        {/* Admin Response Section */}
                        {(feedback as any).adminResponse ? (
                          <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {language === 'ar' ? 'رد الإدارة' : 'Admin Response'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date((feedback as any).adminResponseAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                              </span>
                            </div>
                            <p className="text-sm">{(feedback as any).adminResponse}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Textarea
                              placeholder={language === 'ar' ? 'اكتب ردك هنا...' : 'Write your response here...'}
                              value={adminResponses[feedback.id] || ''}
                              onChange={(e) => setAdminResponses(prev => ({ ...prev, [feedback.id]: e.target.value }))}
                              className="min-h-20"
                              data-testid={`textarea-admin-response-${feedback.id}`}
                            />
                            <Button
                              onClick={() => submitResponseMutation.mutate({ id: feedback.id, response: adminResponses[feedback.id] || '' })}
                              disabled={!(adminResponses[feedback.id] || '').trim() || submitResponseMutation.isPending}
                              size="sm"
                              data-testid={`button-submit-response-${feedback.id}`}
                            >
                              {submitResponseMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                language === 'ar' ? 'إرسال الرد' : 'Send Response'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'جميع البلاغات' : 'All Reports'}</CardTitle>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title={language === 'ar' ? 'لا توجد بلاغات حالياً' : 'No issue reports yet'}
                  description={language === 'ar' 
                    ? 'سيتم عرض البلاغات المُقدمة من العملاء هنا' 
                    : 'Customer-reported issues will appear here'}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                      <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الأهمية' : 'Severity'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>{issue.companyName}</TableCell>
                        <TableCell>{issue.issueType}</TableCell>
                        <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                        <TableCell>
                          <Select
                            value={issue.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ id: issue.id, status })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-40" data-testid={`select-issue-status-${issue.id}`}>
                              <SelectValue>
                                {getStatusBadge(issue.status)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-3 w-3" />
                                  {language === 'ar' ? 'مفتوح' : 'Open'}
                                </div>
                              </SelectItem>
                              <SelectItem value="in_progress">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {language === 'ar' ? 'قيد المعالجة' : 'In Progress'}
                                </div>
                              </SelectItem>
                              <SelectItem value="resolved">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3" />
                                  {language === 'ar' ? 'تم الحل' : 'Resolved'}
                                </div>
                              </SelectItem>
                              <SelectItem value="closed">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-3 w-3" />
                                  {language === 'ar' ? 'مغلق' : 'Closed'}
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedIssue(issue);
                              setDetailsOpen(true);
                            }}
                            data-testid={`button-view-feedback-issue-${issue.id}`}
                          >
                            {language === 'ar' ? 'عرض' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Issue Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تفاصيل المشكلة' : 'Issue Details'}</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'العميل' : 'Client'}</p>
                  <p className="font-medium">{selectedIssue.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الأهمية' : 'Severity'}</p>
                  {getSeverityBadge(selectedIssue.severity)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">{language === 'ar' ? 'الأولوية' : 'Priority'}</p>
                <Select
                  value={selectedIssue.priority || 'medium'}
                  onValueChange={(priority) => updatePriorityMutation.mutate({ id: selectedIssue.id, priority })}
                  disabled={updatePriorityMutation.isPending}
                >
                  <SelectTrigger className="w-40" data-testid="select-issue-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{language === 'ar' ? 'منخفضة' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{language === 'ar' ? 'متوسطة' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{language === 'ar' ? 'عالية' : 'High'}</SelectItem>
                    <SelectItem value="critical">{language === 'ar' ? 'حرجة' : 'Critical'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'العنوان' : 'Title'}</p>
                <p className="font-medium">{selectedIssue.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الوصف' : 'Description'}</p>
                <p className="text-sm whitespace-pre-wrap">{selectedIssue.description}</p>
              </div>
              <div className="flex gap-2 pt-4">
                {selectedIssue.status === 'open' && (
                  <Button onClick={() => updateStatusMutation.mutate({ id: selectedIssue.id, status: 'in_progress' })}>
                    {language === 'ar' ? 'بدء المعالجة' : 'Start Processing'}
                  </Button>
                )}
                {selectedIssue.status === 'in_progress' && (
                  <Button onClick={() => updateStatusMutation.mutate({ id: selectedIssue.id, status: 'resolved' })}>
                    {language === 'ar' ? 'تم الحل' : 'Mark Resolved'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </PageLayout>
  );
}