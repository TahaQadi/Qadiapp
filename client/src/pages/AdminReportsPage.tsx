
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import { securityAudit } from '@/lib/securityAudit';
import { performanceMonitoring } from '@/lib/performanceMonitoring';
import { Shield, Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminReportsPage() {
  const { language } = useLanguage();
  const [securityChecks, setSecurityChecks] = useState(securityAudit.getResults());
  const [securityScore, setSecurityScore] = useState(securityAudit.getSecurityScore());
  const [performanceMetrics, setPerformanceMetrics] = useState(performanceMonitoring.getMetrics());

  const refresh = () => {
    setSecurityChecks(securityAudit.getResults());
    setSecurityScore(securityAudit.getSecurityScore());
    setPerformanceMetrics(performanceMonitoring.getMetrics());
  };

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
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

  return (
    <div className="container mx-auto p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'تقارير النظام' : 'System Reports'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'عرض تقارير الأمان والأداء' : 'View security and performance reports'}
          </p>
        </div>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </Button>
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
  );
}
