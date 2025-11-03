import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { securityAudit } from '@/lib/securityAudit';
import { performanceMonitoring } from '@/lib/performanceMonitoring';
import { queryKeys } from '@/lib/queryKeys';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Activity, AlertTriangle, CheckCircle, RefreshCw, Download, TrendingUp, Database, Clock, ArrowLeft, Server, HardDrive, BarChart3, Users, Package, ShoppingCart, FileText, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'wouter';

interface HistoricalDataPoint {
  timestamp: string;
  securityScore: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

interface SystemHealth {
  status: string;
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  cache: {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    memoryUsage: number;
  };
  performance: {
    totalRequests: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    endpointStats: Record<string, {
      count: number;
      avgDuration: number;
      maxDuration: number;
      errors: number;
    }>;
  };
}

interface DatabaseStats {
  totals: {
    clients: number;
    products: number;
    orders: number;
    ltas: number;
    feedback: number;
    issues: number;
    priceRequests: number;
    demoRequests: number;
  };
  recentActivity: {
    orders24h: number;
    orders7d: number;
    orders30d: number;
    feedback24h: number;
    issues24h: number;
  };
  breakdowns: {
    orderStatus: Array<{ status: string; count: number }>;
    issueStatus: Array<{ status: string; count: number }>;
  };
}

interface ErrorStats {
  total: number;
  byLevel: {
    error: number;
    warning: number;
    info: number;
  };
  recentCount24h: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminReportsPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [securityChecks, setSecurityChecks] = useState(securityAudit.getResults());
  const [securityScore, setSecurityScore] = useState(securityAudit.getSecurityScore());
  const [performanceMetrics, setPerformanceMetrics] = useState(performanceMonitoring.getMetrics());
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('1h');
  const [memoryUsage, setMemoryUsage] = useState({ used: 0, total: 0 });

  // Fetch server-side metrics with staggered loading to reduce initial load
  const { data: systemHealth, isLoading: healthLoading } = useQuery<{ data: SystemHealth }>({
    queryKey: queryKeys.monitoring.health(),
    queryFn: async () => {
      const res = await fetch('/api/monitoring/health', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch system health');
      return res.json();
    },
    refetchInterval: 60000, // Reduced frequency: every minute instead of 30s
    staleTime: 30000, // Consider data fresh for 30s
  });

  const { data: performanceStats, isLoading: perfLoading } = useQuery<{ data: SystemHealth['performance'] }>({
    queryKey: queryKeys.monitoring.performance.stats(),
    queryFn: async () => {
      const res = await fetch('/api/monitoring/performance/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch performance stats');
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
    // Stagger this query slightly
    enabled: !!systemHealth,
  });

  const { data: cacheStats, isLoading: cacheLoading } = useQuery<{ data: SystemHealth['cache'] }>({
    queryKey: queryKeys.monitoring.cache.stats(),
    queryFn: async () => {
      const res = await fetch('/api/monitoring/cache/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch cache stats');
      return res.json();
    },
    refetchInterval: 120000, // Reduced: every 2 minutes
    staleTime: 60000,
  });

  const { data: dbStats, isLoading: dbStatsLoading } = useQuery<DatabaseStats>({
    queryKey: queryKeys.adminReports.stats(),
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch database stats');
      return res.json();
    },
    refetchInterval: 120000, // Reduced: every 2 minutes
    staleTime: 60000,
  });

  const { data: errorStats, isLoading: errorStatsLoading } = useQuery<ErrorStats>({
    queryKey: queryKeys.adminReports.errorStats(),
    queryFn: async () => {
      const res = await fetch('/api/admin/error-logs/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch error stats');
      return res.json();
    },
    refetchInterval: 120000, // Reduced: every 2 minutes
    staleTime: 60000,
  });

  // Memoize expensive calculations
  const memoizedMetrics = useMemo(() => performanceMonitoring.getMetrics(), []);
  const memoizedSecurityChecks = useMemo(() => securityAudit.getResults(), []);
  const memoizedSecurityScore = useMemo(() => securityAudit.getSecurityScore(), []);

  const refresh = useCallback(() => {
    const checks = securityAudit.getResults();
    const score = securityAudit.getSecurityScore();
    const metrics = performanceMonitoring.getMetrics();
    
    setSecurityChecks(checks);
    setSecurityScore(score);
    setPerformanceMetrics(metrics);

    // Track memory usage if available
    if (typeof performance !== 'undefined' && 'memory' in performance && (performance as any).memory) {
      const mem = (performance as any).memory;
      setMemoryUsage({
        used: Math.round(mem.usedJSHeapSize / 1048576),
        total: Math.round(mem.jsHeapSizeLimit / 1048576)
      });
    }

    // Add to historical data
    const dataPoint: HistoricalDataPoint = {
      timestamp: new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      securityScore: score,
      lcp: metrics.find(m => m.name === 'LCP')?.value || 0,
      fid: metrics.find(m => m.name === 'FID')?.value || 0,
      cls: (metrics.find(m => m.name === 'CLS')?.value || 0) * 1000,
      ttfb: metrics.find(m => m.name === 'TTFB')?.value || 0,
    };

    setHistoricalData(prev => {
      const maxPoints = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 28 : 30;
      const updated = [...prev, dataPoint];
      return updated.slice(-maxPoints);
    });
  }, [language, timeRange]);

  const refreshAll = useCallback(() => {
    refresh();
    queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminReports.all });
  }, [refresh, queryClient]);

  useEffect(() => {
    refresh();
    // Reduced refresh frequency: every 10 seconds instead of 5
    const interval = setInterval(refresh, 10000);
    
    // Also refresh after a delay to get async security check results
    const asyncRefreshTimeout = setTimeout(() => {
      refresh();
    }, 2000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(asyncRefreshTimeout);
    };
  }, [refresh]);

  // Memoize utility functions
  const getSeverityColor = useCallback((severity: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  }, []);

  const getRatingColor = useCallback((rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const formatUptime = useCallback((seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    if (!historicalData.length) return [];
    const maxPoints = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 28 : 30;
    return historicalData.slice(-maxPoints);
  }, [historicalData, timeRange]);

  const exportReport = useCallback((format: 'json' | 'csv') => {
    const data = {
      timestamp: new Date().toISOString(),
      securityScore,
      securityChecks: securityChecks.map(check => ({
        name: check.name,
        passed: check.passed,
        severity: check.severity,
        message: check.message
      })),
      performanceMetrics: performanceMetrics.map(metric => ({
        name: metric.name,
        value: metric.value,
        rating: metric.rating
      })),
      memoryUsage,
      historicalData,
      systemHealth: systemHealth?.data,
      databaseStats: dbStats,
      errorStats,
      performanceStats: performanceStats?.data,
      cacheStats: cacheStats?.data
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV format
      let csv = 'Metric,Value,Rating\n';
      csv += `Security Score,${securityScore}%,${securityScore >= 80 ? 'Good' : securityScore >= 60 ? 'Fair' : 'Poor'}\n`;
      performanceMetrics.forEach(metric => {
        csv += `${metric.name},${metric.value.toFixed(2)},${metric.rating}\n`;
      });
      csv += `Memory Used,${memoryUsage.used}MB,N/A\n`;
      csv += `Memory Total,${memoryUsage.total}MB,N/A\n`;
      if (systemHealth?.data) {
        csv += `Server Uptime,${formatUptime(systemHealth.data.uptime)},N/A\n`;
        csv += `Server Memory Heap,${systemHealth.data.memory.heapUsed}MB,N/A\n`;
        csv += `Total Requests,${systemHealth.data.performance.totalRequests},N/A\n`;
        csv += `Avg Response Time,${systemHealth.data.performance.avgDuration}ms,N/A\n`;
      }
      if (dbStats) {
        csv += `Total Clients,${dbStats.totals.clients},N/A\n`;
        csv += `Total Products,${dbStats.totals.products},N/A\n`;
        csv += `Total Orders,${dbStats.totals.orders},N/A\n`;
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [securityScore, securityChecks, performanceMetrics, memoryUsage, historicalData, systemHealth, dbStats, errorStats, performanceStats, cacheStats, formatUptime]);

  const health = systemHealth?.data;
  const performance = performanceStats?.data;
  const cache = cacheStats?.data;

  return (
    <PageLayout>
      <PageHeader
        title={language === 'ar' ? 'تقارير النظام' : 'System Reports'}
        subtitle={language === 'ar' ? 'عرض تقارير الأمان والأداء' : 'View security and performance reports'}
        backHref="/admin"
        showLogo={true}
        actions={
          <>
            <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">{language === 'ar' ? 'ساعة واحدة' : '1 Hour'}</SelectItem>
                <SelectItem value="24h">{language === 'ar' ? '24 ساعة' : '24 Hours'}</SelectItem>
                <SelectItem value="7d">{language === 'ar' ? '7 أيام' : '7 Days'}</SelectItem>
                <SelectItem value="30d">{language === 'ar' ? '30 يوماً' : '30 Days'}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => exportReport('csv')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={() => exportReport('json')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button onClick={refreshAll} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
            <LanguageToggle />
            <ThemeToggle />
          </>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 relative z-10">

        {/* System Health Overview */}
        {healthLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24">
                    <Skeleton className="h-full w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : health && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                {language === 'ar' ? 'صحة النظام' : 'System Health'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'معلومات الخادم والأداء' : 'Server and performance information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === 'ar' ? 'حالة النظام' : 'Status'}
                    </p>
                    <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
                      {health.status}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{formatUptime(health.uptime)}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'وقت التشغيل' : 'Uptime'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === 'ar' ? 'ذاكرة الخادم' : 'Server Memory'}
                    </p>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{health.memory.heapUsed} MB</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? `من ${health.memory.heapTotal} ميجابايت` : `of ${health.memory.heapTotal} MB`}
                  </p>
                  <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${(health.memory.heapUsed / health.memory.heapTotal) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}
                    </p>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{performance?.totalRequests || health.performance.totalRequests}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'جميع الطلبات' : 'All requests'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === 'ar' ? 'متوسط الاستجابة' : 'Avg Response'}
                    </p>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{performance?.avgDuration || health.performance.avgDuration}ms</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'وقت الاستجابة' : 'Response time'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database Statistics */}
        {dbStatsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : dbStats && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {language === 'ar' ? 'إحصائيات قاعدة البيانات' : 'Database Statistics'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'إجمالي الأرقام والأنشطة الأخيرة' : 'Total counts and recent activity'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'العملاء' : 'Clients'}
                      </p>
                    </div>
                    <p className="text-2xl font-bold">{dbStats.totals.clients}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'المنتجات' : 'Products'}
                      </p>
                    </div>
                    <p className="text-2xl font-bold">{dbStats.totals.products}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'الطلبات' : 'Orders'}
                      </p>
                    </div>
                    <p className="text-2xl font-bold">{dbStats.totals.orders}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ar' ? `${dbStats.recentActivity.orders24h} في آخر 24 ساعة` : `${dbStats.recentActivity.orders24h} in last 24h`}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'التعليقات' : 'Feedback'}
                      </p>
                    </div>
                    <p className="text-2xl font-bold">{dbStats.totals.feedback}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ar' ? `${dbStats.recentActivity.feedback24h} في آخر 24 ساعة` : `${dbStats.recentActivity.feedback24h} in last 24h`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdowns */}
            {dbStats.breakdowns.orderStatus.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {language === 'ar' ? 'حالة الطلبات' : 'Order Status'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={dbStats.breakdowns.orderStatus}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry: { status: string; count: number }) => `${entry.status}: ${entry.count}`}
                        >
                          {dbStats.breakdowns.orderStatus.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {dbStats.breakdowns.issueStatus.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {language === 'ar' ? 'حالة المشاكل' : 'Issue Status'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={dbStats.breakdowns.issueStatus}
                              dataKey="count"
                              nameKey="status"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={(entry: { status: string; count: number }) => `${entry.status}: ${entry.count}`}
                            >
                              {dbStats.breakdowns.issueStatus.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* API Performance */}
        {perfLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
        ) : performance && performance.endpointStats && Object.keys(performance.endpointStats).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {language === 'ar' ? 'أداء API' : 'API Performance'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'أداء نقاط النهاية والاستجابات البطيئة' : 'Endpoint performance and slow responses'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(performance.endpointStats)
                  .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
                  .slice(0, 10)
                  .map(([endpoint, stats]) => (
                    <div key={endpoint} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{endpoint}</p>
                        <Badge variant={stats.errors > 0 ? 'destructive' : 'default'}>
                          {stats.errors} {language === 'ar' ? 'أخطاء' : 'errors'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">{language === 'ar' ? 'العدد' : 'Count'}</p>
                          <p className="font-semibold">{stats.count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{language === 'ar' ? 'المتوسط' : 'Avg'}</p>
                          <p className="font-semibold">{stats.avgDuration}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{language === 'ar' ? 'الأقصى' : 'Max'}</p>
                          <p className="font-semibold">{stats.maxDuration}ms</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Logs Summary */}
        {errorStatsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : errorStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {language === 'ar' ? 'ملخص سجلات الأخطاء' : 'Error Logs Summary'}
              </CardTitle>
              <CardDescription>
                <Link href="/admin/error-logs" className="text-primary hover:underline">
                  {language === 'ar' ? 'عرض جميع السجلات' : 'View all logs'}
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {language === 'ar' ? 'الإجمالي' : 'Total'}
                  </p>
                  <p className="text-2xl font-bold">{errorStats.total}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {language === 'ar' ? 'أخطاء' : 'Errors'}
                  </p>
                  <p className="text-2xl font-bold text-red-500">{errorStats.byLevel.error}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {language === 'ar' ? 'تحذيرات' : 'Warnings'}
                  </p>
                  <p className="text-2xl font-bold text-yellow-500">{errorStats.byLevel.warning}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {language === 'ar' ? 'آخر 24 ساعة' : 'Last 24h'}
                  </p>
                  <p className="text-2xl font-bold">{errorStats.recentCount24h}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cache Statistics */}
        {cacheLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24" />
            </CardContent>
          </Card>
        ) : cache && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                {language === 'ar' ? 'إحصائيات الذاكرة المؤقتة' : 'Cache Statistics'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {language === 'ar' ? 'إجمالي الإدخالات' : 'Total Entries'}
                  </p>
                  <p className="text-2xl font-bold">{cache.totalEntries}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {language === 'ar' ? 'صالح' : 'Valid'}
                  </p>
                  <p className="text-2xl font-bold text-green-500">{cache.validEntries}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {language === 'ar' ? 'منتهي الصلاحية' : 'Expired'}
                  </p>
                  <p className="text-2xl font-bold text-yellow-500">{cache.expiredEntries}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {language === 'ar' ? 'استخدام الذاكرة' : 'Memory Usage'}
                  </p>
                  <p className="text-2xl font-bold">{Math.round(cache.memoryUsage / 1024 / 1024)} MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historical Trends */}
        {historicalData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {language === 'ar' ? 'الاتجاهات التاريخية' : 'Historical Trends'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'مقاييس الأداء مع مرور الوقت' : 'Performance metrics over time'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="securityScore" stroke="#8b5cf6" name={language === 'ar' ? 'نتيجة الأمان' : 'Security Score'} />
                  <Line type="monotone" dataKey="lcp" stroke="#10b981" name="LCP (ms)" />
                  <Line type="monotone" dataKey="fid" stroke="#f59e0b" name="FID (ms)" />
                  <Line type="monotone" dataKey="ttfb" stroke="#3b82f6" name="TTFB (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'استخدام الذاكرة' : 'Memory Usage'}
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoryUsage.used} MB</div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? `من ${memoryUsage.total} ميجابايت` : `of ${memoryUsage.total} MB`}
              </p>
              {memoryUsage.total > 0 && (
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${(memoryUsage.used / memoryUsage.total) * 100}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'متوسط الأداء' : 'Avg Performance'}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceMetrics.filter(m => m.rating === 'good').length}/{performanceMetrics.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'مقاييس جيدة' : 'Good Metrics'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'تحديث تلقائي كل 5 ثوانٍ' : 'Auto-refresh every 5s'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Security Audit Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {language === 'ar' ? 'تقرير فحص الأمان' : 'Security Audit Report'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'نتيجة الأمان:' : 'Security Score:'}{' '}
              <span className="font-bold text-2xl">{securityScore}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {check.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-sm text-muted-foreground">{check.message}</p>
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(check.severity)}>
                    {check.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {language === 'ar' ? 'مقاييس الأداء' : 'Performance Metrics'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'مؤشرات الويب الأساسية' : 'Core Web Vitals'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{metric.name}</p>
                    <div className={`w-3 h-3 rounded-full ${getRatingColor(metric.rating)}`} />
                  </div>
                  <p className="text-3xl font-bold">{metric.value.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground capitalize">{metric.rating}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}