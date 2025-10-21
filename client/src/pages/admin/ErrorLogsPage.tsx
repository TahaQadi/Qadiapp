
import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, AlertTriangle, Info, Trash2, RefreshCw } from "lucide-react";

interface ErrorLog {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context: any;
  timestamp: string;
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

export default function ErrorLogsPage() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/admin/error-logs?${params}`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/error-logs/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch error stats:', error);
    }
  };

  const clearOldLogs = async () => {
    if (!confirm(isRTL ? 'هل أنت متأكد من مسح السجلات القديمة؟' : 'Are you sure you want to clear old logs?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/error-logs/clear?daysToKeep=30', {
        method: 'DELETE',
      });
      const data = await response.json();
      alert(isRTL ? data.messageAr : data.message);
      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [selectedLevel, limit]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getLevelBadgeVariant = (level: string): "destructive" | "default" | "secondary" => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className={`container mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {isRTL ? 'سجلات الأخطاء' : 'Error Logs'}
        </h1>
        <p className="text-muted-foreground">
          {isRTL ? 'مراقبة وإدارة أخطاء التطبيق' : 'Monitor and manage application errors'}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'إجمالي السجلات' : 'Total Logs'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">
                {isRTL ? 'أخطاء' : 'Errors'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byLevel.error}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">
                {isRTL ? 'تحذيرات' : 'Warnings'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byLevel.warning}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'آخر 24 ساعة' : 'Last 24h'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentCount24h}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                {isRTL ? 'المستوى' : 'Level'}
              </label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="error">{isRTL ? 'أخطاء' : 'Errors'}</SelectItem>
                  <SelectItem value="warning">{isRTL ? 'تحذيرات' : 'Warnings'}</SelectItem>
                  <SelectItem value="info">{isRTL ? 'معلومات' : 'Info'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                {isRTL ? 'العدد' : 'Limit'}
              </label>
              <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-end">
              <Button onClick={fetchLogs} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {isRTL ? 'تحديث' : 'Refresh'}
              </Button>
              <Button onClick={clearOldLogs} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {isRTL ? 'مسح القديم' : 'Clear Old'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'السجلات' : 'Logs'}</CardTitle>
          <CardDescription>
            {isRTL 
              ? `عرض ${logs.length} سجل`
              : `Showing ${logs.length} logs`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="text-center py-8">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isRTL ? 'لا توجد سجلات' : 'No logs found'}
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <Card key={log.id} className="border-l-4" style={{
                    borderLeftColor: log.level === 'error' ? '#ef4444' : log.level === 'warning' ? '#f59e0b' : '#3b82f6'
                  }}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <Badge variant={getLevelBadgeVariant(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString(isRTL ? 'ar' : 'en')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          {expandedLog === log.id 
                            ? (isRTL ? 'إخفاء' : 'Hide')
                            : (isRTL ? 'عرض التفاصيل' : 'Show Details')}
                        </Button>
                      </div>

                      <p className="font-medium mb-2">{log.message}</p>

                      {log.context && (
                        <div className="text-sm space-y-1">
                          {log.context.route && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">{isRTL ? 'المسار:' : 'Route:'}</span> {log.context.route}
                            </div>
                          )}
                          {log.context.userId && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">{isRTL ? 'المستخدم:' : 'User:'}</span> {log.context.userId}
                            </div>
                          )}
                        </div>
                      )}

                      {expandedLog === log.id && (
                        <div className="mt-4 space-y-2">
                          {log.stack && (
                            <div>
                              <p className="font-medium text-sm mb-1">{isRTL ? 'تتبع المكدس:' : 'Stack Trace:'}</p>
                              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                {log.stack}
                              </pre>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm mb-1">{isRTL ? 'السياق الكامل:' : 'Full Context:'}</p>
                            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
