
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/LanguageProvider';
import { securityAudit } from '@/lib/securityAudit';
import { performanceMonitoring } from '@/lib/performanceMonitoring';
import { Shield, Activity, AlertTriangle, CheckCircle, RefreshCw, Download, TrendingUp, Database, Clock, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'wouter';

interface HistoricalDataPoint {
  timestamp: string;
  securityScore: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

export default function AdminReportsPage() {
  const { language } = useLanguage();
  const [securityChecks, setSecurityChecks] = useState(securityAudit.getResults());
  const [securityScore, setSecurityScore] = useState(securityAudit.getSecurityScore());
  const [performanceMetrics, setPerformanceMetrics] = useState(performanceMonitoring.getMetrics());
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('1h');
  const [memoryUsage, setMemoryUsage] = useState({ used: 0, total: 0 });

  const refresh = () => {
    const checks = securityAudit.getResults();
    const score = securityAudit.getSecurityScore();
    const metrics = performanceMonitoring.getMetrics();
    
    setSecurityChecks(checks);
    setSecurityScore(score);
    setPerformanceMetrics(metrics);

    // Track memory usage if available
    if ('memory' in performance && (performance as any).memory) {
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
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [language, timeRange]);

  const getSeverityColor = (severity: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const exportReport = (format: 'json' | 'csv') => {
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
      historicalData
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

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold">
              {language === 'ar' ? 'تقارير النظام' : 'System Reports'}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {language === 'ar' ? 'عرض تقارير الأمان والأداء' : 'View security and performance reports'}
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
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
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

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
              <LineChart data={historicalData}>
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
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${(memoryUsage.used / memoryUsage.total) * 100}%` }}
              />
            </div>
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

      {/* Console Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'الوصول إلى التقارير' : 'Access Reports'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            {language === 'ar' 
              ? 'يمكنك أيضًا الوصول إلى التقارير من وحدة تحكم المتصفح:'
              : 'You can also access reports from the browser console:'}
          </p>
          <div className="bg-muted p-3 rounded font-mono text-sm space-y-1">
            <p>securityAudit.printReport()</p>
            <p>performanceMonitoring.getMetrics()</p>
            <p>performanceMonitoring.getMetricsByRating()</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
