
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Order } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModificationSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModificationSheet({ order, open, onOpenChange }: ModificationSheetProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [modificationType, setModificationType] = useState<'cancel' | 'items'>('cancel');
  const [reason, setReason] = useState("");

  const requestModificationMutation = useMutation({
    mutationFn: async ({ orderId, modificationType, reason }: { orderId: string; modificationType: string; reason: string }) => {
      return apiRequest('POST', `/api/orders/${orderId}/modify`, { modificationType, reason });
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

  const canModify = order && !['cancelled', 'delivered', 'shipped'].includes(order.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className={isMobile ? "h-[85vh] rounded-t-2xl" : ""}
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">
            {i18n.language === 'ar' ? 'طلب تعديل الطلب' : 'Request Order Modification'}
          </SheetTitle>
          <SheetDescription>
            {canModify 
              ? (i18n.language === 'ar' ? 'اختر نوع التعديل وقدم السبب' : 'Choose modification type and provide a reason')
              : (i18n.language === 'ar' ? `لا يمكن تعديل هذا الطلب (الحالة: ${order?.status})` : `This order cannot be modified (Status: ${order?.status})`)
            }
          </SheetDescription>
        </SheetHeader>

        {canModify && order ? (
          <div className="space-y-6 py-4">
            <div>
              <Label className="text-base font-semibold">
                {i18n.language === 'ar' ? 'رقم الطلب' : 'Order ID'}
              </Label>
              <p className="text-sm font-mono mt-1 text-muted-foreground">
                #{order.id.substring(0, 8)}
              </p>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">
                {i18n.language === 'ar' ? 'نوع التعديل' : 'Modification Type'}
              </Label>
              <RadioGroup 
                value={modificationType} 
                onValueChange={(value: any) => setModificationType(value)} 
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse border rounded-lg p-4 hover:bg-accent transition-colors">
                  <RadioGroupItem value="cancel" id="cancel" className="min-w-[20px] min-h-[20px]" />
                  <Label htmlFor="cancel" className="cursor-pointer text-base flex-1">
                    {i18n.language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                  </Label>
                </div>
              </RadioGroup>
              
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {i18n.language === 'ar' 
                    ? 'ملاحظة: الإلغاء فقط متاح حالياً. لتعديل الأصناف، يرجى التواصل مع الإدارة.' 
                    : 'Note: Only cancellation is currently available. For item modifications, please contact administration.'}
                </AlertDescription>
              </Alert>
            </div>

            <div>
              <Label htmlFor="reason" className="text-base font-semibold">
                {i18n.language === 'ar' ? 'السبب' : 'Reason'} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={i18n.language === 'ar' ? 'اشرح سبب التعديل...' : 'Explain the reason for modification...'}
                className="mt-2 min-h-[120px] text-base"
                rows={5}
              />
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {i18n.language === 'ar' ? 'هذا الطلب لا يمكن تعديله بسبب حالته الحالية.' : 'This order cannot be modified due to its current status.'}
            </p>
          </div>
        )}

        <SheetFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          {canModify && (
            <Button
              onClick={handleSubmit}
              disabled={requestModificationMutation.isPending || !reason.trim()}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {requestModificationMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {i18n.language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
