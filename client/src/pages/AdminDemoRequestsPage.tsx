
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { PlayCircle, Phone, Mail, Building2, MessageSquare, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface DemoRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export default function AdminDemoRequestsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: requests, isLoading } = useQuery<DemoRequest[]>({
    queryKey: ['demoRequests'],
    queryFn: async () => {
      const res = await apiRequest('/api/demo-requests');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await apiRequest(`/api/demo-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demoRequests'] });
      setDialogOpen(false);
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث حالة الطلب بنجاح' : 'Request status updated successfully',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: { en: string; ar: string } }> = {
      pending: { variant: 'secondary', icon: Clock, label: { en: 'Pending', ar: 'قيد الانتظار' } },
      contacted: { variant: 'default', icon: Phone, label: { en: 'Contacted', ar: 'تم الاتصال' } },
      scheduled: { variant: 'default', icon: Calendar, label: { en: 'Scheduled', ar: 'مجدول' } },
      completed: { variant: 'default', icon: CheckCircle, label: { en: 'Completed', ar: 'مكتمل' } },
      cancelled: { variant: 'destructive', icon: XCircle, label: { en: 'Cancelled', ar: 'ملغي' } },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {language === 'ar' ? config.label.ar : config.label.en}
      </Badge>
    );
  };

  const filteredRequests = requests?.filter(req => 
    statusFilter === 'all' || req.status === statusFilter
  );

  return (
    <div className="container mx-auto p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {language === 'ar' ? 'طلبات العروض التوضيحية' : 'Demo Requests'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'إدارة طلبات العروض التوضيحية من العملاء المحتملين' : 'Manage demo requests from potential clients'}
        </p>
      </div>

      <div className="mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'جميع الطلبات' : 'All Requests'}</SelectItem>
            <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
            <SelectItem value="contacted">{language === 'ar' ? 'تم الاتصال' : 'Contacted'}</SelectItem>
            <SelectItem value="scheduled">{language === 'ar' ? 'مجدول' : 'Scheduled'}</SelectItem>
            <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
            <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : !filteredRequests?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لا توجد طلبات' : 'No requests found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {request.company}
                    </CardTitle>
                    <CardDescription>{request.name}</CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                      {request.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                      {request.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(request.createdAt), 'PPp')}
                  </div>
                </div>

                {request.message && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p>{request.message}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setSelectedRequest(request);
                    setDialogOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                >
                  {language === 'ar' ? 'إدارة الطلب' : 'Manage Request'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إدارة طلب العرض التوضيحي' : 'Manage Demo Request'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.company} - {selectedRequest?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </label>
                <Select
                  value={selectedRequest.status}
                  onValueChange={(status) =>
                    updateMutation.mutate({ id: selectedRequest.id, status, notes: selectedRequest.notes || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                    <SelectItem value="contacted">{language === 'ar' ? 'تم الاتصال' : 'Contacted'}</SelectItem>
                    <SelectItem value="scheduled">{language === 'ar' ? 'مجدول' : 'Scheduled'}</SelectItem>
                    <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                    <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'ملاحظات داخلية' : 'Internal Notes'}
                </label>
                <Textarea
                  value={selectedRequest.notes || ''}
                  onChange={(e) =>
                    setSelectedRequest({ ...selectedRequest, notes: e.target.value })
                  }
                  placeholder={language === 'ar' ? 'أضف ملاحظات...' : 'Add notes...'}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={() =>
                    updateMutation.mutate({
                      id: selectedRequest.id,
                      status: selectedRequest.status,
                      notes: selectedRequest.notes || undefined,
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
