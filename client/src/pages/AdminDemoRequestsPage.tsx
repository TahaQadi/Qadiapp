import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDateLocalized } from "@/lib/dateUtils";
import { PlayCircle, Mail, Phone, Building2, Calendar, FileText, Loader2, Eye } from "lucide-react";
import { useState } from "react";

interface DemoRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  message?: string;
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminDemoRequestsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { data: requests = [], isLoading } = useQuery<DemoRequest[]>({
    queryKey: ["/api/admin/demo-requests"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; notes: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/demo-requests/${data.id}`, {
        status: data.status,
        notes: data.notes,
      });
      if (!res.ok) throw new Error('Failed to update request');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث الطلب بنجاح' : 'Request updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/demo-requests"] });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تحديث الطلب' : 'Failed to update request',
      });
    },
  });

  const handleViewRequest = (request: DemoRequest) => {
    setSelectedRequest(request);
    setStatus(request.status);
    setNotes(request.notes || '');
    setDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      status,
      notes,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { label: 'Pending', labelAr: 'قيد الانتظار', variant: 'default' },
      contacted: { label: 'Contacted', labelAr: 'تم الاتصال', variant: 'secondary' },
      scheduled: { label: 'Scheduled', labelAr: 'مجدول', variant: 'outline' },
      completed: { label: 'Completed', labelAr: 'مكتمل', variant: 'secondary' },
      cancelled: { label: 'Cancelled', labelAr: 'ملغي', variant: 'destructive' },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant}>
        {language === 'ar' ? config.labelAr : config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'طلبات العروض التوضيحية' : 'Demo Requests'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'إدارة طلبات العروض التوضيحية من العملاء' : 'Manage demo requests from clients'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted"></CardHeader>
                <CardContent className="h-32 bg-muted/50"></CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <PlayCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لا توجد طلبات عروض توضيحية' : 'No demo requests'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover-elevate transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{request.company}</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{request.name}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{request.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{request.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateLocalized(new Date(request.createdAt), language)}</span>
                  </div>
                  {request.message && (
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="line-clamp-2 text-muted-foreground">{request.message}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleViewRequest(request)}
                    data-testid={`button-view-request-${request.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.company} - {selectedRequest?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <p className="font-medium mt-1">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </Label>
                  <p className="font-medium mt-1">{selectedRequest.phone}</p>
                </div>
              </div>

              {selectedRequest.message && (
                <div>
                  <Label className="text-muted-foreground">
                    {language === 'ar' ? 'الرسالة' : 'Message'}
                  </Label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedRequest.message}</p>
                </div>
              )}

              <div>
                <Label htmlFor="status">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
                    </SelectItem>
                    <SelectItem value="contacted">
                      {language === 'ar' ? 'تم الاتصال' : 'Contacted'}
                    </SelectItem>
                    <SelectItem value="scheduled">
                      {language === 'ar' ? 'مجدول' : 'Scheduled'}
                    </SelectItem>
                    <SelectItem value="completed">
                      {language === 'ar' ? 'مكتمل' : 'Completed'}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {language === 'ar' ? 'ملغي' : 'Cancelled'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'أضف ملاحظات...' : 'Add notes...'}
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-save">
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    language === 'ar' ? 'حفظ' : 'Save'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
