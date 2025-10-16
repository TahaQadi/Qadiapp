import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { Order } from "@shared/schema";

interface OrderModificationDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderModificationDialog({ order, open, onOpenChange }: OrderModificationDialogProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [modificationType, setModificationType] = useState<'cancel' | 'items'>('cancel');
  const [reason, setReason] = useState("");

  const requestModificationMutation = useMutation({
    mutationFn: async ({ orderId, modificationType, reason }: { orderId: string; modificationType: string; reason: string }) => {
      return apiRequest(`/api/orders/${orderId}/modify`, {
        method: 'POST',
        body: JSON.stringify({ modificationType, reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', order?.id, 'modifications'] });
      onOpenChange(false);
      setReason("");
      toast({
        title: i18n.language === 'ar' ? 'تم إرسال الطلب' : 'Request Submitted',
        description: i18n.language === 'ar' ? 'تم إرسال طلب التعديل بنجاح' : 'Modification request submitted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: i18n.language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (i18n.language === 'ar' ? 'فشل إرسال الطلب' : 'Failed to submit request'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!order || !reason.trim()) {
      toast({
        title: i18n.language === 'ar' ? 'خطأ' : 'Error',
        description: i18n.language === 'ar' ? 'الرجاء إدخال السبب' : 'Please enter a reason',
        variant: "destructive",
      });
      return;
    }

    requestModificationMutation.mutate({
      orderId: order.id,
      modificationType,
      reason: reason.trim(),
    });
  };

  // Check if order can be modified
  const canModify = order && !['cancelled', 'delivered', 'shipped'].includes(order.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-modify-order">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {i18n.language === 'ar' ? 'طلب تعديل الطلب' : 'Request Order Modification'}
          </DialogTitle>
          <DialogDescription data-testid="dialog-description">
            {canModify 
              ? (i18n.language === 'ar' ? 'اختر نوع التعديل وقدم السبب' : 'Choose modification type and provide a reason')
              : (i18n.language === 'ar' ? `لا يمكن تعديل هذا الطلب (الحالة: ${order?.status})` : `This order cannot be modified (Status: ${order?.status})`)
            }
          </DialogDescription>
        </DialogHeader>

        {canModify && order && (
          <div className="space-y-4">
            <div>
              <Label data-testid="label-order-id">
                {i18n.language === 'ar' ? 'رقم الطلب' : 'Order ID'}
              </Label>
              <p className="text-sm font-mono" data-testid="text-order-id">
                #{order.id.substring(0, 8)}
              </p>
            </div>

            <div>
              <Label data-testid="label-modification-type">
                {i18n.language === 'ar' ? 'نوع التعديل' : 'Modification Type'}
              </Label>
              <RadioGroup value={modificationType} onValueChange={(value: any) => setModificationType(value)} className="mt-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse" data-testid="radio-cancel">
                  <RadioGroupItem value="cancel" id="cancel" />
                  <Label htmlFor="cancel" className="cursor-pointer">
                    {i18n.language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-note">
                {i18n.language === 'ar' 
                  ? 'ملاحظة: الإلغاء فقط متاح حالياً. لتعديل الأصناف، يرجى التواصل مع الإدارة.' 
                  : 'Note: Only cancellation is currently available. For item modifications, please contact administration.'}
              </p>
            </div>

            <div>
              <Label htmlFor="reason" data-testid="label-reason">
                {i18n.language === 'ar' ? 'السبب' : 'Reason'} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={i18n.language === 'ar' ? 'اشرح سبب التعديل...' : 'Explain the reason for modification...'}
                className="mt-1"
                rows={4}
                data-testid="input-reason"
              />
            </div>
          </div>
        )}

        {!canModify && (
          <div className="py-4 text-center text-muted-foreground" data-testid="text-cannot-modify">
            {i18n.language === 'ar' ? 'هذا الطلب لا يمكن تعديله بسبب حالته الحالية.' : 'This order cannot be modified due to its current status.'}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          {canModify && (
            <Button
              onClick={handleSubmit}
              disabled={requestModificationMutation.isPending || !reason.trim()}
              data-testid="button-submit"
            >
              {requestModificationMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {i18n.language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
