import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModificationStatusBadge } from "@/components/ModificationStatusBadge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, Clock, Package, Ban } from "lucide-react";
import type { OrderModification, Order } from "@shared/schema";

interface ModificationWithOrder extends OrderModification {
  order?: Order;
  clientName?: string;
}

export default function OrderModificationsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedModification, setSelectedModification] = useState<ModificationWithOrder | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null);

  const { data: modifications = [], isLoading } = useQuery<ModificationWithOrder[]>({
    queryKey: ['/api/admin/order-modifications'],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ modificationId, status, adminResponse }: { modificationId: string; status: string; adminResponse?: string }) => {
      return apiRequest('POST', '/api/admin/order-modifications/' + modificationId + '/review', { status, adminResponse });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/order-modifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setSelectedModification(null);
      setAdminResponse("");
      setReviewAction(null);
      toast({
        title: t('success'),
        description: t('modificationReviewedSuccessfully'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToReviewModification'),
        variant: "destructive",
      });
    },
  });

  const handleReview = (action: 'approved' | 'rejected') => {
    if (!selectedModification) return;
    
    setReviewAction(action);
    reviewMutation.mutate({
      modificationId: selectedModification.id,
      status: action,
      adminResponse: adminResponse.trim() || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    return (
      <ModificationStatusBadge 
        status={status as 'pending' | 'approved' | 'rejected'} 
        data-testid={`badge-status-${status}`}
      />
    );
  };

  const getModificationTypeBadge = (type: string) => {
    const types: Record<string, { label: string; icon: any }> = {
      items: { label: i18n.language === 'ar' ? 'تعديل الأصناف' : 'Modify Items', icon: Package },
      cancel: { label: i18n.language === 'ar' ? 'إلغاء' : 'Cancel', icon: Ban },
    };

    const config = types[type] || types.items;
    const Icon = config.icon;

    return (
      <Badge variant="outline" data-testid={`badge-type-${type}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loader-modifications">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingModifications = modifications.filter(m => m.status === 'pending');
  const reviewedModifications = modifications.filter(m => m.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-order-modifications">
          {i18n.language === 'ar' ? 'طلبات تعديل الطلبات' : 'Order Modification Requests'}
        </h1>
        <p className="text-muted-foreground" data-testid="text-description">
          {i18n.language === 'ar' ? 'راجع ووافق على طلبات تعديل الطلبات من العملاء' : 'Review and approve order modification requests from clients'}
        </p>
      </div>

      {/* Pending Modifications */}
      <div>
        <h2 className="text-xl font-semibold mb-4" data-testid="heading-pending">
          {i18n.language === 'ar' ? 'قيد الانتظار' : 'Pending Review'}
          {pendingModifications.length > 0 && (
            <Badge variant="secondary" className="ml-2" data-testid="badge-pending-count">
              {pendingModifications.length}
            </Badge>
          )}
        </h2>

        {pendingModifications.length === 0 ? (
          <Card data-testid="card-no-pending">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground" data-testid="text-no-pending">
                {i18n.language === 'ar' ? 'لا توجد طلبات تعديل قيد الانتظار' : 'No pending modification requests'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingModifications.map((modification) => (
              <Card key={modification.id} className="hover-elevate" data-testid={`card-modification-${modification.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-order-id-${modification.id}`}>
                        {i18n.language === 'ar' ? 'الطلب' : 'Order'} #{modification.orderId.substring(0, 8)}
                      </CardTitle>
                      <CardDescription data-testid={`text-date-${modification.id}`}>
                        {new Date(modification.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getModificationTypeBadge(modification.modificationType)}
                      {getStatusBadge(modification.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold" data-testid={`label-reason-${modification.id}`}>
                      {i18n.language === 'ar' ? 'السبب' : 'Reason'}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`text-reason-${modification.id}`}>
                      {modification.reason}
                    </p>
                  </div>

                  {modification.modificationType === 'items' && modification.newItems && (
                    <div>
                      <Label className="text-sm font-semibold" data-testid={`label-new-items-${modification.id}`}>
                        {i18n.language === 'ar' ? 'الأصناف الجديدة' : 'New Items'}
                      </Label>
                      <div className="text-sm text-muted-foreground mt-1" data-testid={`text-new-total-${modification.id}`}>
                        {i18n.language === 'ar' ? 'الإجمالي الجديد' : 'New Total'}: {modification.newTotalAmount} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => setSelectedModification(modification)}
                    className={isMobile ? "w-full min-h-[44px]" : "w-full"}
                    data-testid={`button-review-${modification.id}`}
                  >
                    {i18n.language === 'ar' ? 'مراجعة' : 'Review'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Modifications */}
      {reviewedModifications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4" data-testid="heading-reviewed">
            {i18n.language === 'ar' ? 'تمت المراجعة' : 'Reviewed'}
          </h2>
          <div className="grid gap-4">
            {reviewedModifications.map((modification) => (
              <Card key={modification.id} data-testid={`card-reviewed-${modification.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-reviewed-order-${modification.id}`}>
                        {i18n.language === 'ar' ? 'الطلب' : 'Order'} #{modification.orderId.substring(0, 8)}
                      </CardTitle>
                      <CardDescription data-testid={`text-reviewed-date-${modification.id}`}>
                        {new Date(modification.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getModificationTypeBadge(modification.modificationType)}
                      {getStatusBadge(modification.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-sm font-semibold" data-testid={`label-reviewed-reason-${modification.id}`}>
                      {i18n.language === 'ar' ? 'السبب' : 'Reason'}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`text-reviewed-reason-${modification.id}`}>
                      {modification.reason}
                    </p>
                  </div>
                  {modification.adminResponse && (
                    <div>
                      <Label className="text-sm font-semibold" data-testid={`label-admin-response-${modification.id}`}>
                        {i18n.language === 'ar' ? 'رد المسؤول' : 'Admin Response'}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-admin-response-${modification.id}`}>
                        {modification.adminResponse}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Review Dialog - Use Sheet on mobile */}
      {isMobile ? (
        <Sheet open={!!selectedModification} onOpenChange={() => setSelectedModification(null)}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle data-testid="sheet-title">
                {i18n.language === 'ar' ? 'مراجعة طلب التعديل' : 'Review Modification Request'}
              </SheetTitle>
              <SheetDescription data-testid="sheet-description">
                {i18n.language === 'ar' ? 'راجع التفاصيل ووافق أو ارفض الطلب' : 'Review the details and approve or reject the request'}
              </SheetDescription>
            </SheetHeader>

            {selectedModification && (
              <div className="space-y-4 py-4 overflow-y-auto max-h-[60vh]">
                <div>
                  <Label data-testid="label-sheet-order">
                    {i18n.language === 'ar' ? 'رقم الطلب' : 'Order ID'}
                  </Label>
                  <p className="text-sm font-mono mt-1" data-testid="text-sheet-order">
                    #{selectedModification.orderId.substring(0, 8)}
                  </p>
                </div>

                <div>
                  <Label data-testid="label-sheet-type">
                    {i18n.language === 'ar' ? 'نوع التعديل' : 'Modification Type'}
                  </Label>
                  <div className="mt-1">
                    {getModificationTypeBadge(selectedModification.modificationType)}
                  </div>
                </div>

                <div>
                  <Label data-testid="label-sheet-reason">
                    {i18n.language === 'ar' ? 'السبب' : 'Reason'}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md" data-testid="text-sheet-reason">
                    {selectedModification.reason}
                  </p>
                </div>

                {selectedModification.modificationType === 'items' && selectedModification.newTotalAmount && (
                  <div>
                    <Label data-testid="label-sheet-total">
                      {i18n.language === 'ar' ? 'الإجمالي الجديد' : 'New Total'}
                    </Label>
                    <p className="text-sm font-semibold mt-1 font-mono" data-testid="text-sheet-total">
                      {selectedModification.newTotalAmount} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="admin-response-sheet" data-testid="label-sheet-response">
                    {i18n.language === 'ar' ? 'ردك (اختياري)' : 'Your Response (Optional)'}
                  </Label>
                  <Textarea
                    id="admin-response-sheet"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder={i18n.language === 'ar' ? 'أضف ملاحظات أو تعليقات...' : 'Add notes or comments...'}
                    className="mt-2 min-h-[100px]"
                    data-testid="input-admin-response-sheet"
                  />
                </div>
              </div>
            )}

            <SheetFooter className="flex-col gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedModification(null)}
                className="w-full min-h-[48px]"
              >
                {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="destructive"
                  onClick={() => handleReview('rejected')}
                  disabled={reviewMutation.isPending}
                  className="min-h-[48px]"
                  data-testid="button-reject-sheet"
                >
                  {reviewMutation.isPending && reviewAction === 'rejected' && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {i18n.language === 'ar' ? 'رفض' : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleReview('approved')}
                  disabled={reviewMutation.isPending}
                  className="min-h-[48px]"
                  data-testid="button-approve-sheet"
                >
                  {reviewMutation.isPending && reviewAction === 'approved' && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {i18n.language === 'ar' ? 'موافقة' : 'Approve'}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedModification} onOpenChange={() => setSelectedModification(null)}>
          <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">
              {i18n.language === 'ar' ? 'مراجعة طلب التعديل' : 'Review Modification Request'}
            </DialogTitle>
            <DialogDescription data-testid="dialog-description">
              {i18n.language === 'ar' ? 'راجع التفاصيل ووافق أو ارفض الطلب' : 'Review the details and approve or reject the request'}
            </DialogDescription>
          </DialogHeader>

          {selectedModification && (
            <div className="space-y-4">
              <div>
                <Label data-testid="label-dialog-order">
                  {i18n.language === 'ar' ? 'رقم الطلب' : 'Order ID'}
                </Label>
                <p className="text-sm" data-testid="text-dialog-order">
                  #{selectedModification.orderId.substring(0, 8)}
                </p>
              </div>

              <div>
                <Label data-testid="label-dialog-type">
                  {i18n.language === 'ar' ? 'نوع التعديل' : 'Modification Type'}
                </Label>
                <div className="mt-1">
                  {getModificationTypeBadge(selectedModification.modificationType)}
                </div>
              </div>

              <div>
                <Label data-testid="label-dialog-reason">
                  {i18n.language === 'ar' ? 'السبب' : 'Reason'}
                </Label>
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-dialog-reason">
                  {selectedModification.reason}
                </p>
              </div>

              {selectedModification.modificationType === 'items' && selectedModification.newTotalAmount && (
                <div>
                  <Label data-testid="label-dialog-total">
                    {i18n.language === 'ar' ? 'الإجمالي الجديد' : 'New Total'}
                  </Label>
                  <p className="text-sm font-semibold mt-1" data-testid="text-dialog-total">
                    {selectedModification.newTotalAmount} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="admin-response" data-testid="label-dialog-response">
                  {i18n.language === 'ar' ? 'ردك (اختياري)' : 'Your Response (Optional)'}
                </Label>
                <Textarea
                  id="admin-response"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder={i18n.language === 'ar' ? 'أضف ملاحظات أو تعليقات...' : 'Add notes or comments...'}
                  className="mt-1"
                  data-testid="input-admin-response"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedModification(null)}
              data-testid="button-cancel-review"
            >
              {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview('rejected')}
              disabled={reviewMutation.isPending}
              data-testid="button-reject"
            >
              {reviewMutation.isPending && reviewAction === 'rejected' && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {i18n.language === 'ar' ? 'رفض' : 'Reject'}
            </Button>
            <Button
              onClick={() => handleReview('approved')}
              disabled={reviewMutation.isPending}
              data-testid="button-approve"
            >
              {reviewMutation.isPending && reviewAction === 'approved' && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {i18n.language === 'ar' ? 'موافقة' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
