
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserMenu } from '@/components/navigation/UserMenu';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Loader2, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface IssueReport {
  id: string;
  userId: string;
  orderId: string;
  issueType: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  companyName: string;
}

export default function IssueReportsPage() {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: issues = [], isLoading } = useQuery<IssueReport[]>({
    queryKey: ['/api/feedback/issues'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest('PATCH', `/api/feedback/issues/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/issues'] });
      toast({
        title: i18n.language === 'ar' ? 'تم التحديث' : 'Updated',
        description: i18n.language === 'ar' ? 'تم تحديث حالة المشكلة' : 'Issue status updated',
      });
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: i18n.language === 'ar' ? 'خطأ' : 'Error',
        description: i18n.language === 'ar' ? 'فشل في تحديث الحالة' : 'Failed to update status',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; variant: any; label: string }> = {
      open: { icon: AlertTriangle, variant: 'destructive', label: i18n.language === 'ar' ? 'مفتوح' : 'Open' },
      in_progress: { icon: Clock, variant: 'default', label: i18n.language === 'ar' ? 'قيد المعالجة' : 'In Progress' },
      resolved: { icon: CheckCircle, variant: 'default', label: i18n.language === 'ar' ? 'تم الحل' : 'Resolved' },
      closed: { icon: XCircle, variant: 'secondary', label: i18n.language === 'ar' ? 'مغلق' : 'Closed' },
    };

    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 me-1" />
        {config.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig: Record<string, { variant: any; label: string }> = {
      high: { variant: 'destructive', label: i18n.language === 'ar' ? 'عالية' : 'High' },
      medium: { variant: 'default', label: i18n.language === 'ar' ? 'متوسطة' : 'Medium' },
      low: { variant: 'secondary', label: i18n.language === 'ar' ? 'منخفضة' : 'Low' },
    };

    const config = severityConfig[severity] || severityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getIssueTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      missing_items: i18n.language === 'ar' ? 'عناصر مفقودة' : 'Missing Items',
      wrong_items: i18n.language === 'ar' ? 'عناصر خاطئة' : 'Wrong Items',
      damaged_items: i18n.language === 'ar' ? 'عناصر تالفة' : 'Damaged Items',
      quality_issue: i18n.language === 'ar' ? 'مشكلة جودة' : 'Quality Issue',
      quantity_mismatch: i18n.language === 'ar' ? 'عدم تطابق الكمية' : 'Quantity Mismatch',
      other: i18n.language === 'ar' ? 'أخرى' : 'Other',
    };
    return typeLabels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Header */}
      <PageHeader
        title={i18n.language === 'ar' ? 'بلاغات المشاكل' : 'Issue Reports'}
        subtitle={i18n.language === 'ar' ? 'إدارة المشاكل المُبلغ عنها من العملاء' : 'Manage customer-reported issues'}
        backHref="/admin"
        showUserMenu={true}
        showNotifications={true}
        actions={
          <>
            <LanguageToggle />
            <ThemeToggle />
          </>
        }
      />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        <div className="space-y-6">
          {/* Mobile Header */}
          <div className="block sm:hidden">
            <p className="text-muted-foreground text-sm">
              {i18n.language === 'ar' ? 'إدارة المشاكل المُبلغ عنها من العملاء' : 'Manage customer-reported issues'}
            </p>
          </div>

      <Card>
        <CardHeader>
          <CardTitle>{i18n.language === 'ar' ? 'جميع البلاغات' : 'All Reports'}</CardTitle>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title={i18n.language === 'ar' ? 'لا توجد بلاغات حالياً' : 'No issue reports yet'}
              description={i18n.language === 'ar' 
                ? 'سيتم عرض البلاغات المُقدمة من العملاء هنا' 
                : 'Customer-reported issues will appear here'}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{i18n.language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                  <TableHead>{i18n.language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                  <TableHead>{i18n.language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                  <TableHead>{i18n.language === 'ar' ? 'الأهمية' : 'Severity'}</TableHead>
                  <TableHead>{i18n.language === 'ar' ? 'العنوان' : 'Title'}</TableHead>
                  <TableHead>{i18n.language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{i18n.language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{i18n.language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>{issue.companyName}</TableCell>
                    <TableCell className="font-mono text-xs">{issue.orderId.substring(0, 8)}</TableCell>
                    <TableCell>{getIssueTypeLabel(issue.issueType)}</TableCell>
                    <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                    <TableCell className="max-w-xs truncate">{issue.title}</TableCell>
                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell>{new Date(issue.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedIssue(issue);
                          setDetailsOpen(true);
                        }}
                        data-testid={`button-view-issue-${issue.id}`}
                      >
                        {i18n.language === 'ar' ? 'عرض' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Issue Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{i18n.language === 'ar' ? 'تفاصيل المشكلة' : 'Issue Details'}</DialogTitle>
            <DialogDescription>
              {i18n.language === 'ar' ? 'معلومات كاملة عن البلاغ' : 'Full information about the report'}
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{i18n.language === 'ar' ? 'العميل' : 'Client'}</p>
                  <p className="font-medium">{selectedIssue.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{i18n.language === 'ar' ? 'رقم الطلب' : 'Order ID'}</p>
                  <p className="font-mono text-sm">{selectedIssue.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{i18n.language === 'ar' ? 'النوع' : 'Type'}</p>
                  <p>{getIssueTypeLabel(selectedIssue.issueType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{i18n.language === 'ar' ? 'الأهمية' : 'Severity'}</p>
                  {getSeverityBadge(selectedIssue.severity)}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">{i18n.language === 'ar' ? 'العنوان' : 'Title'}</p>
                <p className="font-medium">{selectedIssue.title}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">{i18n.language === 'ar' ? 'الوصف' : 'Description'}</p>
                <p className="text-sm whitespace-pre-wrap">{selectedIssue.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{i18n.language === 'ar' ? 'الحالة الحالية' : 'Current Status'}</p>
                {getStatusBadge(selectedIssue.status)}
              </div>

              <div className="flex gap-2 pt-4">
                {selectedIssue.status === 'open' && (
                  <Button
                    onClick={() => updateStatusMutation.mutate({ id: selectedIssue.id, status: 'in_progress' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    {i18n.language === 'ar' ? 'بدء المعالجة' : 'Start Processing'}
                  </Button>
                )}
                {selectedIssue.status === 'in_progress' && (
                  <Button
                    onClick={() => updateStatusMutation.mutate({ id: selectedIssue.id, status: 'resolved' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    {i18n.language === 'ar' ? 'تم الحل' : 'Mark Resolved'}
                  </Button>
                )}
                {(selectedIssue.status === 'resolved' || selectedIssue.status === 'in_progress') && (
                  <Button
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ id: selectedIssue.id, status: 'closed' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    {i18n.language === 'ar' ? 'إغلاق' : 'Close'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  );
}
